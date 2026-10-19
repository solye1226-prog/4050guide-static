const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const apply=process.argv.includes('--apply');
async function run(){
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  const posts=require('../assets/search-index.json').posts;
  const report=[];
  for(const post of posts){
   const slug=decodeURI(post.url).slice(1,-1),file=path.join(root,slug,'index.html');
   if(!fs.existsSync(file))continue;
   const html=fs.readFileSync(file,'utf8');
   const result=await page.evaluate(html=>{
    const doc=new DOMParser().parseFromString(html,'text/html'),body=doc.querySelector('.detail-content');
    if(!body)return null;
    const before=body.textContent.replace(/\s+/g,' ').trim().length;
    const removed=[];
    for(const p of [...body.querySelectorAll('p')]){
     if(!p.innerHTML.includes('guide4050-depth-expand'))continue;
     let next=p.nextElementSibling;
     while(next&&!next.innerHTML.includes('guide4050-related-start')&&!next.classList.contains('guide-related-posts')){
      const after=next.nextElementSibling;removed.push(next.textContent);next.remove();next=after;
     }
     p.remove();
    }
    for(const node of [...body.querySelectorAll('.guide-short-uplift')]){removed.push(node.textContent);node.remove();}
    for(const heading of [...body.querySelectorAll('h2')]){
     if(heading.textContent.trim()!=='4050 기준으로 보는 활용 포인트')continue;
     if(!heading.nextElementSibling?.textContent.startsWith('40대와 50대는 단순히 제도 이름을 아는 것보다'))continue;
     let next=heading.nextElementSibling;
     while(next&&!/^H[12]$/.test(next.tagName)){const after=next.nextElementSibling;removed.push(next.textContent);next.remove();next=after;}
     heading.remove();
    }
    for(const p of [...body.querySelectorAll('p')])if(/4050_SHORT_UPLIFT_(START|END)/.test(p.innerHTML)||(!p.textContent.trim()&&!p.querySelector('img')&&p.innerHTML.includes('guide4050-depth-expand')))p.remove();
    return {before,after:body.textContent.replace(/\s+/g,' ').trim().length,removed:removed.length,body:body.innerHTML};
   },html);
   if(!result?.removed)continue;
   report.push({slug,title:post.title,before:result.before,after:result.after,removedBlocks:result.removed});
   if(apply){
    const boundary=/(<div class="content detail-content"[^>]*>)[\s\S]*?(?=<\/div>\s*<\/div>\s*<aside\b)/;
    if(!boundary.test(html))throw new Error('Body boundary missing '+slug);
    let next=html.replace(boundary,(_,opening)=>opening+result.body);
    next=next.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(full,text)=>{
     let data;try{data=JSON.parse(text);}catch{return full;}
     if(data['@type']!=='BlogPosting')return full;
     data.dateModified='2026-10-19';return '<script type="application/ld+json">'+JSON.stringify(data)+'</script>';
    });
    next=next.replace(/(<p class="editorial-byline">[\s\S]*?)(<\/p>)/,(_,text,end)=>text+' · 문장 정리 2026-10-19'+end);
    fs.writeFileSync(file,next);
   }
  }
  if(apply){
   const sitemapFile=path.join(root,'sitemap.xml'),slugs=new Set(report.map(p=>p.slug));
   let xml=fs.readFileSync(sitemapFile,'utf8');
   xml=xml.replace(/<url>[\s\S]*?<\/url>/g,item=>{
    const loc=item.match(/<loc>(.*?)<\/loc>/)?.[1];if(!loc)return item;
    const slug=decodeURI(new URL(loc).pathname).slice(1,-1);if(!slugs.has(slug))return item;
    return /<lastmod>/.test(item)?item.replace(/<lastmod>.*?<\/lastmod>/,'<lastmod>2026-10-19</lastmod>'):item.replace('</url>','<lastmod>2026-10-19</lastmod></url>');
   });
   fs.writeFileSync(sitemapFile,xml);
  }
  fs.writeFileSync(path.join(__dirname,'legacy-cleanup-20261019.json'),JSON.stringify({date:'2026-10-19',applied:apply,articles:report},null,2)+'\n');
  console.log(JSON.stringify({apply,affected:report.length,removedBlocks:report.reduce((n,p)=>n+p.removedBlocks,0),remainingUnder800:report.filter(p=>p.after<800).map(p=>({slug:p.slug,chars:p.after}))},null,2));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
