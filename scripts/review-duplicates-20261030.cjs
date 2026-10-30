const fs=require('node:fs'),path=require('node:path');
const before=require('../reports/focus-audit-20261030.json');
const merges=require('./content-merges-20261030.cjs');
const reasons=[
 '제과는 포장단위 구매와 사용액·잔량 계산, 화훼는 생화·부자재와 개인 제작 횟수의 선택이다. 비용이라는 공통 표현 외에 재료·시험·준비 결과가 다르다.',
 '굴착기 글은 건설장비 두 종류의 조종·면허 경로 비교, 물류관리사 글은 관리 이론과 장비 운전의 직무 구분이다. 같은 지게차를 비교 축으로 쓰지만 대체 가능한 답이 아니다.',
 '같은 공조냉동 시험의 동관작업 50점·필답 50점 구성과 실습 질문을 반복했다. 공부법에 필답 10문제·시설관리 선택·실습 계약 질문을 합쳤다.',
 '도배는 재단·풀·마감과 3시간20분 작업, 조경은 도면·수목영상감별·시공과 서로 다른 실기일을 다룬다. 종목별 과제와 준비물이 다르다.',
 '방수는 토치램프·환기·화재 예방, 산림은 기계톱·수종·야외 작업구역 통제를 다룬다. 안전이라는 공통어를 이유로 작업 위험을 한 글로 섞지 않는다.',
 '위험물은 분류·화학식과 1시간30분 필답, 전기는 회로 계산과 4시간30분 설비 작업이다. 학습 예시와 실기 환경이 다르다.',
 '기능사·기사 상세 글과 전체 일정 글에 같은 정기검정 날짜와 접수 구분이 반복되었다. 전체 일정에 각각의 필기 상태·응시자격 서류·수험표 확인을 합치고 10월30일 상태로 고쳤다.',
 '전체 일정과 기능사 안내의 같은 4회 달력을 한 번만 유지하도록 통합했다. 기술사·기능장·상시검정 구분도 대표 글에 보존했다.',
 '가구제작과 목공예는 목재 작업 종목의 과목·시간·장비 비교이고, 제과와 제빵은 제조 분야·발효·위생·수험료 비교다. 공통된 비교형 문장 외에 답하는 대상이 다르다.',
 '긴급복지는 위기사유·75% 소득·재산·129와 사후조사, 주거급여는 48% 소득인정액·지역 기준임대료·주택조사를 설명한다. 동시 상담 가능성을 연결하되 하나의 지원금처럼 합치지 않는다.',
 '건축목공은 목구조 도면과 절삭 장비, 도배는 종이·풀·마감의 반복 연습이다. 실습 도구·위험·수험료가 다른 종목이다.',
 '건축목공의 가공·조립과 조경의 도면·감별·시공은 서로 다른 과제다. 준비물이라는 제목 표현만 비슷하다.',
 '버섯종균은 위생·종균 제조 작업, 웹디자인은 파일 경로·제출 폴더·프로그램 환경이다. 실습 환경의 의미가 다르며 서로 대체되지 않는다.',
 '양식조리는 2026 위생·안전 기준과 조리 순서, 조경은 수목감별과 시공을 다룬다. 실기 연습이라는 일반 표현만 공통이다.'
];
if(reasons.length!==before.duplicateCandidates.length)throw new Error('Candidate count changed');
const rows=before.duplicateCandidates.map((c,i)=>({...c,status:merges[c.a.split('/')[1]]||merges[c.b.split('/')[1]]?'통합':'유지',reason:reasons[i]}));
fs.writeFileSync(path.resolve(__dirname,'../reports/duplicate-body-review-20261030.json'),JSON.stringify({checkedAt:'2026-10-30',method:'후보 23개 본문의 질문·시험/제도 대상·표·계산·결론을 비교. 유사도 점수는 통합 판단 근거가 아니라 후보 생성에만 사용.',pairs:rows,redirects:merges},null,2)+'\n');
console.log(JSON.stringify({pairs:rows.length,mergedPairs:rows.filter(r=>r.status==='통합').length,retiredUrls:Object.keys(merges).length,retainedPairs:rows.filter(r=>r.status==='유지').length}));
