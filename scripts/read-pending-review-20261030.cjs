const input=require('../reports/fact-review-input-20261030.json');
const pending=new Set(require('../reports/fact-followup-result-20261030.json').articles.filter(p=>p.status.includes('미완료')).map(p=>p.slug));
const start=Number(process.argv[2]||0),count=Number(process.argv[3]||8);
const posts=input.filter(p=>pending.has(p.slug));
for(const [i,p] of posts.slice(start,start+count).entries()) {
 console.log('\n'+(start+i)+' '+p.slug);
 const blocks=p.blocks.filter(b=>/\d|공식|법령|법제처|공단은|대상은|지원대상|의무|제외|고용24는|국시원/.test(b.text));
 console.log(blocks.map(b=>b.text).join('\n').slice(0,Number(process.argv[4]||2200)));
 console.log('SOURCES '+p.sources.filter(s=>!s.url.includes('4050guide.co.kr')).map(s=>s.url).join(' '));
}
