import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './utils/auth';
import { createMemory } from './routes/memory';
import { searchMemory } from './routes/search';
import { getConfig, updateConfig } from './routes/config';
import { listMemories } from './routes/memories';
import { deleteMemory } from './routes/memory-delete';
import { syncData } from './routes/sync';
import { login, logout } from './routes/login';
import { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin) => origin,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Cloudflare Memory DB API is running.', timestamp: new Date().toISOString() });
});

app.post('/api/login', login);
app.post('/api/logout', logout);

// 诊断端点
  try {
    const r1: any = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: ['hello'] });
    return c.json({ data0Len: r1?.data?.[0]?.length });
  } catch (e: any) { return c.json({ error: e.message }); }
});

const protectedRoutes = new Hono<{ Bindings: Env }>();
protectedRoutes.use('*', authMiddleware);
protectedRoutes.post('/memory', createMemory);
protectedRoutes.get('/memory/search', searchMemory);
protectedRoutes.get('/config', getConfig);
protectedRoutes.post('/config', updateConfig);
protectedRoutes.get('/memories', listMemories);
protectedRoutes.delete('/memory/:id', deleteMemory);
protectedRoutes.get('/sync', syncData);

app.route('/api', protectedRoutes);

export default app;
