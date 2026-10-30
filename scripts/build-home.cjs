const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const evidence = require('../assets/comparison-evidence-20261030.json');
const guides = require('./focus-editorial-20261030.cjs');
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let main = fs.readFileSync(path.join(__dirname, 'home-template.html'), 'utf8').trim();
main=main.replace('<!--home-paths-->',fs.readFileSync(path.join(__dirname,'home-paths.html'),'utf8'))
 .replace('<!--home-budget-compare-->',fs.readFileSync(path.join(__dirname,'home-budget-compare.html'),'utf8'));
main=main.replace(' <section class="home-directory"',fs.readFileSync(path.join(__dirname,'home-practical-depth.html'),'utf8')+'\n <section class="home-directory"');
main=main.replace(/(<section class="home-reading" aria-labelledby="practice-heading">[\s\S]*?<ul class="focus-reading">)([\s\S]*?)(<\/ul><\/section>)/,(all,start,list)=>{
 const items=list.match(/<li>[\s\S]*?<\/li>/g)||[];
 if(items.length!==8)throw new Error('Expected eight practice links');
 return start+items.slice(0,4).join('')+'</ul><details class="home-disclosure"><summary>실습·소방 기록 양식 4개 더 보기</summary><ul class="focus-reading">'+items.slice(4).join('')+'</ul></details></section>';
});
main=main.replace('<!--compare-courses-->',evidence.courses.map(c=>`<option value="${c.id}"${c.id==='T02'?' selected':''} data-pay="${c.displayPay}" data-days="${c.days}" data-url="${esc(c.url)}" data-note="${esc(c.mode+' '+c.hours+'시간 · '+c.status+' · '+c.note)}">${esc(c.name)}</option>`).join(''));
main = main.replace('<!--focus-courses-->', evidence.courses.map(c=>`<option value="${c.id}" data-pay="${c.displayPay}" data-days="${c.days}" data-url="${esc(c.url)}" data-note="${esc(c.mode+' '+c.hours+'시간 · '+c.status+' · '+c.note)}">${esc(c.name)}</option>`).join(''));
main = main.replace('<!--focus-jobs-->',evidence.jobs.map(j=>`<tr data-group="${esc(j.group)}" data-entry="${j.entry}" data-night="${j.night}"><td data-label="직무·지역"><strong>${esc(j.group)}</strong><br>${esc(j.region)}</td><td data-label="임금·경력">${esc(j.pay)}<br>${esc(j.experience)}</td><td data-label="근무표·확인할 점">${esc(j.schedule)}<br>${esc(j.qualification)}<p>${esc(j.issue)}</p></td><td data-label="원문·상태"><a href="${esc(j.url)}" target="_blank" rel="noopener noreferrer">${esc(j.name)}</a><p>${esc(j.status)}</p></td></tr>`).join(''));
main = main.replace('<!--focus-links-->',guides.map(g=>`<li><a href="/${g.slug}/">${esc(g.title)}</a><p>${esc(g.description)}</p></li>`).join(''));
main = main.replace('<!--focus-stories-->',[guides[2],guides[4],guides[7]].map(g=>{
 const article=fs.readFileSync(path.join(root,g.slug,'index.html'),'utf8');
 const figure=article.match(/<figure class="detail-hero-image">[\s\S]*?<\/figure>/)?.[0]||'';
 const image=figure.match(/<img\b[^>]*>/)?.[0]?.replace(/fetchpriority="high"/,'loading="eager"').replace(/sizes="[^"]*"/,'sizes="(max-width: 760px) 100vw, (max-width: 1200px) 33vw, 370px"')||'';
 const cards={
  '50대-시설관리-채용공고-근무조건':['시설관리, 월급보다 근무표','야간·휴게·일요일 근무까지 공고의 조건을 나란히 봅니다.'],
  '국비지원-훈련과정-선택-가이드':['국비훈련, 이름보다 수업 방식','같은 실기 과정이라도 집체 실습과 원격 강의는 다릅니다.'],
  '요양보호사-월급-현실':['요양보호사, 주간과 교대의 차이','표시 월급과 실제 근무시간·수당을 함께 비교합니다.']
 };
 const [title,description]=cards[g.slug]||[g.title,g.description];
 return `<article class="home-story"><a href="/${g.slug}/">${image}<div><span class="home-topic">${esc(g.label)}</span><h3>${esc(title)}</h3><p>${esc(description)}</p></div></a></article>`;
}).join(''));
if (!/<main\b[\s\S]*?<\/main>/.test(html)) throw new Error('Homepage main not found');
html = html.replace(/<main\b[\s\S]*?<\/main>/, main);
html = html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, '');
html = html.replace(/<link\b[^>]*(?:wp-json|EditURI|shortlink)[^>]*>\s*/gi, '');
html = html.replace(/<meta\b[^>]*name=["']generator["'][^>]*>\s*/gi, '');
html = html.replace(/<link[^>]*href="\/assets\/home.css(?:\?[^"]*)?"[^>]*>\s*/g, '').replace(/<script[^>]*src="\/assets\/home.js(?:\?[^"]*)?"[^>]*><\/script>\s*/g, '');
html = html.replace(/<link\b[^>]*href="\/assets\/editorial\.css(?:\?[^\"]*)?"[^>]*>\s*/g, '');
html = html.replace('</head>', '<link rel="canonical" href="https://4050guide.co.kr/">\n<link rel="stylesheet" href="/assets/home.css?v=20261031-visual">\n<link rel="stylesheet" href="/assets/editorial.css?v=20261022">\n<script src="/assets/home.js?v=20261030-paths" defer></script>\n</head>');
html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>4050가이드 - 자격증·훈련비·재취업 근무조건 비교</title>');
html = html.replace(/(<meta name="description" content=")[^"]*(")/, '$140대·50대의 자격증 선택과 국비훈련 예산, 재취업 근무조건을 공개 공고 표본과 통학비 계산으로 비교합니다.$2');
html = html.replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(")/g, '$14050가이드 - 자격증·훈련비·재취업 근무조건 비교$2');
html = html.replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*(")/g, '$1자격증·훈련·재취업을 공개 공고의 경력·근무시간과 훈련비 계산으로 비교하세요.$2');
fs.writeFileSync(file, require('./search-ad-policy.cjs').applyAdPolicy(html,file));
console.log('Built evidence-led comparison homepage');
