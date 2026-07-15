// ==================== PROVIDERS CONFIG ====================
const ICON_CDN = 'https://cdn.simpleicons.org/';
const LOBE_ICON_CDN = 'https://unpkg.com/@lobehub/icons-static-png@latest/light/';

const MIMO_PLANS = {
  tokenPlan: { name: '会员计划', base: 'https://token-plan-cn.xiaomimimo.com' },
  payAsYouGo: { name: '按量付费', base: 'https://api.xiaomimimo.com' }
};

const PROVIDER_CONFIG = {
  '小米 MiMo': {
    baseURL: null,
    headers: function(k) { return { 'Content-Type': 'application/json', 'api-key': k }; },
    transformBody: function(b, m) { if (m.id.includes('pro') || m.id.includes('ultraspeed')) b.enable_thinking = true; return b; },
    endpoint: '/v1/chat/completions'
  },
  'OpenAI': {
    baseURL: 'https://api.openai.com',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    endpoint: '/v1/chat/completions'
  },
  'Anthropic': {
    baseURL: 'https://api.anthropic.com',
    headers: function(k) { return { 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01' }; },
    endpoint: '/v1/messages',
    format: 'anthropic'
  },
  'Google': {
    baseURL: null,
    headers: function(k) { return { 'Content-Type': 'application/json' }; },
    endpoint: null,
    format: 'google'
  },
  'DeepSeek': {
    baseURL: 'https://api.deepseek.com',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    transformBody: function(b, m) { if (m.thinking) b.enable_thinking = true; return b; },
    endpoint: '/v1/chat/completions'
  },
  'Kimi': {
    baseURL: 'https://api.moonshot.cn',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    transformBody: function(b, m) { if (m.thinking) b.enable_thinking = true; return b; },
    endpoint: '/v1/chat/completions'
  },
  '通义千问': {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    endpoint: '/v1/chat/completions'
  },
  '智谱AI': {
    baseURL: 'https://open.bigmodel.cn/api/paas',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    endpoint: '/v1/chat/completions'
  },
  '文心一言': {
    baseURL: 'https://aip.baidubce.com',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    endpoint: '/v1/chat/completions'
  },
  '腾讯混元': {
    baseURL: 'https://api.hunyuan.cloud.tencent.com',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    endpoint: '/v1/chat/completions'
  },
  'MiniMax': {
    baseURL: 'https://api.minimax.chat',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    endpoint: '/v1/chat/completions'
  },
  '火山引擎': {
    baseURL: 'https://ark.cn-beijing.volces.com/api',
    headers: function(k) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }; },
    endpoint: '/v1/chat/completions'
  }
};

const PROVIDER_ICONS = {
  '小米 MiMo': ICON_CDN + 'xiaomi',
  'OpenAI': ICON_CDN + 'openai',
  'Anthropic': ICON_CDN + 'anthropic',
  'Google': ICON_CDN + 'google',
  'DeepSeek': ICON_CDN + 'deepseek',
  '通义千问': ICON_CDN + 'alibabadotcom',
  '智谱AI': ICON_CDN + 'zhipu',
  'Kimi': ICON_CDN + 'moonshot',
  '文心一言': ICON_CDN + 'baidu',
  '腾讯混元': ICON_CDN + 'tencentqq',
  'MiniMax': ICON_CDN + 'minimax',
  '零一万物': ICON_CDN + '01',
  '阶跃星辰': ICON_CDN + 'stepfun',
  '百川智能': ICON_CDN + 'baichuan',
  '火山引擎': ICON_CDN + 'bytedance',
  'Mistral': ICON_CDN + 'mistral',
  'Meta': ICON_CDN + 'meta',
  'Cohere': ICON_CDN + 'cohere',
  'xAI': ICON_CDN + 'xai',
  'Groq': ICON_CDN + 'groq',
  '昆仑万维': ICON_CDN + 'kunlun',
  '商汤': ICON_CDN + 'sensetime',
  '讯飞星火': ICON_CDN + 'iflytek'
};

const PROVIDER_REGION = {
  '小米 MiMo': true, 'OpenAI': false, 'Anthropic': false, 'Google': false,
  'DeepSeek': true, '通义千问': true, '智谱AI': true, 'Kimi': true,
  '文心一言': true, '腾讯混元': true, 'MiniMax': true, '零一万物': true,
  '阶跃星辰': true, '百川智能': true, '火山引擎': true, 'Mistral': false,
  'Meta': false, 'Cohere': false, 'xAI': false, 'Groq': false,
  '昆仑万维': true, '商汤': true, '月之暗面': true, '讯飞星火': true
};

const PROVIDER_COLORS = {
  '小米 MiMo': '#FF6900', 'OpenAI': '#10A37F', 'Anthropic': '#D4A574', 'Google': '#4285F4',
  'DeepSeek': '#0066FF', '通义千问': '#FF6A00', '智谱AI': '#2B5CE6', 'Kimi': '#6236FF',
  '文心一言': '#2319DC', '腾讯混元': '#07C160', 'MiniMax': '#000000', '零一万物': '#000000',
  '阶跃星辰': '#4F46E5', '百川智能': '#2B5CE6', '火山引擎': '#3B7DF0', 'Mistral': '#FF7000',
  'Meta': '#0668E1', 'Cohere': '#39594D', 'xAI': '#333333', 'Groq': '#F55036'
};

const MODE_META = {
  single: { icon: '💬', label: '单模型' },
  multi: { icon: '📋', label: '多模型' },
  debate: { icon: '⚔️', label: '辩论模式' },
  collab: { icon: '🤝', label: '协同合作' }
};

const CHANGELOG = [
  { version: '4.0', date: '2026-07-15', major: true, items: [
    '全新多文件架构：HTML/CSS/JS 分离，代码更清晰可维护',
    '新增"我的"页面：用户信息、主题、API Key、数据管理',
    '新增发现页：四种对话模式快捷入口',
    '新增模型列表页：按厂商分类浏览，点击直接对话',
    '移动端底部导航：对话/模型/发现/我的',
    'API Key 批量导入/导出 txt 格式',
    '主题切换：亮色/暗色/跟随系统',
    '预设账号 1234/1234，首次访问自动创建'
  ]},
  { version: '3.0', date: '2026-07-13', major: true, items: [
    '全新设计：Poe/ChatGPT风格现代UI，玻璃态效果，渐变阴影',
    '辩论模式升级：三种赛制（标准/快速/观点交锋），阶段徽章',
    '多模型对比：分栏网格视图，并排查看不同模型回答',
    '改进导航：侧边栏可折叠，更紧凑的历史列表',
    '代码块美化：复制按钮动画反馈，语法高亮增强',
    '打字机光标：呼吸动画效果',
    '思考过程：可折叠详情面板，更清晰的视觉层级'
  ]},
  { version: '2.0', date: '2026-07-13', major: true, items: ['安全升级：移除硬编码API Key','统一API配置驱动','统一SSE解析器','XSS防护','代码复制按钮','智能标题','消息重发','导出扩展'] },
  { version: '1.0', date: '2026-07-11', major: true, items: ['全新架构','四种模式'] }
];
