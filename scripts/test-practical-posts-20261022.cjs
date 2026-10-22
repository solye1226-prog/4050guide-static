const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const sharp=require('sharp');
const posts=require('./practical-posts-20261022.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));
 if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file))return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.xml':'application/xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
async function run(){
 const remote=process.env.TEST_ORIGIN;
 if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();
 const output=path.resolve(root,'..','4050-practical-qa-20261022'+(remote?'-live':''));fs.mkdirSync(output,{recursive:true});
 const report={origin,posts:[],widths:[1280,390,320],screenshots:output};
 try{
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  const index=await page.request.get(origin+'/assets/search-index.json').then(r=>r.json());
  assert.equal(index.posts.length,218);
  assert.equal(new Set(index.posts.map(p=>decodeURI(p.url))).size,218);
  const baseline=JSON.parse(require('node:child_process').execFileSync('git',['show','a4bc886:assets/search-index.json'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024})).posts;
  for(const post of baseline)assert.ok(index.posts.some(p=>decodeURI(p.url)===decodeURI(post.url)),'Existing article retained '+post.url);
  const sitemap=await page.request.get(origin+'/sitemap.xml').then(r=>r.text());
  const links=new Set();
  for(const [i,post] of posts.entries()){
   assert.ok(!post.title.includes(':'));
   const text=post.body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
   assert.ok(text.length>=1500,'Substantive main body '+post.slug);
   const image=path.join(root,post.image);const meta=await sharp(image).metadata();
   assert.deepEqual([meta.width,meta.height],[1200,750]);assert.ok(fs.statSync(image).size<200000);
   const response=await page.goto(origin+'/'+post.slug+'/');assert.equal(response.status(),200);
   assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('h1').innerText(),post.title);
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://4050guide.co.kr/'+post.slug+'/');
   assert.equal(await page.locator('meta[name=robots]').evaluateAll(es=>es.some(e=>/noindex/i.test(e.content))),false);
   assert.equal(await page.locator('.detail-content h3').count(),3);assert.ok(await page.locator('.detail-content table caption').count()>0);
   assert.equal(await page.locator('.editorial-sources a').count(),post.sources.length);
   assert.match(await page.locator('.editorial-sources').innerText(),/2026년 10월 22일/);
   assert.equal(await page.locator('.detail-hero-image img').count(),1);
   assert.match(await page.locator('.editorial-image-caption').innerText(),/AI 제작 설명용/);
   assert.equal(await page.locator('script[src*="adsbygoogle.js"]').count(),1);
   assert.ok(await page.locator('.guide-related-posts a').count()>=2);
   const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(ss=>ss.map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='BlogPosting'));
   assert.equal(schema.datePublished,'2026-10-22');assert.equal(schema.dateModified,'2026-10-22');assert.equal(schema.headline,post.title);
   assert.equal(schema.image,'https://4050guide.co.kr'+post.image);
   assert.ok(sitemap.includes('<loc>https://4050guide.co.kr/'+post.slug+'/</loc><lastmod>2026-10-22</lastmod>'));
   assert.ok(index.posts.some(p=>decodeURI(p.url)==='/'+post.slug+'/'&&p.title===post.title));
   for(const href of await page.locator('a[href^="/"]').evaluateAll(as=>as.map(a=>a.getAttribute('href'))))links.add(href);
   for(const width of report.widths){
    await page.setViewportSize({width,height:900});
    await page.locator('.detail-hero-image img').evaluate(img=>img.decode());
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))console.error(await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,100),width:e.getBoundingClientRect().width})).slice(-12)));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,post.slug+' overflow '+width);
    const main=await page.locator('.detail-main').boundingBox(),side=await page.locator('.detail-side').boundingBox();
    assert.ok(width===1280?side.x>=main.x+main.width-1:side.y>=main.y+main.height-1,'Sidebar placement '+post.slug+' '+width);
    const clip=await page.locator('h1').evaluate(el=>({clipped:el.scrollWidth>el.clientWidth+1}));assert.equal(clip.clipped,false,'Title clipped '+post.slug);
    assert.equal(await page.locator('.practical-comparison td').evaluateAll(cells=>cells.every(c=>!!c.dataset.label)),true,'Mobile table labels '+post.slug);
    if(width!==320&&[0,3,5,8,9].includes(i)){
     await page.screenshot({path:path.join(output,`${i+1}-top-${width}.png`)});
     await page.locator('.detail-content table').scrollIntoViewIfNeeded();
     await page.screenshot({path:path.join(output,`${i+1}-table-${width}.png`)});
    }
   }
   report.posts.push({slug:post.slug,title:post.title,mainTextCharacters:text.length,faq:3,sources:post.sources.length,imageBytes:fs.statSync(image).size});
  }
  for(const href of links)assert.equal((await page.request.get(origin+href)).status(),200,'Internal link '+href);
  await page.goto(origin+'/');assert.equal(await page.locator('.home-recent-list li').count(),10);
  for(const post of posts)assert.equal(await page.locator(`.home-recent-list a[href="/${post.slug}/"]`).count(),1);
  const memberships=new Set();
  for(const category of new Set(posts.map(p=>p.category))){
   for(const suffix of ['', 'page/2/']){
    const route=origin+'/category/'+category+'/'+suffix;
    const r=await page.goto(route);if(r.status()===404)continue;
    for(const href of await page.locator('.photo-grid h2 a').evaluateAll(as=>as.map(a=>decodeURI(new URL(a.href).pathname))))memberships.add(href);
   }
  }
  for(const post of posts)assert.ok(memberships.has('/'+post.slug+'/'),'Category membership '+post.slug);
  const nojs=await browser.newContext({javaScriptEnabled:false});
  const staticPage=await nojs.newPage();
  for(const post of posts){await staticPage.goto(origin+'/'+post.slug+'/');assert.match(await staticPage.locator('.detail-content').innerText(),/자주 묻는 질문/);}
  await nojs.close();assert.deepEqual(errors,[]);
  report.pass=true;report.internalLinks=links.size;report.previousArticlesRetained=baseline.length;
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
