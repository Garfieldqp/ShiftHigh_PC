import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { cookieOptions } from './cookies';
import { parseExpiryToMs } from './jwt';
import { env } from '../config/env';

// One active identity per browser cookie jar. No change to the 13-table schema.
// Restarting this single-process demo server intentionally signs everyone out.
export const SESSION_COOKIE = 'auth_browser_session';
type Kind = 'customer' | 'employee';
const sessions = new Map<string, { sid: string; kind: Kind; id: number; expires: number }>();
function browserKey(req: Request): string | undefined {
  const key = req.cookies?.[SESSION_COOKIE];
  return typeof key === 'string' && /^[a-f0-9]{64}$/.test(key) ? key : undefined;
}
export function startSession(req: Request, res: Response, kind: Kind, id: number): string {
  const now = Date.now();
  for (const [key, value] of sessions) if (value.expires <= now) sessions.delete(key);
  const key = browserKey(req) ?? randomBytes(32).toString('hex');
  const sid = randomBytes(32).toString('hex');
  const lifetime = parseExpiryToMs(env.jwt.refreshExpiresIn);
  sessions.set(key, { sid, kind, id, expires: now + lifetime });
  res.cookie(SESSION_COOKIE, key, cookieOptions(lifetime));
  return sid;
}
export function activeSession(req: Request, sid: string | undefined, kind: Kind, id: number): boolean {
  const key = browserKey(req);
  const session = key ? sessions.get(key) : undefined;
  if (!session || session.expires <= Date.now()) {
    if (key) sessions.delete(key);
    return false;
  }
  return Boolean(sid && session.sid === sid && session.kind === kind && session.id === id);
}
export function endSession(req: Request, res: Response): void {
  const key = browserKey(req);
  if (key) sessions.delete(key);
  res.clearCookie(SESSION_COOKIE);
}
