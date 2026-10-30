const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),posts=require('./focus-editorial-20261030.cjs');
const baseline=JSON.parse(execFileSync('git',['show','eb0cdad:assets/search-index.json'],{cwd:root,encoding:'utf8',maxBuffer:20e6}));
const current=require('../assets/search-index.json');
const merges=require('./content-merges-20261030.cjs');
assert.deepEqual(current.posts.map(p=>decodeURI(p.url)).sort(),[...new Set(baseline.posts.map(p=>{const slug=decodeURI(p.url).split('/')[1];return '/'+(merges[slug]||slug)+'/';}))].sort(),'Only explicitly reviewed merges may leave the article index');
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));
 if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file))return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
async function run(){
 const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch(),results=[];
 try{
  const page=await browser.newPage();await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const post of current.posts)assert.equal((await page.request.get(origin+post.url)).status(),200,post.url);
  for(const post of posts){
   const old=execFileSync('git',['show',`eb0cdad:${post.slug}/index.html`],{cwd:root,encoding:'utf8',maxBuffer:2e6});
   const published=await page.evaluate(html=>[...new DOMParser().parseFromString(html,'text/html').querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='BlogPosting')?.datePublished,old);
   for(const width of [1280,390,320]){
    await page.setViewportSize({width,height:900});await page.goto(origin+'/'+post.slug+'/');
    assert.equal(await page.locator('h1').innerText(),post.title);
    assert.equal(await page.locator('link[rel=canonical]').count(),1);
    assert.equal(decodeURI(await page.locator('link[rel=canonical]').getAttribute('href')),'https://4050guide.co.kr/'+post.slug+'/');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,post.slug+' overflow '+width);
    assert.ok((await page.locator('.detail-content').innerText()).replace(/\s/g,'').length>1200);
    for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));}
    for(const a of await page.locator('.guide-related-posts a').all())assert.equal((await page.request.get(origin+await a.getAttribute('href'))).status(),200);
   }
   const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(s=>s.map(x=>JSON.parse(x.textContent)).find(x=>x['@type']==='BlogPosting'));
   assert.equal(schema.datePublished,published);assert.equal(schema.dateModified,'2026-10-30');
   assert.ok(await page.locator('.editorial-sources a[href*="work24.go.kr"]').count());
   results.push({slug:post.slug,images:await page.locator('main img').count(),characters:(await page.locator('.detail-content').innerText()).replace(/\s/g,'').length});
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({pass:true,articleUrls:current.posts.length,widths:[1280,390,320],results},null,2));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
