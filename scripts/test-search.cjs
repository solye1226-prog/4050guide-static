const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const remote = process.env.TEST_ORIGIN;
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  let status = 200;
  if (!fs.existsSync(file)) { file = path.join(root, '404.html'); status = 404; }
  const type = file.endsWith('.json') ? 'application/json' : file.endsWith('.js') ? 'text/javascript'
    : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html';
  response.writeHead(status, { 'Content-Type': type + (type.startsWith('image') ? '' : '; charset=utf-8') });
  fs.createReadStream(file).pipe(response);
});

async function test() {
  if (!remote) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = remote || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => {
      const url = route.request().url();
      return url.startsWith(origin) || url.startsWith('data:') ? route.continue() : route.abort();
    });
    const tests = [
      ['/?s=지게차', '“지게차” 안내글', '지게차운전기능사'],
      ['/복지서비스-검색/?welfare_q=긴급복지', '“긴급복지” 안내글', '긴급복지'],
      ['/공공혜택-검색/?benefit_q=근로장려금', '“근로장려금” 안내글', '근로장려금'],
      ['/국가자격-검색/?license_q=전기', '“전기” 안내글', '전기기능사'],
      ['/?s=존재하지않는검색어987654', '안내글 0건', '일치하는 안내글이 없습니다'],
      ['/?s=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E', '안내글 0건', '일치하는 안내글이 없습니다'],
    ];
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [url, heading, expected] of tests) {
        await page.goto(origin + url);
        await page.getByRole('heading', { name: new RegExp(heading), level: 2 }).first().waitFor();
        assert.ok((await page.locator('main').innerText()).includes(expected));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Horizontal overflow ${url} ${width}`);
        assert.equal(await page.locator('img[onerror]').count(), 0);
      }
      await page.goto(origin + '/복지서비스-검색/');
      await page.locator('.guide-api-chip').filter({ hasText: /^긴급복지$/ }).click();
      await page.getByRole('heading', { name: /“긴급복지” 안내글/, level: 2 }).waitFor();
      assert.equal(await page.locator('input[name=welfare_q]').inputValue(), '긴급복지');
      await page.locator('input[name=welfare_q]').fill('치매');
      await page.locator('.guide-api-form button').click();
      await page.getByRole('heading', { name: /“치매” 안내글/, level: 2 }).waitFor();
      await page.goto(origin + '/?s=지게차');
      await page.getByRole('heading', { name: /“지게차” 안내글/, level: 2 }).waitFor();
      const output = path.resolve(root, '..', `4050-search-${remote ? 'live' : 'local'}-${width}.png`);
      await page.screenshot({ path: output, fullPage: true });
      console.log(`PASS ${width}px; screenshot ${output}`);
    }
    await page.goto(origin + '/?s=지게차');
    await page.locator('.guide-search-result h3 a').first().click();
    await page.locator('h1').waitFor();
    assert.ok((await page.locator('h1').innerText()).includes('지게차'));
    const response = await page.goto(origin + '/missing-search-test-20261004/');
    assert.equal(response.status(), 404);
    assert.ok((await page.locator('h1').innerText()).includes('찾을 수 없습니다'));
    await page.goto(origin + '/');
    await page.locator('.hero-search input').fill('요양보호사');
    await page.locator('.hero-search button').click();
    await page.getByRole('heading', { name: /“요양보호사” 안내글/, level: 2 }).waitFor();
    await page.route('**/assets/search-index.json', route => route.abort());
    await page.goto(origin + '/?s=지게차');
    await page.getByText('검색 결과를 불러오지 못했습니다.', { exact: false }).waitFor();
    await page.unroute('**/assets/search-index.json');
    await page.getByRole('button', { name: '다시 시도' }).click();
    await page.getByRole('heading', { name: /“지게차” 안내글/, level: 2 }).waitFor();
    console.log('PASS search submit, chips, result navigation, zero results, escaping, retry, 404');
  } finally {
    await browser.close();
    server.close();
  }
}
test().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
