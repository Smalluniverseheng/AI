# 第三方科技 · AI 智能聚合平台

一个**纯前端、零后端依赖**的 AI 对话聚合应用。接入 23 家厂商 150+ 模型，支持单模型对话、多模型并行对比、AI 辩论、多模型协同四种模式，可作为 **PWA 应用**安装到手机/电脑桌面。

**在线体验**：https://smalluniverseheng.github.io/AI/

## 功能总览

| 模块 | 能力 |
|------|------|
| 对话模式 | 单模型 / 多模型并行（同题竞技）/ 辩论（立论·攻辩·自由辩·总结·裁判点评）/ 协同（主持人拆解→协作者并行→评审修订→汇总） |
| 模型生态 | 23 家厂商 150+ 模型，官方品牌图标（Lobe Icons），按厂商分组搜索，识图/思考/长文标签 |
| 语音 | 语音输入（SpeechRecognition）+ AI 回复朗读（TTS，可选声音与语速） |
| 文件 | 图片（视觉模型）、PDF / Word / TXT / Markdown / CSV / 代码文件解析后提问 |
| AI 绘画 | OpenAI DALL·E / 火山引擎 Seedream / 通义万相，文字生成图片 |
| 联网搜索 | Tavily 搜索注入，回答附带真实来源 |
| 角色预设 | 12 个精品助手预设（学习助教、英语教练、编程专家、辩论教练…） |
| PWA | manifest + Service Worker，可安装、离线可用、桌面图标 |
| 设备适配 | 电脑横向宽屏 / 手机竖屏 / 手表小屏（1:1、4:3）三端独立界面，语音优先 |
| 数据 | 全量本地存储，对话导出/导入、Key 批量导入导出、全量备份恢复 |
| 主题 | 亮色 / 暗色 / 跟随系统 |

## 设备分级

`js/device.js` 在页面绘制前完成设备识别（UA + 视口双重判定），给 `<html>` 打上
`data-device="watch | mobile | desktop"` 标记，三套界面据此切换：

- **desktop**（电脑）：侧边栏 + 宽屏横向布局，≥1400px 自动加宽对话区与网格
- **mobile**（手机）：抽屉式侧边栏 + 底部导航，竖屏触控优化
- **watch**（手表）：≤340px 或手表 UA 触发。极简单栏、大触控点、麦克风优先、
  圆屏安全边距、强制单模型模式；兼容 Apple Watch（`disabled-adaptations` 真实视口）与 Wear OS 圆表

## 快速开始

```bash
# 本地运行（任意静态服务器）
python -m http.server 8000
# 访问 http://localhost:8000
```

演示账号：`1234 / 1234`（首次登录自动创建）

配置 API Key：登录后进入 **我的 → API Key 管理**，按厂商填写；支持 `slug=key` 每行一条的 txt 批量导入。

## 技术架构

```
纯静态：HTML + CSS + Vanilla JS（ES6+），无构建步骤
存储：localStorage（Store 模块统一收口）
图标：Lobe Icons 官方品牌图标（npmmirror CDN 国内加速）+ 内置 SVG 图标
可选 CDN 增强：KaTeX（公式）、pdf.js（PDF 解析）、mammoth（Word 解析）
```

```
├── index.html          # 入口
├── manifest.json       # PWA 清单
├── sw.js               # Service Worker（离线缓存）
├── icons/              # 应用图标
├── css/                # base / layout / components / chat / login / pages
└── js/
    ├── icons.js        # 内置 SVG 图标库
    ├── models.js       # 150+ 模型数据
    ├── providers.js    # 23 家厂商配置（API 适配/图标/Key）
    ├── store.js        # 状态与本地存储（★ 后端接入点）
    ├── api.js          # 统一 API 网关（★ 后端接入点）
    ├── chat.js         # 四种对话模式编排
    ├── ui.js / pages.js# 渲染层 / 页面
    ├── voice.js / files.js / presets.js / auth.js / markdown.js / util.js / app.js
```

## 接入后端（预留）

代码已为服务端化预留两个接缝，前端 UI 无需改动：

1. **API 网关**：`js/api.js` 顶部 `CONFIG.BACKEND_URL`，设置为你的服务端地址后，所有模型请求可改走服务端代理（Key 不再暴露于浏览器）。
2. **存储层**：`js/store.js` 的 `load()/save()` 是所有持久化的唯一入口，替换为服务端同步即可实现跨设备数据同步。
3. **账号体系**：`js/auth.js` 的 `login/register/logout` 替换为服务端接口即可。

## 部署

推送到 `main` 分支，GitHub Pages 自动部署（约 1-2 分钟生效）。

## 版本

v5.0.0（2026-07-17）完全重构：修复全部已知问题、全新 UI、官方图标、PWA 应用化、语音/文件/绘画/联网插件、性能优化。
