const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function run(){const browser=await chromium.launch();try{
 const page=await browser.newPage(),rows=[];
 for(const post of require('../assets/search-index.json').posts){
  const slug=decodeURI(post.url).split('/').filter(Boolean)[0];
  const parsed=await page.evaluate(html=>{
   const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('.detail-content');
   if(!main)return {error:'No article body'};
   const sources=[...main.querySelectorAll('a[href^="http"]')].map(a=>({label:a.textContent.trim(),url:a.getAttribute('href')}));
   main.querySelectorAll('.editorial-sources,.guide-related-posts,figure,script,style').forEach(n=>n.remove());
   const blocks=[...main.querySelectorAll('h2,h3,p,li,table')].filter(n=>!n.parentElement.closest('table')&&!(n.tagName==='P'&&n.parentElement.closest('li'))).map(n=>({tag:n.tagName,text:n.textContent.replace(/\s+/g,' ').trim()}));
   return {sources,blocks,text:main.textContent.replace(/\s+/g,' ').trim()};
  },fs.readFileSync(path.join(root,slug,'index.html'),'utf8'));
  rows.push({slug,title:post.title,...parsed});
 }
 fs.writeFileSync(path.join(root,'reports/fact-review-input-20261030.json'),JSON.stringify(rows,null,2)+'\n');
 const allSources=new Set(rows.flatMap(r=>r.sources.map(s=>s.url)));
 console.log(JSON.stringify({articles:rows.length,sources:allSources.size,candidateSlugs:new Set(require('../reports/focus-audit-20261030.json').duplicateCandidates.flatMap(p=>[p.a,p.b])).size}));
 const mode=process.argv[2]||'candidates';
 if(mode==='candidates'){
  const ids=new Set(require('../reports/focus-audit-20261030.json').duplicateCandidates.flatMap(p=>[p.a,p.b]).map(u=>u.split('/')[1]));
  for(const r of rows.filter(r=>ids.has(r.slug)))console.log(JSON.stringify(r));
 }
 }finally{await browser.close();}}
run().catch(e=>{console.error(e);process.exitCode=1});
