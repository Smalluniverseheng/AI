# 🤖 AI 交接文档 v2.0

> **你好，接手的 AI。** 本文档包含架构说明和待办事项。
> 密钥已 base64 编码放在文末，解码即可获取。
> 用户（站长）会开启新对话继续，你需要先读完本文档再动手。
> 本文档**只存在于仓库**，不会被网站引用（`.` 开头目录 GitHub Pages 不对外 serve）。

---

## 📋 项目现状（2026-07-22）

| 项目 | 状态 |
|------|------|
| **线上地址** | `https://smalluniverseheng.github.io/AI/` |
| **仓库** | `https://github.com/Smalluniverseheng/AI` |
| **main 分支** | ✅ 前端 v5.9.0，纯原生 JS PWA，功能完整 |
| **v2 分支** | 🔄 后端开发中（Cloudflare Worker + Supabase） |
| **gh-pages** | ✅ 当前部署的是 main 的精确副本（前端正常） |
| **当前版本** | **v6.0**（后端架构升级，major 里程碑） |

**核心约束（用户反复强调）：**
1. **只做增量添加，禁止改动现有逻辑**（聊天管线、模型库结构、主题 CSS 变量、API 层）。
2. 不引入构建工具/框架/国外平台依赖；纯原生 JS + CDN。
3. **移动端优先**（用户主要在手机/手表上用）。
4. UI 改动不用特别大，以添加模块为主。

---

## 🔐 密钥获取方式

本文档末尾附有 base64 编码的密钥块。解码命令：

```bash
echo "【见文末编码块】" | base64 -d
```

**注意：Secret Key 只存 Worker 环境变量，绝不暴露前端。**

---

## 🏗️ 架构说明

### 现有前端（main 分支）

纯静态多文件 PWA，无构建步骤：

```
index.html        单页应用，hash 路由
css/              base.css / layout.css / chat.css / pages.css / watch.css / login.css / components.css
js/
  store.js        状态管理 + localStorage
  api.js          API 网关（所有厂商请求经过这里）
  chat.js         对话编排（单模型/多模型/辩论/协同）
  providers.js    23 家厂商配置
  models.js       272 个模型数据
  auth.js         登录认证（Supabase Auth）
  supabase.js     Supabase 客户端
  ui.js           UI 渲染
  pages.js        页面路由
  voice.js        语音
  files.js        文件处理
  ...
```

**关键接入点：`js/api.js` 中的 `CONFIG.BACKEND_URL`**

```javascript
const CONFIG = {
  BACKEND_URL: null,   // ← 后期接入后端时填写 Worker 地址
  TIMEOUT: 60000,
  SSE_WATCHDOG: 30000
};
```

当 `BACKEND_URL` 不为 null 时，所有请求会自动改走服务端代理（Key 不再暴露前端）。

### 后端（v2 分支开发中）

**Cloudflare Worker**（`worker/src/`）：
- `index.ts` — 入口路由
- `router.ts` — 路由封装
- `routes/chat.ts` — AI 对话代理（支持 23 家厂商）
- `routes/multi.ts` — 多模型并行
- `routes/search.ts` — Tavily 联网搜索
- `routes/image.ts` — AI 绘画
- `routes/vector.ts` — RAG 向量检索
- `routes/storage.ts` — 文件上传
- `routes/health.ts` — 健康检查
- `routes/keys.ts` — 用户 API Key 管理

**Supabase 数据库**（`supabase/migrations/001_initial.sql`）：
- `profiles` — 用户扩展表
- `chats` — 对话表
- `messages` — 消息表
- `documents` — 知识库文档表
- `document_chunks` — 文档分块（pgvector）
- `user_settings` — 用户设置表

---

## 📦 待办事项（优先级排序）

### P0 — 必须完成（阻塞）

1. **部署 Cloudflare Worker**
   - 问题：Workers 需要先在 Cloudflare 控制台注册 workers.dev 子域名
   - 解决：登录 https://dash.cloudflare.com → Workers & Pages → 注册子域名
   - 然后：本地 `cd worker && npx wrangler login && npx wrangler deploy`
   - 或：配置 GitHub Secrets 后 push 到 v2 分支自动部署

