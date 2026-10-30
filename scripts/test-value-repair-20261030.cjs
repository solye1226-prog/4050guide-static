const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),data=require('../reports/value-repair-result-20261030.json'),practical=require('./practical-depth-20261030.cjs'),merges=require('./content-merges-20261030.cjs');
const server=http.createServer((req,res)=>{const pathname=decodeURI(new URL(req.url,'http://local').pathname),slug=pathname.split('/')[1];if(merges[slug])return res.writeHead(301,{Location:encodeURI('/'+merges[slug]+'/')}).end();let f=path.resolve(root,'.'+pathname);if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
async function run(){const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=remote||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch(),out=path.resolve(root,'../4050-value-repair-qa'+(remote?'-live':''));fs.mkdirSync(out,{recursive:true});
 try{const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
 const index=await(await p.request.get(origin+'/assets/search-index.json')).json();assert.equal(index.posts.length,215);assert.ok(!index.posts.some(p=>decodeURI(p.url).includes('중장년-일자리-지원센터')));
 for(const suffix of ['/','','/index.html']){const response=await p.request.get(origin+encodeURI('/중장년-일자리-지원센터-찾는-법'+suffix),{maxRedirects:0});assert.equal(response.status(),301);assert.equal(decodeURI(new URL(response.headers().location,origin).pathname),'/중장년-내일센터-이용방법/');}
 const sitemap=await(await p.request.get(origin+'/sitemap.xml')).text();assert.ok(!sitemap.includes('/중장년-일자리-지원센터-찾는-법/'));
 let imageCount=0;
 for(const slug of data.changed){
  for(const width of [1280,390,320]){
   await p.setViewportSize({width,height:900});const response=await p.goto(origin+'/'+encodeURI(slug)+'/');assert.equal(response.status(),200,slug);assert.equal(await p.locator('h1').count(),1);assert.equal(await p.locator('.revision-scope').count(),1);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,slug+' overflow '+width);
   assert.match(await p.locator('.editorial-byline').innerText(),/최근 보완 2026-10-30/);
   if(practical.some(e=>e.slug===slug)){assert.equal(await p.locator('[data-practical-depth]').count(),1);assert.equal(await p.locator('[data-practical-depth] table').count(),1);assert.doesNotMatch(await p.locator('.detail-content').innerText(),/첨부 세부내용 제외|添付|첨부파일을 열어.*확인하지 않았|실제 합격 후기/);}
   if(width===320){const section=p.locator('[data-practical-depth] table,.fact-followup table,[data-value-repair] table').first();if(await section.count())await section.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,slug+'.png')});}
   for(const img of await p.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));if(width===1280)imageCount++;}
  }
 }
 await p.goto(origin+'/산림-조경-관련-자격증-4050-활용도/');const fee=await p.locator('.fact-followup').innerText();for(const value of ['산림기능사','조경기능사','64,200','30,400','78,700','44,900'])assert.ok(fee.includes(value));
 await p.goto(origin+'/전기기능사와-소방안전관리자-비교/');for(const value of ['120,700','12,000','10,000','상장형 무료'])assert.ok((await p.locator('.fact-followup').innerText()).includes(value));
 await p.goto(origin+'/');assert.match(await p.locator('#training-budget').innerText(),/전기기능사 과정 표본 5건/);assert.equal(await p.locator('#public-practice-heading').count(),1);
 for(const g of practical)assert.ok(await p.locator(`main a[href="/${g.slug}/"]`).count());
 for(const slug of data.dateOnly){const html=await(await p.request.get(origin+'/'+encodeURI(slug)+'/')).text();const dates=await p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {byline:d.querySelector('.editorial-byline').textContent,side:d.querySelector('.detail-side').textContent}},html);assert.match(dates.byline,/부분 보완 2026-10-30|최근 보완 2026-10-30|내용 확인 2026-10-30/,slug+' current editor date');assert.match(dates.side,/2026년 10월 30일/,slug+' sidebar date');}
 assert.deepEqual(errors,[]);const report={pass:true,origin,articles:index.posts.length,contentRevisions:data.changed.length,practicalExamples:practical.length,dateLabelUpdates:data.dateOnly.length,widths:[1280,390,320],preservedImages:imageCount,newMergeRedirects:3,output:out};fs.writeFileSync(path.join(root,'reports/value-repair-qa'+(remote?'-live':'')+'-20261030.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();server.close()}}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
