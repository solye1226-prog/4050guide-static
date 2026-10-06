const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const posts=require('./editorial-followup-data.cjs');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(e.name.startsWith('.')||e.name==='scripts')return [];const f=path.join(dir,e.name);return e.isDirectory()?files(f):e.name.endsWith('.html')?[f]:[]})}
async function run(){
 const browser=await chromium.launch();let changed=0;
 try{
  const page=await browser.newPage();
  for(const file of files(root)){
   const old=fs.readFileSync(file,'utf8');
   const cards=[...old.matchAll(/<article\b[^>]*class="[^\"]*\bpost-card\b[^\"]*"[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
   if(!cards.length)continue;
   const updates=await page.evaluate(({cards,posts})=>cards.map(card=>{
    const doc=new DOMParser().parseFromString(card,'text/html');const article=doc.querySelector('article');
    const title=article.querySelector('h2 a');if(!title)return null;
    let url;try{url=new URL(title.getAttribute('href'),'https://4050guide.co.kr/')}catch{return null}
    if(url.hostname!=='4050guide.co.kr')return null;
    const post=posts.find(p=>decodeURIComponent(url.pathname)===`/${p.slug}/`);if(!post)return null;
    title.textContent=post.title;const description=article.querySelector('.post-card-body p');if(description)description.textContent=post.description;
    const thumbnail=article.querySelector('.post-thumb');if(thumbnail)thumbnail.setAttribute('aria-label',post.title);
    if(post.image){const image=article.querySelector('.post-thumb img');if(image){image.setAttribute('src',post.image);image.setAttribute('alt',post.imageAlt);image.setAttribute('width','1200');image.setAttribute('height','750');image.removeAttribute('srcset');image.removeAttribute('sizes')}}
    article.querySelectorAll('.status-badge').forEach(b=>b.remove());
    return {from:card,to:article.outerHTML};
   }),{cards,posts});
   let html=old;for(const u of updates.filter(Boolean))html=html.replace(u.from,u.to);
   if(html!==old){fs.writeFileSync(file,html);changed++}
  }
  console.log('Synchronized updated guide cards in '+changed+' archive pages');
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
