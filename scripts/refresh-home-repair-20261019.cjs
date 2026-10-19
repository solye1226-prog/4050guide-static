const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'home-template.html');
const posts=require('./content-repair-20261019.cjs');
const selected=['4050-국민내일배움카드-자비부담금-확인법','지게차운전기능사-국비지원-신청방법','시설관리-자격증-조합','중장년-내일센터-이용방법','퇴직-후-건강보험료-줄이는-방법','퇴직-후-생활비-계산법','장기요양등급-신청-전-확인할-것','치매검사비-지원-확인방법','제과기능사-실기-연습-재료비','웹디자인개발기능사-실기-환경-확인'];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const items=selected.map(slug=>{
 const p=posts.find(p=>p.slug===slug);if(!p)throw new Error('Missing curated post '+slug);
 return `<li><a href="/${slug}/"><span>${esc(p.label)}</span><strong>${esc(p.title)}</strong></a></li>`;
}).join('');
let html=fs.readFileSync(file,'utf8');
html=html.replace(/<!-- recent-editorial:start -->[\s\S]*?<!-- recent-editorial:end -->/,`<!-- recent-editorial:start -->\n<section class="home-recent" aria-labelledby="recent-heading"><div class="home-heading"><h2 id="recent-heading">비용과 조건을 비교하는 실전 안내</h2><span>2026.10.19 보강</span></div><ul class="home-recent-list">${items}</ul></section>\n<!-- recent-editorial:end -->`);
html=html.replace('다시 일할 준비, 놓치기 쉬운 생활 지원.<br>내 상황에서 먼저 확인할 것부터.','다시 일할 준비부터 부모님 돌봄까지.<br>비용과 조건을 비교하고, 내 다음 단계를 정하세요.');
html=html.replace('<span>2026.10.04 기준 확인</span>','<span>신청과 이용 조건 비교</span>');
fs.writeFileSync(file,html);
console.log('Curated ten repaired guides on home');
