const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const aliases=require('./search-snapshot-aliases.json');
const report=require('./site-quality-result-20261019.json');
const rules=fs.readFileSync(path.join(root,'_redirects'),'utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>l.trim().split(/\s+/));
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local');
 const rule=rules.find(([from])=>!from.includes('*')&&!from.includes('?')&&decodeURI(from)===decodeURI(url.pathname));
 if(rule)return res.writeHead(Number(rule[2]),{Location:rule[1]}).end();
 let file=path.resolve(root,'.'+decodeURI(url.pathname));
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
  for(const {from,to} of aliases){
   assert.ok(rules.some(([a,b,s])=>decodeURI(a)===from&&decodeURI(b)===decodeURI(to)&&s==='301'),'Missing snapshot rule '+from);
   const response=await page.request.get(origin+encodeURI(from),{maxRedirects:0});
   assert.equal(response.status(),301,from);
   const actual=new URL(response.headers().location,origin),expected=new URL(to,origin);
   assert.equal(decodeURI(actual.pathname),decodeURI(expected.pathname),from);
   assert.equal(actual.searchParams.toString(),expected.searchParams.toString(),from+' query');
  }
  for(const cat of report.categories){
   const urls=[];
   for(let n=1;n<=cat.pages;n++){
    const response=await page.goto(origin+`/category/${cat.category}/`+(n===1?'':`page/${n}/`));assert.equal(response.status(),200);
    urls.push(...await page.locator('.photo-grid > article h2 a').evaluateAll(as=>as.map(a=>decodeURI(new URL(a.href).pathname))));
   }
   assert.equal(urls.length,new Set(urls).size,'Duplicate category article '+cat.category);
   assert.equal(urls.length,cat.unique,'Category membership retained '+cat.category);
  }
  for(const [route,count] of [['/복지서비스-검색/?welfare_q=긴급복지',8],['/국가자격-검색/?license_q=지게차',1]]){
   await page.goto(origin+route);
   await page.getByRole('heading',{name:`저장된 공식 자료 ${count}건`,exact:true}).waitFor();
  }
  await page.goto(origin+'/2026년-상시검정-자격증-14종목/');
  assert.match(await page.locator('.detail-side').innerText(),/국가자격 상시검정/);
  assert.doesNotMatch(await page.locator('.detail-side').innerText(),/HRD-Net|관련 혜택/);
  for(const image of report.images){for(const v of image.versions){assert.ok(v.bytes<image.beforeBytes/4);assert.equal((await page.request.get(origin+v.url)).status(),200);}}
  const output=path.resolve(root,'..','4050-quality-qa-20261019'+(remote?'-live':''));fs.mkdirSync(output,{recursive:true});
  const worksheets=['4050-자격증-로드맵','4050-재취업-자격증-고르는-기준','국비지원-훈련과정-선택-가이드'];
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});
   for(const slug of [...worksheets,'국민내일배움카드-신청방법-2026']){
    await page.goto(origin+'/'+slug+'/');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,slug+' overflow '+width);
    if(worksheets.includes(slug))assert.ok(await page.locator('.detail-content table caption').count()>0,slug+' comparison tool');
    const imgs=await page.locator('article img[src*="/assets/optimized/"]').all();
    for(const img of imgs){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.getAttribute('width'));assert.ok(await img.getAttribute('height'));assert.ok(await img.getAttribute('srcset'));}
    if(slug===worksheets[2]&&width!==320){await page.getByRole('heading',{name:'수강료가 싼 과정과 실제 부담이 적은 과정은 다릅니다',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'comparison-'+width+'.png')});}
   }
  }
  for(const applies of [true,false]){
   const context=await browser.newContext();
   await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
   await context.addInitScript(applies=>{
    window.__privacyOpen=0;
    window.__tcfapi=(name,version,cb)=>cb({gdprApplies:applies},true);
    window.googlefc={callbackQueue:{push(item){item.CONSENT_API_READY?.();}},showRevocationMessage(){window.__privacyOpen++;}};
   },applies);
   const privacy=await context.newPage();await privacy.goto(origin+'/');
   const link=privacy.locator('[data-privacy-settings]');
   assert.equal(await link.isVisible(),applies,'Privacy control region gating');
   if(applies){await link.click();assert.equal(await privacy.evaluate(()=>window.__privacyOpen),1,'Consent reopen invoked');}
   await context.close();
  }
  console.log(JSON.stringify({pass:true,aliases:aliases.length,categories:report.categories.length,optimizedImages:report.images.length,worksheets:worksheets.length,privacy:'EU/non-EU and reopen API verified with controlled test data',screenshots:output}));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
