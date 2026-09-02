import { clearSessionCookie } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
