import { Context } from 'hono';
import { Env, AppVariables } from '../types';
import { encryptText } from '../utils/crypto';
import { deriveKeyFromString } from '../utils/user-key';

export async function getConfig(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const userId = c.get('user_id');
  try {
    const dbResult = await c.env.DB.prepare('SELECT llm_endpoint, llm_model, updated_at FROM user_configs WHERE user_id = ?').bind(userId).first();
    if (!dbResult) return c.json({ success: true, data: null });
    return c.json({ success: true, data: { llm_endpoint: (dbResult as any).llm_endpoint, llm_model: (dbResult as any).llm_model, has_key: true, updated_at: (dbResult as any).updated_at } });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
}

export async function updateConfig(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const userId = c.get('user_id');
  const body = await c.req.json();
  if (!body.llm_key && !body.llm_endpoint && !body.llm_model) return c.json({ success: false, error: 'No config data provided' }, 400);

  try {
    const existing = await c.env.DB.prepare('SELECT * FROM user_configs WHERE user_id = ?').bind(userId).first();
    const endpoint = body.llm_endpoint || (existing ? (existing as any).llm_endpoint : null);
    const model = body.llm_model || (existing ? (existing as any).llm_model : null);
    let encryptedKey = existing ? (existing as any).encrypted_llm_key : null;

    if (body.llm_key) {
      const encKey = await deriveKeyFromString(c.env.ENCRYPTION_KEY);
      encryptedKey = await encryptText(body.llm_key, encKey);
    }

    if (existing) {
      await c.env.DB.prepare('UPDATE user_configs SET encrypted_llm_key = ?, llm_endpoint = ?, llm_model = ?, updated_at = ? WHERE user_id = ?')
        .bind(encryptedKey, endpoint, model, new Date().toISOString(), userId).run();
    } else {
      await c.env.DB.prepare('INSERT INTO user_configs (user_id, encrypted_llm_key, llm_endpoint, llm_model, updated_at) VALUES (?, ?, ?, ?, ?)')
        .bind(userId, encryptedKey, endpoint, model, new Date().toISOString()).run();
    }
    return c.json({ success: true, message: 'Configuration updated successfully.' });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
}
