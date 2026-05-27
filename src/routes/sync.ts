import { Context } from 'hono';
import { Env, AppVariables } from '../types';

export async function syncData(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const userId = c.get('user_id');
  const since = c.req.query('since') || '1970-01-01T00:00:00.000Z';

  try {
    const memoriesRes = await c.env.DB.prepare(
      `SELECT id, raw_input, platform, account, notes, vector_id, created_at, updated_at
       FROM memories
       WHERE user_id = ? AND updated_at > ?
       ORDER BY updated_at ASC
       LIMIT 200`
    ).bind(userId, since).all();

    const filesRes = await c.env.DB.prepare(
      `SELECT id, memory_id, file_name, r2_key, mime_type, size, created_at
       FROM files
       WHERE user_id = ? AND created_at > ?
       ORDER BY created_at ASC
       LIMIT 200`
    ).bind(userId, since).all();

    const configRes = await c.env.DB.prepare(
      `SELECT llm_endpoint, llm_model, updated_at
       FROM user_configs
       WHERE user_id = ? AND updated_at > ?`
    ).bind(userId, since).first();

    const memories: any[] = memoriesRes.results || [];
    const files: any[] = filesRes.results || [];

    const latestCandidates: string[] = [since];
    for (const m of memories) {
      if (m.updated_at) latestCandidates.push(String(m.updated_at));
    }
    for (const f of files) {
      if (f.created_at) latestCandidates.push(String(f.created_at));
    }
    if (configRes && (configRes as any).updated_at) {
      latestCandidates.push(String((configRes as any).updated_at));
    }

    latestCandidates.sort();
    const nextSince = latestCandidates[latestCandidates.length - 1] || since;

    return c.json({
      success: true,
      data: {
        memories,
        files,
        config: configRes || null,
        next_since: nextSince,
        has_more: memories.length >= 200 || files.length >= 200
      }
    });
  } catch (error: any) {
    console.error('Sync data error:', error);
    return c.json({ error: 'Internal Server Error', message: error.message }, 500);
  }
}
