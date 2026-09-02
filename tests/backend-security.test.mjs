import assert from 'node:assert/strict';
import login from '../api/login.js';
import logout from '../api/logout.js';
import status from '../api/status.js';
import trigger from '../api/trigger.js';
import summary from '../api/suzuri-summary.js';

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(n) { this.statusCode = n; return this; },
    json(v) { this.body = v; return this; },
  };
}
function cookieFrom(res) { return String(res.headers['Set-Cookie'] || '').split(';')[0]; }

process.env.ARTLOOP_ADMIN_PASSWORD = 'correct horse battery staple';
process.env.ARTLOOP_SESSION_SECRET = '0123456789abcdef0123456789abcdef';
process.env.ARTLOOP_GITHUB_TOKEN = 'gh_test_secret';
process.env.SUZURI_API_KEY = 'suz_test_secret';
process.env.OPENAI_API_KEY = 'sk_test_secret';
process.env.THREADS_ACCESS_TOKEN = 'th_test_secret';
process.env.THREADS_USER_ID = '123';

let session = '';
{
  const res = makeRes();
  await login({ method: 'POST', headers: {}, body: { password: process.env.ARTLOOP_ADMIN_PASSWORD } }, res);
  assert.equal(res.statusCode, 200);
  session = cookieFrom(res);
  assert.match(res.headers['Set-Cookie'], /HttpOnly/);
  assert.match(res.headers['Set-Cookie'], /Secure/);
  assert.match(res.headers['Set-Cookie'], /SameSite=Lax/);
}
{
  const res = makeRes();
  await status({ headers: {} }, res);
  assert.equal(res.statusCode, 401);
}
{
  const res = makeRes();
  await trigger({ method: 'POST', headers: {} }, res);
  assert.equal(res.statusCode, 401);
}
{
  const res = makeRes();
  await trigger({ method: 'POST', headers: { cookie: session, origin: 'https://evil.example', host: 'artloop.example' } }, res);
  assert.equal(res.statusCode, 403);
}
{
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, status: 204, text: async () => '' }; };
  const res = makeRes();
  await trigger({ method: 'POST', headers: { cookie: session, origin: 'https://artloop.example', host: 'artloop.example' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(called, true);
}
{
  global.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith('/user')) return { ok: true, json: async () => ({ user: { name: 'shop' } }) };
    if (value.includes('/products?')) return { ok: true, json: async () => ({ products: [
      { id: 1, title: 'one', item: { name: 'Sticker' } },
      { id: 2, title: 'two', item: { name: 'Tshirt' } },
      { id: 3, title: 'three', item: { humanizeName: 'ステッカー' } },
    ] }) };
    throw new Error(`unexpected fetch ${value}`);
  };
  const res = makeRes();
  await summary({ headers: { cookie: session } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.stickerCount, 2);
  assert.equal(JSON.stringify(res.body).includes('suz_test_secret'), false);
}
{
  const res = makeRes();
  await status({ headers: { cookie: `${session}x` } }, res);
  assert.equal(res.statusCode, 401);
}
{
  const res = makeRes();
  await logout({ method: 'POST', headers: { cookie: session } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
}

console.log('ARTLOOP backend security tests: PASS');
