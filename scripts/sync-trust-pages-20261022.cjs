const fs=require('node:fs');
const path=require('node:path');
const {isDisclosure,cleanDisclosure}=require('./privacy-disclosure.cjs');
const root=path.resolve(__dirname,'..');
const template=fs.readFileSync(path.join(__dirname,'footer-template.html'),'utf8').trim();
const updates=new Set(['소개','이용약관','개인정보처리방침']);
const modifiedDate=process.env.TRUST_MODIFIED_DATE||'2026-10-22';
if(!/^\d{4}-\d{2}-\d{2}$/.test(modifiedDate))throw new Error('Invalid TRUST_MODIFIED_DATE');
const dateUpdates=new Set((process.env.TRUST_MODIFIED_SLUGS||[...updates].join(',')).split(',').map(s=>'/'+s+'/'));
const canonicalMains=new Map([...updates].map(slug=>{
 const html=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
 return ['/'+slug+'/',html.match(/<main\b[\s\S]*?<\/main>/)[0]];
}));
let pages=0,disclosures=0;
function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 if(entry.name.startsWith('.')||entry.name==='scripts')continue;
 const file=path.join(dir,entry.name);
 if(entry.isDirectory()){visit(file);continue;}
 if(!entry.name.endsWith('.html'))continue;
 let html=fs.readFileSync(file,'utf8'),old=html;
 const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
 const route=canonical?decodeURI(new URL(canonical,'https://4050guide.co.kr').pathname):'';
 if(canonicalMains.has(route))html=html.replace(/<main\b[\s\S]*?<\/main>/,canonicalMains.get(route));
 if(/<footer\b[\s\S]*?<\/footer>/.test(html)){
  html=html.replace(/<footer\b[\s\S]*?<\/footer>/,template);
  if(!html.includes('/assets/footer.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/footer.css?v=20261022">\n</head>');
 }
 if(isDisclosure(html)){html=cleanDisclosure(html);disclosures++;}
 if(canonicalMains.has(route)){
  const descriptions={
   '/소개/':'4050가이드의 개인 운영 방식, 공식 자료 검토 과정, 오류 수정 원칙과 대표 비교 가이드를 소개합니다.',
   '/이용약관/':'4050가이드의 정보 이용 범위, 저장자료 검색 방식, 광고·제휴 구분과 문의 경로를 안내합니다.',
   '/개인정보처리방침/':'4050가이드의 문의 정보, 광고·쿠키, Google 동의 선택과 변경 방법 및 개인정보 문의 경로를 안내합니다.'
  };
  html=html.replace(/(<meta\b[^>]*(?:name|property)=["'](?:description|og:description|twitter:description)["'][^>]*content=["'])[^"']*(["'])/g,(_,a,b)=>a+descriptions[route]+b);
 }
 if(html!==old){fs.writeFileSync(file,html);pages++;}
}}
visit(root);
const sitemapFile=path.join(root,'sitemap.xml');
let sitemap=fs.readFileSync(sitemapFile,'utf8');
sitemap=sitemap.replace(/<url>[\s\S]*?<\/url>/g,block=>{
 const loc=block.match(/<loc>([^<]+)<\/loc>/)?.[1];
 if(!loc)return block;
 const u=new URL(loc);
 return dateUpdates.has(decodeURI(u.pathname))?block.replace(/<lastmod>[^<]+<\/lastmod>/,`<lastmod>${modifiedDate}</lastmod>`):block;
});
fs.writeFileSync(sitemapFile,sitemap);
console.log(JSON.stringify({updatedPages:pages,scriptFreeDisclosureCopies:disclosures}));
