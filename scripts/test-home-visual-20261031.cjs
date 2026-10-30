const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),photos=require('./home-photo-set-20261031.cjs');
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURI(new URL(req.url,'http://local').pathname));if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.json':'application/json'})[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
async function run(){const remote=process.env.TEST_ORIGIN;if(!remote)await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=remote||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch(),output=path.resolve(root,'../4050-home-visual-20261031'+(remote?'-live':''));fs.mkdirSync(output,{recursive:true});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
 for(const width of [1440,1280,768,390,320]){
  await p.setViewportSize({width,height:900});await p.goto(origin+'/');assert.equal(await p.locator('[data-edition="20261031-visual"]').count(),1);
  const frames=[];for(const img of await p.locator('.home-story img').all()){await img.evaluate(i=>i.decode());const box=await img.boundingBox();frames.push(box);assert.ok((await img.getAttribute('src')).startsWith('/assets/home-photos/'));assert.ok(await img.evaluate(i=>i.naturalWidth>0));assert.ok(Math.abs(box.width/box.height-1.6)<.02,'Consistent 16:10 frames');}
  assert.equal(frames.length,3);assert.ok(frames[0].y<900,'Photo visible in first viewport');assert.ok(await p.locator('.home-photo-disclosure').isVisible());assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.ok(await p.locator('.home-picks').evaluate(n=>n.compareDocumentPosition(document.querySelector('.home-start'))&Node.DOCUMENT_POSITION_FOLLOWING));
  for(const h of await p.locator('.home-story h3').all()){const box=await h.boundingBox(),parent=await h.locator('..').boundingBox();assert.ok(box.x>=parent.x-1&&box.x+box.width<=parent.x+parent.width+1);}
  await p.screenshot({path:path.join(output,'home-'+width+'.png'),fullPage:true});await p.screenshot({path:path.join(output,'first-'+width+'.png')});
 }
 for(const photo of photos){await p.goto(origin+'/'+photo.slug+'/');const img=p.locator('.detail-hero-image img');assert.ok((await img.getAttribute('src')).includes(photo.id+'-20261031'));await img.evaluate(i=>i.decode());assert.match(await p.locator('.detail-hero-image figcaption').innerText(),/AI 제작/);assert.ok((await p.locator('meta[property="og:image"]').getAttribute('content')).includes(photo.id+'-20261031'));}
 assert.deepEqual(errors,[]);const report={pass:true,origin,widths:[1440,1280,768,390,320],coherentPhotos:3,photoFrames:'16:10',visibleInFirstViewport:true,articleCoversSynced:true,output};fs.writeFileSync(path.join(root,'reports/home-visual-qa'+(remote?'-live':'')+'-20261031.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();server.close()}}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
