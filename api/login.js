import { authConfigured, createSessionToken, passwordMatches, setSessionCookie } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!authConfigured()) return res.status(503).json({ ok: false, error: 'ARTLOOP authentication is not configured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (!passwordMatches(body.password)) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  setSessionCookie(res, createSessionToken());
  return res.status(200).json({ ok: true });
}
