const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function test() {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const origin = process.env.TEST_ORIGIN;
    const url = origin ? `${origin}/근로장려금-기한-후-신청-2026/`
      : 'file:///' + path.join(root, '근로장려금-기한-후-신청-2026/index.html').replaceAll('\\', '/');
    await page.route('**/*', route => {
      const request = route.request().url();
      return request.startsWith('file:') || (origin && request.startsWith(origin))
        ? route.continue() : route.abort();
    });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      const text = await page.locator('.detail-content').innerText();
      for (const value of ['2,200만 원 미만', '3,200만 원 미만', '4,400만 원 미만', '2025년 6월 1일', '47만 5천 원', '4개월 이내']) {
        assert.ok(text.includes(value), `Missing ${value}`);
      }
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('.detail-hero-image img').evaluate(img => img.complete && img.naturalWidth > 0), true);
      assert.ok((await page.locator('.detail-side').innerText()).includes('2026년 10월 4일'));
      const article = await page.locator('script[type="application/ld+json"]').allTextContents();
      assert.ok(article.map(JSON.parse).some(data => data['@type'] === 'BlogPosting' && data.dateModified === '2026-10-04'));
      if (width > 1000) {
        assert.equal(await page.evaluate(() => {
          const main = document.querySelector('.detail-main').getBoundingClientRect();
          const side = document.querySelector('.detail-side').getBoundingClientRect();
          return side.left >= main.right;
        }), true, 'Desktop sidebar must be to the right');
      }
      await page.locator('.detail-content h2').filter({ hasText: '신청 전에 꼭 확인할 조건' }).evaluate(node => node.scrollIntoView());
      await page.screenshot({ path: path.resolve(root, '..', `4050-tax-credit-${origin ? 'live' : 'local'}-${width}.png`) });
      console.log(`PASS tax-credit facts, schema, image and layout ${width}px`);
    }
    const index = JSON.parse(fs.readFileSync(path.join(root, 'assets/search-index.json'), 'utf8'));
    assert.ok(index.posts.find(post => decodeURIComponent(post.url).includes('근로장려금-기한-후-신청-2026')).text.includes('47만 5천 원'));
  } finally { await browser.close(); }
}
test().catch(error => { console.error(error); process.exitCode = 1; });
