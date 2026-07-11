/* ================================================================
 * API 调用模块 - client.js
 * 
 * 功能：统一调用各厂商 AI 模型的 API
 * 特点：所有 API 端点已内置，用户只需在设置中填写 API Key
 * 
 * 支持的 API 格式：
 *   - OpenAI 兼容格式（大多数厂商）
 *   - Anthropic Messages 格式
 *   - Google Gemini 格式
 * 
 * 调用方式：callChatAPI(messages, modelId, onChunk, onThinking)
 *   messages:    消息数组 [{role:'user',content:'...'}]
 *   modelId:     模型ID（如 'gpt-5', 'claude-opus-4-7'）
 *   onChunk:     流式回调，每收到一段数据调用一次
 *   onThinking:  思考过程回调（仅思考模型）
 *   返回值:      Promise，resolve 最终回复内容
 * ================================================================ */

/* --- 各厂商 API 端点配置（内置，无需用户配置） --- */
var API_ENDPOINTS = {
  // 国内厂商
  '小米 MiMo': { base: 'https://api.xiaomimimo.com', path: '/v1/chat/completions', format: 'openai' },
  'DeepSeek':  { base: 'https://api.deepseek.com', path: '/v1/chat/completions', format: 'openai' },
  '通义千问':   { base: 'https://dashscope.aliyuncs.com/compatible-mode', path: '/v1/chat/completions', format: 'openai' },
  '智谱AI':    { base: 'https://open.bigmodel.cn/api/paas', path: '/v4/chat/completions', format: 'openai' },
  'Kimi':      { base: 'https://api.moonshot.cn', path: '/v1/chat/completions', format: 'openai' },
  '文心一言':   { base: 'https://aip.baidubce.com/rpc/2.0/ai_custom', path: '/v1/wenxinworkshop/chat', format: 'baidu' },
  '火山引擎':   { base: 'https://ark.cn-beijing.volces.com/api', path: '/v3/chat/completions', format: 'openai' },
  '腾讯混元':   { base: 'https://api.hunyuan.cloud.tencent.com', path: '/v1/chat/completions', format: 'openai' },
  'MiniMax':   { base: 'https://api.minimax.chat', path: '/v1/text/chatcompletion_v2', format: 'openai' },
  '讯飞星火':   { base: 'https://spark-api-open.xf-yun.com', path: '/v1/chat/completions', format: 'openai' },
  '零一万物':   { base: 'https://api.lingyiwanwu.com', path: '/v1/chat/completions', format: 'openai' },
  '阶跃星辰':   { base: 'https://api.stepfun.com', path: '/v1/chat/completions', format: 'openai' },
  '百川智能':   { base: 'https://api.baichuan-ai.com', path: '/v1/chat/completions', format: 'openai' },
  '商汤':      { base: 'https://api.sensenova.cn', path: '/v1/chat/completions', format: 'openai' },
  // 国外厂商（可能需要代理）
  'OpenAI':    { base: 'https://api.openai.com', path: '/v1/chat/completions', format: 'openai' },
  'Anthropic': { base: 'https://api.anthropic.com', path: '/v1/messages', format: 'anthropic' },
  'Google':    { base: 'https://generativelanguage.googleapis.com/v1beta/models', path: ':generateContent', format: 'gemini' },
  'xAI':       { base: 'https://api.x.ai', path: '/v1/chat/completions', format: 'openai' },
  'Mistral':   { base: 'https://api.mistral.ai', path: '/v1/chat/completions', format: 'openai' },
  'Meta':      { base: 'https://api.together.xyz', path: '/v1/chat/completions', format: 'openai' },  // 通过Together.ai托管
  'Cohere':    { base: 'https://api.cohere.ai', path: '/v2/chat', format: 'cohere' },
  'Groq':      { base: 'https://api.groq.com/openai', path: '/v1/chat/completions', format: 'openai' }
};

/* --- 获取当前模型对应的 API Key --- */
function getKeyForModel(m) {
  var k = state.apiKeys;
  // 小米 MiMo 根据计费方案返回不同 Key
  if (m.provider === '小米 MiMo') {
    var plan = k.mimoPlan || 'tokenPlan';
    return plan === 'tokenPlan' ? (k.mimoTokenPlan || '') : (k.mimoPayAsYouGo || '');
  }
  // 其他厂商直接返回对应 Key
  var keyMap = {
    'OpenAI': k.openai, 'Anthropic': k.anthropic, 'Google': k.google,
    'DeepSeek': k.deepseek, 'Kimi': k.kimi, '通义千问': k.qwen,
    '智谱AI': k.glm, '文心一言': k.ernie, '腾讯混元': k.hunyuan,
    'MiniMax': k.minimax, '火山引擎': k.doubao, 'xAI': k.xai,
    'Mistral': k.mistral, 'Cohere': k.cohere, 'Groq': k.groq,
    '讯飞星火': k.spark, '零一万物': k.yi, '阶跃星辰': k.step,
    '百川智能': k.baichuan, '商汤': k.sensetime
  };
  return keyMap[m.provider] || '';
}

