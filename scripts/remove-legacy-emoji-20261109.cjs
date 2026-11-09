const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function run(){const browser=await chromium.launch();try{const page=await browser.newPage();
 const urls=await page.evaluate(xml=>[...new DOMParser().parseFromString(xml,'application/xml').getElementsByTagName('loc')].map(n=>n.textContent),fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'));
 let changed=0,removed=0;
 for(const url of urls){let file=path.join(root,decodeURIComponent(new URL(url).pathname));if(!path.extname(file))file=path.join(file,'index.html');const before=fs.readFileSync(file,'utf8');
  // Native emoji rendering does not need WordPress's missing fallback bundle.
  const after=before.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,block=>{if(!/id="wp-emoji-settings"|sourceURL=.*wp-emoji-loader\.min\.js/.test(block))return block;removed++;return ''});
  if(after===before)continue;
  const visible=await page.evaluate(([a,b])=>[a,b].map(html=>{const d=new DOMParser().parseFromString(html,'text/html');d.querySelectorAll('script,style').forEach(n=>n.remove());return {text:d.body.textContent,title:d.title,canonical:d.querySelector('link[rel="canonical"]')?.href,images:[...d.images].map(n=>n.getAttribute('src'))}}),[before,after]);
  assert.deepEqual(visible[0],visible[1],url+' content changed');fs.writeFileSync(file,after);changed++;
 }
 console.log(JSON.stringify({canonicalPages:urls.length,changed,removed,visibleContentUnchanged:true}));
 }finally{await browser.close()}}
run().catch(e=>{console.error(e);process.exitCode=1});
