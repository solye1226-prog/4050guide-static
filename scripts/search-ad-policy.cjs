const searchPaths=new Set(['/국가자격-검색/','/복지서비스-검색/','/공공혜택-검색/']);
const tag=/<script\b[^>]*src=["'][^"']*(?:pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js|\/assets\/home-ads\.js)[^"']*["'][^>]*>[\s\S]*?<\/script>\s*/gi;
function applyAdPolicy(html,file=''){
 const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
 if(!canonical)return html;
 const url=new URL(canonical.replaceAll('&amp;','&'),'https://4050guide.co.kr');
 const route=decodeURI(url.pathname);
 const search=searchPaths.has(route)||url.searchParams.has('s')||/index\.html_s=/.test(file);
 if(search)return html.replace(tag,'');
 if(route==='/'){
  html=html.replace(tag,'');
  if(!html.includes('name="google-adsense-account"'))html=html.replace('</head>','<meta name="google-adsense-account" content="ca-pub-2258793659580551">\n</head>');
  html=html.replace('</head>','<script defer src="/assets/home-ads.js?v=20261030"></script>\n</head>');
 }
 return html;
}
module.exports={applyAdPolicy,searchPaths};
