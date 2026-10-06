const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname,'..');
const audit = require('./content-audit.json');
const normalize = text => text.normalize('NFKC').replace(/\s+/g,' ').trim();
async function run() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const titles = new Map();
    for (const post of require('../assets/search-index.json').posts) {
      const key = normalize(post.title);
      if (!titles.has(key)) titles.set(key,new Set());
      titles.get(key).add(post.url);
    }
    const aliases = {
      '2026년 남은 국가기술자격 시험일정':'2026년-남은-국가기술자격-시험일정',
      '2026 국가기술자격 시험일정':'2026년-남은-국가기술자격-시험일정',
      '2026 기능사 남은 시험일정':'2026년-기능사-남은-시험일정',
      '2026년 기능사 남은 시험일정':'2026년-기능사-남은-시험일정',
      '2026년 상시검정 자격증 14종목':'2026년-상시검정-자격증-14종목',
      '2026 상시검정 자격증 14종목':'2026년-상시검정-자격증-14종목',
      '고용24 구직등록 방법':'고용24-구직등록-방법',
      '중장년 내일센터 상담 준비':'중장년-내일센터-이용방법',
      '공조냉동기계기능사 준비 전 확인할 것':'공조냉동기계기능사-4050-준비-전-확인할-것',
      '건축도장기능사 4050 준비방법':'건축도장기능사-4050-준비방법',
      '한식조리기능사 4050 재취업 활용법':'한식조리기능사-4050-재취업-활용법',
      '소방안전관리자 4050 준비 전 확인할 것':'소방안전관리자-4050-준비-전-확인할-것',
      '직업훈련포털 HRD-Net 사용법':'직업훈련포털-HRD-Net-사용법',
      'HRD-Net 사용법':'직업훈련포털-HRD-Net-사용법',
      '기초연금 수급자격 확인방법':'기초연금-수급자격-확인방법',
      '경비원 신임교육 4050 준비방법':'경비원-신임교육-4050-준비방법',
      '4050 재취업 가이드':'50대-재취업-현실',
      '국가자격 검색으로 내게 맞는 자격증 찾는 법':'국가자격-검색',
      '국가자격검색':'국가자격-검색'
    };
    for(const [label,slug] of Object.entries(aliases)) {
      if(!fs.existsSync(path.join(root,slug,'index.html')))throw new Error('Unknown target '+slug);
      titles.set(normalize(label),new Set(['/'+slug+'/']));
    }
    const grouped = Map.groupBy(audit.broken,item=>item.page);
    let count=0;
    const unresolved=[];
    for (const [relative,broken] of grouped) {
      const file=path.join(root,relative);
      let html=fs.readFileSync(file,'utf8');
      const anchors=await page.evaluate(html=>{
        const doc=new DOMParser().parseFromString(html,'text/html');
        return [...doc.querySelectorAll('a[href]')].map(a=>({href:a.getAttribute('href'),text:a.textContent.trim()}));
      },html);
      const replacements=new Map();
      for(const item of broken) {
        const query=item.href.match(/(?:public-benefits|welfare-search|license-search)\/index\.html_(benefit_q|welfare_q|license_q)=([^/]+)\.html$/);
        if(query) {
          const folder={benefit_q:'공공혜택-검색',welfare_q:'복지서비스-검색',license_q:'국가자격-검색'}[query[1]];
          replacements.set(item.href,`/${folder}/?${query[1]}=${encodeURIComponent(query[2])}`);continue;
        }
        const targets=titles.get(normalize(item.text));
        if(targets?.size===1) {
          const target=[...targets][0];
          const sameHref=anchors.filter(a=>a.href===item.href);
          if(sameHref.every(a=>titles.get(normalize(a.text))?.has(target))) replacements.set(item.href,target);
          else unresolved.push(item);
        } else unresolved.push(item);
      }
      html=html.replace(/(<a\b[^>]*\bhref=")([^"]*)(")/g,(all,open,href,close)=>{
        const target=replacements.get(href.replaceAll('&amp;','&'));
        if(!target)return all;
        count++; return open+target+close;
      });
      fs.writeFileSync(file,html);
    }
    let canonicalFixes=0;
    function walk(dir) {
      for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
        if(entry.name.startsWith('.')||entry.name==='scripts')continue;
        const file=path.join(dir,entry.name);
        if(entry.isDirectory())walk(file);
        else if(entry.name.endsWith('.html')) {
          let html=fs.readFileSync(file,'utf8');
          const tags=[...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>\s*/g)];
          const hrefs=new Set(tags.map(tag=>tag[0].match(/href="([^"]*)"/)?.[1]));
          if(tags.length>1 && hrefs.size===1) {
            let seen=false;
            html=html.replace(/<link\b[^>]*rel="canonical"[^>]*>\s*/g,tag=>{if(seen)return '';seen=true;return tag});
            fs.writeFileSync(file,html);canonicalFixes++;
          }
        }
      }
    }
    walk(root);
    fs.writeFileSync(path.join(__dirname,'unresolved-links.json'),JSON.stringify(unresolved,null,2)+'\n');
    console.log(JSON.stringify({repairedLinks:count,canonicalFixes,unresolved:unresolved.length}));
    console.log(JSON.stringify(unresolved.slice(0,12)));
  } finally {await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
