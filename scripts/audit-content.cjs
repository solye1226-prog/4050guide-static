const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes:true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'scripts') return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
async function run() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const entries = files(root).map(file => ({ file:path.relative(root,file).replaceAll('\\','/'), html:fs.readFileSync(file,'utf8') }));
    const parsed = await page.evaluate(entries => entries.map(({file,html}) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const body = doc.querySelector('.detail-content');
      return { file, title:doc.querySelector('h1')?.textContent.trim(), canonical:[...doc.querySelectorAll('link[rel=canonical]')].map(a=>a.getAttribute('href')), chars:body?.textContent.replace(/\s+/g,' ').trim().length || 0,
        headings:[...doc.querySelectorAll('.detail-content h2')].map(h=>h.textContent.trim()),
        generic:body && /4050 세대도 준비하기 늦지|확인해야 할 기본 조건/.test(body.textContent),
        seasonal:body && /2026년 6월|여름|남은 시험/.test(body.textContent),
        sources:body ? [...body.querySelectorAll('a[href^="https:"]')].filter(a=>!a.getAttribute('href').includes('4050guide.co.kr')).length : 0,
        anchors:[...doc.querySelectorAll('a[href]')].map(a=>({href:a.getAttribute('href'),text:a.textContent.trim()})) };
    }), entries);
    const posts = parsed.filter(p=>p.chars>0 && p.file.split('/').length===2 && /[가-힣]/.test(p.file));
    const broken = [];
    for (const item of parsed) {
      const base = new URL(item.file, 'https://4050guide.co.kr/');
      for (const a of item.anchors) {
        let url; try { url = new URL(a.href,base); } catch { continue; }
        if (!['4050guide.co.kr','www.4050guide.co.kr'].includes(url.hostname)) continue;
        let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
        if (!file.startsWith(root + path.sep) && file!==root) continue;
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
        if (!fs.existsSync(file)) broken.push({page:item.file, href:a.href, text:a.text});
      }
    }
    const report = {date:'2026-10-06',pages:parsed.length,posts:posts.map(({anchors,...p})=>p),broken,summary:{articles:posts.length,brokenLinks:broken.length,shortHubPages:posts.filter(p=>p.chars<1200).length,genericPages:posts.filter(p=>p.generic).length,duplicateCanonicalPages:parsed.filter(p=>p.canonical.length>1).length,articlesWithoutBodySources:posts.filter(p=>p.sources===0).length}};
    fs.writeFileSync(path.join(root,'scripts','content-audit.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report.summary));
    console.log('SHORT',JSON.stringify(posts.filter(p=>p.chars<1200).map(p=>({file:p.file,title:p.title,chars:p.chars}))));
    console.log('GENERIC',JSON.stringify(posts.filter(p=>p.generic).map(p=>({file:p.file,title:p.title}))));
    console.log('BROKEN sample',JSON.stringify(broken.slice(0,25)));
  } finally { await browser.close(); }
}
run().catch(e=>{console.error(e);process.exitCode=1});
