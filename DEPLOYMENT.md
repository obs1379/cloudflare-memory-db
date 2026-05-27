# Cloudflare Memory DB 部署说明

## 一、部署前准备
你需要先在 Cloudflare 控制台准备以下资源：
1. Worker
2. D1 数据库
3. Vectorize 索引
4. KV Namespace
5. Workers AI 可用权限

> 当前项目已切换为**无 R2 模式**，不依赖对象存储即可部署核心功能。

---

## 二、修改 `wrangler.toml`
将以下值配置为真实资源：
- `database_id`
- `database_name`
- `kv_namespaces.id`
- `index_name`

示例关键字段：
```toml
[[kv_namespaces]]
binding = "CACHE_KV"
id = "你的 KV ID"

[[d1_databases]]
binding = "DB"
database_name = "你的 D1 名称"
database_id = "你的 D1 ID"

[[vectorize]]
binding = "VECTORIZE_INDEX"
index_name = "你的 Vectorize 索引名"
```

---

## 三、初始化数据库
可使用以下两种方式之一：

### 方式 A：Wrangler
```bash
CLOUDFLARE_API_TOKEN=你的Token npx wrangler d1 execute 你的D1名称 --file=schema.sql --remote
```

### 方式 B：Cloudflare D1 REST API
如果当前终端环境下 `wrangler` 网络不稳定，可以通过 API 逐条执行 `schema.sql`。

---

## 四、设置敏感配置
当前项目必须设置：
- `APP_AUTH_TOKEN`

例如：
```bash
CLOUDFLARE_API_TOKEN=你的Token npx wrangler secret put APP_AUTH_TOKEN
```

---

## 五、部署 Worker
```bash
CLOUDFLARE_API_TOKEN=你的Token npx wrangler deploy
```

部署成功后会得到一个 `*.workers.dev` 域名。

---

## 六、联调测试
可以使用以下方式进行联调：
1. 打开 `test-client/index.html`
2. 填入：
   - Worker API Base URL（如 `https://xxx.workers.dev/api`）
   - Bearer Token
3. 手动测试：
   - `POST /memory`
   - `GET /memory/search`
   - `GET /sync`

如涉及敏感字段加解密，还需要客户端传递：
- `X-User-Id`
- `X-Master-Password`

---

## 七、生产化改造建议
### 必改项
1. 为 `users` 表写入真实用户和 `master_key_salt`
2. 配置 `APP_AUTH_TOKEN`
3. 确保客户端正确传递 `X-User-Id` 与 `X-Master-Password`
4. 完成 D1 schema 初始化

### 建议项
1. 增加 `PUT /api/memory/:id`
2. 增加 `DELETE /api/memory/:id`
3. 增加更严格的请求体校验
4. 增加分页与更严格的同步游标设计
5. 增加部署 CI/CD

---

## 八、当前联调文件
- README: `README.md`
- 联调页: `test-client/index.html`
- 项目计划: `/var/minis/workspace/cloudflare_memory_db_plan.md`
- 项目规范: `/var/minis/workspace/cloudflare_memory_db_spec.md`
- 上线前清单: `PRODUCTION_TODO.md`
