const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const posts=require('./search-recovery-content-20261109.cjs');
const root=path.resolve(__dirname,'..'),date='2026-11-09',origin='https://4050guide.co.kr';
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);
async function run(){const browser=await chromium.launch();try{const page=await browser.newPage();
 const titles=Object.fromEntries(require('../assets/search-index.json').posts.map(p=>[decodeURI(p.url).split('/')[1],p.title]));for(const p of posts)titles[p.slug]=p.title;
 const folder=path.join(root,'assets','worksheets');fs.mkdirSync(folder,{recursive:true});
 for(const p of posts){const file=path.join(root,p.slug,'index.html'),html=fs.readFileSync(file,'utf8');
  const result=await page.evaluate(({html,p,titles,date,origin})=>{const d=new DOMParser().parseFromString(html,'text/html'),content=d.querySelector('.detail-content'),header=d.querySelector('header.detail-title');if(!content||!header)throw Error('Missing article structure');
   const figures=[...content.querySelectorAll('figure')].map(n=>n.outerHTML).join(''),beforeImages=[...d.images].map(n=>n.getAttribute('src'));
   const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
   content.innerHTML=`<section data-search-recovery="20261109">${p.body}</section>${figures}<p><a href="/assets/worksheets/${p.slug}.txt" download>개인 정리용 기록표 내려받기 (TXT)</a></p><p class="editorial-note">빈칸 기록표는 편집자가 만든 개인 준비용 양식입니다. 공식 제출 서식이나 인정·지급·합격을 보장하는 문서가 아니며, 입력한 정보를 사이트로 보내는 기능은 없습니다.</p><section data-recovery-faq="20261109"><h2>자주 묻는 질문</h2>${p.faq.map(([q,a])=>`<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}</section><section class="editorial-sources"><h2>공식 자료와 확인일</h2><p>2026년 11월 9일 아래 자료의 해당 항목을 확인했습니다. 본문의 가상 사례·계산·기록표는 공식 자료와 구분한 편집자의 준비 제안입니다. 개인별 적용은 본인 서류와 해당 회차·과정 안내를 따릅니다.</p><ul>${p.sources.map(([u,t])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a></li>`).join('')}</ul></section><section class="guide-related-posts"><h2>다음 단계로 읽을 글</h2><ul>${p.related.map(slug=>`<li><a href="/${slug}/">${esc(titles[slug]||slug.replaceAll('-',' '))}</a></li>`).join('')}</ul></section>`;
   header.querySelector('h1').textContent=p.title;const lead=[...header.children].find(n=>n.tagName==='P'&&!n.classList.contains('editorial-byline'));if(lead)lead.textContent=p.description;
   const byline=header.querySelector('.editorial-byline');if(byline)byline.innerHTML='4050가이드 편집 · 절차·예시 재구성 '+date+' · <a href="/정보-출처-및-면책-안내/">작성 기준</a>';
   d.title=p.title+' - 4050가이드';for(const n of d.querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]'))n.content=p.title;for(const n of d.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]'))n.content=p.description;
   for(const n of d.querySelectorAll('script[type="application/ld+json"]')){const s=JSON.parse(n.textContent);if(s['@type']==='BlogPosting'){s.headline=p.title;s.description=p.description;s.dateModified=date}if(s['@type']==='FAQPage')s.mainEntity=p.faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}));n.textContent=JSON.stringify(s)}
   const dt=[...d.querySelectorAll('.detail-side dt')].find(n=>n.textContent.trim()==='업데이트');if(dt?.nextElementSibling)dt.nextElementSibling.textContent='2026년 11월 9일 · 절차·예시 재구성';
   return {head:d.head.innerHTML,article:d.querySelector('article.detail-layout').outerHTML,beforeImages,afterImages:[...d.images].map(n=>n.getAttribute('src')),canonical:d.querySelector('link[rel="canonical"]').href};
  },{html,p,titles,date,origin});
  assert.deepEqual(result.beforeImages,result.afterImages,p.slug+' images changed');assert.equal(decodeURI(result.canonical),origin+'/'+p.slug+'/');
  const article=html.match(/<article\b[^>]*class="[^\"]*detail-layout[^\"]*"[^>]*>[\s\S]*?<\/article>/);assert(article,p.slug);const next=html.replace(article[0],result.article).replace(/(<head>)[\s\S]*?(<\/head>)/,(_,a,b)=>a+result.head+b);fs.writeFileSync(file,next);fs.writeFileSync(path.join(folder,p.slug+'.txt'),'\ufeff'+p.worksheet);console.log('Rebuilt '+p.slug);
 }
 let cardCount=0;for(const file of walk(path.join(root,'category'))){let html=fs.readFileSync(file,'utf8');const cards=html.match(/<article\b[^>]*class="[^"]*post-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g)||[];
  const changes=await page.evaluate(({cards,posts})=>cards.flatMap(original=>{const d=new DOMParser().parseFromString(original,'text/html'),card=d.querySelector('article'),link=card.querySelector('h2 a[href]');if(!link)return [];const slug=decodeURI(new URL(link.getAttribute('href'),'https://4050guide.co.kr').pathname).split('/')[1],p=posts.find(p=>p.slug===slug);if(!p)return [];link.textContent=p.title;const para=card.querySelector('.post-card-body > p')||card.querySelector('p');if(para)para.textContent=p.description;for(const a of card.querySelectorAll('a[aria-label]'))a.setAttribute('aria-label',p.title);return [{original,updated:card.outerHTML}]}),{cards,posts});
  for(const c of changes){html=html.replace(c.original,c.updated);cardCount++}if(changes.length)fs.writeFileSync(file,html);
 }console.log('Updated category cards '+cardCount);
 }finally{await browser.close()}}
run().catch(e=>{console.error(e);process.exitCode=1});
