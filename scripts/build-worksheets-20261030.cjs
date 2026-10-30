const fs=require('node:fs'),path=require('node:path');
const rows=require('./useful-guides-20261030.cjs');
const dir=path.resolve(__dirname,'../assets/worksheets');fs.mkdirSync(dir,{recursive:true});
const quote=s=>'"'+String(s).replaceAll('"','""')+'"';
for(const g of rows){const w=g.worksheet;const data=[[w.title],['4050가이드 편집 양식 · 공식 신청서·평가표가 아닙니다.'],[w.note],w.headers,...w.rows,...Array.from({length:8},()=>w.headers.map(()=>''))];fs.writeFileSync(path.join(dir,w.id+'.csv'),'\uFEFF'+data.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n');}
console.log('Created '+rows.length+' UTF-8 CSV worksheets');
const report={date:'2026-10-30',scope:'8편의 핵심 글을 독립적인 풀이·판단 예시와 개인 기록 양식으로 다시 작성했습니다. 나머지 208편을 전면 재작성한 작업은 아닙니다. 예시는 편집자가 만든 가정이며 실제 기출·상담·수강·취업 경험이 아닙니다.',articles:rows.map(g=>({slug:g.slug,title:g.title,url:'https://4050guide.co.kr/'+g.slug+'/',worksheet:'/assets/worksheets/'+g.worksheet.id+'.csv',sections:[...g.body.matchAll(/<h2>([^<]+)/g)].map(m=>m[1]),sources:g.sources})),searchPolicy:'국가자격·복지서비스·공공혜택의 검색 화면과 저장된 검색 별칭에서는 광고 태그를 제거합니다. 메인 GET 검색은 광고 로더가 URL을 먼저 검사해 광고 요청을 시작하지 않습니다. 일반 메인·게시글은 광고 연결을 유지합니다.',privacy:'계산·필터의 페이지 메모리 처리, 검색어 URL의 접속기록 가능성, CSV 기기 내 작성 및 업로드 없음으로 안내를 변경했습니다. 개인정보처리방침 3개 사본의 스크립트 없음은 유지합니다.',approval:'AdSense 재검토 요청은 진행하지 않았으며 이 변경은 승인 보장이 아닙니다.'};
fs.writeFileSync(path.resolve(__dirname,'../reports/content-value-improvements-20261030.json'),JSON.stringify(report,null,2)+'\n');
