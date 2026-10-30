const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const input=require('../reports/fact-review-input-20261030.json');
const oldReport=require('../reports/fact-followup-result-20261030.json');
const pending=new Set(oldReport.articles.filter(p=>p.status.includes('미완료')).map(p=>p.slug));
const posts=input.filter(p=>pending.has(p.slug));
const notes=require('./remaining-review-notes-20261030.cjs');
const supplements=require('./remaining-supplements-20261030.cjs');
const extraSources={
 6:['Q-Net 2026 상시검정 공고와 첨부 시행계획','https://www.q-net.or.kr/man004.do?ARTL_SEQ=5249930&BOARD_ID=Q001&gSite=Q&id=man00402&notiType=10'],
 26:['건강보험공단 치과임플란트 급여 안내','https://www.nhis.or.kr/static/html/wbma/c/wbmac0221.html'],
 42:['국민연금공단 실업크레딧 안내','https://m.nps.or.kr/pnsinfo/ntpsklg/getOHAF0097M0.do'],
 46:['국민연금공단 추후납부 안내','https://m.nps.or.kr/pnsinfo/ntpsklg/getOHAF0047M0.do?menuId=MN24001116'],
 72:['국세청 의료비 세액공제','https://b.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7874&mi=6595'],
 75:['사회복지사업법 시행규칙 별표 1','https://www.law.go.kr/LSW/flDownload.do?bylClsCd=110201&flSeq=92563945&gubun='],
 78:['한국소방안전원 2급 시험 안내 PDF 3쪽','https://www.kfsi.or.kr/assets/downloadDoc/33.pdf'],
 100:['장기요양급여 고시 제36조의2','https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=1637'],
 112:['고용24 조기재취업수당 안내','https://ei.work24.go.kr/ei/eih/eg/pb/pbPersonBnef/retrievePb0208Info.do'],
 126:['대한상공회의소 출제기준 자료실','https://license.korcham.net/co/examguide04.do?cd=0103&mm=53&pg=1'],
 129:['Q-Net 기술자격 환불 안내','https://www.q-net.or.kr/crf022.do?gSite=Q&id=crf02201']
};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
async function run(){
 if(posts.length!==144||notes.length!==144||notes.some((n,i)=>n.index!==i))throw new Error('Frozen review coverage changed');
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage(),rows=[],modified=[];
  const previousPath=path.join(root,'reports/remaining-review-result-20261030.json');
  const previous=fs.existsSync(previousPath)?JSON.parse(fs.readFileSync(previousPath,'utf8')):null;
  for(const [index,post] of posts.entries()){
   const file=path.join(root,post.slug,'index.html'),before=fs.readFileSync(file,'utf8');let html=before;
   const baseline=previous?.articles.find(p=>p.slug===post.slug);
   const preserved=baseline?.preserved||await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');const schema=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)).find(x=>x['@type']==='BlogPosting');return {title:d.querySelector('h1')?.textContent.trim(),canonical:d.querySelector('link[rel="canonical"]')?.href,datePublished:schema?.datePublished,images:[...d.querySelectorAll('main img')].map(n=>n.getAttribute('src'))};},html);
   const addition=supplements.find(s=>s.index===index);
   if(addition&&!html.includes('data-remaining-review="20261030"')){
    const source=extraSources[index];
    const markup=`<section class="remaining-review" data-remaining-review="20261030"><h2>${esc(addition.title)}</h2><p>${esc(addition.text)}</p>${source?`<p>근거: <a href="${esc(source[1])}" target="_blank" rel="noopener noreferrer">${esc(source[0])}</a></p>`:''}</section>`;
    const anchor=['<h2>자주 묻는 질문</h2>','<section class="editorial-sources">','<h2>공식 확인처</h2>'].find(s=>html.includes(s));
    if(!anchor)throw new Error('Missing insertion point '+post.slug);
    html=html.replace(anchor,markup+'\n'+anchor);
   }
   if(index===52)html=html.replace('지난해 상반기 또는 올해 3월 반기신청을 이미 했다면','2025년 상반기 소득에 대해 2025년 9월에, 또는 2025년 하반기 소득에 대해 2026년 3월에 반기신청을 이미 했다면');
   if(html!==before){
    html=html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g,(all,a,json,b)=>{try{const x=JSON.parse(json);if(x['@type']==='BlogPosting'){x.dateModified='2026-10-30';return a+JSON.stringify(x)+b;}}catch{}return all;});
    html=html.replace(/(<dt>업데이트<\/dt><dd>)[^<]+(<\/dd>)/g,'$12026년 10월 30일$2');
    // Keep the original source-check dates; add only the actual supplement date.
    if(addition)html=html.replace('data-remaining-review="20261030">','data-remaining-review="20261030"><p class="review-date">2026년 10월 30일 보완</p>');
    fs.writeFileSync(file,html);
   }
   const isModified=Boolean(addition)||index===52;if(isModified)modified.push(post.slug);
   rows.push({index,slug:post.slug,title:preserved.title,url:'https://4050guide.co.kr/'+post.slug+'/',reviewedAt:'2026-10-30',status:'핵심항목·적용범위 검토',checked:notes[index].check,action:index===52?'귀속연도·반기 신청시점 명확화':addition?'주제별 실용 내용 보강':'기존 내용 유지',supplement:addition?{heading:addition.title}:null,sources:[...post.sources.filter(s=>!s.url.includes('4050guide.co.kr')).map(s=>({label:s.label,url:s.url})),...(extraSources[index]?[{label:extraSources[index][0],url:extraSources[index][1]}]:[])],preserved,beforeSha256:baseline?.beforeSha256||sha(before),afterSha256:sha(html)});
  }
  const xml=await page.evaluate(({xml,modified})=>{const d=new DOMParser().parseFromString(xml,'application/xml');if(d.querySelector('parsererror'))throw new Error('Invalid sitemap');for(const item of d.getElementsByTagName('url')){const loc=item.getElementsByTagName('loc')[0]?.textContent;if(loc&&modified.includes(decodeURI(new URL(loc).pathname).split('/')[1])){let n=item.getElementsByTagName('lastmod')[0];if(!n){n=d.createElementNS(item.namespaceURI,'lastmod');item.appendChild(n);}n.textContent='2026-10-30';}}return new XMLSerializer().serializeToString(d);},{xml:fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),modified});
  fs.writeFileSync(path.join(root,'sitemap.xml'),xml+'\n');
  const report={reviewedAt:'2026-10-30',baseline:'e365601',scope:'앞선 기록의 미완료 144편을 대상으로 본문 핵심 수치·제도 조건·적용 범위와 편집 예시를 검토한 후속 기록입니다. 전체 문장·모든 첨부파일의 무오류 인증이나 개인별 수급·채용 판정이 아닙니다. 기존 자동 출처 탐지 기록과 구분합니다.',limitations:['지역별 현재 잔여 예산·모집 정원·채용 가능 여부는 확인하지 않았습니다.','공개 표본의 조건은 해당 원문 사례이지 전국 평균·취업 보장이 아닙니다.','로그인 후 개인별 조회값·실제 수급자격·보험계약·세액과 법률적 판단은 검증 대상이 아닙니다.','검토 항목은 각 글 checked에 명시했습니다. 그 밖의 모든 문장과 첨부 전체를 전수 검증했다는 뜻이 아닙니다.'],reviewedCount:rows.length,modifiedCount:modified.length,maintainedCount:rows.length-modified.length,modified,articles:rows};
  fs.writeFileSync(previousPath,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({reviewed:rows.length,supplemented:supplements.length,corrected:1,modified:modified.length,maintained:rows.length-modified.length}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
