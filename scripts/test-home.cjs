const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const remote = process.env.TEST_ORIGIN;
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png' };
  res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
});
async function run() {
  if (!remote) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = remote || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    for (const width of [1440, 1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin + '/');
      assert.equal(await page.locator('h1').innerText(), '4050가이드');
      assert.equal(await page.locator('link[rel=canonical]').count(), 1);
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://4050guide.co.kr/');
      const tabs = page.getByRole('tab');
      for (let i = 0; i < 4; i++) {
        await tabs.nth(i).click();
        assert.equal(await page.locator('.home-plan:visible').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}, tab ${i}`);
      }
      await tabs.first().click();
      await page.locator('#retired-1').check();
      await page.reload();
      assert.equal(await page.locator('#retired-1').isChecked(), true);
      assert.ok((await page.locator('.home-count').innerText()).startsWith('1 /'));
      await page.getByRole('button', { name:'체크 초기화' }).click();
      assert.equal(await page.locator('#retired-1').isChecked(), false);
      await tabs.first().focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
      await page.keyboard.press('End');
      assert.equal(await tabs.last().getAttribute('aria-selected'), 'true');
      await page.keyboard.press('Home');
      const images = await page.locator('.home-story img').evaluateAll(async imgs => {
        await Promise.all(imgs.map(img => img.decode().catch(() => {})));
        return imgs.map(img => [img.getAttribute('src'), img.naturalWidth]);
      });
      for (const [src, naturalWidth] of images) assert.ok(naturalWidth > 0, `Broken image ${src}`);
      await page.locator('h1').click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path:path.resolve(root,'..',`4050-home-${remote ? 'live' : 'local'}-${width}.png`), fullPage:true });
      console.log(`PASS homepage ${width}px, tabs, keyboard, persistence, reset, images`);
    }
    const urls = await page.locator('main a[href]').evaluateAll(links => [...new Set(links.map(a => a.getAttribute('href')).filter(url => url.startsWith('/')))]);
    for (const url of urls) assert.equal((await page.request.get(origin + url)).status(), 200, `Broken main link ${url}`);
    for (const slug of ['소개','개인정보처리방침','정보-출처-및-면책-안내','퇴직-후-30일-실행-가이드']) {
      await page.goto(origin + '/' + slug + '/');
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    assert.deepEqual(errors, []);
    const context = await browser.newContext({ javaScriptEnabled:false });
    const fallback = await context.newPage();
    await fallback.goto(origin + '/');
    assert.equal(await fallback.locator('.home-plan:visible').count(), 4);
    assert.equal(await fallback.locator('.home-story img').count(), 3);
    await context.close();
    console.log(`PASS ${urls.length} homepage links, trust pages, JavaScript-disabled fallback`);
  } finally { await browser.close(); server.close(); }
}
run().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
