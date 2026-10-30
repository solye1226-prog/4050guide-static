const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const data=require(process.argv[2]?path.resolve(__dirname,process.argv[2]):'./content-repair-20261019.cjs');
const posts=Object.fromEntries(data.map(p=>[p.slug,{title:p.title,description:p.description,image:p.image,imageAlt:p.imageAlt}]));
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);
async function run(){
 const browser=await chromium.launch();let updated=0;
 try{
  const page=await browser.newPage();
  for(const file of files(path.join(root,'category'))){
   const html=fs.readFileSync(file,'utf8'),cards=html.match(/<article\b[^>]*class="[^"]*post-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g)||[];
   const changes=await page.evaluate(({cards,posts})=>cards.map(original=>{
    const doc=new DOMParser().parseFromString(original,'text/html'),card=doc.querySelector('article');if(!card)return null;
    const title=card.querySelector('h2 a[href]');if(!title)return null;
    let slug;try{slug=decodeURI(new URL(title.getAttribute('href'),'https://4050guide.co.kr/').pathname).split('/').filter(Boolean)[0];}catch{return null;}
    const p=posts[slug];if(!p)return null;
    title.textContent=p.title;
    const description=card.querySelector('.post-card-body > p')||card.querySelector('p');if(description)description.textContent=p.description;
    for(const a of card.querySelectorAll('a[aria-label]'))a.setAttribute('aria-label',p.title);
    const img=card.querySelector('img');if(img){img.setAttribute('alt',p.imageAlt||p.title+' 설명 이미지');if(p.image){img.setAttribute('src',p.image);img.removeAttribute('srcset');img.setAttribute('width','1200');img.setAttribute('height','750');}}
    return {original,updated:card.outerHTML};
   }).filter(Boolean),{cards,posts});
   let next=html;for(const c of changes){next=next.replace(c.original,c.updated);updated++;}
   if(next!==html)fs.writeFileSync(file,next);
  }
  console.log('Updated '+updated+' category cards');
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
