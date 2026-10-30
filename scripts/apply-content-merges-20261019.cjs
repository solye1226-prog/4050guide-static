const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const merges=require(process.argv[2]?path.resolve(__dirname,process.argv[2]):'./content-merges-20261019.cjs');
const date=process.env.PUBLISH_DATE||'2026-10-19';
const origin='https://4050guide.co.kr';
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name.startsWith('.')?[]:e.isDirectory()?(e.name==='scripts'||e.name==='node_modules'?[]:files(path.join(dir,e.name))):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);
function replacement(href,base){
 let url;try{url=new URL(href,base);}catch{return null;}
 if(!['4050guide.co.kr','www.4050guide.co.kr'].includes(url.hostname))return null;
 const parts=decodeURI(url.pathname).split('/').filter(Boolean);
 if(parts.length>2||(parts.length===2&&parts[1]!=='index.html'))return null;
 const target=merges[parts[0]];
 return target?'/'+target+'/'+url.search+url.hash:null;
}
async function run(){
 for(const [from,to] of Object.entries(merges)){
  if(from===to||merges[to])throw new Error('Self/chain merge '+from);
  if(!fs.existsSync(path.join(root,to,'index.html')))throw new Error('Missing target '+to);
 }
 const browser=await chromium.launch();
 const report={date,merges:Object.entries(merges).map(([from,to])=>({from,to})),changedFiles:[],removedCards:0,rewrittenLinks:0};
 try{
  const page=await browser.newPage();
  for(const file of [...files(root),path.join(__dirname,'home-template.html')]){
   const relative=path.relative(root,file).replaceAll('\\','/');
   if(merges[relative.split('/')[0]])continue;
   let html=fs.readFileSync(file,'utf8');const before=html;
   const base=new URL(relative,origin+'/').href;
   if(relative.startsWith('category/')){
    const cards=html.match(/<article\b[^>]*class="[^"]*post-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g)||[];
    const obsolete=await page.evaluate(({cards,base,merges})=>cards.filter(h=>{
     const doc=new DOMParser().parseFromString(h,'text/html');
     return [...doc.querySelectorAll('a[href]')].some(a=>{try{const u=new URL(a.getAttribute('href'),base);return u.hostname==='4050guide.co.kr'&&merges[decodeURI(u.pathname).split('/').filter(Boolean)[0]];}catch{return false;}});
    }),{cards,base,merges});
    for(const card of obsolete){html=html.replace(card,'');report.removedCards++;}
   }
   html=html.replace(/\bhref=(['"])(.*?)\1/g,(full,quote,href)=>{
    const target=replacement(href,base);if(!target)return full;
    report.rewrittenLinks++;return 'href='+quote+target+quote;
   });
   // A merged reading link may duplicate a retained link or point to the article itself.
   html=html.replace(/<section class="guide-related-posts">[\s\S]*?<\/section>/g,section=>{
    const seen=new Set(),current=decodeURI(new URL(base).pathname).replace(/index\.html$/,'');
    return section.replace(/<li\b[^>]*>[\s\S]*?<\/li>/g,item=>{
     const href=item.match(/href=(['"])(.*?)\1/)?.[2];if(!href)return item;
     let u;try{u=new URL(href,base);}catch{return item;}
     const key=decodeURI(u.pathname).replace(/index\.html$/,'');
     if(key===current||seen.has(key))return '';
     seen.add(key);return item;
    });
   });
   if(html!==before){fs.writeFileSync(file,html.replace(/[\t ]+$/gm,''));report.changedFiles.push(relative);}
  }
  const redirectFile=path.join(root,'_redirects');
  const lines=fs.readFileSync(redirectFile,'utf8').split(/\r?\n/).filter(line=>!line.startsWith('# content-merges-20261019'));
  const rules=lines.map(line=>{
   if(!line.trim()||line.trim().startsWith('#'))return line;
   const parts=line.trim().split(/\s+/);const target=replacement(parts[1],origin+'/');
   if(target)parts[1]=encodeURI(target);
   return parts.join(' ');
  });
  const existing=new Set(rules.map(line=>line.trim().split(/\s+/)[0]));
  for(const [from,to] of Object.entries(merges))for(const suffix of ['/','','/index.html'])for(const source of new Set(['/'+from+suffix,encodeURI('/'+from+suffix)])){
   if(!existing.has(source)){rules.unshift(source+' '+encodeURI('/'+to+'/')+' 301');existing.add(source);}
  }
  fs.writeFileSync(redirectFile,rules.filter(Boolean).join('\n')+'\n');
  const sitemapFile=path.join(root,'sitemap.xml');
  const xml=await page.evaluate(({xml,merges})=>{
   const doc=new DOMParser().parseFromString(xml,'application/xml');
   if(doc.querySelector('parsererror'))throw new Error('Invalid sitemap');
   for(const item of [...doc.getElementsByTagName('url')]){
    const loc=item.getElementsByTagName('loc')[0]?.textContent;
    if(loc&&merges[decodeURI(new URL(loc).pathname).split('/').filter(Boolean)[0]])item.remove();
   }
   return new XMLSerializer().serializeToString(doc);
  },{xml:fs.readFileSync(sitemapFile,'utf8'),merges});
  fs.writeFileSync(sitemapFile,xml.replace(/[\t ]+$/gm,'')+'\n');
  for(const from of Object.keys(merges)){
   const file=path.resolve(root,from,'index.html');
   if(!file.startsWith(root+path.sep)||path.dirname(file)!==path.join(root,from))throw new Error('Invalid merge source path');
   if(fs.existsSync(file))fs.unlinkSync(file);
  }
  fs.writeFileSync(path.join(__dirname,'content-merge-result-'+date.replaceAll('-','')+'.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({merged:report.merges.length,changedFiles:report.changedFiles.length,removedCards:report.removedCards,rewrittenLinks:report.rewrittenLinks}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
