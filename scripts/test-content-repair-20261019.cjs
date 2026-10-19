const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const repairs=require('./content-repair-20261019.cjs');
const merges=require('./content-merges-20261019.cjs');
const original=require('node:child_process').execFileSync('git',['show','f30e1fb:assets/search-index.json'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
const originalPosts=JSON.parse(original).posts;
const current=require('../assets/search-index.json').posts;
const remote=process.env.TEST_ORIGIN;
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURI(new URL(req.url,'http://localhost').pathname);}catch{return res.writeHead(400).end();}
 const parts=pathname.split('/').filter(Boolean);
 if(merges[parts[0]]&&parts.length<=2)return res.writeHead(301,{Location:encodeURI('/'+merges[parts[0]]+'/')}).end();
 let file=path.resolve(root,'.'+pathname);
 if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file))return res.writeHead(404).end();
 const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css','.xml':'application/xml','.webp':'image/webp','.png':'image/png'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
async function run(){
 const redirectRules=fs.readFileSync(path.join(root,'_redirects'),'utf8').split(/\r?\n/).filter(line=>line.trim()&&!line.startsWith('#')).map(line=>line.trim().split(/\s+/));
 for(const [from,to] of Object.entries(merges))for(const suffix of ['/','','/index.html']){
  assert.ok(redirectRules.some(([source,target,status])=>decodeURI(source)==='/'+from+suffix&&decodeURI(target)==='/'+to+'/'&&status==='301'),'Missing deployed redirect rule '+from+suffix);
 }
 assert.equal(originalPosts.length,220);
 assert.equal(current.length,220-Object.keys(merges).length);
 const urls=new Set(current.map(p=>decodeURI(p.url)));
 for(const old of originalPosts){const slug=decodeURI(old.url).slice(1,-1);assert.ok(urls.has('/'+(merges[slug]||slug)+'/'),'Original article retained or merged '+slug);}
 for(const from of Object.keys(merges))assert.ok(!urls.has('/'+from+'/'));
 const sourceText=repairs.filter(p=>require('./cert4-posts-20261008.cjs').some(o=>o.slug===p.slug)).map(p=>p.body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' '));
 const seen=new Map();for(const text of sourceText)for(const sentence of new Set(text.split(/(?<=[.!?])\s+/).filter(s=>s.length>=30)))seen.set(sentence,(seen.get(sentence)||0)+1);
 const repeated=sourceText.map(text=>text.split(/(?<=[.!?])\s+/).filter(s=>s.length>=30&&seen.get(s)>=10).reduce((n,s)=>n+s.length,0)/text.length);
 assert.ok(Math.max(...repeated)<0.2,'Latest twenty have limited repeated long sentences');
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 for(const post of current){const slug=decodeURI(post.url).slice(1,-1);const html=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');assert.ok(!html.includes('guide4050-depth-expand'),'No old padding '+slug);assert.ok(!html.includes('4050_SHORT_UPLIFT_START'),'No uplift padding '+slug);assert.ok(sitemap.includes('https://4050guide.co.kr/'+slug+'/'),'Sitemap '+slug);}
 for(const slug of Object.keys(merges))assert.ok(!sitemap.includes('https://4050guide.co.kr/'+slug+'/'));
 if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=remote||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [from,to] of Object.entries(merges)){
   for(const suffix of ['/','','/index.html']){
    const r=await page.request.get(origin+'/'+from+suffix,{maxRedirects:0});
    assert.equal(r.status(),301,'Permanent merge redirect '+from+suffix);
    assert.equal(decodeURI(new URL(r.headers().location,origin).pathname),'/'+to+'/');
   }
  }
  const internal=new Set();
  for(const post of current){
   const slug=decodeURI(post.url).slice(1,-1),r=await page.goto(origin+'/'+slug+'/');
   assert.equal(r.status(),200,slug);
   assert.equal(await page.locator('h1').count(),1,slug+' single title');
   assert.equal(await page.locator('h1').innerText(),post.title);
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://4050guide.co.kr/'+slug+'/');
   assert.equal(await page.locator('meta[name=robots]').evaluateAll(es=>es.some(e=>/noindex/i.test(e.content))),false,slug);
   for(const href of await page.locator('a[href^="/"]').evaluateAll(as=>as.map(a=>a.getAttribute('href'))))internal.add(href);
  }
  for(const href of internal){const slug=decodeURI(href).split('/').filter(Boolean)[0];assert.ok(!merges[slug],'No obsolete internal link '+href);const r=await page.request.get(origin+href);assert.equal(r.status(),200,'Internal route '+href);}
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});
   for(const post of repairs){
    await page.goto(origin+'/'+post.slug+'/');
    assert.equal(await page.locator('h1').innerText(),post.title);
    assert.equal(await page.locator('.detail-content h3').count(),post.faq.length,post.slug+' FAQ');
    assert.ok(await page.locator('.detail-content table').count()>0,post.slug+' useful table');
    await page.locator('.detail-hero-image img').evaluate(img=>img.decode());
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,post.slug+' overflow '+width);
    const main=await page.locator('.detail-main').boundingBox(),side=await page.locator('.detail-side').boundingBox();
    assert.ok(width===1280?side.x>=main.x+main.width-1:side.y>=main.y+main.height-1,post.slug+' sidebar '+width);
    const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(ss=>ss.map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='BlogPosting'));
    assert.equal(schema.dateModified,'2026-10-19');
    if(post.publishedAt)assert.equal(schema.datePublished,post.publishedAt);
    assert.ok(await page.locator('.editorial-sources a').count()>0);
   }
   await page.goto(origin+'/');assert.equal(await page.locator('.home-recent-list li').count(),10);assert.ok((await page.locator('.home-recent').innerText()).includes('2026.10.19'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  const liveIndex=await page.request.get(origin+'/assets/search-index.json').then(r=>r.json());assert.equal(liveIndex.posts.length,current.length);
  const nojs=await browser.newContext({javaScriptEnabled:false});
  const staticPage=await nojs.newPage();
  for(const slug of ['제과기능사-실기-연습-재료비','국민연금-조기수령-전-확인할-것','장기요양등급-신청-전-확인할-것']){
   await staticPage.goto(origin+'/'+slug+'/');assert.equal(await staticPage.locator('.detail-content h3').count(),3);assert.ok((await staticPage.locator('.detail-content').innerText()).length>500);
  }
  await nojs.close();
  const liveMap=await page.request.get(origin+'/sitemap.xml').then(r=>r.text());for(const post of repairs)assert.ok(liveMap.includes('/'+post.slug+'/'));
  const out=path.resolve(root,'..','content-repair-qa-20261019'+(remote?'-live':''));fs.mkdirSync(out,{recursive:true});
  for(const width of [1280,390]){await page.setViewportSize({width,height:900});for(const [name,url] of [['home','/'],['cost','/제과기능사-실기-연습-재료비/'],['training','/4050-국민내일배움카드-자비부담금-확인법/']]){await page.goto(origin+url);await page.screenshot({path:path.join(out,name+'-'+width+'.png'),fullPage:true});}}
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({pass:true,original:220,active:current.length,merged:Object.keys(merges).length,rewritten:repairs.length,latest20RepeatedLongSentenceShare:{min:Math.min(...repeated),max:Math.max(...repeated)},viewports:[1280,390,320],screenshots:out}));
 }finally{await browser.close();if(!remote)await new Promise(r=>server.close(r));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
