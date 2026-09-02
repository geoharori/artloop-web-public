import crypto from 'node:crypto';

const COOKIE_NAME = 'artloop_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.ARTLOOP_SESSION_SECRET || '';
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function hmac(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function cookies(req) {
  const header = req.headers?.cookie || '';
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf('=');
        return i === -1 ? [part, ''] : [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
      }),
  );
}

export function authConfigured() {
  return Boolean(process.env.ARTLOOP_ADMIN_PASSWORD && process.env.ARTLOOP_SESSION_SECRET);
}

export function passwordMatches(value) {
  const expected = process.env.ARTLOOP_ADMIN_PASSWORD || '';
  return Boolean(expected) && safeEqual(value || '', expected);
}

export function createSessionToken() {
  if (!authConfigured()) throw new Error('ARTLOOP auth is not configured');
  const payload = b64url(JSON.stringify({ exp: Date.now() + SESSION_TTL_SECONDS * 1000 }));
  return `${payload}.${hmac(payload)}`;
}

export function isAuthenticated(req) {
  if (!authConfigured()) return false;
  const token = cookies(req)[COOKIE_NAME];
  if (!token) return false;
  const [payload, sig, extra] = token.split('.');
  if (!payload || !sig || extra) return false;
  if (!safeEqual(sig, hmac(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(data.exp) && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`,
  );
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

export function requireAuth(req, res) {
  if (!authConfigured()) {
    res.status(503).json({ ok: false, error: 'ARTLOOP authentication is not configured' });
    return false;
  }
  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Authentication required' });
    return false;
  }
  return true;
}

export function requireSameOrigin(req, res) {
  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (!origin || !host) return true;
  try {
    if (new URL(origin).host !== host) {
      res.status(403).json({ ok: false, error: 'Invalid origin' });
      return false;
    }
  } catch {
    res.status(403).json({ ok: false, error: 'Invalid origin' });
    return false;
  }
  return true;
}
