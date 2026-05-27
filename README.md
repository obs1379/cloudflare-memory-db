# 🧠 Cloudflare Memory DB

一个基于 Cloudflare 纯 Serverless 架构的**对话式个人记忆数据库**。

你可以通过自然语言告诉它任何事情（例如：“我把护照放在了主卧第二个抽屉”），它会自动提取关键信息并进行向量化存储；当你提问时（例如：“我的护照在哪？”），它会通过语义检索找到相关记忆，并用自然语言总结回答你。

## ✨ 核心特性

- **💬 自然语言交互**：无需手动填写表单，像聊天一样记录和检索个人碎片化信息。
- **🔍 语义检索**：基于文本向量化（Embeddings），支持模糊搜索和语义匹配。
- **🔒 极致安全**：
  - 纯私有部署，数据完全掌握在自己手中（Cloudflare D1）。
  - 敏感配置（如外部大模型 API Key）在数据库中加密存储。
  - 基于 Web Crypto API 的无状态 Session 签名与 Bearer Token 双重鉴权。
- **⚡ 纯 Serverless**：依托 Cloudflare 生态，极低延迟，且完全可以利用**免费额度**运行。
- **🤖 灵活的 AI 后端**：支持配置外部大模型（如 DeepSeek、OpenAI 等）进行智能实体提取与对话，同时内置 Cloudflare Workers AI 作为兜底。
- **📱 极简前端**：单文件 SPA 原生前端，支持响应式，自适应多端访问。

## 🛠️ 技术栈

- **后端路由**：[Hono](https://hono.dev/) + TypeScript
- **结构化存储**：[Cloudflare D1](https://developers.cloudflare.com/d1/) (Serverless SQLite)
- **向量数据库**：[Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/) (Cosine 相似度, 768维)
- **键值缓存**：[Cloudflare KV](https://developers.cloudflare.com/kv/)
- **AI 模型**：Cloudflare Workers AI (`@cf/baai/bge-base-en-v1.5` 用于向量化)
- **前端托管**：[Cloudflare Pages](https://pages.cloudflare.com/)

---

## 🚀 部署指南

### 1. 环境准备
确保已安装 Node.js，并全局安装了 Wrangler 命令行工具：
```bash
npm install -g wrangler
wrangler login
```

### 2. 创建 Cloudflare 资源
在终端中依次执行以下命令，创建所需的数据库和缓存：

```bash
# 1. 创建 D1 数据库
wrangler d1 create memory-db-prod

# 2. 创建 Vectorize 向量索引 (768维，使用 cosine)
wrangler vectorize create memory-vector-index --dimensions=768 --metric=cosine

# 3. 创建 KV 命名空间
wrangler kv:namespace create "cloudflare-memory-db-cache"
```

### 3. 配置项目
将上一步生成的 `database_id` 和 `id` 填入项目根目录的 `wrangler.toml` 文件中相应的绑定位置。

### 4. 设置环境变量 (Secrets)
为 Worker 设置必要的安全密钥和管理员凭证：
```bash
wrangler secret put APP_AUTH_TOKEN     # API 备用 Token
wrangler secret put ADMIN_USERNAME     # 登录用户名
wrangler secret put ADMIN_PASSWORD     # 登录密码
wrangler secret put SESSION_SECRET     # Cookie 签名密钥 (随机字符串)
wrangler secret put ENCRYPTION_KEY     # 数据库加密密钥 (必须为 32 字符的随机字符串)
```

### 5. 初始化数据库表结构
```bash
wrangler d1 execute memory-db-prod --file=./schema.sql --remote
```

### 6. 部署后端 Worker
```bash
npm install
npm run deploy
```

### 7. 部署前端 Pages
前端代码位于 `app/` 目录下，直接将其部署到 Cloudflare Pages：
```bash
wrangler pages deploy app/
```

---

## 💡 使用说明

1. 访问你部署好的前端页面（例如 `https://your-project.pages.dev`）。
2. 在页面弹出的配置框中，输入你部署好的 Worker API 地址（例如 `https://your-worker.workers.dev`）。
3. 使用你在 `wrangler secret` 中设置的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 登录。
4. **（推荐）** 在页面底部的“LLM 配置”中，填入你的 DeepSeek 或 OpenAI 的 API Key 及 Base URL，以获得更强大的语义提取和对话能力。
5. 开始记录和检索你的记忆！

## 📄 协议
MIT License