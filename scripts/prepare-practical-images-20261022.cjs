const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const manifest=require('./practical-image-manifest-20261022.json');
async function run(){
 for(const image of manifest){
  const output=path.resolve(__dirname,'..','.'+image.output);
  const source=await sharp(image.raw).metadata();
  // Contain preserves all infographic text instead of cropping source edges.
  await sharp(image.raw).resize(1200,750,{fit:'contain',background:'#ffffff'}).webp({quality:82,effort:6}).toFile(output);
  const bytes=fs.statSync(output).size;
  if(bytes>200000)throw Error('Image budget exceeded '+output);
  console.log(JSON.stringify({index:image.index,source:[source.width,source.height],output:[1200,750],bytes}));
 }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