/* --- 构建 API 请求消息体 --- */
function buildMessages(chat, currentContent, imageData) {
  var msgs = [];
  // 取最近20条消息作为上下文
  var history = chat.messages.slice(-20);
  for (var i = 0; i < history.length; i++) {
    var m = history[i];
    if (m.role === 'user' || m.role === 'assistant') {
      var content = m.role === 'user' && i === history.length - 1 ? currentContent : m.content;
      if (content) msgs.push({ role: m.role, content: content });
    }
  }
  // 如果有图片，添加到消息中
  if (imageData && msgs.length) {
    var last = msgs[msgs.length - 1];
    if (last.role === 'user') {
      last.content = [
        { type: 'text', text: last.content },
        { type: 'image_url', image_url: { url: imageData } }
      ];
    }
  }
  return msgs;
}

/* --- 调用聊天 API（核心函数） --- */
function callChatAPI(messages, modelId, onChunk, onThinking) {
  var m = getModel(modelId);
  if (!m) return Promise.reject(new Error('模型不存在'));
  
  var key = getKeyForModel(m);
  if (!key) return Promise.reject(new Error('请在设置中填写 ' + m.provider + ' 的 API Key'));
  
  var endpoint = API_ENDPOINTS[m.provider];
  if (!endpoint) return Promise.reject(new Error('不支持的厂商: ' + m.provider));
  
  // 根据 API 格式构建请求
  if (endpoint.format === 'openai') {
    return callOpenAIFormat(messages, m, endpoint, key, onChunk, onThinking);
  } else if (endpoint.format === 'anthropic') {
    return callAnthropicFormat(messages, m, endpoint, key, onChunk, onThinking);
  } else if (endpoint.format === 'gemini') {
    return callGeminiFormat(messages, m, endpoint, key, onChunk, onThinking);
  }
  return Promise.reject(new Error('不支持的API格式'));
}

/* --- OpenAI 兼容格式调用（大多数厂商使用） --- */
function callOpenAIFormat(messages, model, endpoint, key, onChunk, onThinking) {
  var url = endpoint.base + endpoint.path;
  var body = {
    model: model.id,
    messages: messages,
    stream: true,
    max_tokens: 4096
  };
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key
    },
    body: JSON.stringify(body)
  }).then(function(res) {
    if (!res.ok) throw new Error('API错误: ' + res.status);
    return streamResponse(res, onChunk, onThinking);
  });
}

/* --- Anthropic Messages 格式调用 --- */
function callAnthropicFormat(messages, model, endpoint, key, onChunk, onThinking) {
  var url = endpoint.base + endpoint.path;
  // Anthropic 格式：system 消息单独提取
  var systemMsg = '';
  var chatMsgs = [];
  for (var i = 0; i < messages.length; i++) {
    if (messages[i].role === 'system') systemMsg = messages[i].content;
    else chatMsgs.push(messages[i]);
  }
  
  var body = {
    model: model.id,
    messages: chatMsgs,
    max_tokens: 4096,
    stream: true
  };
  if (systemMsg) body.system = systemMsg;
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  }).then(function(res) {
    if (!res.ok) throw new Error('API错误: ' + res.status);
    return streamResponse(res, onChunk, onThinking);
  });
}

/* --- Google Gemini 格式调用 --- */
function callGeminiFormat(messages, model, endpoint, key, onChunk, onThinking) {
  var url = endpoint.base + '/' + model.id + endpoint.path + '?key=' + key + '&alt=sse';
  var contents = [];
  for (var i = 0; i < messages.length; i++) {
    contents.push({
      role: messages[i].role === 'assistant' ? 'model' : 'user',
      parts: [{ text: messages[i].content }]
    });
  }
  
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: contents })
  }).then(function(res) {
    if (!res.ok) throw new Error('API错误: ' + res.status);
    return streamResponse(res, onChunk, onThinking);
  });
}

/* --- 流式响应处理（通用） --- */
function streamResponse(res, onChunk, onThinking) {
  var reader = res.body.getReader();
  var decoder = new TextDecoder();
  var fullContent = '';
  var buffer = '';
  
  function read() {
    return reader.read().then(function(result) {
      if (result.done) return fullContent;
      buffer += decoder.decode(result.value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line || !line.startsWith('data:')) continue;
        var data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        
        try {
          var json = JSON.parse(data);
          // OpenAI 格式
          if (json.choices && json.choices[0]) {
            var delta = json.choices[0].delta;
            if (delta) {
              if (delta.content) {
                fullContent += delta.content;
                if (onChunk) onChunk(delta.content, fullContent);
              }
              if (delta.reasoning_content && onThinking) {
                onThinking(delta.reasoning_content, delta.reasoning_content);
              }
            }
          }
        } catch(e) {}
      }
      return read();
    });
  }
  return read();
}
