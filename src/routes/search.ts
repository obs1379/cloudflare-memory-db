import { Context } from 'hono';
import { Env, AppVariables } from '../types';
import { callLLM, generateEmbeddings } from '../utils/llm';
import { decryptText } from '../utils/crypto';
import { deriveKeyFromString } from '../utils/user-key';

export async function searchMemory(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const userId = c.get('user_id');
  const query = c.req.query('q');
  if (!query) return c.json({ success: false, error: 'Missing query parameter ?q=' }, 400);

  const vec = await generateEmbeddings(query, c.env);
  if (!vec || vec.length === 0) return c.json({ success: false, error: 'Embedding failed' }, 500);

  const vectorResults = await c.env.VECTORIZE_INDEX.query(vec, { topK: 5 });
  if (!vectorResults.matches.length) return c.json({ success: true, answer: '在我的记忆中找不到相关信息。', sources: [] });

  const memoryIds = vectorResults.matches.map((m: any) => m.id);
  const placeholders = memoryIds.map(() => '?').join(',');
  const { results } = await c.env.DB.prepare('SELECT * FROM memories WHERE id IN (' + placeholders + ')').bind(...memoryIds).all();

  const encKey = await deriveKeyFromString(c.env.ENCRYPTION_KEY);
  let contextText = 'Your stored memories:\n';
  for (const mem of results) {
    let sensitive = '';
    if ((mem as any).encrypted_sensitive_data) {
      try { sensitive = await decryptText((mem as any).encrypted_sensitive_data, encKey); } catch { sensitive = '[解密失败]'; }
    }
    contextText += '- Platform: ' + ((mem as any).platform || 'N/A') + ', Account: ' + ((mem as any).account || 'N/A') + ', Password: ' + (sensitive || 'N/A') + ', Notes: ' + ((mem as any).notes || 'N/A') + ', Content: ' + (mem as any).raw_input + '\n';
  }

  let userConfig: any = null;
  let plainKey: string | undefined;
  try {
    const configRow = await c.env.DB.prepare('SELECT * FROM user_configs WHERE user_id = ?').bind(userId).first();
    if (configRow && (configRow as any).encrypted_llm_key && (configRow as any).llm_endpoint) {
      userConfig = configRow;
      plainKey = await decryptText((configRow as any).encrypted_llm_key, encKey);
    }
  } catch {}

  const systemPrompt = '你是一个个人记忆助手。请仅根据提供的记忆上下文回答用户问题。如果上下文中没有相关信息，请说"在我的记忆中找不到相关信息"。不要暴露原始上下文格式，用自然语言回答。请始终使用中文回答。';
  const userPrompt = 'Context:\n' + contextText + '\n\nUser Question: ' + query;
  const llmRes = await callLLM([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], c.env, userConfig, plainKey);

  return c.json({ success: true, answer: llmRes.content, sources: results.map((m: any) => ({ id: m.id, platform: m.platform, created_at: m.created_at })) });
}
