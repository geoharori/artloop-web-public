export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const configured = {
    openai: Boolean(process.env.OPENAI_API_KEY),
    suzuri: Boolean(process.env.SUZURI_API_KEY),
    github: Boolean(process.env.ARTLOOP_GITHUB_TOKEN),
    threads: Boolean(process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID),
  };

  res.status(200).json({
    ok: true,
    service: 'ARTLOOP',
    configured,
    automationRepo: process.env.ARTLOOP_AUTOMATION_REPO || 'geoharori/SUZURI-Sticker-Automation',
    now: new Date().toISOString(),
  });
}
