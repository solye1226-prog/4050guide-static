const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const dir=path.resolve(__dirname,'../../4050-source-evidence-20261030');
const urls=[
 'https://www.q-net.or.kr/crf005.do?gSite=L&gId=61&id=crf00503&gbnn=gbnSubtab1',
 'https://www.q-net.or.kr/crf005.do?gSite=L&gId=59&id=crf00503&gbnn=gbnSubtab1',
 'https://www.myhome.go.kr/hws/portal/cont/selectHousingBenefitView.do?contId=MHC0000000000000003',
 'https://www.myhome.go.kr/hws/portal/cont/selectSupSelfHouseholdsView.do',
 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00005004',
 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00001155',
 'https://www.easylaw.go.kr/CSP/CnpClsMainBtr.laf?ccfNo=2&cciNo=1&cnpClsNo=1&csmSeq=999'
];
async function run(){const browser=await chromium.launch();try{
 const page=await browser.newPage(),rows=[];
 for(const [i,url] of urls.entries()){
  let r={url};try{const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(2500);r.status=response.status();r.text=(await Promise.all(page.frames().map(f=>f.locator('body').innerText({timeout:6000}).catch(()=>'')))).join('\n').replace(/\s+/g,' ').trim();}catch(e){r.error=e.message.split('\n')[0];}
  rows.push(r);console.log(JSON.stringify({url,status:r.status,length:r.text?.length,snippets:[...r.text?.matchAll(/.{0,40}(20,000|21,000|14,000|12.5|1천분의|1,230,834|123만|369,000|15만원|8만원|11만원|120%).{0,100}/g)||[]].map(m=>m[0]).slice(0,8)}));
  fs.writeFileSync(path.join(dir,'rendered.json'),JSON.stringify(rows,null,2));
 }
 }finally{await browser.close();}}
run().catch(e=>{console.error(e);process.exitCode=1});
