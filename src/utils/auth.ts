import { Context, Next } from 'hono';
import { parseCookie, verifySession } from './session';

export async function authMiddleware(c: Context<{ Bindings: any; Variables: { user_id: string; username: string } }>, next: Next) {
  const secret = c.env.SESSION_SECRET;

  // 1. Cookie session
  try {
    const cookies = parseCookie(c.req.header('Cookie'));
    if (cookies.session && secret) {
      const payload = await verifySession(cookies.session, secret);
      if (payload && payload.username) {
        let uid = payload.sub || payload.username;
        try {
          const row = await c.env.DB.prepare('SELECT id FROM users WHERE id = ? OR username = ?').bind(uid, payload.username).first();
          if (row) uid = (row as any).id;
        } catch {}
        c.set('user_id', uid);
        c.set('username', payload.username);
        return await next();
      }
    }
  } catch {}

  // 2. Bearer token (session token or APP_AUTH_TOKEN)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    // Try session token first
    if (secret) {
      try {
        const payload = await verifySession(token, secret);
        if (payload && payload.username) {
          let uid = payload.sub || payload.username;
          try {
            const row = await c.env.DB.prepare('SELECT id FROM users WHERE id = ? OR username = ?').bind(uid, payload.username).first();
            if (row) uid = (row as any).id;
          } catch {}
          c.set('user_id', uid);
          c.set('username', payload.username);
          return await next();
        }
      } catch {}
    }

    // Try APP_AUTH_TOKEN
    if (c.env.APP_AUTH_TOKEN && token === c.env.APP_AUTH_TOKEN) {
      c.set('user_id', 'admin');
      c.set('username', 'admin');
      return await next();
    }
  }

  return c.json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' }, 401);
}
