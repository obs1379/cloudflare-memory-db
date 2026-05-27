import { Context } from 'hono';
import { Env } from '../types';

export async function deleteMemory(c: Context<{ Bindings: Env }>) {
  const userId = c.get('user_id');
  const memoryId = c.req.param('id');

  if (!memoryId) {
    return c.json({ error: 'Bad Request', message: 'Missing memory id' }, 400);
  }

  try {
    const row = await c.env.DB.prepare(
      'SELECT id FROM memories WHERE id = ? AND user_id = ?'
    ).bind(memoryId, userId).first();

    if (!row) {
      return c.json({ success: false, error: 'Memory not found' }, 404);
    }

    // 删除向量索引中的记录
    try {
      await c.env.VECTORIZE_INDEX.deleteByIds([memoryId]);
    } catch {
      // 向量删除失败不影响主记录删除
    }

    await c.env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?')
      .bind(memoryId, userId).run();

    // 解除关联的文件
    await c.env.DB.prepare('UPDATE files SET memory_id = NULL WHERE memory_id = ? AND user_id = ?')
      .bind(memoryId, userId).run();

    return c.json({ success: true, message: 'Memory deleted successfully.' });
  } catch (error: any) {
    console.error('Delete memory error:', error);
    return c.json({ error: 'Internal Server Error', message: error.message }, 500);
  }
}
