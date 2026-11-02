const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),expected=require('../assets/search-index.json').posts;
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png'})[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
async function run(){const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=remote||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch(),output=path.resolve(root,'../4050-catalog-qa-20261102'+(remote?'-live':''));fs.mkdirSync(output,{recursive:true});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
 for(const width of [1440,1280,768,390,320]){
  await p.setViewportSize({width,height:900});await p.goto(origin+'/');assert.equal(await p.locator('.catalog-card').count(),215);assert.equal(await p.locator('.catalog-card:visible').count(),12);assert.equal(await p.locator('#budget-form').count(),0);
  const columns=await p.locator('.catalog-grid').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length);assert.equal(columns,width>1000?4:width>600?2:1);
  for(const img of await p.locator('.catalog-card:visible img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(n=>n.decode());assert.ok(await img.evaluate(n=>n.naturalWidth>0));}
  await p.locator('#catalog-more').click();assert.equal(await p.locator('.catalog-card:visible').count(),24);
  for(const topic of ['license','support','rejob','exam','money']){await p.locator('[data-topic="'+topic+'"]').click();const visible=await p.locator('.catalog-card:visible').evaluateAll(ns=>ns.map(n=>n.dataset.category));assert.ok(visible.length>0);assert.ok(visible.every(t=>t===topic));}
  await p.locator('[data-topic="all"]').click();await p.selectOption('#catalog-sort','title');const titles=await p.locator('.catalog-card:visible').evaluateAll(ns=>ns.map(n=>n.dataset.title));assert.deepEqual(titles,[...titles].sort((a,b)=>a.localeCompare(b,'ko')));
  await p.selectOption('#catalog-sort','recommended');await p.evaluate(()=>scrollTo(0,0));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width);
  if(width<760){await p.locator('.catalog-mobile-nav summary').click();assert.ok(await p.locator('.catalog-mobile-nav nav a[href="/tools/"]').isVisible());await p.locator('.catalog-mobile-nav summary').click();}
  await p.screenshot({path:path.join(output,'first-'+width+'.png')});await p.screenshot({path:path.join(output,'full-'+width+'.png'),fullPage:true});
 }
 while(await p.locator('#catalog-more').isVisible())await p.locator('#catalog-more').click();assert.equal(await p.locator('.catalog-card:visible').count(),215);
 const links=await p.locator('.catalog-card h3 a').evaluateAll(ns=>ns.map(n=>n.getAttribute('href')));assert.deepEqual(new Set(links),new Set(expected.map(p=>decodeURI(p.url))));for(const u of links)assert.equal((await p.request.get(origin+encodeURI(u))).status(),200,u);
 const images=await p.locator('.catalog-card img').evaluateAll(ns=>[...new Set(ns.map(n=>n.getAttribute('src')))]);for(const src of images)assert.equal((await p.request.get(origin+encodeURI(src))).status(),200,src);
 await p.goto(origin+'/?s=지게차');await p.getByRole('heading',{name:/“지게차” 안내글/}).waitFor();assert.ok(await p.locator('.catalog-card:visible').count()>0);
 await p.goto(origin+'/?s=없는검색어987654');assert.equal(await p.locator('.catalog-card:visible').count(),0);assert.ok(await p.locator('#catalog-empty').isVisible());assert.ok(await p.locator('meta[name="robots"]').evaluateAll(ns=>ns.some(n=>n.content.includes('noindex'))));
 await p.goto(origin+'/?s=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');assert.equal(await p.locator('img[onerror]').count(),0);
 await p.goto(origin+'/tools/');assert.equal(await p.locator('#budget-total').innerText(),'339,390원');await p.locator('#budget-compare summary').click();assert.equal(await p.locator('#budget-b-total').innerText(),'281,940원');const dl=p.waitForEvent('download');await p.locator('#budget-export').click();assert.equal(await(await dl).failure(),null);
 assert.equal(await p.locator('link[rel="canonical"]').getAttribute('href'),'https://4050guide.co.kr/tools/');
 const context=await browser.newContext({javaScriptEnabled:false}),fallback=await context.newPage();await fallback.goto(origin+'/');assert.equal(await fallback.locator('.catalog-card:visible').count(),215);await context.close();assert.deepEqual(errors,[]);
 const report={pass:true,origin,articles:215,checkedArticleLinks:links.length,widths:[1440,1280,768,390,320],layout:'4/2/1 columns',filters:5,sorting:true,loadMore:true,search:true,noJsFallback:true,toolsMoved:true,comparisonDownload:true,output};fs.writeFileSync(path.join(root,'reports/catalog-qa'+(remote?'-live':'')+'-20261102.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();server.close()}}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
