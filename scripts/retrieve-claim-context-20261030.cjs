const fs=require('node:fs'),path=require('node:path');
const input=require('../reports/fact-review-input-20261030.json');
const dir=path.resolve(__dirname,'../../4050-source-evidence-20261030');
const sources=new Map([...JSON.parse(fs.readFileSync(path.join(dir,'clean.json'),'utf8')),...JSON.parse(fs.readFileSync(path.join(dir,'rendered.json'),'utf8'))].map(s=>[s.url,s]));
const pending=new Set(require('../reports/fact-followup-result-20261030.json').articles.filter(p=>p.status.includes('미완료')).map(p=>p.slug));
const stop=new Set(['확인','안내','경우','해당','있습니다','합니다','따라','필요','대한','아니라','현재','같은','위한','본인','구분','별도','사람','통해','기간','먼저','공식','이상','이하']);
const words=s=>[...new Set(s.replace(/[^가-힣0-9 ]/g,' ').split(/\s+/).filter(s=>s.length>1&&!stop.has(s)))];
const records=[];
for(const post of input.filter(p=>pending.has(p.slug))){
 const claims=post.blocks.filter(b=>b.tag==='P'&&/공단은|고용24는|고용24의|국세청은|공식.+안내|법령은|제\d+조|공단.+안내|국민연금.+안내|시행규칙|국시원|Q-Net|공단의|법제처|기준은|대상은|공식.+기준/.test(b.text)&&!/가상|예시|권장|제안|확인한 공식 안내|자료의 범위/.test(b.text)).slice(0,1);
 const matching=[];
 for(const claim of claims){
  const tokens=words(claim.text),options=[];
  for(const link of post.sources){const record=sources.get(link.url);if(!record?.text||record.status!==200)continue;const text=record.text;
   for(let i=0;i<text.length;i+=140){const excerpt=text.slice(i,i+330);const score=tokens.filter(t=>excerpt.includes(t)).length;if(score>=3)options.push({url:link.url,excerpt,score});}
  }
  options.sort((a,b)=>b.score-a.score);matching.push({claim:claim.text,source:options[0]||null});
 }
 records.push({slug:post.slug,matching});
}
fs.writeFileSync(path.join(dir,'claim-context.json'),JSON.stringify(records,null,2));
const start=Number(process.argv[2]||0),count=Number(process.argv[3]||20);
for(const r of records.slice(start,start+count))console.log(JSON.stringify({slug:r.slug,matching:r.matching.map(m=>({claim:m.claim.slice(0,200),proof:m.source?.excerpt.slice(0,250)||null,source:m.source?.url}))}));
