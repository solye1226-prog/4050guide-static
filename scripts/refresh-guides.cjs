const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const guides = require('./guide-refresh-data.cjs');
const root = path.resolve(__dirname, '..');
const date = '2026-10-04';

// Keep the surrounding export untouched; locate the balanced content div.
function contentRange(html) {
  const open = /<div\b[^>]*class="[^"]*\bdetail-content\b[^"]*"[^>]*>/g.exec(html);
  assert.ok(open, 'Missing article content');
  const start = open.index + open[0].length;
  const tags = /<\/?div\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 1;
  for (let tag; (tag = tags.exec(html));) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return { start, end: tag.index };
  }
  throw new Error('Unbalanced content div');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const selected = process.argv[2] ? [guides[Number(process.argv[2]) - 1]] : guides;
    for (const guide of selected) {
      assert.ok(guide);
      const file = path.join(root, guide.slug, 'index.html');
      let html = fs.readFileSync(file, 'utf8');
      const range = contentRange(html);
      const oldBody = html.slice(range.start, range.end);
      const preserved = await page.evaluate(body => {
        const doc = new DOMParser().parseFromString(body, 'text/html');
        return {
          images: [...doc.querySelectorAll('figure')].filter(el => el.querySelector('img') && !el.closest('.guide-related-posts')).map(el => el.outerHTML).join('\n'),
          related: doc.querySelector('.guide-related-posts')?.outerHTML || ''
        };
      }, oldBody);
      const faq = '<h2>자주 묻는 질문</h2>\n' + guide.faq.map(([q, a]) => `<h3>${q}</h3>\n<p>${a}</p>`).join('\n');
      const sources = '<h2>공식 자료와 확인일</h2><p>2026년 10월 4일 확인한 공식 안내를 기준으로 정리했습니다. 신청 결과는 담당 기관의 개별 심사로 결정됩니다.</p><ul>' + guide.sources.map(([label, url]) => `<li><a href="${url.replaceAll('&', '&amp;')}" target="_blank" rel="noopener noreferrer">${label}</a></li>`).join('') + '</ul>';
      const links = [[3, 8, 4], [5, 6, 7], [1, 8, 4], [1, 8, 9], [2, 6, 7], [7, 2, 5], [6, 2, 4], [1, 3, 4], [4, 5, 8], [6, 7, 4]][guides.indexOf(guide)];
      const related = '<section class="guide-related-posts"><h2>함께 보면 좋은 글</h2><ul>' + links.map(n => `<li><a href="/${guides[n - 1].slug}/">${guides[n - 1].title}</a></li>`).join('') + (guides.indexOf(guide) === 9 ? '<li><a href="/근로장려금-기한-후-신청-2026/">2026 근로장려금 기한 후 신청 조건과 방법</a></li>' : '') + '</ul></section>';
      const body = `\n${guide.body}\n${preserved.images}\n${sources}\n${faq}\n${related}\n`;
      html = html.slice(0, range.start) + body + html.slice(range.end);
      // Old related blocks occasionally live outside the exported content div.
      let relatedSeen = false;
      html = html.replace(/<section class="guide-related-posts">[\s\S]*?<\/section>/g, () => {
        if (relatedSeen) return '';
        relatedSeen = true;
        return related;
      });
      const oldTitle = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1];
      html = html.replaceAll(oldTitle, guide.title);
      html = html.replace(/(<header class="detail-title">[\s\S]*?<p>)[\s\S]*?(<\/p>)/, `$1${guide.intro}$2`);
      html = html.replace(/(<meta\b[^>]*(?:name|property)="(?:description|og:description|twitter:description)"[^>]*content=")[^"]*(")/g, `$1${guide.description}$2`);
      html = html.replace(/(<dt>업데이트<\/dt>\s*<dd>)[\s\S]*?(<\/dd>)/, '$12026년 10월 4일$2');
      html = html.replace(/(<a class="panel-button" href=")[^"]*(")/, `$1${guide.sources[0][1].replaceAll('&', '&amp;')}$2`);
      const sourceNames = ['고용24 / 고용센터', '한국에너지공단', '고용24 / 고용노동부', '고용24 / 고용센터', '보건복지부 / 국민연금공단', '국토교통부 마이홈 / LH', '보건복지부 / 129', '고용24 / 중장년내일센터', '국민건강보험공단 / 보건복지부', '국세청 / 홈택스'];
      html = html.replace(/(<dt>출처<\/dt>\s*<dd>)[\s\S]*?(<\/dd>)/, `$1${sourceNames[guides.indexOf(guide)]}$2`);
      let articleSchema = false;
      html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (_, open, json, close) => {
        const data = JSON.parse(json);
        if (data['@type'] === 'BlogPosting') {
          articleSchema = true;
          Object.assign(data, { headline: guide.title, description: guide.description, dateModified: date });
        }
        return open + JSON.stringify(data) + close;
      });
      if (!articleSchema) {
        const data = {
          '@context': 'https://schema.org', '@type': 'BlogPosting',
          headline: guide.title, description: guide.description, dateModified: date,
          image: html.match(/<meta property="og:image" content="([^"]+)"/)?.[1],
          author: { '@type': 'Organization', name: '4050가이드' },
          publisher: { '@type': 'Organization', name: '4050가이드' },
          mainEntityOfPage: `https://4050guide.co.kr/${guide.slug}/`, inLanguage: 'ko-KR'
        };
        html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(data)}</script>\n</head>`);
      }
      html = html.replace(/<link\b[^>]*type="(?:application\/rss\+xml|application\/json\+oembed|text\/xml\+oembed)"[^>]*>\s*/g, '');
      let canonicalSeen = false;
      html = html.replace(/<link\b[^>]*rel="canonical"[^>]*>\s*/g, tag => {
        if (canonicalSeen) return '';
        canonicalSeen = true;
        return tag;
      });
      const css = '<style id="verified-guide-tables">.detail-main{min-width:0}.detail-content .verified-table{max-width:100%;overflow-x:auto;margin:20px 0}.verified-table table{width:100%;min-width:460px}.detail-content h2,.detail-content h3,.detail-title h1{overflow-wrap:anywhere;word-break:keep-all;letter-spacing:0}</style>';
      html = html.replace(/<style id="verified-guide-tables">[\s\S]*?<\/style>/, '');
      html = html.replace('</head>', css + '\n</head>');
      fs.writeFileSync(file, html);
      console.log(`UPDATED ${guides.indexOf(guide) + 1}/10 ${guide.slug}`);
    }
    let sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, item => {
      const loc = item.match(/<loc>(.*?)<\/loc>/)?.[1];
      if (loc && selected.some(g => decodeURI(loc).endsWith('/' + g.slug + '/'))) {
        return item.replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${date}</lastmod>`);
      }
      return item;
    });
    fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
