const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),output=path.resolve(root,'../4050-source-evidence-20261030');
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch(),page=await browser.newPage();
 try{
  const rows=require('../reports/fact-review-input-20261030.json'),urls=[...new Set(rows.flatMap(r=>r.sources.map(s=>s.url)))];
  const records=[];
  for(const [i,url] of urls.entries()){
   const cached=path.join(output,i+'.json');if(fs.existsSync(cached)){records.push(JSON.parse(fs.readFileSync(cached,'utf8')));continue;}
   let record={url,checkedAt:'2026-10-30'};
   try{
    const target=new URL(url);
    // The Q-Net detail summary loads exam facts in a public sub-tab.
    if(target.hostname.endsWith('q-net.or.kr')&&target.pathname==='/crf005.do'&&target.searchParams.has('jmCd')){target.searchParams.set('id','crf00503s02');target.searchParams.set('jmInfoDivCcd','B0');}
    const response=await page.request.get(target.href,{timeout:18000});
    const bytes=await response.body(),charset=response.headers()['content-type']?.match(/charset=([^; ]+)/i)?.[1]||'utf-8';
    const html=new TextDecoder(charset).decode(bytes);
    record={...record,requestedUrl:target.href,status:response.status(),...await page.evaluate(html=>{
     const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,nav,header,footer').forEach(n=>n.remove());
     const main=doc.querySelector('#contents')||doc.querySelector('#content')||doc.querySelector('main')||doc.body;
     return {title:doc.title,text:main.textContent.replace(/\s+/g,' ').trim()};
    },html)};
   }catch(e){record.error=e.message.split('\n')[0];}
   records.push(record);fs.writeFileSync(cached,JSON.stringify(record,null,2)+'\n');
   console.log(`${i+1}/${urls.length} ${record.status||'ERROR'} ${new URL(url).hostname}`);
  }
  fs.writeFileSync(path.join(output,'all.json'),JSON.stringify(records,null,2)+'\n');console.log('Research cache saved outside site: '+output);
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
