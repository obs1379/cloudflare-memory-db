# Cloudflare Memory DB

基于 **Cloudflare Workers / D1 / Vectorize / Workers AI** 的对话式个人记忆数据库。  
通过自然语言保存和检索你的密码、账号、笔记等信息，支持语义搜索和自定义 LLM。

---

## 在线地址

部署完成后：

| 服务 | 地址 |
|------|------|
| 🌐 前端页面 | `https://你的项目名.pages.dev/<你的Token>` |
| ⚡ API | `https://你的worker名.你的账号名.workers.dev` |

> 前端需在 URL 后附加 `APP_AUTH_TOKEN` 才能访问登录页。

---

## 功能特性

- 🔒 **敏感数据加密**：密码/密钥使用 AES-256-GCM 加密存储  
- 🧠 **语义检索**：通过 Vectorize 向量数据库实现自然语言搜索  
- 🤖 **自定义 LLM**：支持 DeepSeek、OpenAI 等外部模型，未配置时自动回退 Workers AI  
- 🔑 **用户认证**：Token + 用户名/密码双重验证  
- 📋 **记忆管理**：保存、搜索、列表、删除  
- 🌐 **前端页面**：完整的 Web UI，支持 Token 直链登录  
- 📦 **无 R2 模式**：核心功能无需付费对象存储  

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers |
| 框架 | Hono |
| 数据库 | D1 (SQLite) |
| 向量检索 | Vectorize (768维, cosine) |
| LLM | Workers AI / 外部 API |
| 加密 | Web Crypto API (AES-256-GCM + PBKDF2) |
| 前端 | 单页 HTML (Pages) |

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 健康检查 |
| `POST` | `/api/login` | 用户登录（验证用户名+主密码） |
| `POST` | `/api/memory` | 保存记忆（自动提取平台/账号/密码） |
| `GET` | `/api/memory/search?q=` | 语义检索记忆 |
| `GET` | `/api/memories` | 记忆列表（支持分页） |
| `DELETE` | `/api/memory/:id` | 删除记忆 |
| `GET` | `/api/config` | 查看 LLM 配置 |
| `POST` | `/api/config` | 更新 LLM 配置（Key 加密存储） |
| `POST` | `/api/files/upload-url` | 文件上传登记 |
| `POST` | `/api/files/process` | 文件内容入库 |
| `GET` | `/api/sync?since=` | 增量同步 |

所有受保护接口需传入：
- `Authorization: Bearer <APP_AUTH_TOKEN>`
- `X-User-Id: <用户名或用户ID>`
- `X-Master-Password: <主密码>`（加解密时需要）

---

## 目录结构

```
src/
├── index.ts              # 入口 + 路由注册
├── types.ts              # 共享类型定义
├── routes/
│   ├── login.ts          # 登录验证
│   ├── memory.ts         # 保存记忆
│   ├── search.ts         # 语义检索
│   ├── memories.ts       # 记忆列表
│   ├── memory-delete.ts  # 删除记忆
│   ├── config.ts         # LLM 配置
│   ├── files.ts          # 文件上传
│   ├── file-process.ts   # 文件解析入库
│   └── sync.ts           # 增量同步
├── utils/
│   ├── crypto.ts         # AES-256-GCM 加解密
│   ├── llm.ts            # LLM 路由适配器
│   ├── auth.ts           # Bearer Token 鉴权
│   └── user-key.ts       # 用户密钥派生
├── app/
│   └── index.html        # 前端页面
├── schema.sql            # D1 数据库建表
├── wrangler.toml         # Cloudflare 配置
```

---

## 部署

### 前置条件
- Cloudflare 账号（D1 / KV / Vectorize / Workers AI）
- Node.js 18+
- `wrangler.toml` 中的资源 ID 替换为你的资源

### 步骤

```bash
# 1. 初始化 D1 数据库
npx wrangler d1 execute memory-db-prod --file=schema.sql --remote

# 2. 部署 Worker
npx wrangler deploy

# 3. 设置 Token 密钥
npx wrangler secret put APP_AUTH_TOKEN

# 4. 部署前端（可选）
npx wrangler pages deploy app/ --project-name=<项目名> --branch main

# 5. 写入管理员用户
curl -X POST <API地址>/api/login -H "Authorization: Bearer <TOKEN>" \
  -d '{"username":"admin","master_password":"你的密码"}'
```


---

## 本地开发

```bash
npm install
npm run dev    # wrangler dev
```

---

## 安全说明

- 密码/密钥：AES-256-GCM 加密后存入 D1，解密密钥由用户主密码动态派生
- API Token：存储在 Cloudflare Secrets，不写入代码
- API Key 配置：加密存储，接口仅返回「是否已配置」
- 日志：生产环境中不记录敏感信息

---

## 许可证

私有项目，未声明公开许可证。
