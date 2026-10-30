const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const dir='D:/AI-WORK/4050-practical-sources-20261030';
const names=['조주기능사','세탁기능사','제빵기능사','제과기능사','양식조리기능사','일식조리기능사','중식조리기능사','미용사(메이크업)','이용사','환경기능사'];
async function run(){fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch();try{const p=await browser.newPage(),records=[];
 const list=await(await fetch('https://www.q-net.or.kr/cst006.do?id=cst00601&code=1204&gSite=Q')).text();console.log(list.slice(list.indexOf('<select name="schType"'),list.indexOf('<select name="schType"')+650));
 for(const name of names){
 const params=new URLSearchParams({id:'cst00601s01',gSite:'Q',page:'1',schText:name,schType:'T',brdId:'Q006',code:'1204'});
 const html=await(await fetch('https://www.q-net.or.kr/cst006.do?'+params)).text();
 const entries=await p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return [...d.querySelectorAll('tbody tr')].map(tr=>({title:tr.querySelector('td[title]')?.getAttribute('title'),date:tr.querySelector('.date')?.textContent,click:tr.querySelector('a[onclick]')?.getAttribute('onclick')}))},html);
 for(const entry of entries.filter(e=>e.click)){
 const args=[...entry.click.matchAll(/'([^']*)'/g)].map(m=>m[1]);
 const url='https://www.q-net.or.kr/cst006.do?'+new URLSearchParams({id:'cst00602',gSite:'Q',artlSeq:args[0],brdId:args[2],code:args[3],cst:args[4]});
 const detail=await(await fetch(url)).text();fs.writeFileSync(path.join(dir,args[0]+'.html'),detail);
 const parsed=await p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {text:(d.querySelector('#contents')||d.body).textContent.replace(/\s+/g,' ').trim(),files:[...d.querySelectorAll('[onclick]')].map(n=>({text:n.textContent.trim(),click:n.getAttribute('onclick')})).filter(n=>/fileDown|filedown|download/i.test(n.click))}},detail);
 records.push({name,...entry,url,...parsed});
 }
 console.log(JSON.stringify({name,entries:records.filter(r=>r.name===name).map(r=>({title:r.title,date:r.date,url:r.url,files:r.files}))}));
 }
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(records,null,2));
 }finally{await browser.close()}}
run().catch(e=>{console.error(e);process.exitCode=1});
