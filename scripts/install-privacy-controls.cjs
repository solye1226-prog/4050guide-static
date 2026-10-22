const fs=require('node:fs');
const path=require('node:path');
const {isDisclosure,cleanDisclosure}=require('./privacy-disclosure.cjs');
const root=path.resolve(__dirname,'..');
let count=0;
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 if(e.name.startsWith('.')||e.name==='scripts')continue;
 const file=path.join(dir,e.name);
 if(e.isDirectory()){visit(file);continue;}
 if(!e.name.endsWith('.html'))continue;
 let html=fs.readFileSync(file,'utf8'),old=html;
 if(isDisclosure(html))html=cleanDisclosure(html);
 else {
  if(!html.includes('data-privacy-settings')&&html.includes('class="footer-links"'))html=html.replace('<div class="footer-links">','<div class="footer-links">\n<a href="/개인정보처리방침/#advertising-consent" data-privacy-settings hidden>개인정보·쿠키 설정</a>');
  if(html.includes('data-privacy-settings')&&!html.includes('src="/assets/privacy.js'))html=html.replace('</head>','<script defer src="/assets/privacy.js?v=20261019"></script>\n</head>');
 }
 if(html!==old){fs.writeFileSync(file,html);count++;}
}}
visit(root);
console.log('Privacy controls installed on '+count+' pages');
