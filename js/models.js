/* ==================== MODELS · 模型目录（嵌入式数据文件） ====================
 * 【如何手动更新模型】
 * 1. 直接增删改下面的条目即可，字段说明：
 *    id        厂商 API 的真实模型 ID
 *    name      显示名称
 *    provider  厂商（必须与 js/providers.js 中的厂商名一致）
 *    type      chat | tts | asr | voiceclone | voicedesign（仅 chat 可对话）
 *    ctx       上下文长度（单位 K，1024 = 100 万 tokens）
 *    vision    是否支持识图（图片输入）
 *    thinking  是否支持深度思考（推理过程输出）
 *    stream    是否支持流式输出（chat 类默认 true）
 *    status    active 在售 | new 新上线 | deprecated 已下架
 * 2. 保存后刷新页面即生效，无需改其他文件。
 * 3. 也可以在「模型」页点「同步」按钮，从已配置 Key 的厂商实时拉取最新模型列表。
 * ============================================================================= */
const MODELS = [
  // 小米 MiMo
  {id:'mimo-v2.5-pro',name:'MiMo v2.5 Pro',provider:'小米 MiMo',ctx:1024,thinking:true},
  {id:'mimo-v2.5-pro-ultraspeed',name:'MiMo v2.5 Pro UltraSpeed',provider:'小米 MiMo',ctx:1024,thinking:true},
  {id:'mimo-v2.5',name:'MiMo v2.5',provider:'小米 MiMo',ctx:128},
  {id:'mimo-v2.5-tts',name:'MiMo v2.5 TTS',provider:'小米 MiMo',type:'tts',ctx:128,stream:false},
  {id:'mimo-v2.5-tts-voiceclone',name:'MiMo VoiceClone',provider:'小米 MiMo',type:'voiceclone',ctx:128,stream:false},
  {id:'mimo-v2.5-tts-voicedesign',name:'MiMo VoiceDesign',provider:'小米 MiMo',type:'voicedesign',ctx:128,stream:false},
  {id:'mimo-v2.5-asr',name:'MiMo ASR',provider:'小米 MiMo',type:'asr',ctx:128,stream:false},
  // DeepSeek
  {id:'deepseek-chat',name:'DeepSeek Chat',provider:'DeepSeek',ctx:128,status:'deprecated'},
  {id:'deepseek-reasoner',name:'DeepSeek Reasoner',provider:'DeepSeek',ctx:128,thinking:true,status:'deprecated'},
  {id:'deepseek-coder',name:'DeepSeek Coder',provider:'DeepSeek',ctx:128,status:'deprecated'},
  {id:'deepseek-v4-pro',name:'DeepSeek V4 Pro',provider:'DeepSeek',ctx:1024,vision:true,thinking:true,status:'new'},
  {id:'deepseek-v4-flash',name:'DeepSeek V4 Flash',provider:'DeepSeek',ctx:1024,vision:true,status:'new'},
  {id:'deepseek-v3.2',name:'DeepSeek V3.2',provider:'DeepSeek',ctx:128,status:'deprecated'},
  {id:'deepseek-r1',name:'DeepSeek R1',provider:'DeepSeek',ctx:128,thinking:true,status:'deprecated'},
  // 通义千问
  {id:'qwen3.7-max',name:'Qwen3.7-Max',provider:'通义千问',ctx:1024,vision:true,thinking:true},
  {id:'qwen3.6-max',name:'Qwen3.6-Max',provider:'通义千问',ctx:1024,vision:true,thinking:true},
  {id:'qwen3.5-plus',name:'Qwen3.5 Plus',provider:'通义千问',ctx:1024,vision:true},
  {id:'qwen3-max',name:'Qwen3-Max',provider:'通义千问',ctx:262},
  {id:'qwen-plus',name:'通义千问 Plus',provider:'通义千问',ctx:1024},
  {id:'qwen2.5-72b',name:'Qwen2.5-72B',provider:'通义千问',ctx:128},
  {id:'qwen-max',name:'通义千问 Max',provider:'通义千问',ctx:128,vision:true},
  {id:'qwen-turbo',name:'通义千问 Turbo',provider:'通义千问',ctx:131},
  {id:'qwen-long',name:'通义千问 Long',provider:'通义千问',ctx:10240},
  {id:'qwen-vl-max',name:'通义千问 VL Max',provider:'通义千问',ctx:128,vision:true},
  {id:'qwen-coder-plus',name:'通义代码专家',provider:'通义千问',ctx:128},
  {id:'qwen-vl-plus',name:'通义千问 VL Plus',provider:'通义千问',ctx:128,vision:true},
  // 智谱AI
  {id:'glm-5.2',name:'GLM-5.2',provider:'智谱AI',ctx:256,vision:true,thinking:true},
  {id:'glm-5.1',name:'GLM-5.1',provider:'智谱AI',ctx:256,vision:true,thinking:true},
  {id:'glm-5',name:'GLM-5',provider:'智谱AI',ctx:128,vision:true},
  {id:'glm-5-turbo',name:'GLM-5-Turbo',provider:'智谱AI',ctx:128},
  {id:'glm-4.7',name:'GLM-4.7',provider:'智谱AI',ctx:128,vision:true,thinking:true},
  {id:'glm-4.7-flashx',name:'GLM-4.7-FlashX',provider:'智谱AI',ctx:128},
  {id:'glm-4.7-flash',name:'GLM-4.7-Flash',provider:'智谱AI',ctx:128},
  {id:'glm-4-plus',name:'GLM-4 Plus',provider:'智谱AI',ctx:128,vision:true},
  {id:'glm-4-air',name:'GLM-4 Air',provider:'智谱AI',ctx:128},
  {id:'glm-4-flash',name:'GLM-4 Flash',provider:'智谱AI',ctx:128},
  {id:'glm-4v-plus',name:'GLM-4V Plus',provider:'智谱AI',ctx:128,vision:true},
  {id:'glm-4-long',name:'GLM-4 Long',provider:'智谱AI',ctx:1024},
  // 文心一言
  {id:'ernie-4.5-turbo',name:'ERNIE 4.5 Turbo',provider:'文心一言',ctx:128,vision:true},
  {id:'ernie-4.0-turbo-8k',name:'ERNIE 4.0 Turbo',provider:'文心一言',ctx:8,vision:true},
  {id:'ernie-speed',name:'ERNIE Speed',provider:'文心一言',ctx:128},
  {id:'ernie-lite',name:'ERNIE Lite',provider:'文心一言',ctx:128},
  {id:'ernie-3.5-8k',name:'文心一言 3.5',provider:'文心一言',ctx:8},
  // 火山引擎
  {id:'doubao-2.1-pro',name:'Doubao 2.1 Pro',provider:'火山引擎',ctx:256,vision:true,thinking:true},
  {id:'doubao-seed-1.6',name:'Doubao-Seed 1.6',provider:'火山引擎',ctx:128,thinking:true},
  {id:'doubao-lite',name:'Doubao Lite',provider:'火山引擎',ctx:32},
  {id:'doubao-1.5-pro-256k',name:'豆包 1.5 Pro',provider:'火山引擎',ctx:256,vision:true},
  {id:'doubao-1.5-lite-32k',name:'豆包 1.5 Lite',provider:'火山引擎',ctx:32},
  {id:'doubao-pro-256k',name:'豆包 Pro',provider:'火山引擎',ctx:256,vision:true},
  {id:'doubao-1.5-pro-32k',name:'豆包 1.5 Pro 32K',provider:'火山引擎',ctx:32},
  {id:'doubao-vision',name:'豆包 Vision',provider:'火山引擎',ctx:128,vision:true},
  // 腾讯混元
  {id:'hunyuan-turbos',name:'HY 2.0 / 混元-TurboS',provider:'腾讯混元',ctx:256,vision:true},
  {id:'hunyuan-standard',name:'混元-Standard',provider:'腾讯混元',ctx:128},
  {id:'hunyuan-lite-v2',name:'混元-Lite',provider:'腾讯混元',ctx:128},
  {id:'hunyuan-3.0',name:'混元3.0',provider:'腾讯混元',ctx:256,vision:true,thinking:true},
  {id:'hunyuan-pro',name:'混元 Pro',provider:'腾讯混元',ctx:128,vision:true},
  {id:'hunyuan-turbo',name:'混元 Turbo',provider:'腾讯混元',ctx:128,vision:true},
  // Kimi
  {id:'kimi-k2.5',name:'Kimi K2.5',provider:'Kimi',ctx:256,vision:true,thinking:true,status:'deprecated'},
  {id:'kimi-k2',name:'Kimi K2',provider:'Kimi',ctx:256,vision:true,thinking:true,status:'deprecated'},
  {id:'kimi-k2.7-code',name:'Kimi K2.7 Code',provider:'Kimi',ctx:256,thinking:true,status:'new'},
  {id:'kimi-k2.6',name:'Kimi K2.6',provider:'Kimi',ctx:256,vision:true,thinking:true,status:'new'},
  {id:'moonshot-v1-128k',name:'Moonshot V1 128K',provider:'Kimi',ctx:128,status:'deprecated'},
  {id:'moonshot-v1-32k',name:'Moonshot V1 32K',provider:'Kimi',ctx:32,status:'deprecated'},
  {id:'moonshot-v1-8k',name:'Moonshot V1 8K',provider:'Kimi',ctx:8,status:'deprecated'},
  {id:'moonshot-v1-128k-vision-preview',name:'Moonshot V1 128K Vision',provider:'Kimi',ctx:128,vision:true,status:'deprecated'},
  {id:'moonshot-v1-32k-vision-preview',name:'Moonshot V1 32K Vision',provider:'Kimi',ctx:32,vision:true,status:'deprecated'},
  {id:'moonshot-v1-8k-vision-preview',name:'Moonshot V1 8K Vision',provider:'Kimi',ctx:8,vision:true,status:'deprecated'},
  {id:'kimi-k3',name:'Kimi K3',provider:'Kimi',ctx:256,vision:true,thinking:true,status:'new'},
  // MiniMax
  {id:'minimax-m3',name:'MiniMax-M3',provider:'MiniMax',ctx:1024,vision:true,thinking:true},
  {id:'minimax-m2.7',name:'MiniMax-M2.7',provider:'MiniMax',ctx:1024},
  {id:'minimax-m2.5',name:'MiniMax-M2.5',provider:'MiniMax',ctx:1024},
  {id:'abab6.5s-chat',name:'MiniMax M1',provider:'MiniMax',ctx:1024,status:'deprecated'},
  {id:'abab6.5g-chat',name:'MiniMax M1 Pro',provider:'MiniMax',ctx:128,vision:true,status:'deprecated'},
  // 讯飞星火
  {id:'spark-max',name:'星火 Max',provider:'讯飞星火',ctx:128},
  {id:'spark-pro',name:'星火 Pro',provider:'讯飞星火',ctx:128},
  {id:'spark-lite',name:'星火 Lite',provider:'讯飞星火',ctx:128},
  // 昆仑万维
  {id:'skywork-math',name:'天工 天文',provider:'昆仑万维',ctx:128},
  {id:'skywork-13b',name:'天工 13B',provider:'昆仑万维',ctx:128},
  // 商汤
  {id:'SenseChat-5',name:'日日新 SenseChat 5',provider:'商汤',ctx:128,vision:true},
  {id:'SenseChat-32K',name:'日日新 32K',provider:'商汤',ctx:32},
  // 零一万物
  {id:'yi-large',name:'Yi Large',provider:'零一万物',ctx:128},
  {id:'yi-vision',name:'Yi Vision',provider:'零一万物',ctx:128,vision:true},
  {id:'yi-lightning',name:'Yi Lightning',provider:'零一万物',ctx:128},
  // 阶跃星辰
  {id:'step-2-16k',name:'Step 2 16K',provider:'阶跃星辰',ctx:16},
  {id:'step-2-mini',name:'Step 2 Mini',provider:'阶跃星辰',ctx:128},
  // 百川智能
  {id:'Baichuan4',name:'百川4',provider:'百川智能',ctx:128},
  // OpenAI
  {id:'gpt-5',name:'GPT-5',provider:'OpenAI',ctx:400,vision:true,thinking:true},
  {id:'gpt-5-mini',name:'GPT-5 Mini',provider:'OpenAI',ctx:400,vision:true,thinking:true},
  {id:'gpt-4.1',name:'GPT-4.1',provider:'OpenAI',ctx:1024,vision:true},
  {id:'gpt-4.1-mini',name:'GPT-4.1 Mini',provider:'OpenAI',ctx:1024,vision:true},
  {id:'gpt-4.1-nano',name:'GPT-4.1 Nano',provider:'OpenAI',ctx:1024,vision:true},
  {id:'gpt-4o',name:'GPT-4o',provider:'OpenAI',ctx:128,vision:true,status:'deprecated'},
  {id:'gpt-4o-mini',name:'GPT-4o Mini',provider:'OpenAI',ctx:128,vision:true,status:'deprecated'},
  {id:'o3',name:'o3',provider:'OpenAI',ctx:128,vision:true,thinking:true,status:'deprecated'},
  {id:'o3-mini',name:'o3-mini',provider:'OpenAI',ctx:128,status:'deprecated'},
  {id:'o4-mini',name:'o4-mini',provider:'OpenAI',ctx:128,vision:true,thinking:true},
  {id:'o1',name:'o1',provider:'OpenAI',ctx:200,vision:true,thinking:true,status:'deprecated'},
  {id:'gpt-4-turbo',name:'GPT-4 Turbo',provider:'OpenAI',ctx:128,vision:true,status:'deprecated'},
  {id:'chatgpt-4o-latest',name:'ChatGPT-4o Latest',provider:'OpenAI',ctx:128,vision:true,status:'deprecated'},
  {id:'gpt-5.6-sol',name:'GPT-5.6 Sol',provider:'OpenAI',ctx:1024,vision:true,thinking:true,status:'new'},
  {id:'gpt-5.6-terra',name:'GPT-5.6 Terra',provider:'OpenAI',ctx:1024,vision:true,thinking:true,status:'new'},
  {id:'gpt-5.6-luna',name:'GPT-5.6 Luna',provider:'OpenAI',ctx:400,vision:true,thinking:true,status:'new'},
  // Anthropic
  {id:'claude-opus-4.7',name:'Claude Opus 4.7',provider:'Anthropic',ctx:200,vision:true,thinking:true},
  {id:'claude-opus-4.6',name:'Claude Opus 4.6',provider:'Anthropic',ctx:200,vision:true,thinking:true},
  {id:'claude-opus-4-20250514',name:'Claude Opus 4',provider:'Anthropic',ctx:200,vision:true,status:'deprecated'},
  {id:'claude-sonnet-4.6',name:'Claude Sonnet 4.6',provider:'Anthropic',ctx:200,vision:true,thinking:true},
  {id:'claude-sonnet-4-20250514',name:'Claude Sonnet 4',provider:'Anthropic',ctx:200,vision:true,status:'deprecated'},
  {id:'claude-sonnet-3.7',name:'Claude Sonnet 3.7',provider:'Anthropic',ctx:200,vision:true,thinking:true,status:'deprecated'},
  {id:'claude-haiku-4.5',name:'Claude Haiku 4.5',provider:'Anthropic',ctx:200,vision:true,thinking:true},
  {id:'claude-3-5-sonnet-20241022',name:'Claude 3.5 Sonnet',provider:'Anthropic',ctx:200,vision:true,status:'deprecated'},
  {id:'claude-3-5-haiku-20241022',name:'Claude 3.5 Haiku',provider:'Anthropic',ctx:200,vision:true,status:'deprecated'},
  {id:'claude-3-opus-20240229',name:'Claude 3 Opus',provider:'Anthropic',ctx:200,vision:true,status:'deprecated'},
  {id:'claude-3-haiku-20240307',name:'Claude 3 Haiku',provider:'Anthropic',ctx:200,status:'deprecated'},
  {id:'claude-fable-5',name:'Claude Fable 5',provider:'Anthropic',ctx:1024,vision:true,thinking:true,status:'new'},
  {id:'claude-sonnet-5',name:'Claude Sonnet 5',provider:'Anthropic',ctx:200,vision:true,thinking:true,status:'new'},
  {id:'claude-opus-4-8',name:'Claude Opus 4.8',provider:'Anthropic',ctx:200,vision:true,thinking:true,status:'new'},
  // Google
  {id:'gemini-3.1-pro',name:'Gemini 3.1 Pro',provider:'Google',ctx:1024,vision:true,thinking:true},
  {id:'gemini-3.1-flash-lite',name:'Gemini 3.1 Flash-Lite',provider:'Google',ctx:1024,vision:true},
  {id:'gemini-2.5-pro',name:'Gemini 2.5 Pro',provider:'Google',ctx:1024,vision:true,thinking:true},
  {id:'gemini-2.5-flash',name:'Gemini 2.5 Flash',provider:'Google',ctx:1024,vision:true,thinking:true},
  {id:'gemini-2.5-flash-lite',name:'Gemini 2.5 Flash-Lite',provider:'Google',ctx:1024,vision:true},
  {id:'gemini-2.0-flash',name:'Gemini 2.0 Flash',provider:'Google',ctx:1024,vision:true,status:'deprecated'},
  {id:'gemini-1.5-pro',name:'Gemini 1.5 Pro',provider:'Google',ctx:2048,vision:true,status:'deprecated'},
  {id:'gemini-1.5-flash',name:'Gemini 1.5 Flash',provider:'Google',ctx:1024,vision:true,status:'deprecated'},
  {id:'gemini-3.5-flash',name:'Gemini 3.5 Flash',provider:'Google',ctx:1024,vision:true,thinking:true,status:'new'},
  // xAI
  {id:'grok-4.5',name:'Grok 4.5',provider:'xAI',ctx:256,vision:true,thinking:true},
  {id:'grok-4.3',name:'Grok 4.3',provider:'xAI',ctx:128,vision:true,thinking:true},
  {id:'grok-4.20',name:'Grok 4.20',provider:'xAI',ctx:128,vision:true},
  {id:'grok-4.1-fast',name:'Grok 4.1 Fast',provider:'xAI',ctx:128,vision:true,thinking:true},
  {id:'grok-code-fast-1',name:'Grok-code-fast-1',provider:'xAI',ctx:128},
  {id:'grok-2',name:'Grok 2',provider:'xAI',ctx:128,vision:true,status:'deprecated'},
  {id:'grok-3',name:'Grok 3',provider:'xAI',ctx:128,vision:true},
  {id:'grok-3-mini',name:'Grok 3 Mini',provider:'xAI',ctx:128},
  // Mistral
  {id:'mistral-medium-3.5',name:'Mistral Medium 3.5',provider:'Mistral',ctx:128,vision:true},
  {id:'mistral-large-3',name:'Mistral Large 3',provider:'Mistral',ctx:128},
  {id:'mistral-small-4',name:'Mistral Small 4',provider:'Mistral',ctx:128,vision:true},
  {id:'codestral-latest',name:'Codestral',provider:'Mistral',ctx:128},
  {id:'devstral-2',name:'Devstral 2',provider:'Mistral',ctx:128},
  {id:'ministral-3b',name:'Ministral 3B',provider:'Mistral',ctx:32},
  {id:'mistral-large-latest',name:'Mistral Large',provider:'Mistral',ctx:128},
  {id:'mistral-small-latest',name:'Mistral Small',provider:'Mistral',ctx:128,vision:true},
  {id:'pixtral-large-latest',name:'Pixtral Large',provider:'Mistral',ctx:128,vision:true},
  // Meta
  {id:'llama-4-maverick',name:'Llama 4 Maverick',provider:'Meta',ctx:128,vision:true},
  {id:'llama-4-scout',name:'Llama 4 Scout',provider:'Meta',ctx:128,vision:true},
  {id:'llama-3.3-70b',name:'Llama 3.3 70B',provider:'Meta',ctx:128},
  {id:'llama-3.2-90b-vision',name:'Llama 3.2 90B Vision',provider:'Meta',ctx:128,vision:true},
  {id:'llama-3.2-11b-vision',name:'Llama 3.2 11B Vision',provider:'Meta',ctx:128,vision:true},
  {id:'llama-3.1-405b',name:'Llama 3.1 405B',provider:'Meta',ctx:128,status:'deprecated'},
  {id:'llama-3.1-70b',name:'Llama 3.1 70B',provider:'Meta',ctx:128,status:'deprecated'},
  // Cohere
  {id:'command-r-plus',name:'Command R+',provider:'Cohere',ctx:128,status:'deprecated'},
  {id:'command-r',name:'Command R',provider:'Cohere',ctx:128,status:'deprecated'},
  {id:'command-a',name:'Command A',provider:'Cohere',ctx:128},
  {id:'command-r7b',name:'Command R7B',provider:'Cohere',ctx:128},
  // Groq
  {id:'llama-3.1-70b-versatile',name:'Llama 3.1 70B (Groq)',provider:'Groq',ctx:128,status:'deprecated'},
  {id:'mixtral-8x7b-32768',name:'Mixtral 8x7B (Groq)',provider:'Groq',ctx:32,status:'deprecated'},
  {id:'llama-3.3-70b-versatile',name:'Llama 3.3 70B (Groq)',provider:'Groq',ctx:128},
];
