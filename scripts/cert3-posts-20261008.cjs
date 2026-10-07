const posts=[...require('./cert3-posts-20261008-a.cjs'),...require('./cert3-posts-20261008-b.cjs')];
const additions={
 '버섯종균기능사-실기-위생-실습':'실습 상담 때에는 사용한 용기와 폐기물의 처리 담당자를 확인하세요. 재배 체험과 종균 제조 교육의 위생 관리 범위가 같은지도 질문합니다.',
 '유기농업기능사-필답형-인증-차이':'학습 노트에도 자격 시험 범위와 인증 표시의 요건을 다른 페이지로 나누세요. 농산물 판매를 계획한다면 자격 취득 사실을 유기인증의 근거로 내세우지 않습니다.',
 '농기계운전기능사-실기-장비-연습':'장비별 연습 기록에는 지도받은 날짜와 직접 한 작업을 적습니다. 아직 연습하지 않은 장비가 있다면 수강 종료 전에 보강 가능 여부를 질문하세요.',
 '가구제작기능사-목공예-실기-차이':'상담에서는 완성품을 가져갈 수 있는지만 묻지 말고 작업 중간의 피드백도 요청하세요. 도면 해석, 재료 표시, 조립 결과를 사진과 메모로 나누어 기록하면 같은 실수를 되풀이했는지 비교할 수 있습니다. 연습이 끝난 후에는 추가 재료를 구입하기 전에 다음 작업의 목표를 지도자와 정합니다.',
 '측량기능사-실기-장비-학원':'장비 이름을 알고 있다는 것과 관측 결과를 설명할 수 있다는 것은 다릅니다. 연습 기록에는 지도받은 장비와 놓친 확인 항목을 적고 다음 수업에서 그 부분의 피드백을 요청하세요.',
 '정보기기운용기능사-네트워크-초보':'설정 연습 후에는 정상 상태와 바꾼 항목을 각각 기록합니다. 결과가 달라졌을 때 임의로 설정을 더 바꾸기보다 허용된 교육 환경에서 원인을 하나씩 확인하는 습관을 만드세요.',
 '미용사-일반-실기-마네킹-연습':'마네킹과 소모품의 개인 보관 공간도 확인하세요. 수업 후 세척·정리와 다음 연습 준비에 필요한 시간을 포함해 수강 일정을 잡는 편이 좋습니다.',
 '떡제조기능사-실기-공개문제-위생':'연습 기록에는 완성 사진뿐 아니라 준비·정리와 위생에서 받은 피드백도 남깁니다. 다음 실습에서 어떤 부분을 다시 확인할지 한 가지씩 정하세요.'
};
const supplementarySources={
 '유기농업기능사-필답형-인증-차이':['국립농산물품질관리원 친환경 인증제도','https://www.enviagro.go.kr/portal/content/html/info/certSys.jsp'],
 '미용사-일반-실기-마네킹-연습':['찾기쉬운 생활법령 미용실 창업·운영','https://www.easylaw.go.kr/CSP/CsmMainBtr.laf?csmSeq=1009'],
 '미용사-피부-실기-모델-준비':['찾기쉬운 생활법령 미용사(피부) 면허 신청','https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=2&cnpClsNo=2&csmSeq=1012'],
 '미용사-네일-실기-재료비-준비':['찾기쉬운 생활법령 미용사(네일) 면허 신청','https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=2&cnpClsNo=2&csmSeq=1010'],
 '떡제조기능사-실기-공개문제-위생':['찾기쉬운 생활법령 식품 영업 신고·허가','https://www.easylaw.go.kr/CSP/CnpClsMainBtr.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=633&popMenu=ov']
};
for(const post of posts){
 post.related=post.related.map(slug=>slug==='건설업-기초안전보건교육-이수증'?'건설업-기초안전보건교육-신청-이수증-재발급':slug);
 if(additions[post.slug])post.body+='<p>'+additions[post.slug]+'</p>';
 if(supplementarySources[post.slug])post.sources.push(supplementarySources[post.slug]);
 if(post.slug.startsWith('미용사-')){
  const name=post.slug.split('-')[1];
  post.sources[0][0]='Q-Net 미용사('+name+') 시험·출제기준';
 }
}
module.exports=posts;
