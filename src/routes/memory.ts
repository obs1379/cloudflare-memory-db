import { Context } from 'hono';
import { Env, AppVariables } from '../types';
import { callLLM, generateEmbeddings } from '../utils/llm';
import { encryptText } from '../utils/crypto';
import { deriveKeyFromString } from '../utils/user-key';

interface ExtractedEntity { platform?: string; account?: string; password?: string; notes?: string; }

export async function createMemory(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const userId = c.get('user_id');
  const rawInput = (await c.req.json()).text;
  if (!rawInput) return c.json({ success: false, error: 'No text provided' }, 400);

  let userConfig: any = null;
  let plainKey: string | undefined;
  try {
    const configRow = await c.env.DB.prepare('SELECT * FROM user_configs WHERE user_id = ?').bind(userId).first();
    if (configRow && (configRow as any).encrypted_llm_key && (configRow as any).llm_endpoint) {
      userConfig = configRow;
      const encKey = await deriveKeyFromString(c.env.ENCRYPTION_KEY);
      const { decryptText } = await import('../utils/crypto');
      plainKey = await decryptText((configRow as any).encrypted_llm_key, encKey);
    }
  } catch {}

  const prompt = 'You are an information extraction assistant. Extract: platform, account, password, and notes from the input. Omit missing entities. Respond ONLY with valid JSON.\n\nUser input: ' + rawInput;
  const llmRes = await callLLM([{ role: 'user', content: prompt }], c.env, userConfig, plainKey);
  let extracted: ExtractedEntity = {};
  try { extracted = JSON.parse(llmRes.content.trim()); } catch { extracted.notes = rawInput; }

  let encryptedData = undefined;
  if (extracted.password) {
    const encKey = await deriveKeyFromString(c.env.ENCRYPTION_KEY);
    encryptedData = await encryptText(extracted.password, encKey);
  }

  const memoryId = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO memories (id, user_id, raw_input, platform, account, notes, encrypted_sensitive_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(memoryId, userId, rawInput, extracted.platform || null, extracted.account || null, extracted.notes || null, encryptedData || null, now, now).run();

  c.executionCtx.waitUntil((async () => {
    try {
      const vec = await generateEmbeddings(rawInput, c.env);
      if (vec && vec.length > 0 && c.env.VECTORIZE_INDEX) {
        await c.env.VECTORIZE_INDEX.upsert([{ id: memoryId, values: vec, metadata: { user_id: userId, platform: extracted.platform || '' } }]);
      }
    } catch (e) { console.error('Vector upsert failed:', e); }
  })());

  return c.json({ success: true, data: { id: memoryId, platform: extracted.platform, has_sensitive_data: !!encryptedData, message: 'Memory saved successfully.' } });
}
