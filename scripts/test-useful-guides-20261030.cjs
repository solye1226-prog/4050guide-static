const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),guides=require('./useful-guides-20261030.cjs');
const {applyAdPolicy,searchPaths}=require('./search-ad-policy.cjs');
const server=http.createServer((req,res)=>{
 let f=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));
 if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f))return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.csv':'text/csv; charset=utf-8','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);
});
const adRequest=url=>/googlesyndication|doubleclick|fundingchoices|googleads/.test(url);
async function run(){
 const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch();
 const screenshots=path.resolve(root,'../4050-useful-guides-qa'+(remote?'-live':''));fs.mkdirSync(screenshots,{recursive:true});
 try{
  const page=await browser.newPage({acceptDownloads:true}),errors=[],adRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(adRequest(r.url()))adRequests.push(r.url());});
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  for(const g of guides){
   const before=execFileSync('git',['show',`95a4e52:${g.slug}/index.html`],{cwd:root,encoding:'utf8',maxBuffer:2e6});
   const old=await page.evaluate(h=>{const d=new DOMParser().parseFromString(h,'text/html');return {images:[...d.querySelectorAll('main img')].map(n=>n.getAttribute('src')),published:[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)).find(n=>n['@type']==='BlogPosting')?.datePublished};},before);
   for(const width of [1280,390,320]){
    await page.setViewportSize({width,height:900});const response=await page.goto(origin+'/'+g.slug+'/');assert.equal(response.status(),200,g.slug);
    assert.equal(await page.locator('h1').innerText(),g.title);assert.equal(await page.locator('link[rel=canonical]').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,g.slug+' overflow '+width);
    const content=await page.locator('.detail-content').innerText();assert.ok(content.length>1800,g.slug+' actionable body');
    assert.equal(await page.locator('.guide-worksheet').count(),1);assert.equal(await page.locator('.worksheet-download').count(),1);
    assert.deepEqual(await page.locator('main img').evaluateAll(ns=>ns.map(n=>n.getAttribute('src'))),old.images);
    const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(ns=>ns.map(n=>JSON.parse(n.textContent)).find(n=>n['@type']==='BlogPosting'));
    assert.equal(schema.datePublished,old.published);assert.equal(schema.dateModified,'2026-10-30');
    for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(n=>n.decode());assert.ok(await img.evaluate(n=>n.naturalWidth));}
    await page.locator('.guide-worksheet').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,g.worksheet.id+'-'+width+'.png')});
   }
   const file=await page.request.get(origin+'/assets/worksheets/'+g.worksheet.id+'.csv');assert.equal(file.status(),200);const bytes=await file.body();assert.deepEqual([...bytes.subarray(0,3)],[239,187,191]);assert.ok(bytes.toString('utf8').includes(g.worksheet.headers.map(s=>'"'+s+'"').join(',')));
   const downloadPromise=page.waitForEvent('download');await page.locator('.worksheet-download').click();const download=await downloadPromise;assert.equal(await download.failure(),null);assert.equal(download.suggestedFilename(),g.worksheet.id+'.csv');
   for(const href of await page.locator('.guide-related-posts a').evaluateAll(ns=>ns.map(n=>n.getAttribute('href'))))assert.equal((await page.request.get(origin+href)).status(),200);
  }
  for(const route of ['/?s=','/?s=없는검색어zzzz','/?s=지게차',...Array.from(searchPaths).flatMap(p=>[p,p+'?'+({'/국가자격-검색/':'license_q','/복지서비스-검색/':'welfare_q','/공공혜택-검색/':'benefit_q'}[p])+'=없는검색어zzzz']),'/개인정보처리방침/']){
   adRequests.length=0;await page.goto(origin+route);await page.waitForTimeout(400);assert.deepEqual(adRequests,[],route+' must not request ads/CMP');assert.equal(await page.locator('script[src*="adsbygoogle.js"]').count(),0);
   if(route.includes('?'))assert.ok((await page.locator('meta[name="robots"]').evaluateAll(ns=>ns.map(n=>n.content))).some(s=>s.includes('noindex')),route+' noindex');
  }
  await page.goto(origin+'/');assert.equal(await page.locator('meta[name="google-adsense-account"]').getAttribute('content'),'ca-pub-2258793659580551');assert.equal(await page.locator('script[src*="adsbygoogle.js"]').count(),1,'normal home keeps AdSense');
  assert.equal(await page.locator('#practice-heading').innerText(),'막히는 단계부터 다시 준비하기');
  await page.evaluate(()=>localStorage.clear());await page.fill('#budget-extra','71234');await page.locator('#job-details > summary').click();await page.check('#job-entry');assert.equal(await page.evaluate(()=>localStorage.length),0);await page.reload();assert.equal(await page.inputValue('#budget-extra'),'0');assert.equal(await page.isChecked('#job-entry'),false);
  await page.goto(origin+'/개인정보처리방침/');const policy=await page.locator('main').innerText();assert.doesNotMatch(policy,/체크 초기화|다시 방문할 때 상태가 유지/);assert.match(policy,/브라우저 메모리/);assert.match(policy,/검색어는 검색 결과 URL에 포함/);assert.match(policy,/CSV 기록표/);assert.match(policy,/Web Analytics/);
  const policyScripts=await page.locator('script').evaluateAll(ns=>ns.map(n=>n.getAttribute('src')));
  // The CDN may inject its disclosed analytics beacon after serving script-free HTML.
  for(const src of policyScripts){assert.ok(src,'no inline policy scripts');const u=new URL(src,origin);assert.equal(u.hostname,'static.cloudflareinsights.com');assert.match(u.pathname,/^\/beacon\.min\.js(?:\/|$)/);}
  const nojs=await browser.newContext({javaScriptEnabled:false});const policyNoJs=await nojs.newPage();await policyNoJs.goto(origin+'/개인정보처리방침/');assert.match(await policyNoJs.locator('main').innerText(),/solye1226@gmail.com/);assert.equal(await policyNoJs.locator('main a[href="mailto:solye1226@gmail.com"]').count(),1);await nojs.close();
  for(const slug of searchPaths){const r=await page.request.get(origin+slug);const h=await r.text();assert.ok(h.includes('data-search-editorial="20261030"'));assert.equal(applyAdPolicy(h),h,'ad policy idempotence');}
  assert.deepEqual(errors,[]);
  const result={pass:true,origin,guides:guides.length,csvDownloads:8,widths:[1280,390,320],adFreeSearchAndPolicyRoutes:10,homeAdsRetained:true,calculatorMemoryOnly:true,disclosedCdnPolicyBeacons:policyScripts.length,screenshots};
  fs.writeFileSync(path.join(root,'reports/useful-guides-qa'+(remote?'-live':'')+'-20261030.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
