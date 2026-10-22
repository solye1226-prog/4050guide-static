const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const [post]=require('./care-pause-post-20261023.cjs');
const root=path.resolve(__dirname,'..');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
async function run(){
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  const homeFile=path.join(__dirname,'home-template.html');const home=fs.readFileSync(homeFile,'utf8');
  const recent=await page.evaluate(({html,post})=>{
   const doc=new DOMParser().parseFromString(html,'text/html'),section=doc.querySelector('.home-recent');
   const list=section.querySelector('.home-recent-list');
   for(const li of [...list.children])if(li.querySelector('a')?.getAttribute('href')==='/'+post.slug+'/')li.remove();
   const li=doc.createElement('li'),a=doc.createElement('a'),label=doc.createElement('span'),title=doc.createElement('strong');
   a.setAttribute('href','/'+post.slug+'/');label.textContent=post.label;title.textContent=post.title;a.append(label,title);li.append(a);list.prepend(li);
   while(list.children.length>10)list.lastElementChild.remove();
   section.querySelector('.home-heading > span').textContent='2026.10.23 최신 글';
   return section.outerHTML;
  },{html:home,post});
  fs.writeFileSync(homeFile,home.replace(/<section class="home-recent"[\s\S]*?<\/section>/,recent));
  const file=path.join(root,'category','rejob','index.html');let html=fs.readFileSync(file,'utf8');
  const existing=await page.evaluate(html=>[...new DOMParser().parseFromString(html,'text/html').querySelectorAll('.photo-grid h2 a')].map(a=>decodeURI(new URL(a.getAttribute('href'),'https://4050guide.co.kr').pathname)),html);
  if(!existing.includes('/'+post.slug+'/')){
   const card=`<article class="post-card photo-card"><a class="post-thumb" href="/${post.slug}/" aria-label="${esc(post.title)}"><img src="${post.image}" alt="${esc(post.imageAlt)}" width="1200" height="750" loading="lazy" decoding="async"></a><div class="post-card-body"><span class="tag">${esc(post.label)}</span><h2><a href="/${post.slug}/">${esc(post.title)}</a></h2><p>${esc(post.description)}</p><a class="more" href="/${post.slug}/">자세히 보기</a></div></article>`;
   html=html.replace('<div class="grid photo-grid">','<div class="grid photo-grid">\n'+card);fs.writeFileSync(file,html);
  }
  const reportFile=path.join(__dirname,'site-quality-result-20261019.json');const report=JSON.parse(fs.readFileSync(reportFile,'utf8'));
  const urls=new Set();
  for(const file of [path.join(root,'category/rejob/index.html'),path.join(root,'category/rejob/page/2/index.html')]){
   const hrefs=await page.evaluate(html=>[...new DOMParser().parseFromString(html,'text/html').querySelectorAll('.photo-grid h2 a')].map(a=>decodeURI(new URL(a.getAttribute('href'),'https://4050guide.co.kr').pathname)),fs.readFileSync(file,'utf8'));
   for(const href of hrefs){if(urls.has(href))throw Error('Duplicate rejob card '+href);urls.add(href);}
  }
  Object.assign(report.categories.find(c=>c.category==='rejob'),{before:urls.size,unique:urls.size});
  fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
  console.log('Added new article, preserved ten recent links and '+urls.size+' unique rejob articles');
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
