import { Context } from 'hono';
import { Env } from '../types';
import { buildSessionCookie, clearSessionCookie, sha256Hex, signSession } from '../utils/session';

export async function login(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();
  const username = body.username;
  const password = body.master_password;

  if (!username || !password) return c.json({ success: false, error: '缺少用户名或密码' }, 400);

  const envUser = c.env.ADMIN_USERNAME;
  const envPass = c.env.ADMIN_PASSWORD;
  if (!envUser || !envPass || !c.env.SESSION_SECRET) return c.json({ success: false, error: '服务端认证变量未配置' }, 500);

  if (username !== envUser || await sha256Hex(password) !== await sha256Hex(envPass)) {
    return c.json({ success: false, error: '用户名或密码错误' }, 401);
  }

  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const token = await signSession({ sub: 'admin', username, exp }, c.env.SESSION_SECRET);
  c.header('Set-Cookie', buildSessionCookie(token));
  return c.json({ success: true, message: '登录成功', data: { username, token } });
}

export async function logout(c: Context<{ Bindings: Env }>) {
  c.header('Set-Cookie', clearSessionCookie());
  return c.json({ success: true, message: '已退出登录' });
}
