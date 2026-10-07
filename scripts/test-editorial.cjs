const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const newest=require('./cert-posts-20261008.cjs');
const featured=require('./cert-promote-20261008-b.cjs');
const previous=[...require('./new-posts-20261006.cjs'),...require('./practical-posts-20261006.cjs'),...require('./posts-20261007.cjs'),...require('./posts-20261007-approved.cjs'),...require('./cert-posts-20261007.cjs')];
const fresh=[...previous,...newest];
const guides=require('./editorial-refresh-data.cjs');
const followup=require('./editorial-followup-data.cjs');
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
 assert.equal(newest.length,20);
 assert.equal(new Set(newest.map(p=>p.slug)).size,20);
 for(const post of newest){
  assert.ok(post.body.replace(/<[^>]*>/g,'').length>=2000,post.slug+' original pre-FAQ body');
  assert.ok(!post.title.includes(':'));
  assert.equal(post.faq.length,3);
  assert.equal(post.related.length,3);
  assert.ok(post.sources.every(([,url])=>url.startsWith('https://')));
 }
 if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});
   for(const post of [...guides,...fresh,...followup]){
    const response=await page.goto(origin+'/'+post.slug+'/');assert.equal(response.status(),200,post.slug);
    assert.equal(await page.locator('h1').innerText(),post.title);
    assert.equal(await page.locator('link[rel=canonical]').count(),1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://4050guide.co.kr/'+post.slug+'/');
    await page.locator('.detail-hero-image img').evaluate(img=>img.decode());
    if(await page.locator('.editorial-image-caption').count()){
     const figure=await page.locator('.detail-hero-image').boundingBox();
     const caption=await page.locator('.editorial-image-caption').boundingBox();
     assert.ok(caption.y+caption.height<=figure.y+figure.height+1,post.slug+' caption is not clipped');
     assert.equal(await page.locator('.detail-hero-image img').evaluate(img=>getComputedStyle(img).objectFit),'contain');
    }
    assert.ok(await page.locator('.detail-content').innerText().then(s=>s.length>1600),post.slug+' substantive body');
    assert.equal(await page.locator('.detail-content h2').filter({hasText:'자주 묻는 질문'}).count(),1);
   assert.equal(await page.locator('.guide-related-posts').count(),1);
   assert.equal(await page.locator('.editorial-sources').count(),1);
   if(newest.includes(post)){
    assert.ok(await page.locator('.detail-content').innerText().then(s=>s.length>=1800));
    assert.equal(await page.locator('.detail-content h3').count(),3);
    assert.equal(await page.locator('.detail-main img').count(),1);
    assert.equal(await page.locator('.detail-hero-image img').getAttribute('width'),'1200');
    assert.equal(await page.locator('.detail-hero-image img').getAttribute('height'),'750');
    assert.ok(await page.locator('.editorial-sources').innerText().then(s=>s.includes(post.verifiedAt.replace(/^(\d{4})-(\d{2})-(\d{2})$/,(_,y,m,d)=>`${Number(y)}년 ${Number(m)}월 ${Number(d)}일`))));
    assert.equal(await page.locator('.detail-side').innerText().then(s=>s.includes(post.check)),true);
    assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),post.description);
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),'https://4050guide.co.kr/'+post.slug+'/');
    assert.equal(await page.locator('meta[name="robots"]').evaluateAll(ms=>ms.some(m=>/noindex/i.test(m.content))),false);
    if(width<1280){const main=await page.locator('.detail-main').boundingBox(),side=await page.locator('.detail-side').boundingBox();assert.ok(side.y>=main.y+main.height-1,post.slug+' mobile sidebar below');}
   }
    if(followup.includes(post)){
     assert.equal(await page.locator('.detail-main img').count(),1,post.slug+' keep topic image only');
     assert.equal(await page.locator('.detail-hero-image .status-badge').count(),0);
     assert.ok(await page.locator('.detail-hero-image img').getAttribute('alt'));
     const body=await page.locator('.detail-content').innerText();
     assert.ok(!/4050 세대도 준비하기 늦지|확인해야 할 기본 조건/.test(body),post.slug+' remove template filler');
     assert.ok(!post.title.includes(':'));
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,post.slug+' '+width+' overflow');
    const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(ss=>ss.map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='BlogPosting'));
    assert.equal(schema.dateModified,post.publishedAt||post.verifiedAt||'2026-10-06');assert.equal(schema.headline,post.title);
    if(fresh.includes(post)){assert.equal(schema.datePublished,post.publishedAt||post.verifiedAt||'2026-10-06');assert.ok(!post.title.includes(':'));}
    if(width===1280){const main=await page.locator('.detail-main').boundingBox(),side=await page.locator('.detail-side').boundingBox();assert.ok(side.x>=main.x+main.width-1,post.slug+' sidebar right');}
   }
   await page.goto(origin+'/');assert.equal(await page.locator('.home-recent-list li').count(),10);
   for(const post of featured)assert.equal(await page.locator(`.home-recent-list a[href="/${post.slug}/"]`).count(),1);
   assert.equal(await page.locator('.home-hubs a').count(),4);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'home '+width);
   for(const category of new Set(fresh.map(p=>p.category))){
    await page.goto(origin+'/category/'+category+'/');
    for(const post of fresh.filter(p=>p.category===category))assert.equal(await page.locator(`h2 a[href="/${post.slug}/"]`).count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,category+' '+width);
   }
  }
  for(const post of fresh){const r=await page.request.get(origin+post.image);assert.equal(r.status(),200);assert.ok((await r.body()).length<200000);}
  const searchResponse=await page.request.get(origin+'/assets/search-index.json');
  const search=await searchResponse.json();const urls=search.posts.map(p=>decodeURI(p.url));
  assert.equal(new Set(urls).size,urls.length,'search index duplicate URLs');
  for(const post of newest)assert.equal(urls.filter(url=>url==='/'+post.slug+'/').length,1);
  const oldSearch=JSON.parse(require('node:child_process').execFileSync('git',['show','HEAD:assets/search-index.json'],{cwd:root,encoding:'utf8'}));
  for(const post of oldSearch.posts)assert.ok(urls.includes(decodeURI(post.url)),'retained '+post.url);
  const links=new Set();
  for(const post of newest){
   await page.goto(origin+'/'+post.slug+'/');
   for(const href of await page.locator('a[href^="/"]').evaluateAll(as=>as.map(a=>a.getAttribute('href'))))links.add(href);
  }
  for(const href of links){const r=await page.request.get(origin+href);assert.equal(r.status(),200,'internal link '+href);}
  const sitemap=await page.request.get(origin+'/sitemap.xml');const xml=await sitemap.text();for(const p of fresh)assert.ok(xml.includes('https://4050guide.co.kr/'+p.slug+'/'));
  assert.deepEqual(errors,[]);
  const output=path.resolve(root,'..','cert20-qa-20261008'+(remote?'-live':''));fs.mkdirSync(output,{recursive:true});
  for(const width of [1280,390]){await page.setViewportSize({width,height:900});await page.goto(origin+'/'+newest[0].slug+'/');await page.locator('.detail-hero-image img').evaluate(img=>img.decode());await page.screenshot({path:path.join(output,'article-'+width+'.png'),fullPage:true});await page.goto(origin+'/');await page.screenshot({path:path.join(output,'home-'+width+'.png'),fullPage:true});}
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:900});
   for(const post of [newest[12],newest[15],newest[19],followup[0],followup[3],followup[9]]){
    await page.goto(origin+'/'+post.slug+'/');
    await page.locator('.detail-hero-image img').evaluate(img=>img.decode());
    await page.screenshot({path:path.join(output,post.slug+'-'+width+'.png')});
   }
  }
  const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();
  for(const post of newest){await staticPage.goto(origin+'/'+post.slug+'/');assert.equal(await staticPage.locator('h1').innerText(),post.title);assert.equal(await staticPage.locator('.detail-content h3').count(),3);}
  await nojs.close();
  console.log('PASS: '+[...guides,...fresh,...followup].length+' articles, 3 viewports, ten newest home links, old/new category cards, topic images, FAQs, sitemap, schema and no-JS content');
 }finally{await browser.close();if(!remote)await new Promise(r=>server.close(r));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
