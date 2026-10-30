const fs=require('node:fs');
const dir='D:/AI-WORK/4050-source-evidence-20261030/';
const sources=[...JSON.parse(fs.readFileSync(dir+'clean.json','utf8')),...JSON.parse(fs.readFileSync(dir+'rendered.json','utf8'))];
const pattern=new RegExp(process.argv[2]),term=new RegExp(process.argv[3]||'지원대상|수수료|대상|신청');
for(const p of sources.filter(s=>pattern.test(s.url))){const m=term.exec(p.text||'');console.log(p.url+' HTTP '+p.status+'\n'+(m?p.text.slice(Math.max(0,m.index-80),m.index+Number(process.argv[4]||1600)):'NO MATCH'));}
