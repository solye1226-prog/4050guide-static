const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const fresh=require('./new-posts-20261006.cjs');
const guides=require('./editorial-refresh-data.cjs');
const remote=process.env.TEST_ORIGIN;
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file))return res.writeHead(404).end();
 const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
async function run(){
 if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});
   for(const post of [...guides,...fresh]){
    const response=await page.goto(origin+'/'+post.slug+'/');assert.equal(response.status(),200,post.slug);
    assert.equal(await page.locator('h1').innerText(),post.title);
    assert.equal(await page.locator('link[rel=canonical]').count(),1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://4050guide.co.kr/'+post.slug+'/');
    await page.locator('.detail-hero-image img').evaluate(img=>img.decode());
    assert.ok(await page.locator('.detail-content').innerText().then(s=>s.length>1600),post.slug+' substantive body');
    assert.equal(await page.locator('.detail-content h2').filter({hasText:'자주 묻는 질문'}).count(),1);
    assert.equal(await page.locator('.guide-related-posts').count(),1);
    assert.equal(await page.locator('.editorial-sources').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,post.slug+' '+width+' overflow');
    const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(ss=>ss.map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='BlogPosting'));
    assert.equal(schema.dateModified,'2026-10-06');assert.equal(schema.headline,post.title);
    if(fresh.includes(post)){assert.equal(schema.datePublished,'2026-10-06');assert.ok(!post.title.includes(':'));}
    if(width===1280){const main=await page.locator('.detail-main').boundingBox(),side=await page.locator('.detail-side').boundingBox();assert.ok(side.x>=main.x+main.width-1,post.slug+' sidebar right');}
   }
   await page.goto(origin+'/');assert.equal(await page.locator('.home-recent-list li').count(),10);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'home '+width);
   for(const category of new Set(fresh.map(p=>p.category))){
    await page.goto(origin+'/category/'+category+'/');
    for(const post of fresh.filter(p=>p.category===category))assert.equal(await page.locator(`h2 a[href="/${post.slug}/"]`).count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,category+' '+width);
   }
  }
  for(const post of fresh){const r=await page.request.get(origin+post.image);assert.equal(r.status(),200);assert.ok((await r.body()).length<200000);}
  const sitemap=await page.request.get(origin+'/sitemap.xml');const xml=await sitemap.text();for(const p of fresh)assert.ok(xml.includes('https://4050guide.co.kr/'+p.slug+'/'));
  assert.deepEqual(errors,[]);
  const output=path.resolve(root,'..','editorial-qa-20261006');fs.mkdirSync(output,{recursive:true});
  for(const width of [1280,390]){await page.setViewportSize({width,height:900});await page.goto(origin+'/'+fresh[0].slug+'/');await page.screenshot({path:path.join(output,'article-'+width+'.png'),fullPage:true});await page.goto(origin+'/');await page.screenshot({path:path.join(output,'home-'+width+'.png'),fullPage:true});}
  const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();await staticPage.goto(origin+'/'+fresh[0].slug+'/');assert.equal(await staticPage.locator('h1').innerText(),fresh[0].title);await nojs.close();
  console.log('PASS: 15 articles, 3 viewports, desktop sidebars, ten images, home/categories, sitemap, schema and no-JS content');
 }finally{await browser.close();if(!remote)await new Promise(r=>server.close(r));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
