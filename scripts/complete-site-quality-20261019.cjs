const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const origin = 'https://4050guide.co.kr';
const posts = require('../assets/search-index.json').posts;
const merges = require('./content-merges-20261019.cjs');
const titles = new Map(posts.map(p => [decodeURI(p.url), p.title]));
const previous = new Set(require('./content-repair-result-20261019.json').posts.map(p => p.previousTitle));
const esc = text => text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
function files(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => {
    if(e.name.startsWith('.') || e.name==='scripts') return [];
    const f=path.join(dir,e.name);
    return e.isDirectory()?files(f):e.name.endsWith('.html')?[f]:[];
  });
}
function write(file, html) { if(fs.readFileSync(file,'utf8')!==html) fs.writeFileSync(file,html); }
async function run() {
  const browser=await chromium.launch();
  const report={categories:[],images:[],links:0,sidebars:[],worksheets:[]};
  try {
    const page=await browser.newPage();
    const all=files(root);
    // Preserve membership and ordering, then repartition unique cards over existing routes.
    for(const category of fs.readdirSync(path.join(root,'category'),{withFileTypes:true}).filter(e=>e.isDirectory())) {
      const base=path.join(root,'category',category.name);
      const routes=[path.join(base,'index.html')];
      if(fs.existsSync(path.join(base,'page'))) for(const n of fs.readdirSync(path.join(base,'page')).sort((a,b)=>Number(a)-Number(b))) routes.push(path.join(base,'page',n,'index.html'));
      if(!fs.existsSync(routes[0])) continue;
      const cards=new Map(); let oldCount=0;
      for(const file of routes) {
        const html=fs.readFileSync(file,'utf8');
        const parsed=await page.evaluate(({html,url,merges})=>{
          const doc=new DOMParser().parseFromString(html,'text/html');
          return [...doc.querySelectorAll('.photo-grid > article')].map(card=>{
            for(const e of card.querySelectorAll('[href],[src],[srcset]')) {
              for(const attr of ['href','src']) if(e.hasAttribute(attr)) {const u=new URL(e.getAttribute(attr),url);e.setAttribute(attr,u.origin===location.origin?u.pathname:u.href);}
              if(e.hasAttribute('srcset')) e.setAttribute('srcset',e.getAttribute('srcset').split(',').map(part=>{const [src,size]=part.trim().split(/\s+/);return new URL(src,url).pathname+' '+size;}).join(', '));
            }
            const a=card.querySelector('h2 a');
            let u=a?new URL(a.getAttribute('href'),url):null;
            if(u) {const slug=decodeURI(u.pathname).split('/')[1];if(merges[slug]) {const target='/'+merges[slug]+'/';for(const link of card.querySelectorAll('a'))link.setAttribute('href',target);u=new URL(target,url);}}
            return {key:u?decodeURI(u.pathname):'',html:card.outerHTML};
          });
        },{html,url:origin+'/'+path.relative(root,file).replaceAll('\\','/'),merges});
        oldCount+=parsed.length;
        for(const card of parsed) if(card.key&&!cards.has(card.key)) cards.set(card.key,card.html);
      }
      const missingMemberships={'50대-재취업-가능한-직종':'rejob','국가기술자격-문제집-고르는-법':'license','기초연금-탈락-이유':'welfare'};
      for(const [slug,group] of Object.entries(missingMemberships)) {
        if(group!==category.name||cards.has('/'+slug+'/'))continue;
        const post=posts.find(p=>decodeURI(p.url)==='/'+slug+'/');
        if(!post)throw new Error('Missing canonical article '+slug);
        const html=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
        const image=await page.evaluate(({html,url})=>{const d=new DOMParser().parseFromString(html,'text/html');const img=d.querySelector('.detail-hero-image img');return img?new URL(img.getAttribute('src'),url).pathname:'';},{html,url:origin+'/'+slug+'/'});
        const tag={license:'자격증',rejob:'재취업',welfare:'부모님 복지'}[group];
        cards.set('/'+slug+'/',`<article class="post-card photo-card"><a class="post-thumb" href="/${slug}/" aria-label="${esc(post.title)}"><img src="${image}" alt="${esc(post.title)} 설명 이미지" width="1024" height="576" loading="lazy" decoding="async"></a><div class="post-card-body"><span class="tag">${tag}</span><h2><a href="/${slug}/">${esc(post.title)}</a></h2><p>${esc(post.description)}</p><a class="more" href="/${slug}/">자세히 보기</a></div></article>`);
      }
      const unique=[...cards.values()],size=Math.ceil(unique.length/routes.length);
      for(let i=0;i<routes.length;i++) {
        const file=routes[i],html=fs.readFileSync(file,'utf8');
        const next=html.replace(/(<div class="grid photo-grid">)[\s\S]*?(\s*<nav class="pagination">)/,(_,start,nav)=>start+'\n'+unique.slice(i*size,(i+1)*size).join('\n')+'\n</div>\n'+nav);
        if(next===html && oldCount!==unique.length) throw new Error('Missing category insertion '+file);
        write(file,next);
      }
      report.categories.push({category:category.name,before:oldCount,unique:unique.length,pages:routes.length});
    }
    const imageTargets=new Map();
    for(const post of posts) {
      const file=path.join(root,decodeURI(post.url),'index.html'),html=fs.readFileSync(file,'utf8');
      const images=await page.evaluate(({html,url})=>[...new DOMParser().parseFromString(html,'text/html').querySelectorAll('article img:not([srcset])')].map(i=>new URL(i.getAttribute('src'),url).pathname),{html,url:origin+post.url});
      for(const src of images) {
        const f=path.join(root,decodeURI(src));
        if(fs.existsSync(f)&&fs.statSync(f).size>900000) imageTargets.set(decodeURI(src),f);
      }
    }
    fs.mkdirSync(path.join(root,'assets','optimized'),{recursive:true});
    const variants=new Map();
    for(const [src,file] of imageTargets) {
      const meta=await sharp(file).metadata();
      const name=path.basename(file,path.extname(file));
      const widths=[...new Set([480,960,Math.min(meta.width,1440)].map(w=>Math.min(w,meta.width)))].sort((a,b)=>a-b);
      const versions=[];
      for(const width of widths) {
        const url=`/assets/optimized/${name}-${width}.webp`;
        await sharp(file).resize({width,withoutEnlargement:true}).webp({quality:86,effort:6}).toFile(path.join(root,url));
        versions.push({url,width,bytes:fs.statSync(path.join(root,url)).size});
      }
      variants.set(src,{width:meta.width,height:meta.height,versions});
      report.images.push({source:src,beforeBytes:fs.statSync(file).size,...variants.get(src)});
    }
    for(const file of all) {
      let html=fs.readFileSync(file,'utf8');
      const base=origin+'/'+path.relative(root,file).replaceAll('\\','/');
      const anchors=[...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]);
      const replacements=await page.evaluate(({anchors,base,titles,previous})=>anchors.map(raw=>{
        const a=new DOMParser().parseFromString(raw,'text/html').querySelector('a');
        if(!a||a.children.length||!a.getAttribute('href'))return null;
        const u=new URL(a.getAttribute('href'),base),text=a.textContent.trim(),title=titles[decodeURI(u.pathname)];
        return title&&u.hostname==='4050guide.co.kr'&&text!==title&&(previous.includes(text)||/실패하지 않는|6월부터 비교할 항목/.test(text))?title:null;
      }),{anchors,base,titles:Object.fromEntries(titles),previous:[...previous]});
      anchors.forEach((raw,i)=>{if(replacements[i]) {html=html.replace(raw,raw.replace(/>[\s\S]*<\/a>$/, '>'+esc(replacements[i])+'</a>'));report.links++;}});
      html=html.replace(/<img\b[^>]*>/g,raw=>{
        const match=raw.match(/\bsrc="([^"]+)"/);if(!match)return raw;
        const src=decodeURI(new URL(match[1],base).pathname),v=variants.get(src);if(!v)return raw;
        const cleaned=raw.replace(/\s(?:src|srcset|sizes|width|height|loading|decoding)="[^"]*"/g,'');
        return cleaned.replace(/\s*\/?>(\s*)$/,` src="${v.versions.at(-1).url}" srcset="${v.versions.map(x=>`${x.url} ${x.width}w`).join(', ')}" sizes="(max-width: 760px) calc(100vw - 40px), 760px" width="${v.width}" height="${v.height}" loading="lazy" decoding="async">`);
      });
      write(file,html);
    }
    const sidebarFixes={
      '2026년-상시검정-자격증-14종목':[['국비지원','국가자격 상시검정'],['카드 신청 및 훈련과정 확인','종목·지역별 시행일과 접수 가능 여부'],['고용24 / HRD-Net','한국산업인력공단 Q-Net'],['관련 혜택 더 보기','자격증 안내 더 보기'],['https://4050guide.co.kr/공공혜택-검색/','/category/license/']],
      '4050-재취업-자격증-고르는-기준':[['시험 일정과 응시조건 확인','채용공고 요구조건·경력 활용·총준비비 비교'],['한국산업인력공단 Q-Net','채용조건은 고용24 · 시험요건은 Q-Net'],['관련 혜택 더 보기','재취업 안내 더 보기'],['https://4050guide.co.kr/공공혜택-검색/','/category/rejob/']]
    };
    for(const [slug,changes] of Object.entries(sidebarFixes)) {
      const file=path.join(root,slug,'index.html');let html=fs.readFileSync(file,'utf8');
      html=html.replace(/<aside class="detail-side"[\s\S]*?<\/aside>/,block=>{for(const [a,b] of changes)block=block.replaceAll(a,b);return block;});
      if(slug.startsWith('2026년-상시'))html=html.replace('국민내일배움카드 훈련과정으로도 많이 검색되는 종목','국민내일배움카드 훈련과정을 검색할 때 확인해 볼 종목');
      html=html.replace('이전 경력과 연결될수록 전직 가능성이 높아집니다.','이전 경력과 연결되는 업무가 있는지 먼저 비교해보세요. 이는 편집자의 준비 제안이며, 취업 가능성을 보장하는 통계나 공식 요건이 아닙니다.');
      html=html.replace(/("dateModified"\s*:\s*")[^"]+"/g,'$12026-10-19"')
        .replace(/(내용 확인 )\d{4}-\d{2}-\d{2}/g,'$12026-10-19')
        .replace(/(<dt>업데이트<\/dt>\s*<dd>)[^<]+/g,'$12026년 10월 19일');
      write(file,html);report.sidebars.push(slug);
    }
    const reportFile=path.join(__dirname,'site-quality-result-20261019.json');
    if(fs.existsSync(reportFile)) {
      const previousReport=JSON.parse(fs.readFileSync(reportFile,'utf8'));
      report.images=[...new Map([...(previousReport.images||[]),...report.images].map(image=>[image.source,image])).values()];
      report.links+=(previousReport.links||0);
    }
    fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
