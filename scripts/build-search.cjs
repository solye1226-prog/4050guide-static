const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const modes = { '복지서비스-검색': 'welfare', '공공혜택-검색': 'benefit', '국가자격-검색': 'license' };
const ignored = new Set(['소개', '문의', '개인정보처리방침', '이용약관', '정보-출처-및-면책-안내', ...Object.keys(modes)]);

async function build() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const posts = [];
    const official = { welfare: [], benefit: [], license: [] };
    const homeCards = await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return Array.from(doc.querySelectorAll('.guide-api-item')).map(card => ({
        title: card.querySelector('h3')?.textContent.trim() || '',
        description: card.textContent.replace(/\s+/g, ' ').trim(),
        url: card.querySelector('a')?.href || '',
      }));
    }, fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
    for (const card of homeCards) {
      if (card.url.startsWith('https://www.bokjiro.go.kr/')) official.welfare.push(card);
      if (card.url.startsWith('https://www.gov.kr/')) official.benefit.push(card);
    }
    const pages = fs.readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && /[가-힣]/u.test(entry.name));
    for (const entry of pages) {
      const file = path.join(root, entry.name, 'index.html');
      if (!fs.existsSync(file)) continue;
      const parsed = await page.evaluate(({ html }) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('script, style, .detail-side, .guide-related-posts').forEach(node => node.remove());
        const compact = text => (text || '').replace(/\s+/g, ' ').trim();
        return {
          url: doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          title: compact(doc.querySelector('h1')?.textContent),
          description: doc.querySelector('meta[name="description"]')?.content || '',
          text: compact(doc.querySelector('article')?.textContent),
          cards: Array.from(doc.querySelectorAll('.guide-api-item')).map(card => ({
            title: compact(card.querySelector('h3')?.textContent),
            description: compact(card.textContent),
            url: card.querySelector('a')?.href || '',
          })),
        };
      }, { html: fs.readFileSync(file, 'utf8') });
      if (modes[entry.name]) official[modes[entry.name]].push(...parsed.cards);
      if (!ignored.has(entry.name) && parsed.url && parsed.title) {
        posts.push({ url: new URL(parsed.url).pathname, title: parsed.title,
          description: parsed.description, text: parsed.text });
      }
    }
    for (const mode of Object.keys(official)) {
      official[mode] = [...new Map(official[mode].map(card => [card.url || card.title, card])).values()];
    }
    fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(root, 'assets/search-index.json'), JSON.stringify({ posts, official }));

    function updateDirectory(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory() && entry.name !== '.git') updateDirectory(file);
        if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
        let html = fs.readFileSync(file, 'utf8');
        html = html.replace(/30분 단위 갱신/g, '공식 자료 저장본');
        if (!html.includes('src="/assets/search.js"')) {
          html = html.replace('</head>', '<link rel="stylesheet" href="/assets/search.css">\n<script defer src="/assets/search.js"></script>\n</head>');
        }
        html = html.replace(/href="index\.html_(welfare_q|benefit_q|license_q)=([^"]+)\.html"/g,
          (_, parameter, keyword) => `href="?${parameter}=${encodeURIComponent(keyword)}"`);
        html = html.replace(/(<form class="hero-search"[^>]*action=")index\.html("[^>]*>)/g, '$1/$2');
        for (const [folder, mode] of Object.entries(modes)) {
          if (path.dirname(file) !== path.join(root, folder)) continue;
          html = html.replace(/공식 데이터|실시간/g, '공식 자료');
          html = html.replace(/<div class="guide-api-search">/, `<div class="guide-api-search" data-search-mode="${mode}">`);
          html = html.replace(/<p class="guide-api-note">.*?<\/p>/s,
            '<p class="guide-api-note">사이트 안내글과 저장된 공식 자료를 확인합니다. 최신 신청 조건은 공식 기관에서 확인하세요.</p>');
        }
        if (file === path.join(root, 'index.html')) {
          html = html.replace('공식 자료에서 바로 확인한 최신 목록', '주제별 공식 자료 목록')
            .replace('정부24, 복지로, Q-Net 데이터를 연결해 지원제도와 국가자격 종목을 빠르게 확인할 수 있습니다.',
              '정부24, 복지로, Q-Net의 저장된 자료입니다. 최신 정보는 각 기관의 공식 페이지에서 확인하세요.');
        }
        if (html !== fs.readFileSync(file, 'utf8')) fs.writeFileSync(file, html);
      }
    }
    updateDirectory(root);
    console.log(`Indexed ${posts.length} posts; official snapshots: ${JSON.stringify(Object.fromEntries(Object.entries(official).map(([key, value]) => [key, value.length])))}`);
  } finally {
    await browser.close();
  }
}
build().catch(error => { console.error(error); process.exitCode = 1; });
