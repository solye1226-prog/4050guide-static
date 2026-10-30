const fs=require('node:fs'),path=require('node:path');
const dir='D:/AI-WORK/4050-practical-sources-20261030';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.pdf')?[path.join(d,e.name)]:[]);
async function run(){const pdfjs=await import(require('node:url').pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href),rows=[];
 for(const file of walk(dir).filter(f=>!f.includes('2246825')&&!f.includes('2246823')&&!f.endsWith('merged.pdf'))){const doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(file)),useSystemFonts:true}).promise,pages=[];
 for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),c=await p.getTextContent();pages.push({page:i,text:c.items.map(x=>x.str).join(' ')});}
 rows.push({file,pages});await doc.destroy();
 }
 fs.writeFileSync(path.join(dir,'pages.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify({files:rows.length,pages:rows.reduce((n,r)=>n+r.pages.length,0)}));
 const needles=['조주기능사','세탁기능사','식빵','버터스펀지','홀랜다이즈','달걀말이','오징어냉채','메이크업','이용사','환경기능사'];
 for(const word of needles){const candidates=rows.filter(r=>r.pages.some(p=>p.text.includes(word)));console.log(JSON.stringify({word,files:candidates.slice(0,5).map(r=>({file:r.file,pages:r.pages.slice(0,2)}))}));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
