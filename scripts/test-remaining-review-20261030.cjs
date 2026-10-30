const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),report=require('../reports/remaining-review-result-20261030.json');
const supplements=require('./remaining-supplements-20261030.cjs');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local');let f=path.resolve(root,'.'+decodeURI(u.pathname));
 if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f))return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png'})[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);
});
async function run(){
 assert.equal(report.articles.length,144);assert.equal(new Set(report.articles.map(x=>x.slug)).size,144);
 assert.equal(report.modifiedCount,41);assert.equal(report.maintainedCount,103);
 const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch();
 const output=path.resolve(root,'../4050-remaining-review-qa'+(remote?'-live':''));fs.mkdirSync(output,{recursive:true});
 try{
  const page=await browser.newPage();await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  const sitemap=await(await page.request.get(origin+'/sitemap.xml')).text(),assets=new Set();
  for(const p of report.articles){
   const response=await page.request.get(origin+encodeURI('/'+p.slug+'/'));assert.equal(response.status(),200,p.slug);
   const html=await response.text();
   const x=await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {h1:[...d.querySelectorAll('h1')].map(n=>n.textContent.trim()),title:d.title,description:d.querySelector('meta[name="description"]')?.content,canonical:d.querySelector('link[rel="canonical"]')?.getAttribute('href'),robots:d.querySelector('meta[name="robots"]')?.content||'',schema:[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),images:[...d.querySelectorAll('main img')].map(n=>n.getAttribute('src')),sections:d.querySelectorAll('[data-remaining-review="20261030"]').length,text:d.querySelector('main')?.textContent||'',headings:[...d.querySelectorAll('.remaining-review h2')].map(n=>n.textContent),sourceLinks:[...d.querySelectorAll('.remaining-review a')].map(n=>n.href)};},html);
   assert.deepEqual(x.h1,[p.preserved.title],p.slug+' title preserved');assert.ok(x.description?.length);assert.ok(x.title.includes(x.h1[0]));
   assert.equal(decodeURI(x.canonical),decodeURI(p.preserved.canonical));assert.doesNotMatch(x.robots,/noindex/);
   const article=x.schema.find(x=>x['@type']==='BlogPosting');assert.ok(article,p.slug+' schema');assert.equal(article.datePublished,p.preserved.datePublished);
   assert.deepEqual(x.images,p.preserved.images,p.slug+' images preserved');x.images.forEach(s=>assets.add(s));
   assert.ok(sitemap.includes(p.url),p.slug+' sitemap');
   if(p.supplement){assert.equal(x.sections,1,p.slug+' unique addition');assert.deepEqual(x.headings,[p.supplement.heading]);assert.equal(article.dateModified,'2026-10-30');}
   else assert.equal(x.sections,0);
   if(p.index===52){assert.doesNotMatch(x.text,/지난해 상반기 또는 올해 3월/);assert.match(x.text,/2025년 9월/);}
  }
  for(const src of assets){const r=await page.request.get(new URL(src,origin).href);assert.equal(r.status(),200,src);assert.ok((await r.body()).length>100,src);}
  const screenshots=new Set([7,37,42,72,75,78,100,126]);let views=0;
  for(const p of report.articles){
   // Check every reviewed page at desktop and narrow mobile widths.
   for(const width of [1280,320]){
    await page.setViewportSize({width,height:900});await page.goto(origin+encodeURI('/'+p.slug+'/'),{waitUntil:'domcontentloaded'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,p.slug+' overflow '+width);
    if(p.supplement){
     assert.equal(await page.locator('.detail-content .remaining-review').count(),1);
     await page.locator('.remaining-review').scrollIntoViewIfNeeded();
     assert.equal(await page.locator('.remaining-review').evaluate(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1}),true,p.slug+' supplement frame');
     if(screenshots.has(p.index))await page.screenshot({path:path.join(output,p.index+'-'+width+'.png')});
    }
    views++;
   }
  }
  for(const p of report.articles.filter(p=>p.supplement)){
   await page.setViewportSize({width:390,height:900});await page.goto(origin+encodeURI('/'+p.slug+'/'),{waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,p.slug+' overflow 390');
   for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));}
   views++;
  }
  const result={pass:true,origin,reviewed:144,modified:41,kept:103,assets:assets.size,views,widths:[1280,390,320],screenshots:output};
  fs.writeFileSync(path.join(root,'reports/remaining-review-qa'+(remote?'-live':'')+'-20261030.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
