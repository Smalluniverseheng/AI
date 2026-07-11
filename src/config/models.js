/* ================================================================
 * 模型配置文件 - models.js
 * 
 * 功能：定义所有 AI 模型的数据，包括模型ID、名称、厂商、能力等
 * 用途：被 index.html 引用，提供模型选择器的数据源
 * 维护：添加新模型时只需在此文件的 MODELS 数组中追加即可
 * 
 * 数据结构说明：
 *   id:       模型唯一标识符（API调用时使用）
 *   name:     模型显示名称
 *   provider: 厂商名称
 *   type:     模型类型（chat=聊天, tts=语音合成, voiceclone=语音克隆, voicedesign=音色设计, asr=语音识别）
 *   ctx:      上下文窗口大小（单位：K tokens）
 *   vision:   是否支持图片输入
 *   thinking: 是否支持深度思考/推理
 *   priceIn:  输入价格（可选，仅供参考）
 *   priceOut: 输出价格（可选，仅供参考）
 * ================================================================ */

var MODELS = [
  // ===== 国内厂商（优先展示） =====
  
  // ----- 小米 MiMo -----
  {id:'mimo-v2.5-pro',name:'MiMo v2.5 Pro',provider:'小米 MiMo',type:'chat',ctx:128,thinking:true},
  {id:'mimo-v2.5-pro-ultraspeed',name:'MiMo v2.5 Pro UltraSpeed',provider:'小米 MiMo',type:'chat',ctx:128,thinking:true},
  {id:'mimo-v2.5',name:'MiMo v2.5',provider:'小米 MiMo',type:'chat',ctx:128},
  {id:'mimo-v2.5-tts',name:'MiMo v2.5 TTS',provider:'小米 MiMo',type:'tts'},
  {id:'mimo-v2.5-tts-voiceclone',name:'MiMo VoiceClone',provider:'小米 MiMo',type:'voiceclone'},
  {id:'mimo-v2.5-tts-voicedesign',name:'MiMo VoiceDesign',provider:'小米 MiMo',type:'voicedesign'},
  {id:'mimo-v2.5-asr',name:'MiMo ASR',provider:'小米 MiMo',type:'asr'},

  // ----- DeepSeek（深度求索）-----
  {id:'deepseek-v4-pro',name:'DeepSeek V4 Pro',provider:'DeepSeek',type:'chat',ctx:1024,thinking:true},
  {id:'deepseek-v4-flash',name:'DeepSeek V4 Flash',provider:'DeepSeek',type:'chat',ctx:1024},
  {id:'deepseek-v3.2',name:'DeepSeek V3.2',provider:'DeepSeek',type:'chat',ctx:164},
  {id:'deepseek-r1',name:'DeepSeek R1',provider:'DeepSeek',type:'chat',ctx:164,thinking:true},
  {id:'deepseek-chat',name:'DeepSeek Chat',provider:'DeepSeek',type:'chat',ctx:128},
  {id:'deepseek-coder',name:'DeepSeek Coder',provider:'DeepSeek',type:'chat',ctx:128},

  // ----- 通义千问（阿里）-----
  {id:'qwen3.7-max',name:'Qwen3.7 Max',provider:'通义千问',type:'chat',ctx:1024,thinking:true},
  {id:'qwen3.6-max',name:'Qwen3.6 Max',provider:'通义千问',type:'chat',ctx:256,thinking:true},
  {id:'qwen3.5-plus',name:'Qwen3.5 Plus',provider:'通义千问',type:'chat',ctx:1024,vision:true,thinking:true},
  {id:'qwen3-max',name:'Qwen3 Max',provider:'通义千问',type:'chat',ctx:256},
  {id:'qwen-max',name:'通义千问 Max',provider:'通义千问',type:'chat',ctx:128,vision:true},
  {id:'qwen-plus',name:'通义千问 Plus',provider:'通义千问',type:'chat',ctx:1024},
  {id:'qwen-turbo',name:'通义千问 Turbo',provider:'通义千问',type:'chat',ctx:131},
  {id:'qwen-long',name:'通义千问 Long',provider:'通义千问',type:'chat',ctx:10240},
  {id:'qwen-vl-max',name:'通义千问 VL Max',provider:'通义千问',type:'chat',ctx:128,vision:true},
  {id:'qwen2.5-72b-instruct',name:'Qwen2.5 72B',provider:'通义千问',type:'chat',ctx:128},
  {id:'qwen-coder-plus',name:'通义代码专家',provider:'通义千问',type:'chat',ctx:128},

  // ----- 智谱AI（GLM）-----
  {id:'glm-5.2',name:'GLM-5.2',provider:'智谱AI',type:'chat',ctx:1024,thinking:true},
  {id:'glm-5.1',name:'GLM-5.1',provider:'智谱AI',type:'chat',ctx:1024,thinking:true},
  {id:'glm-5',name:'GLM-5',provider:'智谱AI',type:'chat',ctx:1024,thinking:true},
  {id:'glm-5-turbo',name:'GLM-5 Turbo',provider:'智谱AI',type:'chat',ctx:1024,thinking:true},
  {id:'glm-4.7',name:'GLM-4.7',provider:'智谱AI',type:'chat',ctx:512},
  {id:'glm-4.7-flashx',name:'GLM-4.7 FlashX',provider:'智谱AI',type:'chat',ctx:128},
  {id:'glm-4.7-flash',name:'GLM-4.7 Flash（免费）',provider:'智谱AI',type:'chat',ctx:128},
  {id:'glm-4-plus',name:'GLM-4 Plus',provider:'智谱AI',type:'chat',ctx:128,vision:true},
  {id:'glm-4-air',name:'GLM-4 Air',provider:'智谱AI',type:'chat',ctx:128},
  {id:'glm-4v-plus',name:'GLM-4V Plus',provider:'智谱AI',type:'chat',ctx:128,vision:true},

  // ----- Kimi（月之暗面）-----
  {id:'kimi-k2.5',name:'Kimi K2.5',provider:'Kimi',type:'chat',ctx:512,vision:true,thinking:true},
  {id:'kimi-k2',name:'Kimi K2（开源）',provider:'Kimi',type:'chat',ctx:256,thinking:true},
  {id:'kimi-k2.7-code',name:'Kimi K2.7 Code',provider:'Kimi',type:'chat',ctx:256,thinking:true},
  {id:'kimi-k2.6',name:'Kimi K2.6',provider:'Kimi',type:'chat',ctx:256,vision:true,thinking:true},
  {id:'moonshot-v1-128k',name:'Moonshot V1 128K',provider:'Kimi',type:'chat',ctx:128},
  {id:'moonshot-v1-32k',name:'Moonshot V1 32K',provider:'Kimi',type:'chat',ctx:32},
  {id:'moonshot-v1-8k',name:'Moonshot V1 8K',provider:'Kimi',type:'chat',ctx:8},

  // ----- 文心一言（百度）-----
  {id:'ernie-4.5-turbo',name:'文心一言 4.5 Turbo',provider:'文心一言',type:'chat',ctx:128},
  {id:'ernie-4.0-turbo-8k',name:'文心一言 4.0',provider:'文心一言',type:'chat',ctx:8,vision:true},
  {id:'ernie-4.0-turbo-128k',name:'文心一言 4.0 长文本',provider:'文心一言',type:'chat',ctx:128},
  {id:'ernie-speed',name:'文心一言 Speed（免费）',provider:'文心一言',type:'chat',ctx:128},
  {id:'ernie-lite',name:'文心一言 Lite（免费）',provider:'文心一言',type:'chat',ctx:128},

  // ----- 豆包（字节跳动/火山引擎）-----
  {id:'doubao-2.1-pro',name:'豆包 2.1 Pro',provider:'火山引擎',type:'chat',ctx:256},
  {id:'doubao-seed-1.6',name:'豆包 Seed 1.6',provider:'火山引擎',type:'chat',ctx:256},
  {id:'doubao-lite',name:'豆包 Lite',provider:'火山引擎',type:'chat',ctx:128},
  {id:'doubao-1.5-pro-256k',name:'豆包 1.5 Pro',provider:'火山引擎',type:'chat',ctx:256,vision:true},
  {id:'doubao-1.5-lite-32k',name:'豆包 1.5 Lite',provider:'火山引擎',type:'chat',ctx:32},
  {id:'doubao-vision',name:'豆包 Vision',provider:'火山引擎',type:'chat',ctx:128,vision:true},

  // ----- 腾讯混元 -----
  {id:'hunyuan-turbos',name:'混元 TurboS',provider:'腾讯混元',type:'chat',ctx:256},
  {id:'hunyuan-standard',name:'混元 Standard',provider:'腾讯混元',type:'chat',ctx:128},
  {id:'hunyuan-lite',name:'混元 Lite',provider:'腾讯混元',type:'chat',ctx:128},
  {id:'hunyuan3.0',name:'混元 3.0',provider:'腾讯混元',type:'chat',ctx:128},
  {id:'hunyuan-pro',name:'混元 Pro',provider:'腾讯混元',type:'chat',ctx:128,vision:true},

  // ----- MiniMax（稀宇科技）-----
  {id:'minimax-m3',name:'MiniMax M3',provider:'MiniMax',type:'chat',ctx:1024},
  {id:'minimax-m2.7',name:'MiniMax M2.7',provider:'MiniMax',type:'chat',ctx:1024},
  {id:'minimax-m2.5',name:'MiniMax M2.5',provider:'MiniMax',type:'chat',ctx:196},

  // ----- 讯飞星火 -----
  {id:'spark-max',name:'星火 Max',provider:'讯飞星火',type:'chat',ctx:128},
  {id:'spark-pro',name:'星火 Pro',provider:'讯飞星火',type:'chat',ctx:128},
  {id:'spark-lite',name:'星火 Lite',provider:'讯飞星火',type:'chat',ctx:128},

  // ----- 昆仑万维 -----
  {id:'skywork-math',name:'天工 天文',provider:'昆仑万维',type:'chat',ctx:128},
  {id:'skywork-13b',name:'天工 13B',provider:'昆仑万维',type:'chat',ctx:128},

  // ----- 商汤 -----
  {id:'SenseChat-5',name:'日日新 SenseChat 5',provider:'商汤',type:'chat',ctx:128,vision:true},
  {id:'SenseChat-32K',name:'日日新 32K',provider:'商汤',type:'chat',ctx:32},

  // ----- 零一万物 -----
  {id:'yi-large',name:'Yi Large',provider:'零一万物',type:'chat',ctx:128},
  {id:'yi-vision',name:'Yi Vision',provider:'零一万物',type:'chat',ctx:128,vision:true},
  {id:'yi-lightning',name:'Yi Lightning',provider:'零一万物',type:'chat',ctx:128},

  // ----- 阶跃星辰 -----
  {id:'step-2-16k',name:'Step 2 16K',provider:'阶跃星辰',type:'chat',ctx:16},
  {id:'step-2-mini',name:'Step 2 Mini',provider:'阶跃星辰',type:'chat',ctx:128},

  // ----- 百川智能 -----
  {id:'Baichuan4',name:'百川4',provider:'百川智能',type:'chat',ctx:128},

  // ===== 国外厂商 =====

  // ----- OpenAI -----
  {id:'gpt-5',name:'GPT-5',provider:'OpenAI',type:'chat',ctx:128,vision:true},
  {id:'gpt-5-mini',name:'GPT-5 Mini',provider:'OpenAI',type:'chat',ctx:128},
  {id:'gpt-4.1',name:'GPT-4.1',provider:'OpenAI',type:'chat',ctx:1024,vision:true},
  {id:'gpt-4.1-mini',name:'GPT-4.1 Mini',provider:'OpenAI',type:'chat',ctx:1024,vision:true},
  {id:'gpt-4.1-nano',name:'GPT-4.1 Nano',provider:'OpenAI',type:'chat',ctx:1024},
  {id:'gpt-4o',name:'GPT-4o',provider:'OpenAI',type:'chat',ctx:128,vision:true},
  {id:'gpt-4o-mini',name:'GPT-4o Mini',provider:'OpenAI',type:'chat',ctx:128,vision:true},
  {id:'gpt-4-turbo',name:'GPT-4 Turbo',provider:'OpenAI',type:'chat',ctx:128,vision:true},
  {id:'o3',name:'o3',provider:'OpenAI',type:'chat',ctx:200,vision:true,thinking:true},
  {id:'o3-mini',name:'o3-mini',provider:'OpenAI',type:'chat',ctx:128,thinking:true},
  {id:'o4-mini',name:'o4-mini',provider:'OpenAI',type:'chat',ctx:200,vision:true,thinking:true},
  {id:'o1',name:'o1',provider:'OpenAI',type:'chat',ctx:200,thinking:true},

  // ----- Anthropic（Claude）-----
  {id:'claude-opus-4-7',name:'Claude Opus 4.7',provider:'Anthropic',type:'chat',ctx:1024,vision:true,thinking:true},
  {id:'claude-opus-4-6',name:'Claude Opus 4.6',provider:'Anthropic',type:'chat',ctx:200,vision:true,thinking:true},
  {id:'claude-sonnet-4-6',name:'Claude Sonnet 4.6',provider:'Anthropic',type:'chat',ctx:1024,vision:true,thinking:true},
  {id:'claude-sonnet-3-7',name:'Claude Sonnet 3.7',provider:'Anthropic',type:'chat',ctx:200,vision:true,thinking:true},
  {id:'claude-haiku-4-5',name:'Claude Haiku 4.5',provider:'Anthropic',type:'chat',ctx:200,vision:true},
  {id:'claude-opus-4-20250514',name:'Claude Opus 4',provider:'Anthropic',type:'chat',ctx:200,vision:true,thinking:true},
  {id:'claude-sonnet-4-20250514',name:'Claude Sonnet 4',provider:'Anthropic',type:'chat',ctx:200,vision:true,thinking:true},

  // ----- Google（Gemini）-----
  {id:'gemini-3.1-pro',name:'Gemini 3.1 Pro',provider:'Google',type:'chat',ctx:2048,vision:true,thinking:true},
  {id:'gemini-3.1-flash-lite',name:'Gemini 3.1 Flash-Lite',provider:'Google',type:'chat',ctx:1024},
  {id:'gemini-2.5-pro',name:'Gemini 2.5 Pro',provider:'Google',type:'chat',ctx:1024,vision:true,thinking:true},
  {id:'gemini-2.5-flash',name:'Gemini 2.5 Flash',provider:'Google',type:'chat',ctx:1024,vision:true,thinking:true},
  {id:'gemini-2.5-flash-lite',name:'Gemini 2.5 Flash-Lite',provider:'Google',type:'chat',ctx:1024},
  {id:'gemini-2.0-flash',name:'Gemini 2.0 Flash',provider:'Google',type:'chat',ctx:1024,vision:true},

  // ----- xAI（Grok）-----
  {id:'grok-4.5',name:'Grok 4.5',provider:'xAI',type:'chat',ctx:500,vision:true,thinking:true},
  {id:'grok-4.3',name:'Grok 4.3',provider:'xAI',type:'chat',ctx:1024,vision:true,thinking:true},
  {id:'grok-4.20',name:'Grok 4.20',provider:'xAI',type:'chat',ctx:2048,vision:true,thinking:true},
  {id:'grok-4.1-fast',name:'Grok 4.1 Fast',provider:'xAI',type:'chat',ctx:2048},
  {id:'grok-code-fast-1',name:'Grok Code Fast',provider:'xAI',type:'chat',ctx:256},
  {id:'grok-2',name:'Grok 2',provider:'xAI',type:'chat',ctx:128,vision:true},
  {id:'grok-3',name:'Grok 3',provider:'xAI',type:'chat',ctx:128,vision:true},

  // ----- Mistral -----
  {id:'mistral-medium-3.5',name:'Mistral Medium 3.5',provider:'Mistral',type:'chat',ctx:256,thinking:true},
  {id:'mistral-large-3',name:'Mistral Large 3',provider:'Mistral',type:'chat',ctx:262},
  {id:'mistral-small-4',name:'Mistral Small 4',provider:'Mistral',type:'chat',ctx:128},
  {id:'codestral',name:'Codestral',provider:'Mistral',type:'chat',ctx:32},
  {id:'devstral-2',name:'Devstral 2',provider:'Mistral',type:'chat',ctx:256},
  {id:'ministral-3b',name:'Ministral 3B',provider:'Mistral',type:'chat',ctx:128},
  {id:'mistral-large-latest',name:'Mistral Large',provider:'Mistral',type:'chat',ctx:128},
  {id:'pixtral-large-latest',name:'Pixtral Large',provider:'Mistral',type:'chat',ctx:128,vision:true},

  // ----- Meta（Llama）-----
  {id:'llama-4-maverick',name:'Llama 4 Maverick',provider:'Meta',type:'chat',ctx:1024},
  {id:'llama-4-scout',name:'Llama 4 Scout',provider:'Meta',type:'chat',ctx:10240},
  {id:'llama-3.3-70b',name:'Llama 3.3 70B',provider:'Meta',type:'chat',ctx:128},
  {id:'llama-3.2-90b-vision',name:'Llama 3.2 90B Vision',provider:'Meta',type:'chat',ctx:128,vision:true},
  {id:'llama-3.2-11b-vision',name:'Llama 3.2 11B Vision',provider:'Meta',type:'chat',ctx:128,vision:true},

  // ----- Cohere -----
  {id:'command-r-plus',name:'Command R+',provider:'Cohere',type:'chat',ctx:128},
  {id:'command-r',name:'Command R',provider:'Cohere',type:'chat',ctx:128},
  {id:'command-a',name:'Command A',provider:'Cohere',type:'chat',ctx:256},
  {id:'command-r7b',name:'Command R7B',provider:'Cohere',type:'chat',ctx:128},

  // ----- Groq -----
  {id:'llama-3.1-70b-versatile',name:'Llama 3.1 70B (Groq)',provider:'Groq',type:'chat',ctx:128},
  {id:'mixtral-8x7b-32768',name:'Mixtral 8x7B (Groq)',provider:'Groq',type:'chat',ctx:32},
  {id:'llama-3.3-70b-versatile',name:'Llama 3.3 70B (Groq)',provider:'Groq',type:'chat',ctx:128}
];
