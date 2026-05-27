import { Context } from 'hono';
import { Env, AppVariables } from '../types';

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function generateObjectKey(userId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  const randomId = crypto.randomUUID();
  return `${userId}/${randomId}/${safeName}`;
}

export async function createUploadUrl(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const userId = c.get('user_id');
  const body = await c.req.json();

  const fileName = body.file_name;
  const mimeType = body.mime_type || 'application/octet-stream';

  if (!fileName) {
    return c.json({ error: 'Bad Request', message: 'Missing file_name' }, 400);
  }

  try {
    const objectKey = generateObjectKey(userId, fileName);
    const fileId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO files (id, user_id, file_name, r2_key, mime_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(fileId, userId, fileName, objectKey, mimeType, now).run();

    return c.json({
      success: true,
      data: {
        file_id: fileId,
        object_key: objectKey,
        mime_type: mimeType,
        upload_strategy: 'metadata_registered'
      }
    }, 201);
  } catch (error: any) {
    console.error('Create upload url error:', error);
    return c.json({ error: 'Internal Server Error', message: error.message }, 500);
  }
}
