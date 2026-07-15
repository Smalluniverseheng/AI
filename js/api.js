// ==================== API ====================
let abortControllers = [];

function getModel(id) {
  for (let i = 0; i < MODELS.length; i++) { if (MODELS[i].id === id) return MODELS[i]; }
  return null;
}

function getProviders() {
  const seen = {}, acc = [];
  for (let i = 0; i < MODELS.length; i++) {
    if (!seen[MODELS[i].provider]) { seen[MODELS[i].provider] = 1; acc.push(MODELS[i].provider); }
  }
  return acc;
}

function getProviderModels(p) { return MODELS.filter(m => m.provider === p); }

function getMiMoBase() { return MIMO_PLANS[(state.apiKeys.mimoPlan || 'tokenPlan')].base; }

function getKeyForModel(m) {
  const k = state.apiKeys || {};
  const map = {
    '小米 MiMo': () => {
      const plan = k.mimoPlan || 'tokenPlan';
      return plan === 'tokenPlan' ? (k.mimoTokenPlan || '') : (k.mimoPayAsYouGo || '');
    },
    'OpenAI': () => k.openai || '',
    'Anthropic': () => k.anthropic || '',
    'Google': () => k.google || '',
    'DeepSeek': () => k.deepseek || '',
    'Kimi': () => k.kimi || '',
    '通义千问': () => k.qwen || '',
    '智谱AI': () => k.glm || '',
    '文心一言': () => k.ernie || '',
    '腾讯混元': () => k.hunyuan || '',
    'MiniMax': () => k.minimax || '',
    '火山引擎': () => k.doubao || ''
  };
  return (map[m.provider] || (() => k.general || ''))();
}

function providerIconHtml(prov, size) {
  size = size || 16;
  const url = PROVIDER_ICONS[prov];
  const color = PROVIDER_COLORS[prov] || '#666';
  const letter = prov.charAt(0);
  let html = '<span style="display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';color:#fff;font-size:' + Math.round(size * 0.55) + 'px;font-weight:700;flex-shrink:0;position:relative;overflow:hidden">';
  if (url) html += '<img src="' + url + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display=\'none\'" alt="">';
  html += letter + '</span>';
  return html;
}

function fetchWithRetry(url, options, retries) {
  retries = retries || 1;
  return fetch(url, options).catch(err => {
    if (retries > 0 && err.name !== 'AbortError') {
      return new Promise(r => setTimeout(r, 1000)).then(() => fetchWithRetry(url, options, retries - 1));
    }
    throw err;
  });
}

function buildMessages(chat, currentContent, imageData) {
  const m = getModel(state.currentModelId);
  const ctxLimit = m ? (m.ctx || 128) * 1024 : 128 * 1024;
  let msgs = [], totalTokens = 0;
  const history = chat.messages.slice();
  let userMsg = { role: 'user', content: currentContent };
  if (imageData && m && m.vision) {
    userMsg.content = [
      { type: 'text', text: currentContent },
      { type: 'image_url', image_url: { url: 'data:' + imageData.mimeType + ';base64,' + imageData.base64 } }
    ];
  }
  let tempMsgs = [userMsg];
  let estTokens = currentContent.length / 2;
  if (imageData) estTokens += 1000;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const msgTokens = (msg.content || '').length / 2;
    if (totalTokens + msgTokens + estTokens > ctxLimit * 0.8) break;
    tempMsgs.push({ role: msg.role, content: msg.content });
    totalTokens += msgTokens;
  }
  for (let i = tempMsgs.length - 1; i >= 0; i--) msgs.push(tempMsgs[i]);
  return msgs;
}

