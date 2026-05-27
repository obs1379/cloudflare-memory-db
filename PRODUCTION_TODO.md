# Cloudflare Memory DB - 上线前最终清单

## 一、当前已完成
- [x] 基础 Worker / Hono / Wrangler 配置
- [x] D1 Schema 设计与基础数据结构定义
- [x] AES-256-GCM + PBKDF2 加解密模块
- [x] LLM 路由适配（外部模型 / Cloudflare Workers AI 回退）
- [x] Bearer Token 鉴权中间件
- [x] 记忆写入接口 `POST /api/memory`
- [x] 语义检索接口 `GET /api/memory/search`
- [x] 用户配置接口 `GET/POST /api/config`
- [x] 文件上传元数据接口 `POST /api/files/upload-url`
- [x] 文件解析入库接口 `POST /api/files/process`
- [x] 增量同步接口 `GET /api/sync`
- [x] API 联调页面 `test-client/index.html`
- [x] 第一轮生产化清理（移除测试 Token / 测试主密码 / 测试盐值 / 上传占位值）
- [x] 已创建并绑定新的 D1 / KV / Vectorize 资源
- [x] 已通过 D1 REST API 完成远程 schema 初始化

---

## 二、上线前必须完成（Blocking）

### 1. 配置生产环境 Secrets
- [ ] 配置 `APP_AUTH_TOKEN`
- [ ] 确认不在代码中保存任何敏感密钥

### 2. 初始化用户体系
- [ ] 确保 `users` 表中已有真实用户记录
- [ ] 为每个用户写入 `master_key_salt`
- [ ] 客户端实现 `X-User-Id` 与 `X-Master-Password` 的安全传递逻辑

### 3. 完成基本部署验证
- [ ] 成功部署到 Cloudflare Worker
- [ ] 使用联调页面完成一次完整链路验证：
  - [ ] 保存记忆
  - [ ] 检索记忆
  - [ ] 获取同步结果
  - [ ] 更新用户配置
  - [ ] 文件元数据登记
  - [ ] 文件解析入库

---

## 三、强烈建议上线前完成（High Priority）

### 1. 强化身份认证
- [ ] 将当前单一 `APP_AUTH_TOKEN` 方案升级为更细粒度认证
- [ ] 可选方案：
  - [ ] JWT
  - [ ] 用户级 API Token
  - [ ] Session + 签名机制

### 2. 强化用户密钥传递方案
- [ ] 评估 `X-Master-Password` 方案是否满足你的安全要求
- [ ] 如需更高安全性，升级为：
  - [ ] 前端本地派生密钥
  - [ ] 仅上传派生结果 / 包装密钥
  - [ ] Session unwrap 模式

### 3. 完善错误处理与日志策略
- [ ] 收敛生产日志
- [ ] 避免日志中出现敏感文本
- [ ] 为关键 API 增加统一错误码

### 4. 加强输入校验
- [ ] 为请求体增加字段校验
- [ ] 限制文本长度
- [ ] 限制文件元数据大小
- [ ] 限制同步接口分页范围

---

## 四、建议在正式公开前补充（Recommended）

### 1. 完善记忆管理能力
- [ ] 新增 `PUT /api/memory/:id`
- [ ] 新增 `DELETE /api/memory/:id`
- [ ] 可选：新增记忆列表接口

### 2. 完善多模态处理能力
- [ ] 接入真实 OCR
- [ ] 接入 PDF 文本提取
- [ ] 接入音频转文字

### 3. 完善同步机制
- [ ] 增加分页游标/游标化同步
- [ ] 更完善的冲突解决策略
- [ ] 客户端离线缓存规范

### 4. 自动化部署与回滚
- [ ] GitHub Actions 自动部署
- [ ] 自动运行检查脚本
- [ ] 部署失败回滚机制

---

## 五、当前部署模式说明
当前项目已明确切换为：
- **无 R2 模式**
- 不依赖对象存储即可部署核心文本记忆能力
- 文件相关接口当前只处理：元数据登记 + 已提取文本入库

---

## 六、当前可直接用于部署前检查的文件
- `README.md`
- `DEPLOYMENT.md`
- `production.check.js`
- `docs.check.js`
- `test-client/index.html`
- `schema.sql`

---

## 七、建议的下一步执行顺序
1. 设置 `APP_AUTH_TOKEN`
2. 写入至少一个真实用户及 `master_key_salt`
3. 部署 Worker
4. 用联调页验证全链路
5. 再决定是否补删除/更新接口 / OCR / 自动部署
