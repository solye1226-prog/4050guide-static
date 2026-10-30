const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const core=new Set(require('./focus-editorial-20261030.cjs').map(p=>'/'+p.slug+'/'));
const index=require('../assets/search-index.json');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name==='index.html'?[path.join(dir,e.name)]:[]);
async function run(){const browser=await chromium.launch();try{
 const page=await browser.newPage(),members=new Map();
 for(const file of walk(path.join(root,'category'))){
  const category=path.relative(path.join(root,'category'),file).split(path.sep)[0];
  const links=await page.evaluate(html=>[...new DOMParser().parseFromString(html,'text/html').querySelectorAll('.post-card h2 a')].map(a=>a.getAttribute('href')),fs.readFileSync(file,'utf8'));
  for(const href of links){const u=decodeURI(new URL(href,'https://4050guide.co.kr').pathname);if(!members.has(u))members.set(u,new Set());members.get(u).add(category);}
 }
 const rows=[];
 for(const post of index.posts){
  const url=decodeURI(new URL(post.url,'https://4050guide.co.kr').pathname),file=path.join(root,url,'index.html');
  const details=await page.evaluate(html=>{const doc=new DOMParser().parseFromString(html,'text/html');return {characters:(doc.querySelector('.detail-content')?.textContent||'').replace(/\s/g,'').length,sources:doc.querySelectorAll('.editorial-sources a').length,images:doc.querySelectorAll('main img').length}},fs.readFileSync(file,'utf8'));
  const categories=[...(members.get(url)||[])];
  const bucket=core.has(url)?'대표 글':categories.some(c=>['license','rejob','support'].includes(c))?'직업·훈련 보조 글':'생활·복지 자료실';
  rows.push({url,title:post.title,categories,bucket,...details,flags:[...(details.characters<1200?['본문 길이 추가 검토']:[]),...(details.sources===0?['구조화된 출처 영역 미확인']:[])]});
 }
 const tokens=s=>new Set(s.replace(/[^가-힣a-z0-9 ]/gi,' ').split(/\s+/).filter(t=>t.length>1)),candidates=[];
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=tokens(rows[i].title),b=tokens(rows[j].title),common=[...a].filter(t=>b.has(t));const score=common.length/(new Set([...a,...b]).size||1);if(common.length>=3&&score>=.35)candidates.push({score:Number(score.toFixed(3)),a:rows[i].url,b:rows[j].url,common,status:'제목 유사 후보·본문 비교 후 판단·자동 통합 안 함'});}
 candidates.sort((a,b)=>b.score-a.score);
 const report={checkedAt:'2026-10-30',scope:'구조·카테고리·제목 유사도 점검입니다. 전체 글의 사실 재검증이나 중복 확정 결과가 아닙니다. 원문과 주소는 유지합니다.',counts:rows.reduce((a,r)=>(a[r.bucket]=(a[r.bucket]||0)+1,a),{}),posts:rows,duplicateCandidates:candidates};
 fs.mkdirSync(path.join(root,'reports'),{recursive:true});fs.writeFileSync(path.join(root,'reports/focus-audit-20261030.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:rows.length,counts:report.counts,candidates:candidates.length}));
 }finally{await browser.close();}}
run().catch(e=>{console.error(e);process.exitCode=1});
