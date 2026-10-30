const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir='D:/AI-WORK/4050-practical-sources-20261030';
async function run(){const manifest=require(path.join(dir,'manifest.json')),seen=new Set(),downloads=[];
 for(const r of manifest){if(seen.has(r.name))continue;seen.add(r.name);
  for(const f of r.files){const a=[...f.click.matchAll(/'([^']*)'/g)].map(m=>m[1]);const url='https://www.q-net.or.kr/cst006.do?'+new URLSearchParams({id:'cst00602s01',gSite:'Q',fileCode:'R001',filePath:a[0],fileName:a[1],fileSeq:a[2],artlSeq:a[3],href:'0'});
   const response=await fetch(url),data=Buffer.from(await response.arrayBuffer()),extension=path.extname(a[1]).toLowerCase();
   if(extension==='.zip'&&data.toString('ascii',0,2)!=='PK'||extension==='.pdf'&&data.toString('ascii',0,4)!=='%PDF')throw new Error('Not expected file: '+a[1]+' '+data.toString('utf8',0,200));
   const file=path.join(dir,a[2]+extension);fs.writeFileSync(file,data);downloads.push({subject:r.name,title:a[1],article:r.url,url,file,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});console.log(r.name+' '+a[1]+' '+data.length);
  }
 }
 fs.writeFileSync(path.join(dir,'downloads.json'),JSON.stringify(downloads,null,2));
}
run().catch(e=>{console.error(e);process.exitCode=1});
