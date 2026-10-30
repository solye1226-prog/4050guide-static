const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const practical=require('./practical-depth-20261030.cjs'),data=require('./value-repair-data-20261030.cjs');
const root=path.resolve(__dirname,'..'),today='2026-10-30';
const replacements={
 '4050-재취업-자격증-고르는-기준':{body:data.general,ids:['J05','J08','J10'],note:'서로 다른 직무의 진입 조건과 작성 예를 중심으로 재구성'},
 '전기기능사-50대-취업-가능할까':{body:data.electric,ids:['J03','J01','J02','J04'],note:'시설관리·설치·경력직의 실제 업무와 지원 준비를 분리'},
 '중장년-내일센터-이용방법':{prepend:data.center,note:'센터 찾기 안내를 통합하고 예약·상담 준비 예시 보강'},
 '산림-조경-관련-자격증-4050-활용도':{fee:data.forest,note:'산림·조경 각각의 시험료와 합계 구분'},
 '전기기능사와-소방안전관리자-비교':{fee:data.fire,note:'전기 시험료와 소방 2급 강습·시험·발급 비용 구분'}
};
async function run(){const browser=await chromium.launch(),changed=[],dateOnly=[];try{const page=await browser.newPage();
 for(const post of require('../assets/search-index.json').posts){
 const slug=decodeURI(post.url).split('/')[1],file=path.join(root,slug,'index.html');if(!fs.existsSync(file))continue;
 let html=fs.readFileSync(file,'utf8');const before=html,e=practical.find(e=>e.slug===slug),r=replacements[slug];
 const result=await page.evaluate(({html,e,r,day})=>{
  const d=new DOMParser().parseFromString(html,'text/html'),body=d.querySelector('.detail-content'),oldBody=body.outerHTML,oldHeader=d.querySelector('.detail-title')?.outerHTML;
  if(e){
   if(!body.querySelector('[data-practical-depth]'))body.insertAdjacentHTML('afterbegin',e.html);
   for(const [from,to] of e.replacements||[])body.innerHTML=body.innerHTML.replace(from,to);
   for(const a of body.querySelectorAll('a'))if(a.textContent.includes('첨부 세부내용 제외'))a.textContent=a.textContent.replace(/\s*\([^)]*첨부 세부내용 제외\)/,'')+' · 종목 안내';
  }
  if(r){
   const sources=body.querySelector('.editorial-sources')?.outerHTML||'',related=body.querySelector('.guide-related-posts')?.outerHTML||'';
   if(r.body)body.innerHTML=r.body+sources+related;
   if(r.prepend&&!body.querySelector('[data-value-repair]'))body.insertAdjacentHTML('afterbegin',r.prepend);
   if(r.fee){const old=body.querySelector('.fact-followup');if(!old)throw new Error('Fee section missing');old.outerHTML=r.fee;const recheck=body.querySelector('.source-recheck');if(recheck)recheck.textContent='2026년 10월 30일 비교 대상별 시험·발급 비용을 구분해 보완했습니다. 공식 자료의 적용 범위는 본문 표와 연결된 출처를 확인하세요.';}
  }
  const edits=[{from:oldBody,to:body.outerHTML}];
  const schemaNode=[...d.querySelectorAll('script[type="application/ld+json"]')].find(n=>{try{return JSON.parse(n.textContent)['@type']==='BlogPosting'}catch{return false}});
  const schema=schemaNode?JSON.parse(schemaNode.textContent):null;
  if((e||r)&&schemaNode){const old=schemaNode.outerHTML;schema.dateModified=day;schemaNode.textContent=JSON.stringify(schema);edits.push({from:old,to:schemaNode.outerHTML});}
  const modified=schema?.dateModified;
  const byline=d.querySelector('.editorial-byline');
  if(byline){const old=byline.outerHTML,base=byline.textContent.match(/\d{4}-\d{2}-\d{2}/)?.[0];
   if(e||r){byline.innerHTML=`4050가이드 편집 · 기초 자료 확인 ${base||day} · 최근 보완 ${day} · <a href="/정보-출처-및-면책-안내/">작성 기준</a>`;}
   else if(modified===day&&base&&base!==day&&!byline.textContent.includes('부분 보완'))byline.innerHTML=`4050가이드 편집 · 기초 자료 확인 ${base} · 부분 보완 ${day} · <a href="/정보-출처-및-면책-안내/">작성 기준</a>`;
   edits.push({from:old,to:byline.outerHTML});
  }
  for(const dt of d.querySelectorAll('.detail-side dt'))if(dt.textContent==='업데이트'&&modified===day){const dd=dt.nextElementSibling;if(dd){const old=dd.outerHTML;dd.textContent='2026년 10월 30일 · '+(e||r?'내용 보완':'부분 수정');edits.push({from:old,to:dd.outerHTML});}}
  if(e||r){const header=d.querySelector('.detail-title');header.querySelector('.revision-scope')?.remove();const n=d.createElement('p');n.className='revision-scope';n.dataset.revisionDate=day;n.textContent='이번 보완: '+(e?'공개문제 첨부 대조와 연습 기록 예시 추가':r.note)+'. 기초 자료 확인일과 구분합니다.';header.appendChild(n);edits.push({from:oldHeader,to:header.outerHTML});}
  return {edits,modified};
 },{html,e,r,day:today});
 // Apply the whole header before its nested byline replacement.
 const headerEdit=result.edits.find(x=>x.from.startsWith('<header'));
 if(headerEdit)html=html.replace(headerEdit.from,headerEdit.to);
 for(const edit of result.edits.filter(x=>!x.from.startsWith('<header')))html=html.replace(edit.from,edit.to);
 if(r?.ids){const sources='<section class="editorial-sources"><h2>공식 자료와 확인일</h2><p>2026년 10월 30일 공개 상세페이지에서 확인한 비교용 표본입니다. 현재 모집이나 연령별 채용 결과를 보장하지 않습니다.</p><ul>'+r.ids.map(id=>{const j=require('../assets/comparison-evidence-20261030.json').jobs.find(j=>j.id===id);return '<li><a href="'+j.url.replaceAll('&','&amp;')+'" target="_blank" rel="noopener noreferrer">'+j.name+' · '+j.status+'</a></li>'}).join('')+'</ul></section>';html=html.replace(/<section class="editorial-sources">[\s\S]*?<\/section>/,sources);}
 if(html!==before){fs.writeFileSync(file,html);(e||r?changed:dateOnly).push(slug);}
 }
 // Only pages actually changed by this pass receive a new sitemap modification date.
 const xmlFile=path.join(root,'sitemap.xml'),xml=await page.evaluate(({xml,slugs,day})=>{const d=new DOMParser().parseFromString(xml,'application/xml');for(const n of d.getElementsByTagName('url')){const loc=n.getElementsByTagName('loc')[0]?.textContent;if(loc&&slugs.includes(decodeURI(new URL(loc).pathname).split('/')[1])){let lm=n.getElementsByTagName('lastmod')[0];if(!lm){lm=d.createElementNS(n.namespaceURI,'lastmod');n.appendChild(lm)}lm.textContent=day;}}return new XMLSerializer().serializeToString(d);},{xml:fs.readFileSync(xmlFile,'utf8'),slugs:[...changed,...dateOnly],day:today});fs.writeFileSync(xmlFile,xml+'\n');
 const reportFile=path.join(root,'reports/value-repair-result-20261030.json'),previous=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile,'utf8')):null;
 fs.writeFileSync(reportFile,JSON.stringify({date:today,scope:'10 practical attachments reviewed in the explicitly listed sections; comparison, merge target and date labels updated. Not an all-claims verification or AdSense prediction.',changed:[...new Set([...(previous?.changed||[]),...changed])],dateOnly:[...new Set([...(previous?.dateOnly||[]),...dateOnly])],practical:practical.map(e=>({slug:e.slug,source:e.source,checked:e.checked})),merge:{from:'중장년-일자리-지원센터-찾는-법',to:'중장년-내일센터-이용방법'}},null,2)+'\n');console.log(JSON.stringify({changed,dateOnly:dateOnly.length}));
 }finally{await browser.close()}}
run().catch(e=>{console.error(e);process.exitCode=1});
