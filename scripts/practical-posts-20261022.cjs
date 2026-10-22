const posts=[...require('./practical-posts-20261022-a.cjs'),...require('./practical-posts-20261022-b.cjs')];
module.exports=posts.map((post,index)=>({...post,
 body:post.body.replaceAll('<table>','<table class="practical-comparison">'),
 image:`/assets/practical-20261022-${index+1}.webp`,
 imageAlt:`${post.title}의 확인 순서를 표현한 AI 제작 설명용 카드뉴스`,
 publishedAt:'2026-10-22',verifiedAt:'2026-10-22'
}));
