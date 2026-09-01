const SUZURI_API = 'https://suzuri.jp/api/v1';

async function suzuri(path, params = {}) {
  const token = process.env.SUZURI_API_KEY;
  if (!token) throw new Error('SUZURI_API_KEY is not configured');
  const url = new URL(`${SUZURI_API}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  if (!r.ok) throw new Error(`SUZURI ${path}: ${r.status}`);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await suzuri('/user');
    const userName = user.user?.name || user.user?.userName || user.name || user.userName;
    if (!userName) throw new Error('Could not resolve SUZURI user name');

    const products = await suzuri('/products', { userName, limit: 50, offset: 0 });
    const rows = products.products || [];
    const stickers = rows.filter((p) => {
      const item = p.item || {};
      const text = `${item.name || ''} ${item.humanizeName || ''}`.toLowerCase();
      return text.includes('sticker') || text.includes('ステッカー');
    });

    const latest = stickers.slice(0, 8).map((p) => ({
      id: p.id,
      title: p.title || p.name || 'Untitled',
      publishedAt: p.publishedAt || null,
      url: p.sampleUrl || p.url || null,
      image: p.sampleImageUrl || p.imageUrl || p.material?.texture || null,
    }));

    res.status(200).json({ ok: true, userName, productCount: rows.length, stickerCount: stickers.length, latest });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
