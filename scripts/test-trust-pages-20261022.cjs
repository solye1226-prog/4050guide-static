const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const {isDisclosure}=require('./privacy-disclosure.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));
 if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file))return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
function allHtml(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
 if(e.name.startsWith('.')||e.name==='scripts')return [];
 const file=path.join(dir,e.name);return e.isDirectory()?allHtml(file):e.name.endsWith('.html')?[file]:[];
});}
async function run(){
 const remote=process.env.TEST_ORIGIN;
 if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  let policyCopies=0,footerCopies=0;
  for(const file of allHtml(root)){
   const html=fs.readFileSync(file,'utf8');
   if(html.includes('<footer')){footerCopies++;assert.match(html,/민간 정보 사이트/);assert.ok(html.includes('footer-contact'));assert.ok(html.includes('/assets/footer.css'));}
   if(isDisclosure(html)){policyCopies++;assert.doesNotMatch(html,/<script\b/i,file+' must remain script free');assert.doesNotMatch(html,/data-privacy-settings/);}
  }
  assert.equal(policyCopies,3);
  const out=path.resolve(root,'..','4050-trust-qa-20261022'+(remote?'-live':''));fs.mkdirSync(out,{recursive:true});
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});
   for(const slug of ['','소개','문의','개인정보처리방침','이용약관','정보-출처-및-면책-안내']){
    const response=await page.goto(origin+'/'+(slug?slug+'/':''));assert.equal(response.status(),200,slug);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,slug+' overflow '+width);
    assert.equal(await page.locator('footer .footer-contact').getAttribute('href'),'mailto:solye1226@gmail.com');
    assert.match(await page.locator('footer').innerText(),/정부기관의 공식 사이트가 아닙니다/);
    for(const name of ['소개','문의','개인정보처리방침','이용약관','정보 출처 및 면책 안내'])assert.equal(await page.locator('footer').getByRole('link',{name,exact:true}).count(),1);
    const ad=page.locator('script[src*="adsbygoogle.js"]');
    if(slug==='개인정보처리방침'){
     assert.equal(await ad.count(),0);assert.equal(await page.locator('script[src*="privacy.js"]').count(),0);
     assert.equal(await page.locator('a[data-privacy-settings]').count(),0);
     assert.ok((await page.locator('main').innerText()).includes('광고 코드와 동의 메시지를 불러오는 코드를 사용하지 않습니다'));
     assert.equal(await page.locator('#advertising-consent').count(),1);
     assert.equal(await page.locator('footer').getByRole('link',{name:'광고 동의 안내'}).getAttribute('href'),'/개인정보처리방침/#advertising-consent');
    }else assert.equal(await ad.count(),1,'AdSense retained on general content '+slug);
    if(slug==='소개'){
     const text=await page.locator('main').innerText();assert.match(text,/개인 운영자/);assert.match(text,/자료를 대조/);
     assert.equal(await page.locator('main a[href="/국비지원-훈련과정-선택-가이드/"]').count(),1);
     for(const href of await page.locator('main a[href^="/"]').evaluateAll(as=>as.map(a=>a.getAttribute('href'))))assert.equal((await page.request.get(origin+href)).status(),200);
    }
    if(slug==='이용약관'){const text=await page.locator('main').innerText();assert.match(text,/실시간 조회/);assert.match(text,/저장된 공개 자료/);assert.doesNotMatch(text,/공공데이터 API 기반 검색/);}
    if(width!==320&&['','소개','개인정보처리방침'].includes(slug)){
     await page.locator('footer').screenshot({path:path.join(out,(slug||'home')+'-footer-'+width+'.png')});
     if(slug==='소개'){await page.locator('main').screenshot({path:path.join(out,'about-'+width+'.png')});}
    }
   }
  }
  // Run without blocking third-party requests: the disclosure itself must not request ads/CMP.
  const policy=await browser.newPage();const adRequests=[];
  policy.on('request',r=>{if(/googlesyndication|doubleclick|fundingchoices|googleads/.test(r.url()))adRequests.push(r.url());});
  await policy.goto(origin+'/개인정보처리방침/?fc=alwaysshow&fctype=gdpr');
  await policy.waitForLoadState('networkidle');
  assert.deepEqual(adRequests,[],'Disclosure made advertising or CMP requests');
  assert.equal(await policy.getByRole('button',{name:'Consent',exact:true}).count(),0);
  const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();await staticPage.goto(origin+'/개인정보처리방침/');assert.match(await staticPage.locator('main').innerText(),/광고 동의와 선택 변경/);await nojs.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({pass:true,footerCopies,scriptFreePolicyCopies:policyCopies,widths:[1280,390,320],liveDisclosureAdRequests:adRequests.length,screenshots:out}));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
