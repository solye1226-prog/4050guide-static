const path=require('node:path');
const fs=require('node:fs');
const manifest={
  "generatedAt": "2026-10-08",
  "tool": "OpenAI built-in image generation tool",
  "model": "Tool does not expose a selectable or verifiable model identifier",
  "sourceDirectory": "C:/Users/kch41/.codex/generated_images/019e7e0e-7d29-7da3-aa5f-5bffb7ad17b7",
  "output": "1200x750 WebP, contain fit on white, quality 82, below 200KB each",
  "visualReview": "All twenty displayed originals checked for readable Korean titles and labels, framing and article consistency. Some include extra non-factual motivational wording. No official seals, personal data, fee or deadline claims. AI illustrations, not official forms or operational instructions.",
  "images": [
    {
      "name": "cert2-wallpaper",
      "source": "exec-1d8d6f92-b0a9-45c7-be10-59e19cb5ec51.png",
      "title": "도배기능사 실기 준비",
      "labels": [
        "도면 확인",
        "재단 연습",
        "마감 점검"
      ],
      "prompt": "Use case: infographic-diagram. Create one polished landscape 8:5 Korean editorial card-news image for a practical guide aimed at middle-aged Korean learners. Exact large headline \"도배기능사 실기 준비\". Exactly three short labels \"도면 확인\", \"재단 연습\", \"마감 점검\". Illustration of a bright professional wallpaper training room, middle-aged learner and instructor comparing a paper plan, neatly laid wallpaper rolls, measuring tape, closed utility knife and brush. No active cutting, ladder climbing or dangerous work. Crisp sophisticated detailed raster illustration with white, teal, coral and black, generous text margins, flawless Hangul typography, useful actual topic objects. No other words, logos, dates, fees, official seals, guarantees or watermarks."
    },
    {
      "name": "cert2-tile",
      "source": "exec-941fdb3a-1481-4a47-926c-f7ae3fbea6f7.png",
      "title": "타일기능사 실기 준비",
      "labels": [
        "도면 읽기",
        "실습시간 확인",
        "보호구 점검"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap for middle-aged learners. Exact large readable headline \"타일기능사 실기 준비\". Exactly three labels \"도면 읽기\", \"실습시간 확인\", \"보호구 점검\". Scene: Bright tile training studio. Middle-aged Korean learner and instructor examining a stationary tiled mockup wall, tile samples, ruler and switched-off tile cutter. Hard hat, goggles and work shoes clearly on bench. No active machinery. Sophisticated detailed raster illustration, bright white, teal, coral and black. Clear actual topic objects, generous text margins, flawless Hangul, no cropped text. No other words, dates, prices, logos, official seals, promises or watermarks."
    },
    {
      "name": "cert2-waterproof",
      "source": "exec-86cc9a0a-023b-4afc-9a41-ddf608ebf666.png",
      "title": "방수기능사 실기 준비",
      "labels": [
        "과제 확인",
        "안전 실습",
        "마감 점검"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap for middle-aged learners. Exact large readable headline \"방수기능사 실기 준비\". Exactly three labels \"과제 확인\", \"안전 실습\", \"마감 점검\". Scene: Supervised waterproofing training room, middle-aged Korean learner reading plan with instructor, small mockup roof model, neatly rolled membranes and protective equipment. No flames or active torch. Sophisticated detailed raster illustration, bright white, teal, coral and black. Clear actual topic objects, generous text margins, flawless Hangul, no cropped text. No other words, dates, prices, logos, official seals, promises or watermarks."
    },
    {
      "name": "cert2-ondol",
      "source": "exec-cccded90-3200-44d9-a3a2-22a7ce7bc58a.png",
      "title": "온수온돌기능사 준비",
      "labels": [
        "도면 이해",
        "배관 실습",
        "비용 확인"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap for middle-aged learners. Exact large readable headline \"온수온돌기능사 준비\". Exactly three labels \"도면 이해\", \"배관 실습\", \"비용 확인\". Scene: Supervised plumbing teaching studio. Middle-aged Korean learner and instructor examine a disconnected training pipe layout on a workbench, brass fittings, measuring ruler and notebook. No operating boiler or hot pipes. Sophisticated detailed raster illustration, bright white, teal, coral and black. Clear actual topic objects, generous text margins, flawless Hangul, no cropped text. No other words, dates, prices, logos, official seals, promises or watermarks."
    },
    {
      "name": "cert2-cbt",
      "source": "exec-618bed88-6144-4ccf-a4a3-bc1e1ddaf092.png",
      "title": "큐넷 CBT 연습",
      "labels": [
        "화면 익히기",
        "답안 확인",
        "제출 연습"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap for middle-aged learners. Exact large readable headline \"큐넷 CBT 연습\". Exactly three labels \"화면 익히기\", \"답안 확인\", \"제출 연습\". Scene: Middle-aged Korean learner at a desktop computer practicing neutral generic multiple-choice screen with an instructor, visible mouse and notebook. No official website imitation or private data. Sophisticated detailed raster illustration, bright white, teal, coral and black. Clear actual topic objects, generous text margins, flawless Hangul, no cropped text. No other words, dates, prices, logos, official seals, promises or watermarks."
    },
    {
      "name": "cert2-excavator",
      "source": "exec-e5c2666a-0401-44c9-97b5-9637fe07b37c.png",
      "title": "굴착기와 지게차 자격 선택",
      "labels": [
        "업무 비교",
        "실습 확인",
        "면허 구분"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large readable headline \"굴착기와 지게차 자격 선택\". Exactly three labels \"업무 비교\", \"실습 확인\", \"면허 구분\". Scene: Middle-aged Korean learner and instructor at a training yard comparing a parked excavator with bucket grounded and parked empty forklift with forks lowered. Both machines off, no workers in operating zones. Sophisticated detailed raster illustration, bright white, teal, coral and black, generous text margins, flawless Hangul. No other words, dates, fees, official logos, private data, seals, promises or watermarks."
    },
    {
      "name": "cert2-mechanic",
      "source": "exec-ff2db8a9-a730-4b51-929e-8eb7c4aa7376.png",
      "title": "자동차정비기능사 준비",
      "labels": [
        "구조 이해",
        "진단 실습",
        "안전 점검"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large readable headline \"자동차정비기능사 준비\". Exactly three labels \"구조 이해\", \"진단 실습\", \"안전 점검\". Scene: Bright professional vehicle teaching workshop, middle-aged Korean learner and instructor examine a disconnected engine training model and multimeter on bench. Parked vehicle behind, no lifted vehicle or live high voltage work. Sophisticated detailed raster illustration, bright white, teal, coral and black, generous text margins, flawless Hangul. No other words, dates, fees, official logos, private data, seals, promises or watermarks."
    },
    {
      "name": "cert2-baking",
      "source": "exec-5106cc8c-d226-4d5b-9d99-c72bbb3faaa4.png",
      "title": "제과와 제빵 실기 준비",
      "labels": [
        "과자와 빵",
        "개인 실습",
        "위생 점검"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large readable headline \"제과와 제빵 실기 준비\". Exactly three labels \"과자와 빵\", \"개인 실습\", \"위생 점검\". Scene: Clean professional baking training kitchen, middle-aged Korean learners compare pastry and bread dough on separate workstations, flour bowl, weighing scale, bread tray. White clean chef jackets and caps. No dangerous hot equipment handling. Sophisticated detailed raster illustration, bright white, teal, coral and black, generous text margins, flawless Hangul. No other words, dates, fees, official logos, private data, seals, promises or watermarks."
    },
    {
      "name": "cert2-cooking",
      "source": "exec-03551477-9a1f-44fc-a67b-7f2413e8d4c9.png",
      "title": "한식조리 실기 준비물",
      "labels": [
        "위생복 확인",
        "도구 점검",
        "작업대 정리"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large readable headline \"한식조리 실기 준비물\". Exactly three labels \"위생복 확인\", \"도구 점검\", \"작업대 정리\". Scene: Clean professional Korean cooking classroom. Middle-aged Korean learner in long sleeve clean white chef coat, apron and white cap checks neatly arranged ingredients, knife safely laid flat and checklist, no active cutting. Sophisticated detailed raster illustration, bright white, teal, coral and black, generous text margins, flawless Hangul. No other words, dates, fees, official logos, private data, seals, promises or watermarks."
    },
    {
      "name": "cert2-counseling",
      "source": "exec-0583f8a2-ae91-4d2a-ae05-86daf65c722f.png",
      "title": "직업상담사 실기 답안 연습",
      "labels": [
        "질문 읽기",
        "핵심 용어",
        "다시 쓰기"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large readable headline \"직업상담사 실기 답안 연습\". Exactly three labels \"질문 읽기\", \"핵심 용어\", \"다시 쓰기\". Scene: Middle-aged Korean adult at study desk writing on neutral lined paper, textbook with no readable claims, simple three-step note tabs and pen, calm detailed learning scene, no real clients or personal data. Sophisticated detailed raster illustration, bright white, teal, coral and black, generous text margins, flawless Hangul. No other words, dates, fees, official logos, private data, seals, promises or watermarks."
    },
    {
      "name": "cert2-realtor",
      "source": "exec-9c15183d-b3eb-4cd6-9ae1-fede05d5047d.png",
      "title": "공인중개사 공부 계획",
      "labels": [
        "1차 기초",
        "동차 비교",
        "시간 점검"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"공인중개사 공부 계획\". Exactly three labels \"1차 기초\", \"동차 비교\", \"시간 점검\". Scene: Middle-aged Korean learner at desk comparing two neutral study folders, weekly planner, small model house and legal study books with blank spines, no legal claims or real document emulation. Sophisticated detailed bright raster illustration. White with teal and coral accents, black typography, generous margins, flawless Hangul. No extra words, dates, numeric claims, fees, official logos, seals, promises or watermarks."
    },
    {
      "name": "cert2-barista",
      "source": "exec-dd02b2a3-6ed8-45fd-87c1-0a4b145728cf.png",
      "title": "바리스타 자격 확인",
      "labels": [
        "관리기관 확인",
        "실습시간 비교",
        "총비용 점검"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"바리스타 자격 확인\". Exactly three labels \"관리기관 확인\", \"실습시간 비교\", \"총비용 점검\". Scene: Middle-aged Korean learner and instructor in a bright coffee training studio with stationary espresso machine, empty cups, coffee beans and notebook. No fake certification, seals or logos. Sophisticated detailed bright raster illustration. White with teal and coral accents, black typography, generous margins, flawless Hangul. No extra words, dates, numeric claims, fees, official logos, seals, promises or watermarks."
    },
    {
      "name": "cert2-accounting",
      "source": "exec-1f23796a-361e-431c-99e1-2fc80cb22a05.png",
      "title": "전산회계운용사 실기 준비",
      "labels": [
        "회계원리",
        "프로그램 확인",
        "입력과 검토"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"전산회계운용사 실기 준비\". Exactly three labels \"회계원리\", \"프로그램 확인\", \"입력과 검토\". Scene: Middle-aged Korean learner at computer showing a neutral generic ledger screen without real amounts or software brand, organized notebook, calculator and textbook. No private data or official certificates. Sophisticated detailed bright raster illustration. White with teal and coral accents, black typography, generous margins, flawless Hangul. No extra words, dates, numeric claims, fees, official logos, seals, promises or watermarks."
    },
    {
      "name": "cert2-photo",
      "source": "exec-a0f3a64f-dbe3-4d77-8610-ba8963470184.png",
      "title": "큐넷 원서접수 확인",
      "labels": [
        "사진 점검",
        "결제 확인",
        "수험표 확인"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"큐넷 원서접수 확인\". Exactly three labels \"사진 점검\", \"결제 확인\", \"수험표 확인\". Scene: Middle-aged Korean applicant at laptop checking a neutral blank portrait thumbnail and checklist, separate generic document sheet. No actual identification document, realistic website screenshots or private details. Sophisticated detailed bright raster illustration. White with teal and coral accents, black typography, generous margins, flawless Hangul. No extra words, dates, numeric claims, fees, official logos, seals, promises or watermarks."
    },
    {
      "name": "cert2-exemption",
      "source": "exec-acae5fd4-2915-43e2-b990-fbee87d32891.png",
      "title": "필기 면제기간 확인",
      "labels": [
        "합격일 확인",
        "면제기간 조회",
        "실기 계획"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"필기 면제기간 확인\". Exactly three labels \"합격일 확인\", \"면제기간 조회\", \"실기 계획\". Scene: Middle-aged Korean learner comparing generic calendar with no readable dates and notebook, simple plan timeline with three labeled stages, desktop computer neutral empty screen. No guaranteed deadlines or automatic eligibility. Sophisticated detailed bright raster illustration. White with teal and coral accents, black typography, generous margins, flawless Hangul. No extra words, dates, numeric claims, fees, official logos, seals, promises or watermarks."
    },
    {
      "name": "cert2-refund",
      "source": "exec-d0c386c9-a72b-4e97-8431-b7a21de214d3.png",
      "title": "큐넷 시험 취소 확인",
      "labels": [
        "회차 기준",
        "환불 기간",
        "처리 상태"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"큐넷 시험 취소 확인\". Exactly three labels \"회차 기준\", \"환불 기간\", \"처리 상태\". Scene: Middle-aged Korean adult at desktop with generic calendar without dates, neutral payment card without details and checklist, thoughtful comparing three steps. No stated refund amounts or official website imitation. Sophisticated bright detailed raster illustration, white, teal, coral accents, black crisp typography, generous margins, flawless Hangul. No extra words, numeric claims, dates, fees, official logos, seals or watermarks."
    },
    {
      "name": "cert2-certificate",
      "source": "exec-a911a487-a2ae-49de-9bcd-ec9b5dccd63a.png",
      "title": "자격증 발급 형태 선택",
      "labels": [
        "상장형 인쇄",
        "수첩형 신청",
        "제출처 확인"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"자격증 발급 형태 선택\". Exactly three labels \"상장형 인쇄\", \"수첩형 신청\", \"제출처 확인\". Scene: Middle-aged Korean adult at desk comparing generic blank certificate sheet with small blank credential booklet and printer. Absolutely no official seals, realistic credential content, forged documents or private details. Sophisticated bright detailed raster illustration, white, teal, coral accents, black crisp typography, generous margins, flawless Hangul. No extra words, numeric claims, dates, fees, official logos, seals or watermarks."
    },
    {
      "name": "cert2-confirmation",
      "source": "exec-b522e80e-3099-481b-8329-48429f55ad49.png",
      "title": "자격취득 확인서 준비",
      "labels": [
        "문서명 확인",
        "출력 점검",
        "제출 확인"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"자격취득 확인서 준비\". Exactly three labels \"문서명 확인\", \"출력 점검\", \"제출 확인\". Scene: Middle-aged Korean applicant checking generic document on laptop and plain printer sheet, tidy application folder and checklist. No official seal, forged document content, readable private data or approval promise. Sophisticated bright detailed raster illustration, white, teal, coral accents, black crisp typography, generous margins, flawless Hangul. No extra words, numeric claims, dates, fees, official logos, seals or watermarks."
    },
    {
      "name": "cert2-course",
      "source": "exec-03b2c01a-4271-4069-ae5c-6870cb350b73.png",
      "title": "과정평가형과 검정형",
      "labels": [
        "지정 과정",
        "출석과 평가",
        "취득 확인"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"과정평가형과 검정형\". Exactly three labels \"지정 과정\", \"출석과 평가\", \"취득 확인\". Scene: Middle-aged Korean learners in professional training classroom with instructor, neutral workbench model, attendance planner and generic study book. Explain alternative learning paths with three short stage labels, no guarantee or fake diploma. Sophisticated bright detailed raster illustration, white, teal, coral accents, black crisp typography, generous margins, flawless Hangul. No extra words, numeric claims, dates, fees, official logos, seals or watermarks."
    },
    {
      "name": "cert2-accessibility",
      "source": "exec-1c5f6260-c4a7-4edc-92b0-91004d3fcbcd.png",
      "title": "시험 편의제공 확인",
      "labels": [
        "유형 확인",
        "증빙 준비",
        "신청 결과"
      ],
      "prompt": "Use case: infographic-diagram. One polished landscape 8:5 Korean editorial card-news bitmap. Exact large headline \"시험 편의제공 확인\". Exactly three labels \"유형 확인\", \"증빙 준비\", \"신청 결과\". Scene: Respectful realistic middle-aged Korean person using wheelchair at an accessible study desk, instructor seated at equal eye level discussing neutral checklist, clear wide walkway and computer. No medical condition depiction or fake medical form, no eligibility or time-extension promises. Sophisticated bright detailed raster illustration, white, teal, coral accents, black crisp typography, generous margins, flawless Hangul. No extra words, numeric claims, dates, fees, official logos, seals or watermarks."
    }
  ]
};
module.exports=manifest;
if(require.main===module){
 const sharp=require('sharp');
 (async()=>{
  for(const {name,source} of manifest.images){
   const output=path.resolve(__dirname,'..','assets',name+'-20261008.webp');
   if(fs.existsSync(output))throw new Error('Asset already exists '+output);
   await sharp(path.join(manifest.sourceDirectory,source)).resize(1200,750,{fit:'contain',background:'#ffffff'}).webp({quality:82}).toFile(output);
   const meta=await sharp(output).metadata(),bytes=fs.statSync(output).size;
   if(meta.width!==1200||meta.height!==750||bytes>=200000)throw new Error('Invalid image output '+name);
   console.log(name+' '+bytes+' bytes');
  }
 })().catch(e=>{console.error(e);process.exitCode=1;});
}

