const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const dataset=process.argv[2];
const posts=require(dataset?path.resolve(__dirname,dataset):'./new-posts-20261006.cjs');
const batch=dataset?'practical-posts':'recent-posts';
const date=posts[0].verifiedAt||'2026-10-06';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const marker=(name,body)=>`<!-- ${name}:start -->\n${body}\n<!-- ${name}:end -->`;
function replaceBlock(html,name,body,before) {
 const re=new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
 if(re.test(html))return html.replace(re,marker(name,body));
 if(!html.includes(before))throw new Error('Missing insertion point '+name);
 return html.replace(before,marker(name,body)+'\n'+before);
}
for(const category of new Set(posts.map(p=>p.category))) {
 const file=path.join(root,'category',category,'index.html');let html=fs.readFileSync(file,'utf8');
 const cards=posts.filter(p=>p.category===category).map(p=>`<article class="post-card photo-card"><a class="post-thumb" href="/${p.slug}/" aria-label="${esc(p.title)}"><img src="${p.image}" alt="${esc(p.label)} 설명용 AI 이미지" width="1200" height="750" loading="lazy" decoding="async"></a><div class="post-card-body"><span class="tag">${esc(p.label)}</span><h2><a href="/${p.slug}/">${esc(p.title)}</a></h2><p>${esc(p.description)}</p><a class="more" href="/${p.slug}/">자세히 보기</a></div></article>`).join('\n');
 const re=new RegExp(`<!-- ${batch}:start -->[\\s\\S]*?<!-- ${batch}:end -->`);
 if(re.test(html))html=html.replace(re,marker(batch,cards));
 else html=html.replace('<div class="grid photo-grid">','<div class="grid photo-grid">\n'+marker(batch,cards));
 html=html.replace(/<link\b[^>]*rel="canonical"[^>]*>/,`<link rel="canonical" href="https://4050guide.co.kr/category/${category}/">`);
 fs.writeFileSync(file,html);
}
const homeFile=path.join(__dirname,'home-template.html');let home=fs.readFileSync(homeFile,'utf8');
const recent=`<section class="home-recent" aria-labelledby="recent-heading"><div class="home-heading"><h2 id="recent-heading">새로 발행한 실전 안내</h2><span>${date.replaceAll('-','.')} 발행</span></div><ul class="home-recent-list">${posts.map(p=>`<li><a href="/${p.slug}/"><span>${esc(p.label)}</span><strong>${esc(p.title)}</strong></a></li>`).join('')}</ul></section>`;
home=replaceBlock(home,'recent-editorial',recent,'    <section class="home-directory"');fs.writeFileSync(homeFile,home);
const paths={
 '시설관리-자격증-조합':['50대-시설관리-채용공고-근무조건','시설관리-입문-가이드','50대-재취업-경력기술서-작성법'],
 '시설관리-입문-가이드':['50대-시설관리-채용공고-근무조건','시설관리-자격증-조합','국비지원-학원-취업률-확인방법'],
 '요양보호사-월급-현실':['요양보호사-근로계약서-급여계산','돌봄-분야-재취업-가이드','방문요양-주간보호센터-비용-비교'],
 '돌봄-분야-재취업-가이드':['요양보호사-월급-현실','요양보호사-근로계약서-급여계산','50대-재취업-경력기술서-작성법'],
 '국비지원-훈련과정-선택-가이드':['국비지원-학원-취업률-확인방법','내일배움카드-중도포기-재수강','2026-중장년-경력지원제-신청방법']
};
const titles=new Map(posts.map(p=>[p.slug,p.title]));
for(const p of require('./editorial-refresh-data.cjs'))titles.set(p.slug,p.title);
for(const [slug,related] of Object.entries(dataset?{}:paths)) {
 const file=path.join(root,slug,'index.html');let html=fs.readFileSync(file,'utf8');
 const body=`<section class="guide-related-posts"><h2>다음 단계로 읽을 글</h2><ul>${related.map(s=>{if(!titles.has(s))throw new Error(s);return `<li><a href="/${s}/">${esc(titles.get(s))}</a></li>`}).join('')}</ul></section>`;
 html=html.replace(/<section class="guide-related-posts">[\s\S]*?<\/section>/,body);fs.writeFileSync(file,html);
}
console.log('Connected '+posts.length+' posts to home and categories');