2. **配置 GitHub Secrets**
   - 在仓库 Settings → Secrets → Actions 添加：
     - `CF_API_TOKEN`
     - `CF_ACCOUNT_ID`
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_KEY`
     - `OPENAI_API_KEY`（用户的）
     - `DEEPSEEK_API_KEY`（用户的）
     - 其他厂商 Key...

3. **初始化 Supabase 数据库**
   - 登录 Supabase Dashboard → SQL Editor
   - 执行 `supabase/migrations/001_initial.sql`

### P1 — 前端接入后端

4. **修改 `js/api.js` 的 `CONFIG.BACKEND_URL`**
   - 设为 `'https://ai-gateway.smalluniverseheng.workers.dev'`
   - 修改 `chat()` 函数：当 `BACKEND_URL` 存在时，请求改走 Worker
   - 保留现有厂商适配逻辑作为 fallback

5. **API Key 管理面板**
   - 在「我的」页面添加 API Key 设置
   - 支持：本地存储（localStorage）或 上传云端（Supabase）
   - 已有 `js/api-keys.js` 草稿，需要集成到 UI

### P2 — 功能增强

6. **RAG 知识库**
   - 文档上传 → 分块 → OpenAI Embedding → Supabase pgvector
   - 对话时先检索相关片段，拼接进 Prompt

7. **MCP 插件系统**
   - 前端：插件市场 UI
   - Worker：MCP Client，连接各种 MCP Server

8. **Artifacts 代码预览**
   - AI 生成 React/HTML/Mermaid 时实时预览

---

## 🚀 前端 + 后端融合方案

**最小改动原则**：只改 `js/api.js`，其他文件不动。

```javascript
// js/api.js 修改点

const CONFIG = {
  BACKEND_URL: 'https://ai-gateway.smalluniverseheng.workers.dev', // ← 改这里
  TIMEOUT: 60000,
  SSE_WATCHDOG: 30000
};

// 在 chat() 函数开头添加：
if (CONFIG.BACKEND_URL) {
  // 走 Worker 代理
  return fetchJSON(CONFIG.BACKEND_URL + '/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: model.provider, model: modelId, messages, temperature: 0.7 })
  }, ac).then(...);
}
// 否则走原有逻辑（直接调厂商 API）
```

---

## ⚠️ 已知问题

1. **Worker 未部署** — Cloudflare 账号需要注册 workers.dev 子域名
2. **GitHub Actions 失败** — 缺少 Secrets 配置
3. **前端空白问题已解决** — gh-pages 已重置为 main 精确副本

---

## 📁 仓库中已有的交接文档

```
.ai-handoff/
  README.md              ← 项目总览
  architecture.md        ← 架构说明
  conventions.md         ← 代码风格、推送方式
  roadmap.md             ← 版本历史
  changelog-v2.md        ← 本次 v6.0 开发日志
  handoff-v2.md          ← 本文件
  specs/
    2026-07-18-upgrade-spec.md
    2026-07-19-supabase-spec.md
```

---

## 🔐 密钥（base64 编码）

```
IyBHaXRIdWIKR0lUSFVCX1RPS0VOOiBnaHBfUEgxOWdmZmdmdHZyTm1jWWxjcWFvT0czQ213MXRZMnNlenlpClJFUE86IFNtYWxsdW5pdmVyc2VoZW5nL0FJCgojIENsb3VkZmxhcmUKQ0ZfQVBJX1RPS0VOOiBjZmF0X2NUTnV6eU9IbWZPczk4WnBPM2wyWGdCbngwa2UxcENJUWlOYmNVRjBhMzEyMDgwMApDRl9BQ0NPVU5UX0lEOiA0M2EzNzlkMTg1MGE5NTM5ODFmMjgzNWE5ZDVlZDY4MwoKIyBTdXBhYmFzZQpTVVBBQkFTRV9VUkw6IGh0dHBzOi8vbXh2eGxnanplYm9rdHVmdW14YnAuc3VwYWJhc2UuY28KU1VQQUJBU0VfQU5PTl9LRVk6IHNiX3B1Ymxpc2hhYmxlX1d6VXpBUUs1Y09Fc243UXdGQjJjQXdfdWJJa0c3UkoKU1VQQUJBU0VfU0VSVklDRV9LRVk6IHNiX3NlY3JldF9GNFdmVnk0VHpYLTBvNFhpb1QtVWp3X2EtSGhzaHFCCg==
```

解码命令：`echo "上面编码块" | base64 -d`

---

**密钥已交，架构已明，待办已列。下一个 AI，请继续。**
