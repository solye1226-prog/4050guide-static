const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),origin='https://4050guide.co.kr';
async function run(){const browser=await chromium.launch();try{const page=await browser.newPage();
 const urls=await page.evaluate(xml=>[...new DOMParser().parseFromString(xml,'application/xml').getElementsByTagName('loc')].map(n=>n.textContent),fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'));
 const pages=urls.map(url=>{const slug=decodeURIComponent(new URL(url).pathname);let file=path.join(root,slug);if(!path.extname(file))file=path.join(file,'index.html');return {url,html:fs.readFileSync(file,'utf8')}});
 const assets=await page.evaluate(rows=>rows.flatMap(({url,html})=>{const d=new DOMParser().parseFromString(html,'text/html');return [...d.querySelectorAll('link[rel="stylesheet"][href],script[src],img[src]')].map(n=>({page:url,url:new URL(n.getAttribute('href')||n.getAttribute('src'),url).href}))}),pages);
 const missing=assets.filter(a=>{const u=new URL(a.url);return u.origin===origin&&!fs.existsSync(path.join(root,decodeURIComponent(u.pathname)))});
 assert.deepEqual(missing,[],'Missing canonical-page resources: '+JSON.stringify(missing));
 const tools=pages.find(p=>p.url===origin+'/tools/');assert(tools);assert(!/\b(?:href|src)=["']wp-content\//.test(tools.html));
 console.log(JSON.stringify({pass:true,canonicalPages:urls.length,resourceReferences:assets.length,localResources:[...new Set(assets.filter(a=>new URL(a.url).origin===origin).map(a=>new URL(a.url).pathname))].length}));
 }finally{await browser.close()}}
run().catch(e=>{console.error(e);process.exitCode=1});
