const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const repairs=require('./content-repair-20261019.cjs');
const guides=require('./guide-refresh-data.cjs').map(old=>{
 const current=repairs.find(p=>p.slug===old.slug);
 return current?{...current,facts:[],minimum:500}:{...old,minimum:2000};
});
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));
 if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file))return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
async function run(){
 const remote=process.env.TEST_ORIGIN;
 if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const only=process.env.GUIDE_LIMIT?guides.slice(0,Number(process.env.GUIDE_LIMIT)):guides;
  for(const guide of only)for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});
   assert.equal((await page.goto(origin+'/'+guide.slug+'/')).status(),200);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('h1').innerText(),guide.title);
   const body=await page.locator('.detail-content').innerText();
   for(const fact of guide.facts)assert.ok(body.includes(fact),guide.slug+': '+fact);
   assert.ok(body.length>=guide.minimum,guide.slug+' substantive body');
   for(const [question] of guide.faq)assert.equal(await page.getByRole('heading',{name:question,exact:true}).count(),1);
   assert.equal(await page.locator('.guide-related-posts').count(),1);
   assert.doesNotMatch(await page.locator('article').innerText(),/검색할 때 같이 넣으면 좋은 키워드|4050 세대도 준비하기 늦지 않나요/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,guide.slug+' overflow '+width);
   assert.ok(await page.locator('article img').count()>0);
   for(const img of await page.locator('article img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
   const posting=(await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse).find(s=>s['@type']==='BlogPosting');
   assert.equal(posting.headline,guide.title);
   assert.match(posting.dateModified,/^2026-10-(04|07|19)$/);
   const [year,month,day]=posting.dateModified.split('-').map(Number);
   assert.ok((await page.locator('.detail-side').innerText()).includes(`${year}년 ${month}월 ${day}일`));
   assert.equal(decodeURI(await page.locator('link[rel=canonical]').getAttribute('href')),'https://4050guide.co.kr/'+guide.slug+'/');
   if(width===1280){const main=await page.locator('.detail-main').boundingBox(),side=await page.locator('.detail-side').boundingBox();assert.ok(side.x>=main.x+main.width-1);}
   for(const link of await page.locator('.guide-related-posts a').evaluateAll(as=>as.map(a=>a.getAttribute('href'))))assert.ok(fs.existsSync(path.join(root,decodeURI(new URL(link,'https://4050guide.co.kr').pathname),'index.html')));
   const indexed=require('../assets/search-index.json').posts.find(p=>decodeURI(p.url)==='/'+guide.slug+'/');
   assert.equal(indexed.title,guide.title);for(const fact of guide.facts)assert.ok(indexed.text.includes(fact));
  }
  console.log('PASS all ten refreshed guides: current titles, retained facts, FAQs, images, schema, dates, search, related links and three viewports');
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
