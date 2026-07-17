/* ==================== API · 统一调用网关 ====================
 * 所有厂商请求都从这里经过。后期接入后端时：
 * 将 BACKEND_URL 设为你的服务端地址，请求即自动改走服务端代理（Key 不再暴露在前端）。
 */
const API = (() => {

  const CONFIG = {
    BACKEND_URL: null,   // 例: 'https://your-server.com'  后期接入后端时填写
    TIMEOUT: 60000
  };

  let controllers = [];

  function abortAll() {
    controllers.forEach(c => { try { c.abort(); } catch (e) {} });
    controllers = [];
  }

  /* ---------- 错误处理 ---------- */
  function friendlyError(status, text) {
    let msg = text || '';
    try { const j = JSON.parse(text); msg = (j.error && (j.error.message || j.error.msg)) || j.message || msg; } catch (e) {}
    msg = String(msg).slice(0, 300);
    if (status === 401 || status === 403) return 'API Key 无效或已过期，请检查设置中的 Key（' + status + '）';
    if (status === 402) return '账户余额不足，请充值后重试（402）';
    if (status === 404) return '模型不存在或接口地址错误（404）：' + msg;
    if (status === 429) return '请求过于频繁或额度受限，请稍后再试（429）';
    if (status >= 500) return '服务商服务器繁忙，请稍后再试（' + status + '）';
    return '请求失败（' + status + '）：' + msg;
  }

  async function fetchJSON(url, options, ac) {
    const resp = await fetch(url, Object.assign({}, options, { signal: ac ? ac.signal : undefined }));
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      throw new Error(friendlyError(resp.status, t));
    }
    return resp;
  }

  /* ---------- 消息构建（含上下文截断 / 图片 / 系统提示） ---------- */
  function buildMessages(chat, userContent, attachments, opts) {
    opts = opts || {};
    const model = getModel(Store.state.currentModelId);
    const ctxLimit = model ? (model.ctx || 128) * 1024 : 128 * 1024;
    const msgs = [];
    if (chat.system) msgs.push({ role: 'system', content: chat.system });

    // excludeId：调用方刚 push 的当前用户消息（已由参数重建），避免重复注入
    const history = (chat.messages || []).filter(m =>
      (m.role === 'user' || m.role === 'assistant') && m.id !== opts.excludeId);
    let userMsg;
    const img = attachments && attachments.image;
    if (img && model && model.vision) {
      userMsg = { role: 'user', content: [
        { type: 'text', text: userContent },
        { type: 'image_url', image_url: { url: img.dataUrl } }
      ] };
    } else {
      let text = userContent;
      if (attachments && attachments.filesText) text = attachments.filesText + '\n\n' + userContent;
      userMsg = { role: 'user', content: text };
    }

    const est = m => (typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length) / 2;
    const picked = [userMsg];
    let total = est(userMsg) + (img ? 1200 : 0);
    for (let i = history.length - 1; i >= 0; i--) {
      const m = history[i];
      if (!m.content || m.error) continue;
      const t = est(m);
      if (total + t > ctxLimit * 0.75) break;
      picked.unshift({ role: m.role, content: m.content });
      total += t;
    }
    return msgs.concat(picked);
  }

  /* ---------- SSE 流式解析 ---------- */
  async function streamSSE(resp, format, onChunk, onThinking) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let full = '';
    let fullThink = '';

    const handleData = (data) => {
      if (!data || data === '[DONE]') return;
      let json;
      try { json = JSON.parse(data); } catch (e) { return; }

      if (format === 'anthropic') {
        if (json.type === 'content_block_delta' && json.delta) {
          if (json.delta.type === 'thinking_delta' && onThinking) { fullThink += json.delta.thinking || ''; onThinking(json.delta.thinking || '', fullThink); }
          else if (json.delta.text) { full += json.delta.text; onChunk(json.delta.text, full); }
        }
      } else if (format === 'google') {
        const parts = json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts;
        if (parts) {
          parts.forEach(p => {
            if (p.thought && onThinking) { fullThink += p.text || ''; onThinking(p.text || '', fullThink); }
            else if (p.text) { full += p.text; onChunk(p.text, full); }
          });
        }
      } else {
        // OpenAI 兼容格式
        const delta = json.choices && json.choices[0] && json.choices[0].delta;
        if (delta) {
          const think = delta.reasoning_content || delta.reasoning;
          if (think && onThinking) { fullThink += think; onThinking(think, fullThink); }
          if (delta.content) { full += delta.content; onChunk(delta.content, full); }
        }
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Anthropic / Google(alt=sse) / OpenAI 都是 `data: ` 行
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line.startsWith('data:')) handleData(line.slice(5).trim());
      }
    }
    if (buffer.trim().startsWith('data:')) handleData(buffer.trim().slice(5).trim());
    return { content: full, thinking: fullThink };
  }

  /* ---------- 聊天调用 ---------- */
  function chat(opts) {
    const { modelId, messages, onChunk, onThinking } = opts;
    const model = getModel(modelId);
    if (!model) return Promise.reject(new Error('模型不存在: ' + modelId));
    const cfg = PROVIDERS[model.provider];
    if (!cfg) return Promise.reject(new Error('暂不支持该厂商: ' + model.provider));
    const key = getKeyForModel(model);
    if (!key) return Promise.reject(new Error('请先在「我的 → API Key」中配置 ' + model.provider + ' 的 Key'));

    const ac = new AbortController();
    controllers.push(ac);
    const streaming = typeof onChunk === 'function';

    // —— Google Gemini 格式 ——
    if (cfg.format === 'google') {
      const sys = messages.find(m => m.role === 'system');
      const contents = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: Array.isArray(m.content)
          ? m.content.map(c => c.type === 'text' ? { text: c.text } : { inlineData: { mimeType: 'image/jpeg', data: String(c.image_url.url).split(',')[1] } })
          : [{ text: m.content }]
      }));
      const body = { contents };
      if (sys) body.systemInstruction = { parts: [{ text: sys.content }] };
      const url = cfg.base() + '/v1beta/models/' + encodeURIComponent(modelId) + (streaming ? ':streamGenerateContent?alt=sse&key=' : ':generateContent?key=') + encodeURIComponent(key);
      return fetchJSON(url, { method: 'POST', headers: cfg.headers(key), body: JSON.stringify(body) }, ac)
        .then(resp => {
          if (streaming) return streamSSE(resp, 'google', onChunk, onThinking);
          return resp.json().then(d => {
            const parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts || [];
            return { content: parts.map(p => p.text || '').join(''), thinking: '' };
          });
        })
        .finally(() => { controllers = controllers.filter(c => c !== ac); });
    }

    // —— Anthropic 格式 ——
    if (cfg.format === 'anthropic') {
      const sys = messages.find(m => m.role === 'system');
      const msgs = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));
      const body = { model: modelId, max_tokens: 8192, messages: msgs, stream: streaming };
      if (sys) body.system = typeof sys.content === 'string' ? sys.content : '';
      return fetchJSON(cfg.base() + '/v1/messages', { method: 'POST', headers: cfg.headers(key), body: JSON.stringify(body) }, ac)
        .then(resp => {
          if (streaming) return streamSSE(resp, 'anthropic', onChunk, onThinking);
          return resp.json().then(d => ({ content: (d.content || []).filter(b => b.type === 'text').map(b => b.text).join(''), thinking: '' }));
        })
        .finally(() => { controllers = controllers.filter(c => c !== ac); });
    }

    // —— OpenAI 兼容格式（默认） ——
    let body = { model: modelId, messages, stream: streaming };
    if (cfg.transform) body = cfg.transform(body, model) || body;
    return fetchJSON(cfg.base() + '/v1/chat/completions', { method: 'POST', headers: cfg.headers(key), body: JSON.stringify(body) }, ac)
      .then(resp => {
        if (streaming) return streamSSE(resp, 'openai', onChunk, onThinking);
        return resp.json().then(d => {
          const m = d.choices && d.choices[0] && d.choices[0].message || {};
          return { content: m.content || '', thinking: m.reasoning_content || '' };
        });
      })
      .finally(() => { controllers = controllers.filter(c => c !== ac); });
  }

  /* ---------- AI 绘画（OpenAI 兼容图像接口） ---------- */
  function generateImage(opts) {
    const { prompt, provider, size } = opts;
    const cfg = PROVIDERS[provider];
    if (!cfg || !cfg.imageModel) return Promise.reject(new Error('该厂商暂不支持绘画'));
    const key = Store.state.apiKeys[cfg.keySlug] || '';
    if (!key) return Promise.reject(new Error('请先配置 ' + provider + ' 的 API Key'));
    const ac = new AbortController();
    controllers.push(ac);
    const body = { model: cfg.imageModel, prompt, n: 1, size: size || '1024x1024', response_format: 'b64_json' };
    return fetchJSON(cfg.base() + '/v1/images/generations', { method: 'POST', headers: cfg.headers(key), body: JSON.stringify(body) }, ac)
      .then(r => r.json())
      .then(d => {
        const item = d.data && d.data[0];
        if (!item) throw new Error('绘画接口返回为空');
        if (item.b64_json) return 'data:image/png;base64,' + item.b64_json;
        if (item.url) return item.url;
        throw new Error('无法解析绘画结果');
      })
      .finally(() => { controllers = controllers.filter(c => c !== ac); });
  }

  /* ---------- 联网搜索（Tavily，支持浏览器直连） ---------- */
  function webSearch(query) {
    const key = Store.state.webSearch.tavilyKey;
    if (!key) return Promise.reject(new Error('未配置搜索 Key'));
    const ac = new AbortController();
    controllers.push(ac);
    return fetchJSON('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, query, max_results: 5, search_depth: 'basic', include_answer: true })
    }, ac)
      .then(r => r.json())
      .then(d => ({
        answer: d.answer || '',
        results: (d.results || []).map(r => ({ title: r.title, url: r.url, snippet: (r.content || '').slice(0, 300) }))
      }))
      .finally(() => { controllers = controllers.filter(c => c !== ac); });
  }

  function buildSearchContext(query, data) {
    let ctx = '【联网搜索结果】用户问题：' + query + '\n\n';
    if (data.answer) ctx += '综合答案：' + data.answer + '\n\n';
    data.results.forEach((r, i) => {
      ctx += '[' + (i + 1) + '] ' + r.title + '\n' + r.snippet + '\n来源：' + r.url + '\n\n';
    });
    ctx += '请基于以上搜索结果回答用户问题，在引用信息处用上标 [1][2] 等标注来源，并在回答末尾列出参考来源。如果搜索结果与问题无关，请忽略并用自身知识回答。';
    return ctx;
  }

  return { CONFIG, abortAll, chat, buildMessages, generateImage, webSearch, buildSearchContext };
})();