function callChatAPI(messages, modelId, onChunk, onThinking) {
  const model = getModel(modelId);
  if (!model) throw new Error('模型不存在');
  const key = getKeyForModel(model);
  if (!key) throw new Error('请先在设置中配置 API Key');
  const config = PROVIDER_CONFIG[model.provider];
  if (!config) throw new Error('不支持的提供商: ' + model.provider);
  const ac = new AbortController();
  abortControllers.push(ac);

  let body = { model: modelId, messages: messages, stream: !!onChunk };
  if (config.transformBody) body = config.transformBody(body, model);

  if (config.format === 'anthropic') {
    const sys = messages.find(m => m.role === 'system');
    const msgs = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    body = { model: modelId, max_tokens: 4096, messages: msgs, stream: !!onChunk };
    if (sys) body.system = sys.content;
    return fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: config.headers(key), body: JSON.stringify(body), signal: ac.signal
    }).then(resp => {
      if (!resp.ok) return resp.text().then(t => { throw new Error('Anthropic错误(' + resp.status + '): ' + t.slice(0, 200)); });
      if (onChunk) return streamSSE(resp, onChunk, onThinking, 'anthropic');
      return resp.json().then(d => (d.content && d.content[0] && d.content[0].text) || '');
    });
  }

  if (config.format === 'google') {
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const gBody = { contents: contents };
    const sys = messages.find(m => m.role === 'system');
    if (sys) gBody.systemInstruction = { parts: [{ text: sys.content }] };
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelId + ':streamGenerateContent?key=' + key + '&alt=sse';
    return fetchWithRetry(url, {
      method: 'POST', headers: config.headers(key), body: JSON.stringify(gBody), signal: ac.signal
    }).then(resp => {
      if (!resp.ok) return resp.text().then(t => { throw new Error('Google错误(' + resp.status + '): ' + t.slice(0, 200)); });
      if (onChunk) return streamSSE(resp, onChunk, onThinking, 'google');
      return resp.json().then(d => {
        return (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts && d.candidates[0].content.parts[0] && d.candidates[0].content.parts[0].text) || '';
      });
    });
  }

  let base = config.baseURL;
  if (model.provider === '小米 MiMo') base = getMiMoBase();
  const reqBody = { model: modelId, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: !!onChunk };
  if (config.transformBody) reqBody = config.transformBody(reqBody, model);
  return fetchWithRetry(base + config.endpoint, {
    method: 'POST', headers: config.headers(key), body: JSON.stringify(reqBody), signal: ac.signal
  }).then(resp => {
    if (!resp.ok) return resp.text().then(t => { throw new Error('API错误(' + resp.status + '): ' + t.slice(0, 200)); });
    if (onChunk) return streamSSE(resp, onChunk, onThinking, 'openai');
    return resp.json().then(d => (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '');
  });
}

function streamSSE(resp, onChunk, onThinking, format) {
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', full = '', fullThink = '';
  return new Promise((resolve, reject) => {
    function pump() {
      reader.read().then(r => {
        if (r.done) { resolve({ content: full, thinking: fullThink }); return; }
        buffer += decoder.decode(r.value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].indexOf('data: ') !== 0) continue;
          const d = lines[i].slice(6).trim();
          if (d === '[DONE]') { resolve({ content: full, thinking: fullThink }); return; }
          try {
            const j = JSON.parse(d);
            if (format === 'openai' || !format) {
              const delta = j.choices && j.choices[0] && j.choices[0].delta;
              if (delta) {
                const think = delta.reasoning_content || '';
                if (think) { fullThink += think; if (onThinking) onThinking(think, fullThink); }
                const content = delta.content || '';
                if (content) { full += content; onChunk(content, full); }
              }
            } else if (format === 'anthropic') {
              if (j.type === 'content_block_delta') {
                const t = j.delta && j.delta.text || '';
                if (t) { full += t; onChunk(t, full); }
              }
              if (j.type === 'message_stop') { resolve(full); return; }
            } else if (format === 'google') {
              const t = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text || '';
              if (t) { full += t; onChunk(t, full); }
            }
          } catch (e) {}
        }
        pump();
      }).catch(e => reject(e));
    }
    pump();
  });
}

function createTypewriter(targetEl, onUpdate, onComplete) {
  let queue = '', running = false, lastTime = 0, charDelay = 16;
  function add(text) {
    queue += text;
    if (!running) { running = true; lastTime = performance.now(); requestAnimationFrame(tick); }
  }
  function tick(now) {
    if (!running) return;
    const elapsed = now - lastTime;
    const charsToAdd = Math.max(1, Math.floor(elapsed / charDelay * 3));
    if (queue.length > 0) {
      const chunk = queue.slice(0, charsToAdd);
      queue = queue.slice(charsToAdd);
      onUpdate(chunk);
      lastTime = now;
      requestAnimationFrame(tick);
    } else { running = false; if (onComplete) onComplete(); }
  }
  function flush() { if (queue.length > 0) { onUpdate(queue); queue = ''; } running = false; if (onComplete) onComplete(); }
  function stop() { running = false; }
  return { add, flush, stop };
}

function stopGeneration() {
  stopRequested = true;
  abortControllers.forEach(ac => { try { ac.abort(); } catch (e) {} });
  abortControllers = [];
}

function generateTitle(content) {
  if (!content) return '新对话';
  const clean = content.replace(/[#*`\[\]]/g, '').trim();
  if (clean.length <= 15) return clean;
  const breaks = ['。', '？', '！', '；', '.', '?', '!', ';'];
  for (let i = 0; i < breaks.length; i++) {
    const idx = clean.indexOf(breaks[i], 10);
    if (idx > 5 && idx < 25) return clean.slice(0, idx + 1);
  }
  return clean.slice(0, 15) + '...';
}

function formatDate(ts) {
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return '昨天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function getCurrentChat() {
  if (!state.chats) return null;
  for (let i = 0; i < state.chats.length; i++) { if (state.chats[i].id === state.currentChatId) return state.chats[i]; }
  return null;
}

function ensureChat() {
  if (!state.currentChatId || !getCurrentChat()) {
    const id = genId();
    const chat = { id: id, title: '新对话', modelId: state.currentModelId, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    state.chats.unshift(chat);
    state.currentChatId = id;
    saveState();
  }
  return getCurrentChat();
}
