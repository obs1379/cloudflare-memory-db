import { Context } from 'hono';
import { Env, AppVariables } from '../types';
import { callLLM, generateEmbeddings } from '../utils/llm';

async function extractTextByMimeType(fileText: string, mimeType: string, env: Env): Promise<string> {
  if (mimeType.startsWith('text/')) {
    return fileText;
  }
  return fileText;
}

export async function processFileMemory(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const userId = c.get('user_id');
  const body = await c.req.json();

  const fileId = body.file_id;
  const fileName = body.file_name || 'unknown';
  const mimeType = body.mime_type || 'text/plain';
  const extractedTextInput = body.extracted_text || '';
  const description = body.description || '';

  if (!fileId || !extractedTextInput) {
    return c.json({ error: 'Bad Request', message: 'Missing file_id or extracted_text' }, 400);
  }

  try {
    const extractedText = await extractTextByMimeType(extractedTextInput, mimeType, c.env);
    const mergedText = `${description}\n\n${extractedText}`.trim();

    const prompt = `You are a file memory extraction assistant. Based on the following content, extract a concise JSON object with keys: platform, account, notes. If unknown, omit. Respond ONLY with valid JSON.\n\nFile name: ${fileName}\nDescription: ${description}\nContent: ${extractedText}`;

    const llmRes = await callLLM([{ role: 'user', content: prompt }], c.env);

    let extracted: any = {};
    try {
      extracted = JSON.parse(llmRes.content.trim());
    } catch {
      extracted = { notes: description || `Imported from file: ${fileName}` };
    }

    const memoryId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO memories (id, user_id, raw_input, platform, account, notes, encrypted_sensitive_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      memoryId,
      userId,
      mergedText,
      extracted.platform || null,
      extracted.account || null,
      extracted.notes || description || `Imported from file: ${fileName}`,
      null,
      now,
      now
    ).run();

    await c.env.DB.prepare(`UPDATE files SET memory_id = ? WHERE id = ? AND user_id = ?`).bind(memoryId, fileId, userId).run();

    c.executionCtx.waitUntil((async () => {
      try {
        const vector = await generateEmbeddings(mergedText, c.env);
        await c.env.VECTORIZE_INDEX.upsert([
          {
            id: memoryId,
            values: vector,
            metadata: {
              user_id: userId,
              file_id: fileId,
              file_name: fileName,
              mime_type: mimeType
            } as any
          }
        ]);
        await c.env.DB.prepare(`UPDATE memories SET vector_id = ? WHERE id = ?`).bind(memoryId, memoryId).run();
      } catch (err) {
        console.error('File vectorization failed:', err);
      }
    })());

    return c.json({
      success: true,
      data: {
        memory_id: memoryId,
        file_id: fileId,
        file_name: fileName,
        notes: extracted.notes || description || `Imported from file: ${fileName}`
      }
    }, 201);
  } catch (error: any) {
    console.error('Process file memory error:', error);
    return c.json({ error: 'Internal Server Error', message: error.message }, 500);
  }
}
