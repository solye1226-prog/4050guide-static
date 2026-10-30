const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),merges=require('./content-merges-20261030.cjs');
const posts=require('../assets/search-index.json').posts,changed=require('../reports/fact-followup-result-20261030.json').changed;
const rules=fs.readFileSync(path.join(root,'_redirects'),'utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>l.trim().split(/\s+/));
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local'),rule=rules.find(([a])=>!a.includes('*')&&!a.includes('?')&&decodeURI(a)===decodeURI(url.pathname));
 if(rule)return res.writeHead(Number(rule[2]),{Location:rule[1]}).end();
 let file=path.resolve(root,'.'+decodeURI(url.pathname));if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file))return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
async function run(){
 const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=remote||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch();
 try{
  const page=await browser.newPage();await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  assert.equal(posts.length,216);const sitemap=await (await page.request.get(origin+'/sitemap.xml')).text();
  for(const [from,to] of Object.entries(merges)){
   for(const suffix of ['/','','/index.html']){const response=await page.request.get(origin+encodeURI('/'+from+suffix),{maxRedirects:0});assert.equal(response.status(),301,from+suffix);assert.equal(decodeURI(new URL(response.headers().location,origin).pathname),'/'+to+'/');}
   assert.ok(!sitemap.includes('https://4050guide.co.kr/'+from+'/'));assert.ok(sitemap.includes('https://4050guide.co.kr/'+to+'/'));
   assert.ok(!posts.some(p=>decodeURI(p.url)==='/'+from+'/'));
  }
  let checked=0;
  for(const p of posts){
   const slug=decodeURI(p.url).split('/')[1],html=await (await page.request.get(origin+p.url)).text();
   const parsed=await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {title:d.querySelector('h1')?.textContent.trim(),links:[...d.querySelectorAll('main a[href]')].map(a=>a.getAttribute('href')),count:d.querySelectorAll('[data-fact-review="20261030"]').length,fees:d.querySelectorAll('.fact-followup h2').length}},html);
   assert.equal(parsed.title,p.title);for(const href of parsed.links){try{const u=new URL(href,origin);if(u.origin===origin)assert.ok(!merges[decodeURI(u.pathname).split('/')[1]],slug+' links to retired '+href);}catch(e){if(e.code==='ERR_ASSERTION')throw e;}}
   if(changed.includes(slug)){assert.ok(parsed.count>=1,slug+' recheck scope');checked++;}
   assert.ok(!html.includes('edi.work.go.kr'),slug+' old source');
  }
  const output=path.resolve(root,'../4050-fact-followup-qa'+(remote?'-live':''));fs.mkdirSync(output,{recursive:true});
  for(const slug of ['공조냉동기계기능사-4050-공부법','2026년-남은-국가기술자격-시험일정','주거급여-신청조건-2026','내일배움카드-훈련장려금-지급조건','부모님-응급안전안심서비스-신청-확인']){
   for(const width of [1280,390,320]){
    await page.setViewportSize({width,height:900});const response=await page.goto(origin+'/'+slug+'/');assert.equal(response.status(),200);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,slug+' overflow '+width);
    for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));}
    if(slug.startsWith('공조')){await page.locator('.detail-content table').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'table-'+width+'.png')});}
   }
  }
  await page.goto(origin+'/부모님-응급안전안심서비스-신청-확인/');assert.equal(await page.locator('main a[href*="biz.namdong.go.kr"]').count(),0);assert.doesNotMatch(await page.locator('main').innerText(),/실제로 인천 남동구는/);
  await page.goto(origin+'/공조냉동기계기능사-4050-공부법/');assert.equal(await page.getByRole('heading',{name:'공식 시험료와 교육비를 구분합니다',exact:true}).count(),0,'Do not repeat fees already covered by the merged article');
  console.log(JSON.stringify({pass:true,activeArticles:posts.length,mergedUrls:3,checkedModifiedArticles:checked,widths:[1280,390,320],output}));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
