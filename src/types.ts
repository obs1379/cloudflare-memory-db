export interface User {
  id: string;
  username: string;
  password_hash: string;
  master_key_salt: string;
  created_at: string;
}

export interface Env {
  CACHE_KV: KVNamespace;
  DB: D1Database;
  VECTORIZE_INDEX: VectorizeIndex;
  AI: any;
  APP_AUTH_TOKEN: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ENCRYPTION_KEY: string;
  SESSION_SECRET: string;
}

export interface AppVariables {
  user_id: string;
  username: string;
}

export interface UserConfig {
  user_id: string;
  encrypted_llm_key?: string;
  llm_endpoint?: string;
  llm_model?: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  raw_input: string;
  platform?: string;
  account?: string;
  notes?: string;
  encrypted_sensitive_data?: string;
  vector_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FileMeta {
  id: string;
  user_id: string;
  memory_id?: string;
  file_name: string;
  r2_key: string;
  mime_type?: string;
  size?: number;
  created_at: string;
}
