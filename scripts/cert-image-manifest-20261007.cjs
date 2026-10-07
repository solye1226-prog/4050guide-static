const path=require('node:path');
const fs=require('node:fs');
const manifest={
 generatedAt:'2026-10-07',
 tool:'OpenAI built-in image generation tool',
 model:'Tool does not expose a selectable or verifiable model identifier',
 sourceDirectory:'C:/Users/kch41/.codex/generated_images/019e7e0e-7d29-7da3-aa5f-5bffb7ad17b7',
 output:'1200x750 WebP, contain fit on white, quality 82, below 200KB each',
 commonPrompt:'One landscape 8:5 Korean editorial card-news bitmap. Large flawless title and three readable stage labels, generous margins. Meaningful middle-aged Korean study/work context. No official logos, fake documents, unverified dates, prices or guarantees. Nonoperating equipment and safe learning posture.',
 visualReview:'All ten displayed originals checked for Korean spelling, clipping and consistency with the articles; no numeric claims. Some outputs include extra non-factual motivational wording, checked for readability. All are captioned as AI illustrations.',
 images:[
  ['cert-computer','exec-197139f8-83d2-490c-9b99-4aa349d044fa.png','컴퓨터활용능력 2급 실기',['기초 조작','함수 연습','시간 재고 풀기'],'Learner at spreadsheet computer with notebook'],
  ['cert-landscape','exec-7c015401-0693-455c-b21a-e3c04c877f3a.png','조경기능사 실기 준비',['도면 읽기','작업 연습','준비물 확인'],'Drawing board, supervised tree planting, tools and work gloves'],
  ['cert-electric','exec-33dc7f41-3ae6-48e5-b0c3-55460c646006.png','전기산업기사 응시자격',['학력·경력 확인','증빙서류 준비','심사 결과 확인'],'Applicant reviewing documents with motor model'],
  ['cert-housing','exec-51bf335d-57fd-4caf-bb85-bf6e9a182033.png','주택관리사보 준비',['시험과목 확인','학습시간 점검','채용조건 비교'],'Study desk, apartment model, accounting notebook'],
  ['cert-gas-energy','exec-3a027ae4-60a9-4a73-b1c0-ff486fa23b4b.png','가스기능사와 에너지관리기능사',['시험 방식 비교','실습 환경 확인','채용공고 점검'],'Gas study and supervised nonoperating thermal training equipment'],
  ['cert-hazard','exec-7f649249-c2ec-45b7-8b1f-3187cc47d5f3.png','위험물기능사 공부 순서',['화학 기초','분류와 성질','필답 연습'],'Desk study, conceptual atom graphic, classification tabs; no experiments'],
  ['cert-elevator','exec-5a37b01c-5a90-4c6e-920f-ab0c8656eadd.png','승강기기능사 준비 전 확인',['업무 범위','근무 조건','안전 교육'],'Closed elevator, supervisor and trainee, nonenergized circuit board'],
  ['cert-safety','exec-53398ec3-c01c-49a1-967b-88af7d17c997.png','산업안전 자격 선택',['응시자격 확인','시험 범위 비교','희망 직무 점검'],'Learner comparing study folders and factory model'],
  ['cert-welding','exec-b85eb575-41b7-4c8e-875a-de740dd30c34.png','피복아크용접기능사 실기 준비',['실습시간 확인','재료비 비교','보호구 점검'],'Trainee and instructor inspecting cooled practice piece, PPE, machine off'],
  ['cert-logistics','exec-5a6c6325-a86f-4f54-9506-9b4a2a9ba279.png','물류관리사와 지게차 자격증',['업무 구분','자격 조건','근무 환경'],'Operations desk contrasted with parked empty forklift, forks down']
 ]
};
module.exports=manifest;
if(require.main===module){
 const sharp=require('sharp');
 (async()=>{
  for(const [name,source] of manifest.images){
   const output=path.resolve(__dirname,'..','assets',name+'-20261007.webp');
   if(fs.existsSync(output))throw new Error('Asset already exists '+output);
   await sharp(path.join(manifest.sourceDirectory,source)).resize(1200,750,{fit:'contain',background:'#ffffff'}).webp({quality:82}).toFile(output);
   const meta=await sharp(output).metadata(),bytes=fs.statSync(output).size;
   if(meta.width!==1200||meta.height!==750||bytes>=200000)throw new Error('Invalid image output '+name);
   console.log(name+' '+bytes+' bytes');
  }
 })().catch(e=>{console.error(e);process.exitCode=1});
}
