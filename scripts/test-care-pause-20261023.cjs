const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const [post]=require('./care-pause-post-20261023.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));
 if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file))return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.xml':'application/xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
async function run(){
 const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`;
 const out=path.resolve(root,'..','4050-care-pause-qa-20261023'+(remote?'-live':''));fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  const links=new Set();
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});
   assert.equal((await page.goto(origin+'/'+post.slug+'/')).status(),200);
   assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('h1').innerText(),post.title);
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://4050guide.co.kr/'+post.slug+'/');
   assert.equal(await page.locator('meta[name=description]').getAttribute('content'),post.description);
   assert.equal(await page.locator('meta[name=robots]').evaluateAll(es=>es.some(e=>/noindex/i.test(e.content))),false);
   const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(ss=>ss.map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='BlogPosting'));
   assert.equal(schema.datePublished,'2026-10-23');assert.equal(schema.dateModified,'2026-10-23');assert.equal(schema.headline,post.title);
   assert.equal(await page.locator('.detail-content h3').count(),3);assert.equal(await page.locator('.editorial-sources a').count(),3);
   assert.equal(await page.locator('.guide-related-posts a').count(),3);
   assert.match(await page.locator('.editorial-sources').innerText(),/2026년 10월 23일/);
   assert.equal(await page.locator('.detail-hero-image img').getAttribute('src'),post.image);
   assert.equal(await page.locator('.detail-hero-image img').evaluate(async i=>{await i.decode();return i.naturalWidth;}),1200);
   assert.match(await page.locator('.editorial-image-caption').innerText(),/AI 제작 설명용 이미지/);
   assert.equal(await page.locator('.practical-comparison td').evaluateAll(cells=>cells.every(c=>!!c.dataset.label)),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Article overflow '+width);
   const main=await page.locator('.detail-main').boundingBox(),side=await page.locator('.detail-side').boundingBox();
   assert.ok(width===1280?side.x>=main.x+main.width-1:side.y>=main.y+main.height-1,'Sidebar '+width);
   for(const href of await page.locator('a[href^="/"]').evaluateAll(as=>as.map(a=>a.getAttribute('href'))))links.add(href);
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'article-top-'+width+'.png')});
   await page.locator('.practical-comparison').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'article-table-'+width+'.png')});
   await page.goto(origin+'/');assert.equal(await page.locator('.home-recent-list li').count(),10);
   assert.equal(await page.locator('.home-recent-list a').first().getAttribute('href'),'/'+post.slug+'/');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Home overflow '+width);
  }
  for(const href of links)assert.equal((await page.request.get(origin+href)).status(),200,'Internal route '+href);
  const index=await page.request.get(origin+'/assets/search-index.json').then(r=>r.json());assert.equal(index.posts.length,219);
  const baseline=JSON.parse(require('node:child_process').execFileSync('git',['show','cd80261:assets/search-index.json'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024})).posts;
  for(const old of baseline)assert.ok(index.posts.some(p=>p.url===old.url),'Existing article retained '+old.url);
  assert.ok(index.posts.some(p=>decodeURI(p.url)==='/'+post.slug+'/'));
  const map=await page.request.get(origin+'/sitemap.xml').then(r=>r.text());assert.ok(map.includes('<loc>https://4050guide.co.kr/'+post.slug+'/</loc><lastmod>2026-10-23</lastmod>'));
  await page.goto(origin+'/category/rejob/');assert.equal(await page.locator(`.photo-grid h2 a[href="/${post.slug}/"]`).count(),1);
  await page.goto(origin+'/?s='+encodeURIComponent('방문요양 어르신 입원'));
  const result=page.locator('.guide-search-result h3 a').filter({hasText:post.title});await result.waitFor();await result.click();
  assert.equal(decodeURI(new URL(page.url()).pathname),'/'+post.slug+'/');
  const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();await staticPage.goto(origin+'/'+post.slug+'/');
  assert.match(await staticPage.locator('.detail-content').innerText(),/센터에 보낼 문자 예시/);await nojs.close();
  assert.deepEqual(errors,[]);
  const report={pass:true,origin,title:post.title,url:'https://4050guide.co.kr/'+post.slug+'/',activeArticles:219,previousArticlesRetained:baseline.length,imageBytes:fs.statSync(path.join(root,post.image)).size,faq:3,officialSources:3,related:3,widths:[1280,390,320],internalLinks:links.size,searchResultNavigation:true,screenshots:out};
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
