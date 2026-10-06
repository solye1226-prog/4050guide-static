const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const titles=new Map(require('../assets/search-index.json').posts.map(p=>[decodeURI(p.url),p.title]));
require('./editorial-refresh-data.cjs').forEach(g=>titles.set('/'+g.slug+'/',g.title));
const paths={
 '퇴직-후-30일-실행-가이드':['퇴직-후-건강보험료-줄이는-방법','실업급여-신청-전-확인할-것','중장년-내일센터-이용방법'],
 '퇴직-후-건강보험료-줄이는-방법':['실업급여-신청-전-확인할-것','중장년-내일센터-이용방법','국비지원-훈련과정-선택-가이드'],
 '실업급여-신청-전-확인할-것':['퇴직-후-건강보험료-줄이는-방법','중장년-내일센터-이용방법','국민내일배움카드-신청방법-2026'],
 '중장년-내일센터-이용방법':['국민내일배움카드-신청방법-2026','국비지원-훈련과정-선택-가이드','시설관리-입문-가이드'],
 '국민내일배움카드-신청방법-2026':['국비지원-훈련과정-선택-가이드','시설관리-자격증-조합','돌봄-분야-재취업-가이드']
};
for(const [slug,next] of Object.entries(paths)) {
 const file=path.join(root,slug,'index.html');let html=fs.readFileSync(file,'utf8');
 const block='<section class="guide-related-posts"><h2>다음 단계로 읽을 글</h2><ul>'+next.map(s=>`<li><a href="/${s}/">${titles.get('/'+s+'/')}</a></li>`).join('')+'</ul></section>';
 if(html.includes('<section class="guide-related-posts">'))html=html.replace(/<section class="guide-related-posts">[\s\S]*?<\/section>/,block);
 else html=html.replace(/<div class="guide-related-posts">[\s\S]*?<\/div>/,block);
 fs.writeFileSync(file,html);
}
let dated=0;
for(const entry of fs.readdirSync(root,{withFileTypes:true})) {
 if(!entry.isDirectory()||!/(?:2026.*(?:6월|remaining|남은)|하반기.*훈련)/.test(entry.name))continue;
 const file=path.join(root,entry.name,'index.html');if(!fs.existsSync(file))continue;
 let html=fs.readFileSync(file,'utf8');
 if(!html.includes('editorial-archive-note')) {
  html=html.replace(/(<div class="content detail-content">)/,'$1<p class="editorial-archive-note">이 글에는 당시의 신청기간이나 시험 회차 안내가 포함되어 있습니다. 2026년 10월 이후의 접수 가능 여부는 연결된 공식 공고에서 확인하세요. 지난 일정을 현재 접수기간으로 적용하지 마세요.</p>');
  if(!html.includes('/assets/editorial.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/editorial.css">\n</head>');
  fs.writeFileSync(file,html);dated++;
 }
}
console.log(`Connected ${Object.keys(paths).length} reading routes; added ${dated} historical schedule notices`);
