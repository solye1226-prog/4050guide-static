const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),input=require('../reports/fact-review-input-20261030.json');
const evidenceDir=path.resolve(root,'../4050-source-evidence-20261030');
const sources=JSON.parse(fs.readFileSync(path.join(evidenceDir,'clean.json'),'utf8'));
const rendered=JSON.parse(fs.readFileSync(path.join(evidenceDir,'rendered.json'),'utf8'));
const sourceMap=new Map([...sources,...rendered].map(s=>[s.url,s]));
const merges=require('./content-merges-20261030.cjs');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const oldUnemployment='https://edi.work.go.kr/ei/eim/eg/ei/eiEminsr/retrievePb200Info.do';
const newUnemployment='https://ei.work24.go.kr/ei/eih/eg/pb/pbPersonBnef/retrievePb0201Info.do';
const housingSource='https://gonggam.korea.kr/newsContentView.es?b_list=9&code_cd=0121000000&content=NC002&mid=a12505000000&nPage=18&news_id=f5911df5-c91e-486d-a6b1-7a49aa05cacb&section_id=NCCD_POLICY';
async function run(){const browser=await chromium.launch();try{
 const page=await browser.newPage(),changes=[],review=[];
 for(const post of input){
  if(merges[post.slug]){review.push({slug:post.slug,status:'통합',target:merges[post.slug]});continue;}
  const file=path.join(root,post.slug,'index.html');let html=fs.readFileSync(file,'utf8');const before=html;
  let notes=[],additions=[];
  const alreadyUpdated=html.includes('data-fact-review="20261030"');
  const qnet=post.sources.map(s=>sourceMap.get(s.url)).filter(s=>s?.status===200&&/jmCd=/.test(s.url)&&s.text?.includes('수수료'));
  const subjectSources=qnet.filter(s=>{
   const name=s.text.match(/취득방법\s+(.+?)\s+취득방법/)?.[1];
   const compact=s=>s.replace(/[^\p{L}\p{N}]/gu,'');
   return name&&compact(post.title).includes(compact(name));
  });
  for(const s of subjectSources){
   const fee=s.text.match(/안내표 (필기 실기|실기) ((?:[\d,]+원\s*){1,2})/);
   if(!fee)continue;
   const amounts=[...fee[2].matchAll(/[\d,]+원/g)].map(m=>m[0]);
   const code=new URL(s.url).searchParams.get('jmCd');
   const sourceUrl='https://www.q-net.or.kr/crf005.do?id=crf00503s02&gSite=Q&jmInfoDivCcd=B0&jmCd='+code;
   const fact=amounts.length===2?`필기 ${amounts[0]}, 실기 ${amounts[1]}`:`실기 ${amounts[0]}`;
   notes.push({type:'시험 수수료',code,fact,source:sourceUrl});
   if(!amounts.every(amount=>post.text.replace(/\s/g,'').includes(amount.replace(/\s/g,'')))){
    additions.push(`<section class="fact-followup" data-fact-review="20261030"><h2>공식 시험료와 교육비를 구분합니다</h2><p>2026년 10월 30일 <a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">Q-Net 해당 종목 시험정보</a>에서 확인한 수험료는 ${fact}입니다. 교재·수강료·실습 재료·공구·통학비를 포함하는 금액이 아닙니다. 학원 견적에 접수비가 포함되어 있다면 같은 비용을 다시 더하지 말고, 재응시할 때 필요한 비용은 별도로 적으세요.</p></section>`);
   }
   html=html.replaceAll(esc(s.url),esc(sourceUrl)).replaceAll(s.url,esc(sourceUrl));
  }
  if(subjectSources.length){
   const note='<p class="source-recheck" data-fact-review="20261030">2026년 10월 30일 해당 종목 Q-Net 시험정보의 수험료를 재확인했습니다. 이 확인은 공개문제 첨부파일 전체나 개인별 합격·취업 요건의 검증을 뜻하지 않습니다.</p>';
   if(!html.includes('class="source-recheck"')){
    if(html.includes('<section class="editorial-sources">'))html=html.replace('<section class="editorial-sources">','<section class="editorial-sources">'+note);
    else additions.push(note);
   }
  }
  if(post.slug==='실업급여-신청-전-확인할-것'){
   html=html.replaceAll(oldUnemployment,newUnemployment);
   additions.push('<section class="fact-followup" data-fact-review="20261030"><h2>수급기간 확인은 현재 고용24 안내에서 합니다</h2><p>접속이 끊긴 고용보험 옛 주소를 고용24의 실업급여 안내로 교체했습니다. 원문은 퇴직 다음 날부터 12개월이 지나면 남은 소정급여일수가 있어도 구직급여를 더 받을 수 없다고 안내합니다. “1년 안에 신청만 하면 남은 일수를 모두 받는다”는 의미가 아니므로 교육·신청·실업인정 일정을 늦추지 마세요.</p></section>');
   notes.push({type:'수급기간·출처 교체',fact:'이직 다음 날부터 12개월과 소정급여일수 구분',source:newUnemployment});
  }
  if(post.slug==='부모님-응급안전안심서비스-신청-확인'){
   html=html.replace(/<p>실제로 인천 남동구는 2026년 대기 지연[\s\S]*?<\/p>/,'<p>주소지 기관에 오늘 접수가 가능한지, 신청과 예비대상자 등록 중 어떤 절차인지, 설치까지 대기가 있는지 따로 확인하세요. 지역 공고의 종료·중단·재개 상태는 달라질 수 있어 과거 다른 지역의 사례를 현재 접수 상태로 적용하지 않습니다.</p>');
   html=html.replace('접수 일시 중단 사례도 있으므로 현재 상태를 담당 기관에 문의하세요.','현재 접수·대기 상태를 주소지 담당 기관에 문의하세요.');
   html=html.replace(/<li><a[^>]*href="https:\/\/(?:www\.busan\.go\.kr\/depart\/welgrand01022|biz\.namdong\.go\.kr\/bbs\/bbsMsgDetail\.do[^\"]*)"[^>]*>[\s\S]*?<\/a><\/li>/g,'');
   additions.push('<p class="source-recheck" data-fact-review="20261030">2026년 10월 30일 재점검에서 열리지 않는 부산·남동구 출처와 이를 근거로 한 접수 중단 사례를 제외했습니다. 인천 안내의 가구 유형과 전국의 현재 접수 여부는 구분해야 합니다.</p>');
   notes.push({type:'확인 불가 사례 제외',fact:'남동구 중단 공지를 현재 상태의 근거로 사용하지 않음',source:post.sources[0].url});
  }
  if(post.slug==='주거급여-신청조건-2026'){
   additions.push(`<section class="fact-followup" data-fact-review="20261030"><h2>선정기준과 지원액을 다시 대조했습니다</h2><p>2026년 10월 30일 마이홈의 2026년 표에서 소득인정액 기준과 1인 가구 기준임대료를 다시 대조했습니다. 임차료 지원과 달리 자가가구는 주택조사 후 보수 범위를 정합니다. <a href="${esc(housingSource)}" target="_blank" rel="noopener noreferrer">정부의 주거급여 설명</a>도 신청 후 조사·지급의 구분을 안내합니다. 먼저 사설 수리를 맡긴 비용을 자동 환급받는 제도로 이해하지 마세요.</p></section>`);
   notes.push({type:'선정기준·기준임대료·신청 경로',fact:'마이홈 2026 표와 대조·선정기준액과 실제 급여 구분',source:post.sources[0].url});
  }
  if(post.slug==='내일배움카드-훈련장려금-지급조건'){
   additions.push('<section class="fact-followup" data-fact-review="20261030"><h2>일반 장려금과 특화훈련을 같은 상한으로 보지 않습니다</h2><p>2026년 10월 30일 고용24 일반 안내의 일액 2,500원·5,800원과 월 상한 5만원·11만6천원, 자영업자인 피보험자 월 최대 36만원을 다시 대조했습니다. 이 표는 일반 안내의 범위입니다. K-디지털 트레이닝 등 별도 훈련유형의 수당은 해당 유형 공고로 확인하고 일반 장려금과 임의로 합산하지 마세요.</p><p>과정명, 훈련유형, 단위기간, 인정 출결, 수급 중인 다른 수당 이름을 함께 적어 기관에 물으면 어떤 기준이 적용되는지 확인하기 쉽습니다. 수당이 확정되기 전에는 최대액을 생활비 수입으로 먼저 잡지 않는 편이 안전합니다.</p></section>');
   notes.push({type:'일반 훈련장려금',fact:'일액·상한·자영업자 피보험자 구분',source:post.sources[0].url});
  }
  if(['물류관리사-지게차-자격증-취업-차이','주택관리사보-50대-시험-취업-현실'].includes(post.slug)){
   const record=rendered.find(s=>s.url===post.sources[0].url);
   const fact=post.slug.startsWith('물류')?'물류관리사 응시수수료 20,000원':'주택관리사보 1차 21,000원·2차 14,000원';
   if(!record?.text?.includes(post.slug.startsWith('물류')?'20,000':'21,000'))throw new Error('Missing rendered fee proof');
   additions.push(`<p class="source-recheck" data-fact-review="20261030">2026년 10월 30일 Q-Net 시험정보의 공개 하위 화면에서 ${fact}을 재확인했습니다. 수강료·교재·이동비를 포함한 총비용이 아닙니다.</p>`);
   notes.push({type:'전문자격 수험료',fact,source:record.url});
  }
  if(additions.length&&!alreadyUpdated){
   const anchors=['<h2>자주 묻는 질문</h2>','<section class="editorial-sources">'];
   const anchor=anchors.find(s=>html.includes(s));if(!anchor)throw new Error('Missing insertion anchor '+post.slug);
   html=html.replace(anchor,additions.join('\n')+'\n'+anchor);
  }
  if(html!==before){
   html=html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g,(all,a,json,b)=>{try{const data=JSON.parse(json);if(data['@type']==='BlogPosting'){data.dateModified='2026-10-30';return a+JSON.stringify(data)+b;}}catch{}return all;});
   fs.writeFileSync(file,html);changes.push(post.slug);
  }
  review.push({slug:post.slug,status:notes.length?'항목별 공식 원문 대조':'출처·수치 위험 탐지 완료 / 문장별 재검증 미완료',checks:notes});
 }
 // Replace the broken application link in canonical legacy copies as well.
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['scripts','reports'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.html')){const h=fs.readFileSync(f,'utf8');if(h.includes(oldUnemployment))fs.writeFileSync(f,h.replaceAll(oldUnemployment,newUnemployment));}}}
 walk(root);
 const reportFile=path.join(root,'reports/fact-followup-result-20261030.json');
 const history=[...new Set([...(fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile,'utf8')).changed:[]),...changes])];
 const sitemapFile=path.join(root,'sitemap.xml');
 const sitemap=await page.evaluate(({xml,slugs})=>{const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('Invalid sitemap');for(const item of doc.getElementsByTagName('url')){const loc=item.getElementsByTagName('loc')[0]?.textContent;if(loc&&slugs.includes(decodeURI(new URL(loc).pathname).split('/')[1])){let last=item.getElementsByTagName('lastmod')[0];if(!last){last=doc.createElementNS(item.namespaceURI,'lastmod');item.appendChild(last);}last.textContent='2026-10-30';}}return new XMLSerializer().serializeToString(doc);},{xml:fs.readFileSync(sitemapFile,'utf8'),slugs:history});
 fs.writeFileSync(sitemapFile,sitemap+'\n');
 fs.writeFileSync(reportFile,JSON.stringify({checkedAt:'2026-10-30',scope:'219편 전체 출처·수치 탐지와 확인 가능한 항목별 대조입니다. 모든 문장·첨부파일·개인별 자격을 전수 검증했다는 의미가 아닙니다.',changed:history,articles:review},null,2)+'\n');
 console.log(JSON.stringify({changedThisRun:changes.length,changedTotal:history.length,scopedChecks:review.filter(r=>r.checks?.length).length,pendingFullReview:review.filter(r=>r.status.includes('미완료')).length}));
 }finally{await browser.close();}}
run().catch(e=>{console.error(e);process.exitCode=1});
