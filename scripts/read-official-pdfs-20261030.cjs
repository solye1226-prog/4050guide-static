const fs=require('node:fs');
async function run(){
 const pdfjs=await import(require('node:url').pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
 const params=new URLSearchParams({id:'man00402s01',gSite:'Q',gId:'',fileCode:'R001',BOARD_ID:'Q001',ARTL_SEQ:'5249930',filePath:'bbs/Q001/Q001_2247085',fileName:'(공고) 2026년도 국가기술자격 상시검정 시행계획(안).pdf',fileSeq:'2247085',href:'0'});
 const urls=['https://www.q-net.or.kr/man004.do?'+params,'https://www.kfsi.or.kr/assets/downloadDoc/33.pdf','https://www.law.go.kr/LSW/flDownload.do?bylClsCd=110201&flSeq=92563945&gubun='];
 const rows=[];
 for(const url of urls){const response=await fetch(url);const data=new Uint8Array(await response.arrayBuffer());const doc=await pdfjs.getDocument({data,useSystemFonts:true}).promise;const pages=[];for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i);const c=await p.getTextContent();pages.push({page:i,text:c.items.map(x=>x.str).join(' ')})}rows.push({url,checkedAt:'2026-10-30',status:response.status,pages});console.log(JSON.stringify({url,pages:pages.filter(p=>/14종목|50문항|160시간/.test(p.text)).map(p=>({page:p.page,text:p.text.slice(0,5000)}))}));}
 fs.writeFileSync('D:/AI-WORK/4050-source-evidence-20261030/official-pdfs.json',JSON.stringify(rows,null,2));
}
run().catch(e=>{console.error(e);process.exitCode=1});
