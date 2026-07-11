# AI 多模型对话平台

一个纯前端多模型 AI 对话平台，支持 20+ 家国内外厂商，150+ 模型，四种对话模式。

## ✨ 功能

- 🤖 **20+ 家国内外 AI 厂商，150+ 模型** — 所有 API 端点已内置，用户只需填写 API Key
- 💬 **单模型对话** — 与单个 AI 深度对话
- 📋 **多模型并行** — 多个 AI 同时回答，对比效果
- ⚔️ **辩论模式** — 正方·反方·裁判三角色，支持多轮辩论
- 🤝 **协同合作** — 多个 AI 协作完成同一任务，互相参考
- ⌨️ **打字机效果** — AI 回复逐字显示
- ⏹ **停止功能** — 所有模式支持随时停止生成
- 🧠 **思考链展示** — DeepSeek R1、o1、Claude、Kimi 等思考模型支持思考过程展示
- 📝 **富文本渲染** — Markdown、代码高亮、引用、列表
- 🎤 **语音合成** — 多种音色、语速、情绪可调
- 🧬 **语音克隆** — 上传参考音频克隆音色
- 🎨 **音色设计** — 用文字描述设计音色
- 🔍 **语音识别** — 音频转文字
- 📷 **图片上传** — 支持视觉模型图片理解
- 💾 **对话历史** — 本地保存，支持搜索和管理
- 📥 **Markdown 导出导入** — 对话记录可导出为 Markdown 文件
- 🌙 **深色模式** — 暖色调黑金主题（参考 ToxAI）
- 📱 **响应式适配** — 移动端完美适配

## 🚀 使用

直接打开 `index.html` 即可，无需任何服务器。

**首次使用：**
1. 打开页面，用默认账号登录（1234 / 1234）
2. 点击右上角设置图标，填写对应厂商的 API Key
3. 选择模型开始对话

## 📁 项目结构

```
AI/
├── index.html              # 主文件（单文件部署，所有代码在此）
├── README.md               # 项目说明文档
├── build.sh                # 构建脚本
├── src/                    # 模块化源码（供参考和后期重构）
│   ├── config/             # 配置模块
│   │   ├── models.js       # 模型配置（150+模型数据）
│   │   ├── providers.js    # 厂商配置（API端点、图标、地区）
│   │   └── changelog.js    # 更新日志
│   ├── modules/            # 功能模块（待拆分）
│   │   ├── login.js        # 登录模块
│   │   ├── chat.js         # 聊天核心
│   │   ├── debate.js       # 辩论模式
│   │   ├── collab.js       # 协同合作
│   │   ├── multi.js        # 多模型
│   │   ├── history.js      # 对话历史
│   │   └── voice.js        # 语音功能
│   ├── ui/                 # UI模块（待拆分）
│   │   ├── theme.js        # 主题/样式
│   │   ├── nav.js          # 导航
│   │   └── modal.js        # 弹窗
│   ├── api/                # API模块
│   │   └── client.js       # API调用（内置所有端点）
│   └── utils/              # 工具模块（待拆分）
│       ├── markdown.js     # Markdown渲染
│       └── storage.js      # 本地存储
└── .gitignore
```

## 🔧 技术栈

- 纯 HTML/CSS/JS，单文件部署
- Simple Icons CDN 图标（开源免费）
- Fetch API + SSE 流式输出
- localStorage 数据持久化

## 📋 版本号规范

- 从 1.0 开始：1.0 → 1.1 → 1.2 → 1.3 ...
- 不跳版本号
- 新版本日志添加在最前面，不修改旧的

## 🔑 API Key 配置

所有 API 端点已内置，用户只需在「设置」中填写对应厂商的 API Key：

| 厂商 | 获取 Key 地址 |
|------|--------------|
| 小米 MiMo | platform.moonshot.cn |
| OpenAI | platform.openai.com |
| Anthropic | console.anthropic.com |
| Google | ai.google.dev |
| DeepSeek | platform.deepseek.com |
| 通义千问 | bailian.console.aliyun.com |
| 智谱AI | open.bigmodel.cn |
| Kimi | platform.moonshot.cn |
| 文心一言 | cloud.baidu.com |
| 火山引擎 | console.volcengine.com |
| 腾讯混元 | console.cloud.tencent.com |
| MiniMax | platform.minimaxi.com |
| xAI | console.x.ai |
| Mistral | console.mistral.ai |

## 📦 部署到 GitHub Pages

1. Fork 或上传到 GitHub 仓库
2. Settings → Pages → Source 选 `main` 分支
3. 访问 `https://你的用户名.github.io/仓库名/`

## 📄 License

MIT
