const path=require('node:path');
const fs=require('node:fs');
const manifest={
  "generatedAt": "2026-10-08",
  "tool": "OpenAI built-in image generation tool",
  "model": "Tool does not expose a selectable or verifiable model identifier",
  "sourceDirectory": "C:/Users/kch41/.codex/generated_images/019e7e0e-7d29-7da3-aa5f-5bffb7ad17b7",
  "output": "1200x750 WebP, contain fit on white, quality 82, below 200KB each",
  "visualReview": "All twenty displayed originals checked for readable headline and key Korean labels, topic correspondence, framing and safe learning scenes. Some outputs include additional non-factual motivational wording. No official seals, deadline or fee claims. Screens and diagrams are illustrative, not official tasks or operational instructions.",
  "images": [
    {
      "name": "cert3-forest",
      "source": "exec-b3323e1a-7f3e-4d41-bc64-b01c87e075f0.png",
      "prompt": "Use case: infographic-diagram. Create a polished Korean editorial card-news image for a practical certification article, wide 8:5 aspect, one single finished image, not a grid of unrelated assets. Subject: 산림기능사 preparation. Main visual realistic midlife Korean learner and instructor reviewing tree specimens and safety equipment at a woodland training station. Chainsaw switched off on a distant bench, nobody operating or touching blades. Helmet, face protection and leg protection visibly arranged. Crisp natural photo details. White editorial border area, forest green and coral accents, restrained professional design. Large exact Korean headline \"산림기능사 안전 준비\". Three clear short captions \"수종 관찰\" \"보호구 확인\" \"지도 실습\", each with a simple relevant icon. No other text, dates, prices, seals, logos, watermark or promises. Typography clean and fully inside image margins, usable at mobile width. Not a depiction of an official test."
    },
    {
      "name": "cert3-floral",
      "source": "exec-22f600cb-0520-4701-8b3b-a235cf295153.png",
      "prompt": "Use case: infographic-diagram. Wide 8:5 single Korean editorial card news for 화훼장식기능사, beautiful precise professional photo of Korean woman in her late40s arranging flowers on a clean florist training bench, instructor casually reviewing finished floral study work, flowers and separated simple tools, not dangerous blade handling. Elegant white area with leaf green and coral accents. Exact headline \"화훼장식기능사 연습 계획\". Bottom three icons and exact captions \"공개문제\" \"개인 제작\" \"재료비 확인\". No other text, prices, dates, official logos or watermark, no passing promises. All text large sharp legible Hangul inside generous margins. One coherent scene, not collage of unrelated images, polished natural lighting, editorial educational illustration rather than official exam photo."
    },
    {
      "name": "cert3-horticulture",
      "source": "exec-68f4ad90-cc82-422f-8529-d55ceb917d00.png",
      "prompt": "Use case: infographic-diagram. Wide 8:5 single polished Korean editorial card-news illustration with realistic photography. A Korean adult learner in their50s in a bright horticulture classroom with potted vegetable seedlings, a printed study binder containing ONLY non-readable schematic lines and a blank calendar, thoughtfully comparing learning materials. Clear white band headline exactly \"원예기능사 기준 확인\". Bottom three iconic captions exactly \"기준 연도\" \"시험 안내\" \"개념 정리\". Natural green plants with muted teal and coral accents, crisp typography very large and mobile readable, generous safe margins. No other legible text, no official documents/logos, dates or prices. Do not label exam written or practical because official webpage descriptions are inconsistent. Not a claim of official exam scene, no gardening chemical usage."
    },
    {
      "name": "cert3-mushroom",
      "source": "exec-2377d01b-3658-4e02-983f-41eb041cb794.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 Korean editorial educational card-news image, photorealistic modern training lab. Mature Korean woman in clean lab coat and hair cover with instructor reviewing closed culture jars and clean graduated glassware; no open living cultures, no mushroom consumption, no dangerous experimental procedures. Clean white area, teal and coral accents, laboratory objects physically plausible, show study/preparation not official examination. Large exact headline \"버섯종균기능사 실습 준비\". Three clear captions with icons \"위생 관리\" \"실습 환경\" \"준비물 확인\". No other text, prices, dates, logos, seals, certificates, watermarks or exaggerated promises. Wide safe margins, crisp readable Korean on mobile, natural photographic detail."
    },
    {
      "name": "cert3-seed",
      "source": "exec-2c7823bd-0152-4b34-9a17-83aa65b1aec3.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 high quality editorial Korean card-news image for 종자기능사 studying. Photorealistic midlife Korean man at a tidy study desk, small labeled-by-shape seed sample trays and botanical seed diagrams with no readable text, studying with pen and notebook rather than gardening. White editorial areas, sage green and muted coral, airy natural lighting, detailed texture. Exact large headline \"종자기능사 답안 공부\". Three icon-caption pairs \"개념 구분\" \"조건 읽기\" \"답안 점검\". Keep all Hangul accurate, large and safely inside margins. No additional text, dates, prices, official logos, personal data, certificates or pass guarantees. Educational illustrative scene, not official exam."
    },
    {
      "name": "cert3-organic",
      "source": "exec-ed420024-954c-41bc-9f5a-909c85324ef8.png",
      "prompt": "Use case: infographic-diagram. Create one polished single wide 8:5 Korean editorial card news about 유기농업기능사 versus organic produce certification, not an official form. Main realistic photo: Korean adult learner around50 studying a notebook with simple soil/plant diagrams at a greenhouse bench, soil sample and healthy vegetables, no chemicals and no official organic marks. White editorial strip, deep leaf green, muted coral and charcoal typography. Exact large headline \"유기농업기능사와 유기인증\". Exact three icon-caption pairs \"시험 공부\" \"인증 구분\" \"공식 확인\". Do not show any approval stamp or certificate, do not imply passing the exam grants organic produce certification. No other text, prices, dates, logos, seal, watermark, or guarantees. Natural photo texture, safe margins and large accurate Korean typography mobile readable."
    },
    {
      "name": "cert3-farm-driving",
      "source": "exec-49de5b7b-aa6d-481c-b643-8c2f2acc343f.png",
      "prompt": "Use case: infographic-diagram. Create one single wide 8:5 Korean card news, professional realistic rural equipment training scene. Korean midlife learner and instructor standing safely beside a PARKED tractor, engine switched off, transmission secured, nobody driving, wheels visible, distant rice transplanter in a tidy training lot. Protective sturdy clothing and work shoes, no unsafe proximity to moving mechanisms, no children. White editorial headline band with green, coral and charcoal accents. Exact large headline \"농기계운전기능사 실습 확인\". Three icon captions exactly \"장비별 연습\" \"안전 교육\" \"개인 시간\". No other legible text, dates, prices, logos, official seals, watermark or guarantees. Legible accurate Korean, generous margins, photographic natural daylight, illustrative training not an official exam."
    },
    {
      "name": "cert3-farm-repair",
      "source": "exec-32486558-8550-4a32-988d-de569b36114a.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 Korean editorial card news. Realistic bright agricultural machinery training workshop. Midlife Korean learner in fitted work clothing and safety shoes with instructor reviewing removed spare mechanical parts on a tidy workbench. Parked switched-off compact tractor in background with hood closed, no active engine, no working on rotating mechanisms. Instructor explaining a paper diagram with no readable text. White editorial bands, leaf green/coral/charcoal. Exact large headline \"농업기계정비기능사 실습 선택\". Three exact icon captions \"정비 범위\" \"개인 작업\" \"안전 지도\". No other text, dates, fees, brand logos, official documents, watermark or pass promises. Crisp natural photographic detail, safe margins and mobile readable Hangul. Illustrative classroom scene, not official exam."
    },
    {
      "name": "cert3-woodcraft",
      "source": "exec-37692c75-04a8-4812-83b7-12e4ec4e5871.png",
      "prompt": "Use case: infographic-diagram. Single wide 8:5 Korean editorial card news with realistic photo of woodworking study. Korean woman learner around50 and instructor at a bright tidy woodworking bench reviewing a dimension-free wooden craft drawing and a small handcrafted wooden box. Hands pointing to drawing only, all hand tools safely resting, powered cutting machines switched off and distant. Safety glasses and dust mask resting neatly, no gloves near rotating cutters. White editorial bands with emerald, coral and charcoal. Large exact headline \"목공예기능사 도면과 연습\". Three icon captions exactly \"도면 읽기\" \"개인 제작\" \"안전 공간\". No other readable text, official markings, dimensions, fees, dates, watermark, promises. Accurate large Korean safe margins, detailed wood texture, no unsafe woodworking operations. Not official exam photo."
    },
    {
      "name": "cert3-furniture",
      "source": "exec-dd4ad27a-2d71-41b0-a329-115daec0b08e.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 high quality Korean editorial card news for furniture making certificate study. Photorealistic adult Korean man in his50s and instructor at a bright craft workshop comparing a simple wooden stool and a small wooden decorative box with their line drawings. Hands on notebook only, no saw operation, no unsafe tool handling, no gloves near machines. Main scene shows distinction between furniture and craft learning. White headline area with green, coral and charcoal. Exact large title \"가구제작과 목공예 비교\". Three icon captions exactly \"목표 작품\" \"도면 연습\" \"제작 비용\". No extra text, measurements, dates, fees, logos, seals, watermark or employment guarantees. Clean accurate Korean typography, safe margins and mobile legibility, detailed realistic wood texture, educational AI illustration not official exam."
    },
    {
      "name": "cert3-carpentry",
      "source": "exec-c15a070e-1553-4c5e-9f61-84587e2d4a0c.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 premium Korean editorial card news, realistic instructional wood construction scene. Midlife Korean learner and instructor both wearing hard hats and appropriate closed work shoes, reviewing a simple timber frame and a paper drawing at a bright training workshop. Hands away from tools; powered equipment switched off and out of frame; a tape measure, safety glasses and respirator neatly resting. Image is a planning demonstration, not a real construction project or official examination. White editorial headline band with green and coral accent. Exact large headline \"건축목공기능사 준비 점검\". Three exact icon captions \"도면 확인\" \"공구 준비\" \"안전 연습\". No other readable text, measurements, prices, dates, logos, seal, watermark or pass promises. Korean typography crisp large, generous safe margins, realistic wood and natural daylight."
    },
    {
      "name": "cert3-architecture",
      "source": "exec-b64f4ecd-646c-40c8-bfb0-7d3b0bc00e53.png",
      "prompt": "Use case: infographic-diagram. One single polished wide 8:5 Korean educational card news about architectural CAD certification study. Realistic midlife Korean woman at a bright modern study workstation, looking at a monitor showing a clean generic architectural plan, notebook and printer nearby. Drawing has schematic lines only, no proprietary CAD branding, no readable dimensions or tiny text, not a real project. White editorial title band with emerald/coral/charcoal. Exact large headline \"건축제도 CAD 초보 공부\". Three icon captions exactly \"도면 읽기\" \"기본 조작\" \"저장과 출력\". No other readable text, logos, fees, dates, seals, watermark or guarantees. Crisp natural photography and sharp accurate Korean typography all within safe margins, mobile readable. Educational AI illustration not official examination."
    },
    {
      "name": "cert3-mechanical",
      "source": "exec-0cf808f1-ddbe-4839-a9d2-ee92c46a1a86.png",
      "prompt": "Use case: infographic-diagram. Create one single wide 8:5 Korean editorial card-news image for mechanical CAD certification. Realistic midlife Korean learner at modern workstation reviewing a simple mechanical bracket shown as both a 3D model and 2D orthographic drawing on a generic unbranded screen, notebook and a small passive machined part on desk. Diagram illustrative only, not a real engineering specification, no tiny dimension text. White title band, leaf green/coral/charcoal. Exact large headline \"기계제도 CAD와 도면 연습\". Three exact icon captions \"형상 이해\" \"도면 표현\" \"파일 점검\". No other readable text, official stamps, brand logos, dates, prices, guarantees, watermark. Sharp large accurate Hangul within safe margins, natural bright photographic detail, no machinery operated."
    },
    {
      "name": "cert3-survey",
      "source": "exec-60193e3c-de6e-4f80-9670-7224cd6c9854.png",
      "prompt": "Use case: infographic-diagram. One single polished wide 8:5 Korean editorial card news for surveying certificate preparation. Photorealistic midlife Korean male learner and instructor with high-visibility vests and sturdy closed shoes beside correctly proportioned surveying total station on stable tripod and optical level on separate tripod in a quiet flat training field; nobody near traffic or construction hazards. Instructor reviewing field notes without legible numbers. White editorial headline band, emerald/coral/charcoal accents. Exact large headline \"측량기능사 장비 연습\". Three exact icon captions \"개인 조작\" \"관측 기록\" \"야외 안전\". No other readable text, dimensions, fees, dates, brand logos, seals, watermark, promises. Bright natural detail, sharp accurate large Hangul safe margins, learning illustration not official exam or real boundary determination."
    },
    {
      "name": "cert3-network",
      "source": "exec-8392f411-0f49-43cb-98b7-aecf211e379b.png",
      "prompt": "Use case: infographic-diagram. Single wide 8:5 polished Korean editorial card-news image for network device certificate study. Realistic midlife Korean woman learner at a bright computer classroom, a small training router and network switch with neatly organized ethernet cables, unbranded monitor displays a generic simple network diagram without addresses or readable UI text. Studying in an authorized training environment, no hacker imagery, no terminal commands. White editorial band with emerald/coral/charcoal. Exact large headline \"정보기기운용기능사 기초 공부\". Three exact icon captions \"연결 이해\" \"설정 연습\" \"오류 기록\". No other legible text, IP addresses, official logos, dates, fees, watermark or promises. Clean accurate large Hangul with generous margins, detailed natural photography, educational illustration not official exam."
    },
    {
      "name": "cert3-electronic",
      "source": "exec-167f0b1d-6fb8-4045-b227-487b8012e995.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 polished Korean editorial card news for electronic CAD certification preparation. Realistic midlife Korean adult at a clean study workstation, generic screen with simple electronic schematic and PCB layout side by side, an unpowered small sample circuit board and notebook on desk. No soldering, exposed mains electricity, or dangerous electrical work. Diagram only illustration, no readable circuit values or proprietary software branding. White editorial area with emerald/coral/charcoal accents. Exact large headline \"전자캐드기능사 도면 공부\". Three exact icon captions \"회로 이해\" \"PCB 표현\" \"파일 확인\". No additional text, dimensions, dates, fees, official stamps, logos, watermark or pass promises. Crisp large accurate Hangul within safe margins, natural detailed photography, educational illustration not official exam instructions."
    },
    {
      "name": "cert3-hair",
      "source": "exec-9f96bbe0-5e5d-4d5f-89a8-af3b83cfe862.png",
      "prompt": "Use case: infographic-diagram. One single polished wide 8:5 Korean editorial card-news image about hairdressing certificate practical preparation. Realistic bright clean salon classroom. Midlife Korean woman learner and instructor discussing a mannequin head with natural hair mounted securely on a training stand, combs and clips neatly arranged, scissors safely closed on tray, no cutting or hot tools in use. White editorial areas with emerald/coral/charcoal accents. Exact large headline \"미용사 일반 실기 준비\". Three exact icon captions \"마네킹 연습\" \"준비물 확인\" \"비용 구분\". No other readable text, brand logos, dates, prices, official seals, medical imagery, watermark or promises. Accurate Korean large mobile readable typography and safe margins, flattering natural photography, illustrative education not official examination."
    },
    {
      "name": "cert3-skin",
      "source": "exec-314b3f5e-1c2e-4121-964c-2b8cfa9fbf42.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 premium Korean editorial card news about beauty skin certificate practical preparation. Bright clean nonmedical beauty training classroom. Midlife Korean woman learner and instructor reviewing neatly arranged clean towels, covered cosmetic containers and a checklist with no legible text. A fully clothed adult volunteer model seated comfortably nearby, consensual friendly educational setting, no treatment being performed, no needles, lasers or medical machines. White title band with emerald/coral/charcoal. Exact large headline \"미용사 피부 실기 준비\". Three exact icon captions \"모델 확인\" \"위생 준비\" \"절차 점검\". No other readable text, dates, prices, logos, official seals, watermark or skin outcome promises. Large correct Hangul with safe margins, realistic natural photography, educational illustration not official exam."
    },
    {
      "name": "cert3-nail",
      "source": "exec-c9322bed-8349-4fd9-87c6-4ce78ec32bf4.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 professional Korean editorial card-news image about nail beauty certificate preparation. Bright clean nail training classroom. Korean woman learner in her40s and instructor reviewing a practice hand on a table, neatly separated brushes, closed bottles, towels and trays, no active cutting, no sharp tools touching skin, no medical procedures. White editorial headline band with emerald/coral/charcoal accents. Exact large headline \"미용사 네일 준비물과 비용\". Three exact icon captions \"과제 확인\" \"재료 구분\" \"위생 정리\". No other readable text, dates, prices, product brands, official logos, seals, watermark or guarantees. Crisp natural photographic detail, precise large Hangul and safe margins readable on mobile. Educational preparation illustration not official exam."
    },
    {
      "name": "cert3-ricecake",
      "source": "exec-d3f0e181-66ce-4c22-af5c-4e88d3487475.png",
      "prompt": "Use case: infographic-diagram. One single wide 8:5 Korean editorial card news about 떡제조기능사 preparation. Premium realistic bright food training kitchen. Midlife Korean woman learner and instructor in clean chef jackets, hair fully covered by caps, reviewing a neatly arranged tray of finished simple Korean rice cakes and clean utensils on stainless counter, handwritten study sheet with no readable words. No bare hands touching ready food, no hot steam opening or unsafe stove actions. White editorial headline band with emerald/coral/charcoal. Exact large headline \"떡제조기능사 실기 준비\". Three exact icon captions \"공개문제\" \"전체 연습\" \"위생 정리\". No other readable text, prices, dates, logos, official seals, certificates, watermark or revenue/pass promises. Crisp large correct Hangul within safe margins, natural detailed food photography, educational illustration not actual official exam."
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
