const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {chromium}=require('playwright');
const photos=require('./home-photo-set-20261031.cjs'),root=path.resolve(__dirname,'..');
const source='C:/Users/kch41/.codex/generated_images/019e7e0e-7d29-7da3-aa5f-5bffb7ad17b7';
async function run(){const output=path.join(root,'assets','home-photos');fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch(),records=[];try{const p=await browser.newPage();
 for(const photo of photos){
  const versions=[];for(const width of [480,800,1200]){const filename=photo.id+'-20261031-'+width+'.webp';await sharp(path.join(source,photo.source)).resize({width,withoutEnlargement:true}).webp({quality:84}).toFile(path.join(output,filename));const info=await sharp(path.join(output,filename)).metadata();versions.push({url:'/assets/home-photos/'+filename,width:info.width,height:info.height,bytes:fs.statSync(path.join(output,filename)).size});}
  const file=path.join(root,photo.slug,'index.html');let html=fs.readFileSync(file,'utf8');
  const edits=await p.evaluate(({html,photo,versions})=>{const d=new DOMParser().parseFromString(html,'text/html'),figure=d.querySelector('.detail-hero-image'),old=figure.outerHTML,img=figure.querySelector('img'),largest=versions.at(-1);
   img.src=largest.url;img.width=largest.width;img.height=largest.height;img.alt=photo.alt;img.srcset=versions.map(v=>v.url+' '+v.width+'w').join(', ');img.sizes='(max-width: 760px) 100vw, 800px';
   let cap=figure.querySelector('figcaption');if(!cap){cap=d.createElement('figcaption');figure.append(cap)}cap.className='editorial-image-caption';cap.textContent='AI 제작 설명용 이미지 · 실제 사업장·수강생·이용자의 사진이나 후기가 아닙니다.';
   const edits=[{old,next:figure.outerHTML}];
   for(const n of d.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]')){const old=n.outerHTML;n.content='https://4050guide.co.kr'+largest.url;edits.push({old,next:n.outerHTML});}
   for(const n of d.querySelectorAll('script[type="application/ld+json"]')){const x=JSON.parse(n.textContent);if(x['@type']==='BlogPosting'){const old=n.outerHTML;x.image='https://4050guide.co.kr'+largest.url;n.textContent=JSON.stringify(x);edits.push({old,next:n.outerHTML});}}
   return edits;
  },{html,photo,versions});for(const e of edits)html=html.replace(e.old,e.next);fs.writeFileSync(file,html);
  records.push({...photo,versions,tool:'built-in image_gen',style:'20261031 natural-daylight documentary workplace photography'});
 }
 const titleMap=Object.fromEntries(records.map(ph=>[ph.slug,ph]));
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);
 for(const file of walk(path.join(root,'category'))){let html=fs.readFileSync(file,'utf8');const updated=await p.evaluate(({html,titleMap})=>{const d=new DOMParser().parseFromString(html,'text/html'),edits=[];for(const card of d.querySelectorAll('.post-card')){const a=card.querySelector('h2 a'),slug=a&&decodeURI(new URL(a.getAttribute('href'),'https://4050guide.co.kr').pathname).split('/')[1],ph=titleMap[slug];if(!ph)continue;const img=card.querySelector('img');if(!img)continue;const old=img.outerHTML,v=ph.versions.find(v=>v.width===800);img.src=v.url;img.removeAttribute('srcset');img.removeAttribute('sizes');img.width=v.width;img.height=v.height;img.alt=ph.alt;edits.push({old,next:img.outerHTML});}return edits},{html,titleMap});for(const e of updated)html=html.replace(e.old,e.next);if(updated.length)fs.writeFileSync(file,html);}
 fs.writeFileSync(path.join(root,'reports/home-photo-set-20261031.json'),JSON.stringify({date:'2026-10-31',method:'Three separately generated built-in images, responsive WebP encoding only. Existing originals retained; no change to article factual verification dates.',photos:records},null,2)+'\n');console.log(JSON.stringify(records.map(r=>({slug:r.slug,versions:r.versions}))));
 }finally{await browser.close()}}
run().catch(e=>{console.error(e);process.exitCode=1});
