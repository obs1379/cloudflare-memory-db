import { Context } from 'hono';
import { Env, AppVariables } from '../types';

export async function listMemories(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const userId = c.get('user_id');
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const offset = (page - 1) * limit;

  try {
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM memories WHERE user_id = ?'
    ).bind(userId).first();

    const total = (countResult as any)?.total || 0;

    const dbResult = await c.env.DB.prepare(
      `SELECT id, raw_input, platform, account, notes, created_at, updated_at
       FROM memories
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(userId, limit, offset).all();

    const memories = dbResult.results || [];

    return c.json({
      success: true,
      data: {
        memories,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('List memories error:', error);
    return c.json({ error: 'Internal Server Error', message: error.message }, 500);
  }
}
