const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const posts=require('./search-intent-content-20261109.cjs');
const root=path.resolve(__dirname,'..');
async function run(){const browser=await chromium.launch();try{const page=await browser.newPage();
 for(const p of posts){const file=path.join(root,p.slug,'index.html');let html=fs.readFileSync(file,'utf8');
  const update=await page.evaluate(({html,p})=>{const d=new DOMParser().parseFromString(html,'text/html'),content=d.querySelector('.detail-content'),header=d.querySelector('header.detail-title');if(!content||!header)throw Error('Missing article structure');
   content.querySelector('[data-search-intent="20261109"]')?.remove();const section=d.createElement('section');section.dataset.searchIntent='20261109';section.innerHTML=p.html;content.prepend(section);
   content.querySelector('[data-search-faq="20261109"]')?.remove();const faq=d.createElement('section');faq.dataset.searchFaq='20261109';for(const [q,a] of p.faq){const h=d.createElement('h3'),answer=d.createElement('p');h.textContent=q;answer.textContent=a;faq.append(h,answer)}
   const faqHeading=[...content.querySelectorAll('h2')].find(n=>n.textContent.trim()==='자주 묻는 질문');if(!faqHeading)throw Error('Missing FAQ');faqHeading.after(faq);
   if(p.title)header.querySelector('h1').textContent=p.title;
   const lead=[...header.children].find(n=>n.tagName==='P'&&!n.classList.contains('editorial-byline'));if(p.description&&lead)lead.textContent=p.description;
   const byline=header.querySelector('.editorial-byline');if(byline&&!byline.textContent.includes('2026-11-09'))byline.append(d.createTextNode(' · 학습 예시·절차 보완 2026-11-09'));
   const dt=[...d.querySelectorAll('.detail-side dt')].find(n=>n.textContent.trim()==='업데이트');if(dt?.nextElementSibling)dt.nextElementSibling.textContent='2026년 11월 9일 · 학습 예시·절차 부분 보완';
   const title=header.querySelector('h1').textContent.trim(),description=p.description||d.querySelector('meta[name="description"]').content;
   d.title=title+' - 4050가이드';for(const n of d.querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]'))n.content=title;for(const n of d.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]'))n.content=description;
   for(const n of d.querySelectorAll('script[type="application/ld+json"]')){const s=JSON.parse(n.textContent);if(s['@type']==='BlogPosting'){s.headline=title;s.description=description;s.dateModified='2026-11-09';n.textContent=JSON.stringify(s)}}
   return {head:d.head.innerHTML,article:d.querySelector('article.detail-layout').outerHTML};},{html,p});
  const article=html.match(/<article\b[^>]*class="[^\"]*detail-layout[^\"]*"[^>]*>[\s\S]*?<\/article>/);if(!article)throw Error('Missing article '+p.slug);html=html.replace(article[0],update.article).replace(/(<head>)[\s\S]*?(<\/head>)/,(_,a,b)=>a+update.head+b);fs.writeFileSync(file,html);console.log(p.slug);
 }
 const urls=['https://4050guide.co.kr/',...posts.map(p=>'https://4050guide.co.kr/'+p.slug+'/')];
 const xml=await page.evaluate(({xml,urls})=>{const d=new DOMParser().parseFromString(xml,'application/xml');for(const u of d.getElementsByTagName('url'))if(urls.includes(u.getElementsByTagName('loc')[0]?.textContent)){let m=u.getElementsByTagName('lastmod')[0];if(!m){m=d.createElementNS(d.documentElement.namespaceURI,'lastmod');u.append(m)}m.textContent='2026-11-09'}return new XMLSerializer().serializeToString(d);},{xml:fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),urls});fs.writeFileSync(path.join(root,'sitemap.xml'),xml+'\n');
 }finally{await browser.close()}}
run().catch(e=>{console.error(e);process.exitCode=1});
