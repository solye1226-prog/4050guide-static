const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const origin = 'https://4050guide.co.kr';
const audit = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'content-audit.json'), 'utf8'));

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    assert.equal(audit.posts.length, 150);
    for (const post of audit.posts) {
      const html = fs.readFileSync(path.join(root, post.file), 'utf8');
      const result = await page.evaluate(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => {
          try { return JSON.parse(node.textContent); } catch { return {}; }
        });
        const article = schemas.find(schema => schema['@type'] === 'BlogPosting');
        const external = [...doc.querySelectorAll('.detail-content a[href^="https://"]')]
          .filter(link => !link.href.includes('4050guide.co.kr'));
        return {
          canonical: doc.querySelector('link[rel="canonical"]')?.href,
          canonicalCount: doc.querySelectorAll('link[rel="canonical"]').length,
          h1: doc.querySelectorAll('h1').length,
          headline: doc.querySelector('h1')?.textContent.trim(),
          faq: [...doc.querySelectorAll('article h2')].some(node => /자주 묻는 질문|FAQ/.test(node.textContent)),
          related: [...doc.querySelectorAll('article h2')].some(node => /함께 보면 좋은 글|다음 단계로 읽을 글|관련 글/.test(node.textContent)),
          external: external.length,
          byline: Boolean(doc.querySelector('.editorial-byline')),
          adScript: Boolean(doc.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')),
          article,
        };
      }, html);
      const expected = `${origin}/${post.file.split('/')[0]}/`;
      assert.equal(result.canonicalCount, 1, `${post.file}: canonical count`);
      assert.equal(decodeURI(result.canonical), expected, `${post.file}: canonical`);
      assert.equal(result.h1, 1, `${post.file}: H1`);
      assert.ok(result.faq, `${post.file}: FAQ`);
      assert.ok(result.related, `${post.file}: related posts`);
      assert.ok(result.external > 0, `${post.file}: official source`);
      assert.ok(result.byline, `${post.file}: visible editorial byline`);
      assert.ok(result.adScript, `${post.file}: AdSense ownership script`);
      assert.equal(result.article?.headline, result.headline, `${post.file}: schema headline`);
      assert.equal(decodeURI(result.article?.mainEntityOfPage || ''), decodeURI(result.canonical), `${post.file}: schema URL`);
      assert.equal(result.article?.author?.name, '4050가이드 편집부', `${post.file}: author`);
      assert.match(result.article?.dateModified || '', /^\d{4}-\d{2}-\d{2}$/, `${post.file}: modified date`);
    }

    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
    assert.equal(urls.length, 173, 'sitemap URL count');
    assert.equal(new Set(urls).size, urls.length, 'sitemap duplicates');
    const redirectedSources = new Set(fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/)
      .map(line => line.trim().split(/\s+/))
      .filter(([from, , status]) => status === '301' && /^\/[^*?]+\/$/.test(from || ''))
      .map(([from]) => origin + decodeURIComponent(from)));
    assert.deepEqual(urls.filter(url => redirectedSources.has(url)), [], 'redirect URL found in sitemap');

    const privacy = fs.readFileSync(path.join(root, '개인정보처리방침', 'index.html'), 'utf8');
    assert.match(privacy, /(adssettings\.google\.com|myadcenter\.google\.com)/);
    assert.match(privacy, /Google 인증 동의 관리 플랫폼/);
    assert.doesNotMatch(privacy, /향후 Google AdSense/);

    const ads = fs.readFileSync(path.join(root, 'ads.txt'), 'utf8').match(/pub-\d+/)?.[0];
    assert.ok(ads, 'ads.txt publisher ID');
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(home.includes(`client=ca-${ads}`), 'ads.txt and AdSense script publisher IDs differ');
    console.log('PASS: 150 articles have self-canonical, FAQ, official source, related reading, byline, BlogPosting schema and AdSense ownership code; sitemap has 173 final URLs; privacy disclosures and ads.txt match');
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
