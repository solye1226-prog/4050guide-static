const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const source = 'C:/Users/kch41/.codex/generated_images/019e7e0e-7d29-7da3-aa5f-5bffb7ad17b7';
const style = 'Photorealistic editorial website thumbnail, landscape 16:10, Korean adults in their 40s and 50s, candid medium-wide composition, soft natural daylight, white and muted blue/green palette, realistic hands and skin. No readable text, overlays, logos, watermark or collage. Fictional illustrative scene.';
const photos = [
 ['전기기능사-4050-공부법','electrical','46d048b2-559c-403e-8884-3ab7ad71ca54','전기 이론 교재를 공부하는 중년 학습자', 'A Korean man in his early 50s studying electrical technician theory at a bright vocational classroom desk, open workbook with indistinct diagrams, pencil, small disconnected training terminal board in background.'],
 ['국민내일배움카드-신청방법-2026','training-card','5d32c817-1d07-4d4e-8f25-cdeda6868aa3','훈련 지원 신청 서류를 상담하는 중년 학습자','Korean woman age 48 and vocational training counselor age 50 seated across a light desk in a bright modern employment service office, applicant holding a plain unbranded card and checking papers alongside laptop, screen not readable.'],
 ['지게차운전기능사-필기-공부법','forklift','20ec0331-c38e-4c97-9390-eeea4abe25f3','지게차 교육장에서 필기 교재를 공부하는 중년 학습자','Korean male vocational student in his early 50s studying forklift written test theory with a workbook and pen at a clean training room desk. Through large classroom interior windows a stationary yellow forklift is clearly visible in a dedicated empty training bay, forks resting on floor, no operation.'],
 ['중장년-내일센터-이용방법','career-center','d66531d7-8098-425d-9fb5-51eebc329923','이력서를 살펴보며 재취업 상담을 받는 중년 구직자','Korean man about 55 in everyday light blue shirt receiving one-to-one career counseling from Korean woman counselor about 45 in a bright employment center, both examining a resume on desk, counselor gestures gently with pen, laptop turned away from viewer.'],
 ['2026년-남은-국가기술자격-시험일정','exam-calendar','d4f93f8b-2670-4c5d-a524-02e6d9ccc360','달력에 시험 준비 일정을 표시하는 중년 학습자','Korean woman about 50 seated at a bright home study desk marking a date on a paper monthly calendar with pen, open workbook and closed blue notebook nearby, laptop showing an indistinct calendar grid. Over shoulder three-quarter medium shot with hands and calendar visible.'],
 ['퇴직-후-생활비-계산법','retirement-budget','1d6a33b3-b13c-4f58-8d84-6940f167935b','계산기와 영수증으로 생활비를 점검하는 중년 부부','Korean couple in their early-to-mid 50s calmly reviewing household expenses after retirement at a bright dining table, calculator, organized receipts and open notebook, woman writing and man checking calculator. Not luxurious or distressed. No money piles.'],
 ['요양보호사-자격증-취득방법','care-training','04c08eb1-86cd-4886-9c2a-f75f6290cb78','교육용 침대에서 침구 정리 실습을 하는 요양보호 학습자','Korean woman trainee about 50 learning elder care in a bright vocational skills classroom, wearing pale blue training scrubs, practicing gently folding a clean bed sheet on an empty demonstration bed while female instructor in white polo observes beside her. No patients, no actual medical procedure.'],
 ['한식조리기능사-4050-공부법','cooking','6b07f84e-2d2f-4786-9972-60f0115e0b06','조리 교육장에서 채소와 재료를 정리하는 중년 학습자','Korean woman student around 50 in clean white cook jacket apron and white cap concentrating on arranging julienned vegetables in small dishes at a stainless steel training kitchen counter, instructor in background at another station. Clean safe workspace, no flame or unsafe knife handling.']
];
async function run() {
 const dir = path.join(root,'assets','catalog-photos');
 fs.mkdirSync(dir,{recursive:true});
 const map = {}, records = [];
 for (const [slug,name,id,alt,subject] of photos) {
  const input = path.join(source,'exec-'+id+'.png');
  const sizes = [480,800,1200];
  for(const width of sizes) await sharp(input).resize(width,width*5/8,{fit:'cover',position:'centre'}).webp({quality:82}).toFile(path.join(dir,`${name}-20261102-${width}.webp`));
  map[slug] = {image:`/assets/catalog-photos/${name}-20261102-800.webp`,srcset:sizes.map(w=>`/assets/catalog-photos/${name}-20261102-${w}.webp ${w}w`).join(', '),alt:alt+' (AI 제작 설명 이미지)'};
  records.push({slug,name,source:input,subjectPrompt:subject,files:sizes.map(w=>`assets/catalog-photos/${name}-20261102-${w}.webp`)});
 }
 fs.writeFileSync(path.join(root,'assets/catalog-photo-map.json'),JSON.stringify(map,null,2)+'\n');
 fs.writeFileSync(path.join(root,'reports/catalog-photos-20261102.json'),JSON.stringify({date:'2026-11-02',method:'Built-in image_gen',scope:'Eight new catalog thumbnails; four existing photographic covers retained. Article body images unchanged.',sharedPromptStyle:style,promptNote:'Subject prompts and shared visual constraints record the prompt set; individual generation calls included minor scene-specific composition wording.',records},null,2)+'\n');
 const previews=[];
 for(let i=0;i<photos.length;i++)previews.push({input:await sharp(path.join(dir,photos[i][1]+'-20261102-800.webp')).resize(400,250).toBuffer(),left:(i%2)*400,top:Math.floor(i/2)*250});
 await sharp({create:{width:800,height:1000,channels:3,background:'#ffffff'}}).composite(previews).png().toFile(path.resolve(root,'../catalog-photos-preview-20261102.png'));
 console.log('Prepared eight responsive catalog photos');
}
run().catch(e=>{console.error(e);process.exitCode=1});
