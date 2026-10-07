const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const guides = require('./guide-refresh-data.cjs');
const root = path.resolve(__dirname, '..');

async function main() {
  let server;
  let origin = process.env.TEST_ORIGIN;
  if (!origin) {
    server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
      const ext = path.extname(file);
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' })[ext] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const only = process.env.GUIDE_LIMIT ? guides.slice(0, Number(process.env.GUIDE_LIMIT)) : guides;
    for (const guide of only) {
      for (const width of [1280, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(`${origin}/${guide.slug}/`);
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('h1').innerText(), guide.title);
        assert.ok(!guide.title.includes(':'));
        const body = await page.locator('.detail-content').innerText();
        for (const fact of guide.facts) assert.ok(body.includes(fact), `${guide.slug}: ${fact}`);
        assert.ok(body.length >= 2000, `${guide.slug}: article too short (${body.length})`);
        for (const [question] of guide.faq) assert.equal(await page.getByRole('heading', { name: question, exact: true }).count(), 1);
        assert.equal(await page.locator('.guide-related-posts').count(), 1);
        assert.ok(!(await page.locator('article').innerText()).includes('검색할 때 같이 넣으면 좋은 키워드'));
        assert.ok(!(await page.locator('article').innerText()).includes('4050 세대도 준비하기 늦지 않나요'));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${guide.slug}: page overflow ${width}px`);
        const images = page.locator('article img');
        assert.ok(await images.count() >= 1);
        for (const img of await images.all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(img => img.decode());
          assert.ok(await img.evaluate(img => img.naturalWidth > 0));
        }
        const schema = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
        const posting = schema.find(s => s['@type'] === 'BlogPosting' && s.headline === guide.title);
        assert.ok(posting);
        assert.match(posting.dateModified, /^2026-10-(04|07)$/);
        const info = await page.locator('.detail-side').innerText();
        const [, month, day] = posting.dateModified.split('-').map(Number);
        assert.ok(info.includes(`2026년 ${month}월 ${day}일`));
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        assert.equal(decodeURI(canonical), `https://4050guide.co.kr/${guide.slug}/`);
        if (width === 1280) assert.ok(await page.evaluate(() => document.querySelector('.detail-side').getBoundingClientRect().left >= document.querySelector('.detail-main').getBoundingClientRect().right));
        const localLinks = await page.locator('.guide-related-posts a').evaluateAll(links => links.map(a => a.getAttribute('href')));
        for (const link of localLinks) assert.ok(fs.existsSync(path.join(root, decodeURI(link), 'index.html')), `Broken related link ${link}`);
        await page.locator('h1').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.resolve(root, '..', `4050-refresh-${guides.indexOf(guide) + 1}-${process.env.TEST_ORIGIN ? 'live' : 'local'}-${width}.png`) });
        console.log(`PASS ${guides.indexOf(guide) + 1}/10 ${width}px ${guide.slug} (${body.length} chars)`);
      }
    }
    const index = JSON.parse(fs.readFileSync(path.join(root, 'assets/search-index.json'), 'utf8'));
    for (const guide of only) {
      const post = index.posts.find(post => decodeURI(post.url).endsWith(`/${guide.slug}/`));
      assert.equal(post?.title, guide.title);
      for (const fact of guide.facts) assert.ok(post.text.includes(fact), `Search missing ${fact}`);
    }
    console.log('PASS updated site search entries');
  } finally {
    await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
