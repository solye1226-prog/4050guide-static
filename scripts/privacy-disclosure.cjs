function isDisclosure(html) {
  const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
  if(!canonical)return false;
  return decodeURI(new URL(canonical,'https://4050guide.co.kr').pathname)==='/개인정보처리방침/';
}
function cleanDisclosure(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>\s*/gi,'')
    .replace(/<a\b[^>]*data-privacy-settings[^>]*>[\s\S]*?<\/a>/g,'<a href="/개인정보처리방침/#advertising-consent">광고 동의 안내</a>');
}
module.exports={isDisclosure,cleanDisclosure};
