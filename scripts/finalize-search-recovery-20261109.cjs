const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
async function run(){const b=await chromium.launch();try{const page=await b.newPage(),root=path.resolve(__dirname,'..'),urls=['https://4050guide.co.kr/',...require('./search-recovery-content-20261109.cjs').map(p=>'https://4050guide.co.kr/'+p.slug+'/')];
 const xml=await page.evaluate(({xml,urls})=>{const d=new DOMParser().parseFromString(xml,'application/xml');for(const u of d.getElementsByTagName('url'))if(urls.includes(u.getElementsByTagName('loc')[0]?.textContent)){let n=u.getElementsByTagName('lastmod')[0];if(!n){n=d.createElementNS(d.documentElement.namespaceURI,'lastmod');u.append(n)}n.textContent='2026-11-09'}return new XMLSerializer().serializeToString(d)},{xml:fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),urls});fs.writeFileSync(path.join(root,'sitemap.xml'),xml+'\n');
 }finally{await b.close()}}
run().catch(e=>{console.error(e);process.exitCode=1});
