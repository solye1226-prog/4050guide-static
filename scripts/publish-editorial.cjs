const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root=path.resolve(__dirname,'..');
const date=process.env.PUBLISH_DATE||new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('PUBLISH_DATE must be YYYY-MM-DD');
const displayDate=value=>value.split('-').map((n,i)=>Number(n)+['년','월','일'][i]).join(' ');
const data=require(path.resolve(__dirname,process.argv[2]||'editorial-refresh-data.cjs'));
const escape=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
async function run() {
 const browser=await chromium.launch();
 try {
  const page=await browser.newPage();
  const base=fs.readFileSync(path.join(root,'국민취업지원제도-4050-신청-전-확인할-것','index.html'),'utf8');
  const titleMap=new Map(require('../assets/search-index.json').posts.map(p=>[decodeURI(p.url),p.title]));
  data.forEach(g=>titleMap.set('/'+g.slug+'/',g.title));
  const changedTitles=[];
  for(const [i,g] of data.entries()) {
   if(g.publishedAt&&!/^\d{4}-\d{2}-\d{2}$/.test(g.publishedAt))throw new Error('publishedAt must be YYYY-MM-DD');
   const verifiedDate=g.verifiedAt||date;
   const file=path.join(root,g.slug,'index.html');
   const exists=fs.existsSync(file);
   if(!exists&&!g.image)throw new Error('Missing new illustration '+g.slug);
   const old=exists?fs.readFileSync(file,'utf8'):base;
   const preserved=await page.evaluate(html=>{
    const doc=new DOMParser().parseFromString(html,'text/html');
    return {title:doc.querySelector('h1')?.textContent.trim(),hero:doc.querySelector('.detail-hero-image')?.outerHTML||'',figures:[...doc.querySelectorAll('.detail-content figure')].filter(f=>f.querySelector('img')).map(f=>f.outerHTML).join('\n'),image:doc.querySelector('.detail-hero-image img')?.getAttribute('src'),datePublished:[...doc.querySelectorAll('script[type="application/ld+json"]')].map(s=>{try{return JSON.parse(s.textContent)}catch{return {}}}).find(s=>s['@type']==='BlogPosting')?.datePublished};
   },old);
   if(exists&&preserved.title!==g.title)changedTitles.push([preserved.title,g.title]);
   const url=`https://4050guide.co.kr/${g.slug}/`;
   const image=g.image||new URL(preserved.image,url).href;
   const retainedHero=preserved.hero.replace(/<span\b[^>]*>[\s\S]*?<\/span>/g,'').replace(/\balt=""/,`alt="${escape(g.label+' 설명용 이미지')}"`).replace(/[\t ]+(?=\r?$)/gm,'');
   const hero=g.image?`<figure class="detail-hero-image"><img width="1200" height="750" src="${escape(g.image)}" alt="${escape(g.imageAlt||g.title+' 설명용 AI 카드뉴스')}" fetchpriority="high" decoding="async"><figcaption class="editorial-image-caption">AI 제작 설명용 이미지 · 공식 안내문이나 실제 이용자 후기가 아닙니다.</figcaption></figure>`:retainedHero;
   const faq='<h2>자주 묻는 질문</h2>'+g.faq.map(([q,a])=>`<h3>${escape(q)}</h3><p>${escape(a)}</p>`).join('\n');
   const sources='<section class="editorial-sources"><h2>공식 자료와 확인일</h2><p>'+displayDate(verifiedDate)+' 확인한 자료와 편집자의 준비 제안을 구분해 정리했습니다. 개인별 계약·지원 자격·처리 결과는 해당 기관에서 확인하세요.</p><ul>'+g.sources.map(([title,href])=>`<li><a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(title)}</a></li>`).join('')+'</ul></section>';
   const related='<section class="guide-related-posts"><h2>다음 단계로 읽을 글</h2><ul>'+g.related.map(slug=>{const title=titleMap.get('/'+slug+'/');if(!title)throw new Error('Missing related title '+slug);return `<li><a href="/${slug}/">${escape(title)}</a></li>`}).join('')+'</ul></section>';
   const content=`<main class="main"><div class="wrap"><article class="detail-layout"><div class="detail-main">${hero}<header class="detail-title"><span class="tag">${escape(g.label)}</span><h1>${escape(g.title)}</h1><p>${escape(g.intro)}</p><p class="editorial-byline">4050가이드 편집 · ${exists?'내용 확인':'발행'} ${date} · <a href="/정보-출처-및-면책-안내/">작성 기준</a></p></header><div class="content detail-content">${g.body}${exists&&g.keepFigures!==false?preserved.figures:''}${faq}${sources}${related}</div></div><aside class="detail-side" aria-label="핵심 정보"><div class="info-panel"><h2>핵심 정보</h2><dl><div><dt>분야</dt><dd>${escape(g.label)}</dd></div><div><dt>확인할 것</dt><dd>${escape(g.check||'조건·비용·실제 안내 비교')}</dd></div><div><dt>출처</dt><dd>${escape(g.sources[0][0])}</dd></div><div><dt>업데이트</dt><dd>${displayDate(date)}</dd></div></dl><a class="panel-button" href="${escape(g.sources[0][1])}" target="_blank" rel="noopener noreferrer">공식 안내 확인</a><a class="panel-subbutton" href="/category/${g.category}/">관련 글 더 보기</a></div></aside></article></div></main>`;
   let html=old.replace(/<main\b[\s\S]*?<\/main>/,content).replace(/<link\b[^>]*href="\/assets\/editorial.css"[^>]*>\s*/g,'');
   html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(g.title)} - 4050가이드</title>`);
   html=html.replace(/(<meta[^>]*(?:name|property)="(?:description|og:description|twitter:description)"[^>]*content=")[^"]*(")/g,(_,a,b)=>a+escape(g.description)+b);
   html=html.replace(/(<meta[^>]*(?:name|property)="(?:og:title|twitter:title)"[^>]*content=")[^"]*(")/g,(_,a,b)=>a+escape(g.title)+b);
   html=html.replace(/(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")/g,(_,a,b)=>a+url+b);
   html=html.replace(/(<meta[^>]*(?:name|property)="(?:og:image|twitter:image)"[^>]*content=")[^"]*(")/g,(_,a,b)=>a+escape(new URL(image,url).href)+b);
   html=html.replace(/<link\b[^>]*rel="canonical"[^>]*>\s*/g,'').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g,'');
   html=html.replace(/<link\b[^>]*(?:wp-json|xmlrpc|rss\+xml)[^>]*>\s*/g,'').replace(/<meta\b[^>]*name="generator"[^>]*>\s*/g,'');
   const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:g.title,description:g.description,dateModified:date,image:new URL(image,url).href,author:{'@type':'Organization',name:'4050가이드',url:'https://4050guide.co.kr/소개/'},publisher:{'@type':'Organization',name:'4050가이드'},mainEntityOfPage:url,inLanguage:'ko-KR'};
   if(g.publishedAt)schema.datePublished=g.publishedAt;
   else if(!exists)schema.datePublished=date;
   else if(preserved.datePublished)schema.datePublished=preserved.datePublished;
   html=html.replace('</head>',`<link rel="canonical" href="${url}">\n<link rel="stylesheet" href="/assets/editorial.css">\n<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);
   fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);
   console.log(`${exists?'UPDATED':'CREATED'} ${i+1}/${data.length} ${g.slug}`);
  }
  function sync(dir) {
   for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if(entry.name.startsWith('.')||entry.name==='scripts')continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())sync(file);
    else if(entry.name.endsWith('.html')) {
     const old=fs.readFileSync(file,'utf8');let html=old;
     changedTitles.forEach(([from,to])=>{html=html.replaceAll(from,to).replaceAll(escape(from),escape(to))});
     if(html!==old)fs.writeFileSync(file,html);
    }
   }
  }
  sync(root);
  const sitemapFile=path.join(root,'sitemap.xml');let sitemap=fs.readFileSync(sitemapFile,'utf8');
  for(const g of data) {
   const loc=`https://4050guide.co.kr/${g.slug}/`;
   const tag=`<url><loc>${loc}</loc><lastmod>${date}</lastmod></url>`;
   if(sitemap.includes(`<loc>${loc}</loc>`))sitemap=sitemap.replace(/<url>[\s\S]*?<\/url>/g,item=>item.includes(`<loc>${loc}</loc>`)?tag:item);
   else sitemap=sitemap.replace('</urlset>',`  ${tag}\n</urlset>`);
  }
  fs.writeFileSync(sitemapFile,sitemap);
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
