const fs=require('node:fs'),path=require('node:path');
const dir='D:/AI-WORK/4050-practical-sources-20261030',rows=require(path.join(dir,'pages.json'));
async function run(){const canvas=require('@napi-rs/canvas');global.DOMMatrix=canvas.DOMMatrix;global.ImageData=canvas.ImageData;global.Path2D=canvas.Path2D;
 const pdfjs=await import(require('node:url').pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
 const picks=[
  ['joju','2247065',/※ 시험시간 : 7분/,1],['laundry','2217615.pdf',/./,1],
  ['bread','2246826',/과제명\s+식빵/,1],['cake','2246822',/과제명\s+버터스펀지/,1],
  ['western','2246680',/과제명\s+홀렌다이즈/,1],['japanese','2246684',/과제명\s+달걀말이/,1],
  ['chinese','2246688',/과제명\s+오징어 냉채/,1],['makeup','2247064',/모델기준/,1],
  ['barber','2220015',/과제명\s+단발형 이발\(중상고\)/,1],['environment','2201566.pdf',/./,1]
 ];
 for(const [name,fragment,pattern,num] of picks){const r=rows.find(r=>r.file.includes(fragment)&&pattern.test(r.pages[0].text));if(!r)throw Error('Missing '+name);const doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(r.file)),useSystemFonts:true}).promise;const p=await doc.getPage(num),v=p.getViewport({scale:1.2}),c=canvas.createCanvas(Math.ceil(v.width),Math.ceil(v.height));await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;fs.writeFileSync(path.join(dir,name+'.png'),c.toBuffer('image/png'));await doc.destroy();console.log(name+'.png');}
 const downloads=require(path.join(dir,'downloads.json'));
 const proof={checkedAt:'2026-10-30',scope:'Selected pages and notices listed in value-repair-result were read; public problem PDFs/recipes/images are not republished. Only metadata and hashes retained in repository.',files:downloads.map(({subject,title,article,bytes,sha256})=>({subject,title,article,bytes,sha256}))};
 fs.writeFileSync(path.resolve(__dirname,'../reports/practical-source-files-20261030.json'),JSON.stringify(proof,null,2)+'\n');
}
run().catch(e=>{console.error(e);process.exitCode=1});
