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
      assert.equal(await page.locator('#budget-total').innerText(),'339,390원');
      await page.selectOption('#budget-course','T02');
      assert.equal(await page.locator('#budget-total').innerText(),'281,940원');
      assert.match(await page.locator('#budget-source').getAttribute('href'),/AIG20250000513298/);
      await page.fill('#budget-days','');assert.equal(await page.locator('#budget-error').isVisible(),true);
      await page.fill('#budget-days','-1');assert.equal(await page.locator('#budget-total').innerText(),'계산 대기');
      await page.fill('#budget-days','1.5');assert.equal(await page.locator('#budget-error').isVisible(),true);
      await page.selectOption('#budget-course','T04');assert.equal(await page.locator('#budget-total').innerText(),'101,580원');
      await page.fill('#budget-extra','10000');assert.equal(await page.locator('#budget-total').innerText(),'111,580원');
      await page.locator('#job-details > summary').click();
      await page.check('#job-entry');assert.equal(await page.locator('.focus-jobs tbody tr:visible').count(),4);
      await page.check('#job-day');assert.equal(await page.locator('.focus-jobs tbody tr:visible').count(),1);
      await page.selectOption('#job-group','시설관리');assert.equal(await page.locator('#job-empty').isVisible(),true);
      await page.uncheck('#job-entry');assert.equal(await page.locator('.focus-jobs tbody tr:visible').count(),2);
      await page.uncheck('#job-day');await page.selectOption('#job-group','');
      assert.equal(await page.locator('.focus-jobs tbody tr:visible').count(),10);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
      const images = await page.locator('.home-story img').evaluateAll(async imgs => {
        await Promise.all(imgs.map(img => img.decode().catch(() => {})));
        return imgs.map(img => [img.getAttribute('src'), img.naturalWidth]);
      });
      for (const [src, naturalWidth] of images) assert.ok(naturalWidth > 0, `Broken image ${src}`);
      await page.locator('h1').click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path:path.resolve(root,'..',`4050-focus-${remote ? 'live' : 'local'}-${width}.png`) });
      await page.screenshot({ path:path.resolve(root,'..',`4050-home-${remote ? 'live' : 'local'}-${width}.png`), fullPage:true });
      console.log(`PASS homepage ${width}px, budget math, validation, unknown-condition filters, images`);
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
    await fallback.locator('#job-details > summary').click();
    assert.equal(await fallback.locator('.focus-jobs tbody tr:visible').count(), 10);
    assert.match(await fallback.locator('#training-budget > noscript').innerText(),/339,390/);
    assert.equal(await fallback.locator('.home-story img').count(), 3);
    await context.close();
    console.log(`PASS ${urls.length} homepage links, trust pages, JavaScript-disabled fallback`);
  } finally { await browser.close(); server.close(); }
}
run().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
