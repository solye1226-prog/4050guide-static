const batches=['a','b','careers','money','training','merged','workpaths','elder','services','medical','planning','jobs','study'];
const posts=batches.flatMap(batch=>require(`./content-repair-20261019-${batch}.cjs`));
if(new Set(posts.map(post=>post.slug)).size!==posts.length)throw new Error('Duplicate repair targets');
const merges=require('./content-merges-20261019.cjs');
const titles={
 '건강보험-피부양자-탈락-기준-4050-체크':'건강보험 피부양자 소득과 재산 기준',
 '국민연금-조기수령-전-확인할-것':'국민연금 조기수령 감액과 소득 기준',
 '주택연금-4050이-부모님-대신-확인할-때-볼-것':'부모님 주택연금 가입조건과 월지급액 확인',
 '퇴직-후-대출-전-확인할-것':'퇴직 후 대출 소득과 상환액 비교',
 '퇴직-후-생활비-계산법':'퇴직 후 생활비와 연금 전 공백자금 계산',
 '퇴직금-중간정산과-퇴직연금-차이':'퇴직금 중간정산과 DB·DC 중도인출 차이',
 '소상공인-정책자금-신청-전-확인할-것':'소상공인 정책자금 융자와 신청조건 확인',
 '중장년-창업지원금-찾는-법':'중장년 창업지원금 공고 찾기와 유형 비교'
};
for(const post of posts){
 if(merges[post.slug])throw new Error('Repair target scheduled for merge '+post.slug);
 post.title=titles[post.slug]||post.title.replace(/:\s*/g,' ').replace(/\s+/g,' ').trim();
 post.related=[...new Set(post.related.map(slug=>merges[slug]||slug))].filter(slug=>slug!==post.slug);
}
module.exports=posts;
