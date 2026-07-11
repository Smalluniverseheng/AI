/* ================================================================
 * 厂商配置文件 - providers.js
 * 
 * 功能：定义所有 AI 厂商的图标、地区、API端点等配置
 * 用途：被 index.html 引用，提供厂商图标和地区标记
 * 维护：添加新厂商时需同时更新 PROVIDER_ICONS 和 PROVIDER_REGION
 * ================================================================ */

/* --- 图标 CDN 地址（使用 Simple Icons 免费开源图标库） --- */
var ICON_CDN = 'https://cdn.simpleicons.org/';

/* --- 厂商图标映射（品牌名 → Simple Icons 图标名） --- */
var PROVIDER_ICONS = {
  // 国内厂商
  '小米 MiMo':ICON_CDN+'xiaomi',
  'DeepSeek':ICON_CDN+'deepseek',
  '通义千问':ICON_CDN+'alibabacloud',
  '智谱AI':ICON_CDN+'zhipuai',
  'Kimi':ICON_CDN+'moonshot',
  '文心一言':ICON_CDN+'baidu',
  '火山引擎':ICON_CDN+'bytedance',
  '腾讯混元':ICON_CDN+'tencentqq',
  'MiniMax':ICON_CDN+'minimax',
  '讯飞星火':ICON_CDN+'spark',
  '昆仑万维':ICON_CDN+'kunlun',
  '商汤':ICON_CDN+'sensetime',
  '零一万物':ICON_CDN+'01ai',
  '阶跃星辰':ICON_CDN+'stepfun',
  '百川智能':ICON_CDN+'baichuan',
  // 国外厂商
  'OpenAI':ICON_CDN+'openai',
  'Anthropic':ICON_CDN+'anthropic',
  'Google':ICON_CDN+'google',
  'xAI':ICON_CDN+'x',
  'Mistral':ICON_CDN+'mistralai',
  'Meta':ICON_CDN+'meta',
  'Cohere':ICON_CDN+'cohere',
  'Groq':ICON_CDN+'groq'
};

/* --- 厂商地区标记（true=国内, false=国外） --- */
var PROVIDER_REGION = {
  // 国内厂商
  '小米 MiMo':true,
  'DeepSeek':true,
  '通义千问':true,
  '智谱AI':true,
  'Kimi':true,
  '文心一言':true,
  '火山引擎':true,
  '腾讯混元':true,
  'MiniMax':true,
  '讯飞星火':true,
  '昆仑万维':true,
  '商汤':true,
  '零一万物':true,
  '阶跃星辰':true,
  '百川智能':true,
  // 国外厂商
  'OpenAI':false,
  'Anthropic':false,
  'Google':false,
  'xAI':false,
  'Mistral':false,
  'Meta':false,
  'Cohere':false,
  'Groq':false
};

/* --- 厂商颜色（用于图标加载失败时的 fallback） --- */
var PROVIDER_COLORS = {
  '小米 MiMo':'#FF6900',
  'DeepSeek':'#0066FF',
  '通义千问':'#FF6A00',
  '智谱AI':'#2B5CE6',
  'Kimi':'#6236FF',
  '文心一言':'#2319DC',
  '火山引擎':'#3B7DF0',
  '腾讯混元':'#07C160',
  'MiniMax':'#000000',
  '讯飞星火':'#0066FF',
  'OpenAI':'#10A37F',
  'Anthropic':'#D4A574',
  'Google':'#4285F4',
  'xAI':'#333333',
  'Mistral':'#FF7000',
  'Meta':'#0668E1',
  'Cohere':'#39594D',
  'Groq':'#F55036'
};

/* --- 小米 MiMo 计费方案配置 --- */
var MIMO_PLANS = {
  tokenPlan: { name:'会员计划', base:'https://token-plan-cn.xiaomimimo.com' },
  payAsYouGo: { name:'按量付费', base:'https://api.xiaomimimo.com' }
};
