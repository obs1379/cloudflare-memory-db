-- Cloudflare D1 SQLite Schema

-- 1. 用户表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    master_key_salt TEXT NOT NULL, -- 用于配合用户密码派生 Web Crypto API 的主密钥
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 用户配置表 (存储外部 LLM 配置)
DROP TABLE IF EXISTS user_configs;
CREATE TABLE user_configs (
    user_id TEXT PRIMARY KEY,
    encrypted_llm_key TEXT, -- 加密存储的 API Key
    llm_endpoint TEXT,      -- 自定义 API 端点 (如 https://api.openai.com/v1)
    llm_model TEXT,         -- 自定义模型名 (如 gpt-4o)
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. 记忆主表
DROP TABLE IF EXISTS memories;
CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    raw_input TEXT NOT NULL,               -- 用户的原始输入语句
    platform TEXT,                         -- 提取的平台名 (如 "Twitter", "GitHub")
    account TEXT,                          -- 提取的账号名
    notes TEXT,                            -- 其他非敏感备注信息
    encrypted_sensitive_data TEXT,         -- 敏感信息 (密码/密钥/Token)，AES-GCM 加密后的 Base64 字符串
    vector_id TEXT,                        -- 关联到 Cloudflare Vectorize 数据库中的向量 ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 文件关联表 (存储上传到 R2 的文件元数据)
DROP TABLE IF EXISTS files;
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    memory_id TEXT,                        -- 关联的记忆条目 ID
    file_name TEXT NOT NULL,               -- 原始文件名
    r2_key TEXT NOT NULL,                  -- R2 存储桶中的唯一 Object Key
    mime_type TEXT,                        -- 文件类型
    size INTEGER,                          -- 文件大小 (Bytes)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE SET NULL
);

-- 创建索引以优化查询性能
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_memory_id ON files(memory_id);
