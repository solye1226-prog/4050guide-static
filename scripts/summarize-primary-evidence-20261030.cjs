const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const dir=path.resolve(__dirname,'../../4050-source-evidence-20261030');
async function run(){const browser=await chromium.launch();try{
 const page=await browser.newPage(),rows=[];
 for(const file of fs.readdirSync(dir).filter(f=>/^\d+\.json$/.test(f))){
  const record=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  if(record.text)record.text=await page.evaluate(text=>{
   // Some Q-Net fields contain an encoded HTML document inside the first page.
   const doc=new DOMParser().parseFromString(text,'text/html');doc.querySelectorAll('script,style').forEach(n=>n.remove());return doc.body.textContent.replace(/\s+/g,' ').trim();
  },record.text);
  rows.push(record);
 }
 fs.writeFileSync(path.join(dir,'clean.json'),JSON.stringify(rows,null,2));
 for(const r of rows.filter(r=>/jmCd=/.test(r.url)&&process.argv[2]!=='quiet')){
  const code=new URL(r.url).searchParams.get('jmCd');
  console.log(JSON.stringify({code,status:r.status,fees:r.text?.match(/수수료.{0,110}/)?.[0],exam:r.text?.match(/취득방법.{0,1100}/)?.[0],criteria:r.text?.slice(-350)}));
 }
 }finally{await browser.close();}}
run().catch(e=>{console.error(e);process.exitCode=1});
