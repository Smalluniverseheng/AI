# 架构说明

## 技术形态
纯静态多文件 PWA：一个 `index.html` + `css/` + `js/` 若干原生 ES6 模块（IIFE 全局单例，非 ES Module），无构建步骤。所有 js 通过 `<script src="js/xxx.js?v=版本">` 顺序加载，靠全局对象互相调用（`Store` `UI` `Chat` `API` `Pages` `Voice` `Plugins` `Skills` `TokenStats` `MD` `I18n` `Toast` 等）。

## 文件与职责

```
index.html        全部页面/弹窗/subpage 的 DOM（单页应用，hash 路由 pageChat/pageModels/pageDiscover/pageProfile）
manifest.json     PWA 配置
sw.js             Service Worker（network-first，VERSION 常量控制缓存桶）
assets/brand.jpg  品牌 logo（开屏页用）
css/
  base.css        主题 CSS 变量（--bg/--card/--text-1/2/3/--border/--accent 等，明暗双主题）★禁止改变量名
  layout.css      整体布局/侧栏/移动端断点(≤860px)/手表适配入口
  login.css       登录页 + 开屏页 splash
  chat.css        对话页/消息气泡/工具卡片/思考面板
  pages.css       模型页/排行榜/发现页/我的页/各 subpage
  watch.css       手表端（小屏）适配 ★别破坏
js/
  store.js        Store：state + localStorage 持久化（DEFAULTS 扩展须做老数据兼容）
  token.js        TokenStats：usage 记账/估算/聚合查询
  api.js          API：三家格式（OpenAI 兼容/Anthropic/Google）流式+非流式、usage 捕获、30s 熔断
  models.js       MODELS 目录（270+）+ MODEL_RANK 排行榜数据
  modelsync.js    模型目录辅助
  providers.js    PROVIDERS 厂商配置（base/headers/适配参数）+ getModel/getKeyForModel/isSelectableModel + APP_VERSION
  plugins.js      Plugins：插件定义与配置（tavily-search/github-connector/tencent-cloud/opensource-ecosystem）
  skills.js       Skills：内置技能(润色/摘要/代码解释) + 模板库 + 自定义技能，与 toolsEnabled 双向同步
  chat.js         Chat：会话 CRUD、发送管线（单模型/多模型/辩论/协同）、中止、重生成
  ui.js           UI：消息渲染(msgHtml/thinkingHtml/工具卡片)、侧栏、顶栏、手势、播报按钮
  pages.js        Pages：模型页/排行榜/发现页/工具弹窗/我的页/subpage 体系/语音工坊/翻译空间
  voice.js        Voice：ASR/TTS 多引擎（browser/MiMo/OpenAI/Groq）、speakMimo/speakClone
  markdown.js     MD：markdown 渲染 + 代码块复制 + KaTeX
  i18n.js         I18n：7 语言词条（新增词条至少补 zh-CN/zh-TW/en）
  changelog.js    CHANGELOG：更新日志数据（数组顶部追加）
  auth.js         Auth：本地账号/游客
  icons.js        icon() SVG 图标库（新增图标加这里）
  app.js          启动入口：Store.load → 登录 → showApp → splash
```

## 关键契约（跨模块调用，改签名前全文搜索调用方）

- `API.chat({modelId, messages, onChunk, onThinking, onToolCall, signal}) → {content, thinking, toolCalls, usage}`
- `TokenStats.estimate/record/byProvider/grand/fmt/reset`
- `Plugins.getGithub() → {enabled, token, repo, branch}|null`；`Plugins.githubPush(path, content, message) → Promise<html_url>`
- `Skills.listEnabled()/toggle/addFromLibrary/addCustom/removeCustom/getPrompt`
- `Pages.openSub(id)/closeSubs()` —— subpage 机制：`.subpage` DOM + `data-sub` 条目
- 消息对象：`{id, role, content, thinking, toolCalls, image, file, model, ts, error}`（老数据缺字段必须可渲染）

## 数据流
用户输入 → chat.js 组装 messages（注入系统提示/语言提示/角色/联网）→ api.js 按厂商格式 fetch SSE → 回调流式更新 ui.js → 完成时记账 TokenStats、存 Store。全部状态在 `Store.state`（key: `ai_chat_state_v5`），`Store.save()` 400ms 防抖落盘。

## 设计约定
- 增量开发：新功能优先加新文件/新 subpage/新 CSS 追加，不重构旧代码。
- 样式一律用现有 CSS 变量，明暗主题自动适配；新 CSS 追加到对应文件末尾。
- 文案全中文走 i18n（大量历史文案是硬编码中文，新功能要求至少三语言）。
- 移动端(≤860px)与桌面双布局已存在；手表端有独立简化 UI，新功能默认手表端隐藏或降级。
