const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),posts=require('../assets/search-index.json').posts;
function grams(s){s=s.replace(/\s+/g,'').replace(/[^가-힣a-zA-Z0-9]/g,'');const out=new Set();for(let i=0;i<s.length-4;i++)out.add(s.slice(i,i+5));return out;}
async function run(){
 const browser=await chromium.launch(),page=await browser.newPage();
 try{
  const rows=[];
  for(const post of posts){
   const html=fs.readFileSync(path.join(root,decodeURI(post.url),'index.html'),'utf8');
   const row=await page.evaluate(({html,url})=>{
    const d=new DOMParser().parseFromString(html,'text/html'),b=d.querySelector('.detail-content');
    const text=n=>n?.textContent.replace(/\s+/g,' ').trim()||'';
    const full=text(b),c=b.cloneNode(true);
    c.querySelectorAll('script,style,.editorial-sources,.guide-related-posts,.guide-reading-path,.decision-worksheet,.guide-worksheet').forEach(n=>n.remove());
    const headings=[...b.querySelectorAll('h2,h3')].map(text);
    const links=[...b.querySelectorAll('a[href]')].map(a=>({text:text(a),url:a.getAttribute('href')}));
    const external=links.filter(a=>a.url.startsWith('https:')&&!a.url.includes('4050guide.co.kr'));
    const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(n=>{try{return JSON.parse(n.textContent)}catch{return []}});
    return {url,title:text(d.querySelector('h1')),intro:text(d.querySelector('.detail-title>p')),fullCharacters:full.length,bodyCharacters:text(c).length,body:text(c),headings,paragraphs:[...c.querySelectorAll('p')].map(text).filter(t=>t.length>=50),external,internal:links.filter(a=>a.url.startsWith('/')),images:[...d.querySelectorAll('main img')].map(a=>({src:a.getAttribute('src'),alt:a.alt})),tables:b.querySelectorAll('table').length,download:links.filter(a=>/\.csv|\.pdf|\.xlsx/.test(a.url)),published:schemas.find(s=>s['@type']==='BlogPosting')?.datePublished,modified:schemas.find(s=>s['@type']==='BlogPosting')?.dateModified};
   },{html,url:decodeURI(post.url)});
   rows.push(row);
  }
  const freq=new Map();for(const r of rows)for(const t of new Set(r.paragraphs)){if(!freq.has(t))freq.set(t,[]);freq.get(t).push(r.url);}
  const repeated=[...freq].filter(([t,urls])=>urls.length>=3).map(([text,urls])=>({text,count:urls.length,urls})).sort((a,b)=>b.count-a.count);
  const sets=rows.map(r=>grams(r.body)),pairs=[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
   let intersect=0;for(const g of sets[i])if(sets[j].has(g))intersect++;
   const containment=intersect/Math.min(sets[i].size,sets[j].size),jaccard=intersect/(sets[i].size+sets[j].size-intersect);
   if(containment>=.22)pairs.push({a:rows[i].url,b:rows[j].url,aTitle:rows[i].title,bTitle:rows[j].title,containment:+containment.toFixed(3),jaccard:+jaccard.toFixed(3)});
  }
  pairs.sort((a,b)=>b.containment-a.containment);
  const live=[];let cursor=0;
  async function worker(){while(cursor<rows.length){const r=rows[cursor++];try{const response=await fetch('https://4050guide.co.kr'+encodeURI(r.url));const html=await response.text();live.push({url:r.url,status:response.status,hasTitle:html.includes(r.title),bodyMatch:html.includes(r.intro),canonical:html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1]});}catch(e){live.push({url:r.url,error:String(e)})}}}
  for(let i=0;i<5;i++)await worker();
  const report={checkedAt:'2026-10-30',scope:'216 active article HTML bodies inspected structurally; similarity is a screening heuristic, not a duplication or AdSense verdict. Live status/title/intro checked; not every factual claim or external source reverified.',count:rows.length,repeated,pairs,live,articles:rows.map(({paragraphs,...r})=>r)};
  const dest=path.resolve(root,'../4050-value-audit-20261030.json');fs.writeFileSync(dest,JSON.stringify(report,null,2));
  console.log(JSON.stringify({report:dest,count:rows.length,liveProblems:live.filter(r=>r.status!==200||!r.hasTitle||!r.bodyMatch),shortest:rows.slice().sort((a,b)=>a.bodyCharacters-b.bodyCharacters).slice(0,25).map(r=>({url:r.url,title:r.title,chars:r.bodyCharacters,sources:r.external.length})),repeated:repeated.slice(0,12),pairs:pairs.slice(0,22)},null,2));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
