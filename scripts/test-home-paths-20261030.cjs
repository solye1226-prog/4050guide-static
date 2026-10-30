const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'})[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});
async function run(){
 const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=remote||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch();
 const out=path.resolve(root,'../4050-home-paths-qa'+(remote?'-live':''));fs.mkdirSync(out,{recursive:true});
 try{
  const p=await browser.newPage({acceptDownloads:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  for(const width of [1440,1280,390,320]){
   await p.setViewportSize({width,height:900});await p.goto(origin+'/');
   assert.equal(await p.getByRole('tab').count(),3);assert.equal(await p.locator('[data-stage-panel]:visible').count(),1);
   await p.getByRole('tab',{name:'자격증 선택',exact:true}).focus();await p.keyboard.press('ArrowRight');assert.equal(await p.getByRole('tab',{name:'교육 등록 전',exact:true}).getAttribute('aria-selected'),'true');assert.equal(await p.locator('#path-course').isVisible(),true);
   await p.keyboard.press('End');assert.equal(await p.locator('#path-study').isVisible(),true);await p.keyboard.press('Home');assert.equal(await p.locator('#path-choice').isVisible(),true);
   assert.equal(await p.locator('#job-details').getAttribute('open'),null);assert.equal(await p.locator('.focus-jobs tbody tr:visible').count(),0);
   await p.locator('.home-popular a[href="#job-samples"]').click();assert.equal(await p.locator('.focus-jobs tbody tr:visible').count(),10);await p.locator('#job-details > summary').click();
   await p.locator('#budget-compare > summary').click();assert.equal(await p.locator('#budget-b-total').innerText(),'281,940원');assert.match(await p.locator('#budget-difference').innerText(),/B안.*57,450원/);assert.match(await p.locator('#budget-threshold').innerText(),/1,581원/);
   await p.fill('#budget-travel','0');await p.fill('#budget-b-travel','0');assert.match(await p.locator('#budget-difference').innerText(),/A안.*20,550원/);
   await p.fill('#budget-b-days','23');assert.match(await p.locator('#budget-threshold').innerText(),/통학일수가 같아/);
   await p.fill('#budget-b-tuition','201390');assert.equal(await p.locator('#budget-difference').innerText(),'두 안의 단순 합계가 같습니다.');
   await p.fill('#budget-b-days','10');await p.fill('#budget-b-tuition','0');assert.match(await p.locator('#budget-threshold').innerText(),/교차점이 없습니다/);
   await p.fill('#budget-b-travel','1');assert.match(await p.locator('#budget-threshold').innerText(),/서로 달라/);
   for(const bad of ['', '-1','1.5','1000000001']){await p.fill('#budget-b-tuition',bad);assert.equal(await p.locator('#budget-export').isDisabled(),true);assert.equal(await p.locator('#budget-b-total').innerText(),'계산 대기');}
   await p.reload();await p.locator('#budget-compare > summary').click();await p.selectOption('#budget-b-course','T04');assert.match(await p.locator('#budget-b-source').getAttribute('href'),/ACG/);assert.equal(await p.locator('#budget-b-total').innerText(),'101,580원');await p.selectOption('#budget-b-course','T02');
   const downloadPromise=p.waitForEvent('download');await p.locator('#budget-export').click();const file=await downloadPromise;assert.equal(await file.failure(),null);await file.saveAs(path.join(out,'comparison-'+width+'.csv'));const csv=fs.readFileSync(path.join(out,'comparison-'+width+'.csv'),'utf8');assert.match(csv,/"합계","339390","281940"/);assert.match(csv,/"A안 합계 - B안 합계","57450"/);assert.match(csv,/선택 표본/);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width);
   await p.locator('#budget-compare').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'compare-'+width+'.png')});
   await p.locator('#budget-compare > summary').click();await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'home-'+width+'.png')});await p.screenshot({path:path.join(out,'full-'+width+'.png'),fullPage:true});
   for(const image of await p.locator('.home-story img').all()){await image.evaluate(n=>n.decode());assert.ok(await image.evaluate(n=>n.naturalWidth));}
  }
  const links=await p.locator('main a[href^="/"]').evaluateAll(ns=>[...new Set(ns.map(n=>n.getAttribute('href')))]);for(const u of links)assert.equal((await p.request.get(origin+u)).status(),200,u);
  const nojs=await browser.newContext({javaScriptEnabled:false}),fallback=await nojs.newPage();await fallback.goto(origin+'/');assert.equal(await fallback.locator('[data-stage-panel]:visible').count(),3);await fallback.locator('#job-details > summary').click();assert.equal(await fallback.locator('.focus-jobs tbody tr:visible').count(),10);await fallback.locator('#budget-compare > summary').click();assert.match(await fallback.locator('#budget-compare noscript').innerText(),/281,940/);await nojs.close();
  assert.deepEqual(errors,[]);const result={pass:true,origin,widths:[1440,1280,390,320],stagePaths:3,comparisonDownloads:4,checkedLinks:links.length,keyboardTabs:true,noJsFallback:true,output:out};fs.writeFileSync(path.join(root,'reports/home-paths-qa'+(remote?'-live':'')+'-20261030.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
