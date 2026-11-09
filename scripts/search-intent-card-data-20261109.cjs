const fs=require('node:fs'),path=require('node:path');
module.exports=require('./search-intent-content-20261109.cjs').map(p=>({...p,title:p.title||fs.readFileSync(path.join(__dirname,'..',p.slug,'index.html'),'utf8').match(/<h1[^>]*>([^<]+)<\/h1>/)[1]}));
