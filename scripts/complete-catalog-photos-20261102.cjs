const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),library=require('./catalog-photo-library-20261102.json');
const mapFile=path.join(root,'assets/catalog-photo-map.json');
const widths=[480,800,1200];
const redirects=Object.fromEntries(fs.readFileSync(path.join(root,'_redirects'),'utf8').split(/\r?\n/).filter(line=>line.trim()&&!line.trim().startsWith('#')).map(line=>line.trim().split(/\s+/)).filter(row=>row.length===3&&/^30[12]$/.test(row[2])&&row[0].startsWith('/')&&row[1].startsWith('/')).map(([from,to])=>[decodeURI(from),decodeURI(to)]));
const rules=[
 [/웹디자인/,'web-design'],[/전자출판/,'publishing'],
 [/큐넷.*사진|큐넷.*확인서|자격.*발급/,'job-documents'],[/큐넷.*취소/,'computer'],[/문제집/,'training-class'],
 [/50대 남성|직업상담사.*실기/,'interview'],[/50대 여성|여성새로일하기|경력단절/,'training-card'],[/첫 출근|재취업이 막히면/,'job-documents'],[/재취업 가능한 직종|4050 재취업 자격증/,'training-class'],
 [/국민연금.*납부|국민연금.*추납|국민연금.*임의계속/,'finance-advice'],[/퇴직연금|IRP/,'retirement-budget'],[/기초연금|장기요양.*등급|장기요양.*감경|장기요양.*용구/,'benefits'],[/요양원|요양병원/,'medical'],
 [/농기계|농업기계/,'farm-machinery'],[/산림/,'forestry'],[/측량/,'surveying'],[/승강기/,'elevator'],[/인쇄기능사/,'printing'],[/건축도장/,'painting'],[/조주/,'bar-practice'],[/떡제조/,'ricecake'],
 [/사회복지사|상시검정/,'training-class'],[/정부지원금|부모님 복지 점검/,'benefits'],
 [/3D프린터/i,'printing3d'],[/목공|가구제작/,'woodwork'],[/금속재창호/,'metalwork'],[/거푸집|철근|건설업|측량/,'construction'],[/건축도장|도배|타일|미장|방수/,'wall-finish'],
 [/공조|에너지관리|가스기능사|온수온돌|승강기/,'hvac'],[/용접/,'welding'],[/자동차정비/,'automotive'],[/농기계|농업기계|종자|원예|유기농업|버섯/,'agriculture'],[/산림|조경/,'landscape'],[/화훼/,'flowers'],
 [/미용사.*일반|이용사/,'hair'],[/미용사/,'beauty'],[/제과|제빵|떡제조/,'bakery'],[/조주|바리스타/,'beverages'],[/사진기능사/,'photography'],[/전산응용|전자캐드/,'cad'],[/정보기기/,'network'],[/웹디자인|컴퓨터|전자출판|인쇄|전산회계|CBT/,'computer'],[/환경기능사|위험물기능사/,'laboratory'],[/세탁기능사/,'laundry'],
 [/경비원/,'security'],[/소방안전관리자/,'fire-safety'],[/조리/,'cooking'],[/지게차|굴착기|물류관리사/,'forklift'],[/전기기능사|전기산업기사/,'electrical'],[/시설관리/,'facility'],
 [/요양보호사.*계약서|요양보호사.*월급|요양보호사.*취업처|가족인 요양보호사|방문요양.*입원|돌봄.*재취업|생활지원사/,'care-contract'],[/요양보호사/,'care-training'],
 [/세액공제/,'tax'],
 [/간호간병|의료비|건강보험.*환급|본인부담상한|틀니|임플란트|치매|건강검진/,'medical'],[/장기요양.*감경|장기요양.*등급|장기요양.*용구|가족휴가제|요양원|요양병원|방문요양|주간보호|응급안전|노인맞춤돌봄|가족돌봄|부모님.*돌봄/,'elder-care'],
 [/기초연금/,'pension'],[/국민연금|퇴직연금|IRP|퇴직금.*DB|주택연금/,'pension'],[/보험 리모델링|건강보험 피부양자|건강보험료/,'insurance'],[/에너지바우처/,'energy'],[/주거급여/,'housing'],
 [/근로.*장려금|근로·자녀|연말정산|세액공제/,'tax'],[/복지|부모님.*혜택|부모님.*상담|부모님.*지원|지자체.*지원사업/,'benefits'],[/노인일자리/,'career-center'],[/대출|정책자금|창업지원금|퇴직금|생활경제/,'finance-advice'],[/생활비/,'retirement-budget'],
 [/실업급여|자발적 퇴사|조기재취업수당|이직확인서|계약서|첫 월급|급여명세서/,'job-documents'],[/면접/,'interview'],[/이력서|경력기술서|경력증명서|스마트폰|고용24 구직|교육비나 보증금/,'job-documents'],
 [/시험일정|상시검정|월간시험|공부계획표|준비기간|큐넷|자격.*발급|시험 편의|문제집/,'exam-calendar'],
 [/내일배움카드.*신청|내일배움카드.*사용|내일배움카드.*자격증|국민취업지원제도/,'training-card'],[/자비부담|훈련장려금/,'retirement-budget'],[/내일배움카드|국비지원|HRD|훈련과정|폴리텍|과정평가형/,'training-class'],
 [/내일센터|새로일하기|경력지원제|경력단절|재취업|퇴직.*30일|퇴직 예정|사회복지사|직업상담사/,'career-center'],[/자격증|공인중개사|주택관리사|산업안전/,'training-class']
];
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);
async function run(){
 const dir=path.join(root,'assets/catalog-photos');fs.mkdirSync(dir,{recursive:true});
 const photos={};
 for(const photo of library.photos){
  for(const width of widths){const output=path.join(dir,`${photo.name}-set-20261102-${width}.webp`);if(!fs.existsSync(output))await sharp(photo.source).resize(width,width*5/8,{fit:'cover',position:'centre'}).webp({quality:82}).toFile(output);}
  photos[photo.name]={image:`/assets/catalog-photos/${photo.name}-set-20261102-800.webp`,srcset:widths.map(w=>`/assets/catalog-photos/${photo.name}-set-20261102-${w}.webp ${w}w`).join(', '),alt:photo.alt+' (AI 제작 설명 이미지)',photoKey:photo.name};
 }
 // Preview sheets are outside the published repository.
 for(let start=0;start<library.photos.length;start+=12){const tiles=[];for(let j=0;j<12&&start+j<library.photos.length;j++){const name=library.photos[start+j].name;tiles.push({input:await sharp(path.join(dir,`${name}-set-20261102-800.webp`)).resize(320,200).toBuffer(),left:(j%3)*320,top:Math.floor(j/3)*200});}await sharp({create:{width:960,height:800,channels:3,background:'#fff'}}).composite(tiles).png().toFile(path.resolve(root,`../catalog-all-photos-${start/12+1}-20261102.png`));}
 const browser=await chromium.launch();try{const page=await browser.newPage();
  const original=JSON.parse(fs.readFileSync(mapFile,'utf8'));
  const curated=JSON.parse(fs.readFileSync(path.join(root,'reports/catalog-build-20261102.json'),'utf8')).curated;
  const preserved=await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return Object.fromEntries([...d.querySelectorAll('.catalog-card')].slice(0,12).map(card=>{const a=card.querySelector('.catalog-card-image'),im=a.querySelector('img'),slug=decodeURI(new URL(a.getAttribute('href'),'https://4050guide.co.kr').pathname).split('/')[1];return [slug,{image:im.getAttribute('src'),srcset:im.getAttribute('srcset')||'',alt:im.alt}]}));},fs.readFileSync(path.join(root,'index.html'),'utf8'));
  for(const slug of curated){const p=preserved[slug]||original[slug];if(!p)throw Error('Missing original curated photo '+slug);photos[slug]=p;}
  for(const name of ['cooking','forklift','electrical','care-training','training-card','retirement-budget','career-center','exam-calendar']){const match=Object.values(original).find(p=>p.image.includes('/'+name+'-20261102-'));if(!match)throw Error('Missing prior photo '+name);photos[name]=match;}
  photos.facility=preserved['시설관리-자격증-조합'];
  const posts=require('../assets/search-index.json').posts,map={},assignments=[],unmatched=[];
  for(const post of posts){const slug=decodeURI(post.url).split('/')[1];let key;
   if(curated.includes(slug))key=slug;else key=rules.find(([pattern])=>pattern.test(post.title))?.[1];
   if(!key||!photos[key]){unmatched.push({slug,title:post.title});continue;}
   map[slug]={...photos[key],photoKey:photos[key].photoKey||key};assignments.push({slug,title:post.title,photoKey:map[slug].photoKey,image:map[slug].image});
  }
  if(unmatched.length){console.log(JSON.stringify({unmatched},null,2));throw Error('Unmapped articles need review');}
  fs.writeFileSync(mapFile,JSON.stringify(map,null,2)+'\n');
  let changedFiles=0,listedFiles=0,updatedCards=0;const covered=new Set();
  for(const file of files(path.join(root,'category'))){const html=fs.readFileSync(file,'utf8');
   const cards=html.match(/<article\b[^>]*class="[^\"]*post-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g)||[];
   const edits=await page.evaluate(({cards,map,redirects})=>cards.map(original=>{
    const d=new DOMParser().parseFromString(original,'text/html'),card=d.querySelector('.post-card'),a=card?.querySelector('h2 a[href]'),img=card?.querySelector('img');if(!a||!img)return null;
    let route=decodeURI(new URL(a.getAttribute('href'),'https://4050guide.co.kr').pathname);const visited=new Set();while(redirects[route]&&!visited.has(route)){visited.add(route);route=redirects[route];}
    const slug=route.split('/')[1],p=map[slug];if(!p)throw Error('Unmapped category card '+slug);
    img.setAttribute('src',p.image);if(p.srcset)img.setAttribute('srcset',p.srcset);else img.removeAttribute('srcset');img.setAttribute('sizes','(max-width: 700px) calc(100vw - 32px), (max-width: 1000px) 45vw, 380px');img.setAttribute('width','800');img.setAttribute('height','500');img.setAttribute('alt',p.alt.includes('AI')?p.alt:p.alt+' (AI 제작 설명 이미지)');
    return {old:original,next:card.outerHTML,slug};
   }).filter(Boolean),{cards,map,redirects});
   if(edits.length)listedFiles++;let next=html;for(const e of edits){if(!next.includes(e.old))throw Error('Category card markup changed: '+e.slug);next=next.replace(e.old,e.next);covered.add(e.slug);updatedCards++;}if(next!==html){fs.writeFileSync(file,next);changedFiles++;}
  }
  fs.writeFileSync(path.join(root,'reports/catalog-photos-complete-20261102.json'),JSON.stringify({date:'2026-11-02',method:library.method,newPhotographs:library.photos.length,articles:posts.length,previouslyUnified:12,remainingUnified:posts.length-12,scope:'Homepage catalog and category list thumbnails only. Article body images, copy, URLs and dates unchanged. Related articles intentionally share topic photographs.',uniqueImages:new Set(Object.values(map).map(p=>p.image)).size,categoryFiles:listedFiles,categoryCards:updatedCards,categoryArticles:covered.size,assignments},null,2)+'\n');
  console.log(JSON.stringify({mapped:posts.length,newPhotos:library.photos.length,uniqueImages:new Set(Object.values(map).map(p=>p.image)).size,categoryFiles:listedFiles,changedFiles,categoryCards:updatedCards}));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
