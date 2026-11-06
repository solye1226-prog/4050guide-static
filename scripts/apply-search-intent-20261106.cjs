const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const posts=require('./search-intent-content-20261106.cjs');
const root=path.resolve(__dirname,'..');
async function main(){
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  for(const p of posts){
   const file=path.join(root,p.slug,'index.html');let html=fs.readFileSync(file,'utf8');
   const updated=await page.evaluate(({html,p})=>{
    const d=new DOMParser().parseFromString(html,'text/html');
    const content=d.querySelector('.detail-content');if(!content)throw Error('Missing content');
    content.querySelector('[data-search-intent="20261106"]')?.remove();
    const s=d.createElement('section');s.dataset.searchIntent='20261106';s.innerHTML=p.html;content.prepend(s);
    content.querySelector('[data-search-faq="20261106"]')?.remove();
    const faq=d.createElement('section');faq.dataset.searchFaq='20261106';
    const h=d.createElement('h3'),answer=d.createElement('p');h.textContent=p.faq[0];answer.textContent=p.faq[1];faq.append(h,answer);
    const faqHeading=[...content.querySelectorAll('h2')].find(h=>h.textContent.trim()==='자주 묻는 질문');
    if(!faqHeading)throw Error('Missing FAQ heading');faqHeading.after(faq);
    const header=d.querySelector('header.detail-title');if(!header)throw Error('Missing title header');
    if(p.title)header.querySelector('h1').textContent=p.title;
    if(p.description){const lead=[...header.children].find(n=>n.tagName==='P'&&!n.classList.contains('editorial-byline'));if(lead)lead.textContent=p.description;}
    const byline=header.querySelector('.editorial-byline');if(byline&&!byline.textContent.includes('2026-11-06'))byline.append(d.createTextNode(' · 실용 절차·예시 보완 2026-11-06'));
    const side=d.querySelector('.detail-side');if(side){const dt=[...side.querySelectorAll('dt')].find(n=>n.textContent.trim()==='업데이트');if(dt?.nextElementSibling)dt.nextElementSibling.textContent='2026년 11월 6일 · 절차·예시 부분 보완';}
    const head=d.head;
    const title=p.title||header.querySelector('h1').textContent.trim();
    const description=p.description||head.querySelector('meta[name="description"]').content;
    head.querySelector('title').textContent=title+' - 4050가이드';
    for(const n of head.querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]'))n.content=title;
    for(const n of head.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]'))n.content=description;
    for(const n of head.querySelectorAll('script[type="application/ld+json"]')){const data=JSON.parse(n.textContent);if(data['@type']==='BlogPosting'){data.headline=title;data.description=description;data.dateModified='2026-11-06';n.textContent=JSON.stringify(data);}}
    return {head:head.innerHTML,article:d.querySelector('article.detail-layout').outerHTML};
   },{html,p});
   html=html.replace(/(<head>)[\s\S]*?(<\/head>)/,(_,a,b)=>a+updated.head+b);
   const match=html.match(/<article\b[^>]*class="[^\"]*detail-layout[^\"]*"[^>]*>[\s\S]*?<\/article>/);
   if(!match)throw Error('Missing article '+p.slug);html=html.replace(match[0],updated.article);
   fs.writeFileSync(file,html);console.log(p.slug);
  }
  const changed=new Set(['https://4050guide.co.kr/',...posts.map(p=>'https://4050guide.co.kr/'+p.slug+'/')]);
  const sitemap=await page.evaluate(({xml,urls})=>{
   const d=new DOMParser().parseFromString(xml,'application/xml');
   for(const u of d.getElementsByTagName('url'))if(urls.includes(u.getElementsByTagName('loc')[0]?.textContent)){let m=u.getElementsByTagName('lastmod')[0];if(!m){m=d.createElementNS(d.documentElement.namespaceURI,'lastmod');u.append(m)}m.textContent='2026-11-06';}
   return new XMLSerializer().serializeToString(d);
  },{xml:fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),urls:[...changed]});
  fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap+'\n');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
