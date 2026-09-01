export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const token = process.env.ARTLOOP_GITHUB_TOKEN;
  const repo = process.env.ARTLOOP_AUTOMATION_REPO || 'geoharori/SUZURI-Sticker-Automation';
  const workflow = process.env.ARTLOOP_WORKFLOW_FILE || 'sticker-test.yml';
  if (!token) return res.status(500).json({ ok: false, error: 'ARTLOOP_GITHUB_TOKEN is not configured' });

  const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ARTLOOP-web-app',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: 'main' }),
  });

  if (!r.ok) {
    const text = await r.text();
    return res.status(r.status).json({ ok: false, error: `GitHub dispatch failed: ${r.status}`, detail: text.slice(0, 500) });
  }

  return res.status(200).json({ ok: true, message: 'Automation started' });
}
