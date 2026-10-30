const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data={
 '국가자격-검색':{text:'자격 종목이 등록돼 있어도 모든 회차·지역에서 시험이 열리는 것은 아닙니다. 응시연도 출제기준과 시험 경로를 확인한 뒤 교육비를 비교하세요.',links:[['/4050-자격증-로드맵/','공고에서 필요한 자격을 고르는 순서'],['/국민내일배움카드-신청방법-2026/','교육 지원 대상과 시험 응시자격 구분'],['/큐넷-실기시험-준비물-조회방법/','회차별 지참물 확인']]},
 '복지서비스-검색':{text:'같은 나이라도 가구 구성·소득인정액·돌봄 상태에 따라 대상이 달라집니다. 제도 이름을 찾은 다음에는 신청 가능한 가구와 신청처를 따로 확인해야 합니다.',links:[['/부모님-복지-점검-가이드/','부모님 상황에 따른 상담 경로'],['/장기요양등급-신청-전-확인할-것/','돌봄 필요와 장기요양 인정 구분'],['/기초연금-수급자격-확인방법/','기초연금 선정기준과 지급액 구분']]},
 '공공혜택-검색':{text:'사업의 운영기간과 개인의 신청기한은 다를 수 있습니다. 중앙부처와 지역 사업을 구분하고 소득 귀속연도·거주 요건·현재 접수 여부를 확인하세요.',links:[['/근로장려금-기한-후-신청-2026/','2025년 귀속 기한 후 신청 판단'],['/에너지바우처-신청방법/','신청기간과 겨울 사용기간 구분'],['/지자체-중장년-지원사업-찾는-법/','지역별 모집공고의 적용 범위']]}
};
for(const [slug,g] of Object.entries(data)){
 const file=path.join(root,slug,'index.html');let html=fs.readFileSync(file,'utf8');
 if(html.includes('data-search-editorial="20261030"'))continue;
 const anchor='<div class="guide-api-search"';const i=html.indexOf(anchor);if(i<0)throw new Error('Missing search wrapper '+slug);
 const markup=`<section class="search-editorial" data-search-editorial="20261030"><h2>자료를 적용하기 전에</h2><p>${g.text}</p><ul>${g.links.map(([u,t])=>`<li><a href="${u}">${t}</a></li>`).join('')}</ul></section>`;
 html=html.slice(0,i)+markup+html.slice(i);fs.writeFileSync(file,html);
}
console.log('Added three topic-specific search reading paths');
const sitemapFile=path.join(root,'sitemap.xml');
const xml=fs.readFileSync(sitemapFile,'utf8').replace(/<url>[\s\S]*?<\/url>/g,block=>{
 const loc=block.match(/<loc>([^<]+)/)?.[1];
 if(!loc)return block;
 const slug=decodeURI(new URL(loc).pathname).split('/')[1];
 return data[slug]?block.replace(/<lastmod>[^<]+<\/lastmod>/,'<lastmod>2026-10-30</lastmod>'):block;
});
fs.writeFileSync(sitemapFile,xml);
