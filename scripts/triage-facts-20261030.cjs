const fs=require('node:fs'),path=require('node:path');
const input=require('../reports/fact-review-input-20261030.json');
const primary=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../4050-source-evidence-20261030/clean.json'),'utf8'));
const sourceMap=new Map(primary.map(s=>[s.url,s]));
const normalize=s=>s.replaceAll(',','').replace(/\s/g,'');
const records=input.map(p=>{
 const sources=p.sources.map(s=>({...s,...sourceMap.get(s.url)}));
 const qnet=sources.filter(s=>/jmCd=/.test(s.url)&&s.text?.includes('수수료'));
 const allText=sources.map(s=>s.text||'').join(' '),sourceNormalized=normalize(allText);
 const blocks=p.blocks.filter(b=>!['H2','H3'].includes(b.tag)&&!/가상|예시|임의|계산 예|예산표/.test(b.text));
 const amounts=blocks.flatMap(b=>[...b.text.matchAll(/\d[\d,]*(?:\.\d+)?\s*(?:만원|억원|원|%|개월)/g)].map(m=>({amount:m[0],context:b.text.slice(Math.max(0,m.index-40),m.index+m[0].length+60)})));
 const mismatches=amounts.filter(a=>!sourceNormalized.includes(normalize(a.amount)));
 return {slug:p.slug,title:p.title,sourceCount:sources.length,unavailable:sources.filter(s=>s.error||s.status!==200||!s.text||/오류가 발생|페이지를 찾을 수|접근이 제한/.test(s.text.slice(0,400))).map(s=>({url:s.url,error:s.error,status:s.status})),qnet:qnet.map(s=>({url:s.url,fees:s.text.match(/안내표 (?:필기 실기|실기) (?:[\d,]+원\s*){1,2}/)?.[0],exam:s.text.match(/취득방법.{0,550}/)?.[0]})),unmatchedAmounts:mismatches,status:'기계적 탐지 결과·금액 불일치는 오류 확정 아님·수동 맥락 확인 필요'};
});
fs.writeFileSync(path.resolve(__dirname,'../reports/fact-triage-20261030.json'),JSON.stringify(records,null,2)+'\n');
if(process.argv[2]==='amounts')console.log(JSON.stringify(records.filter(r=>r.unmatchedAmounts.length).map(r=>({slug:r.slug,unmatched:r.unmatchedAmounts})),null,2));
else if(process.argv[2]==='qnet')console.log(JSON.stringify(records.filter(r=>r.qnet.length).map(r=>({slug:r.slug,source:r.qnet})),null,2));
else console.log(JSON.stringify({total:records.length,qnetArticles:records.filter(r=>r.qnet.length).length,sourceProblems:records.filter(r=>r.unavailable.length).map(r=>({slug:r.slug,unavailable:r.unavailable})),amountFlags:records.filter(r=>r.unmatchedAmounts.length).length},null,2));
