(() => {
 'use strict';
 const root=document.querySelector('[data-catalog]');if(!root)return;
 const cards=[...root.querySelectorAll('.catalog-card')],grid=root.querySelector('#catalog-grid'),filters=[...root.querySelectorAll('[data-topic]')],sort=root.querySelector('#catalog-sort'),more=root.querySelector('#catalog-more'),count=root.querySelector('#catalog-count'),empty=root.querySelector('#catalog-empty'),heading=root.querySelector('#catalog-heading');
 const params=new URLSearchParams(location.search),query=(params.get('s')||'').trim(),normalize=s=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
 const input=root.querySelector('#catalog-query');input.value=query;
 const paths=root.querySelector('.career-paths');if(paths&&(params.has('s')||params.has('topic')))paths.hidden=true;
 let topic=filters.some(b=>b.dataset.topic===params.get('topic'))?params.get('topic'):'all',limit=12;
 if(params.has('s')||params.has('topic')){const meta=document.createElement('meta');meta.name='robots';meta.content='noindex, follow';document.head.append(meta);}
 function render(){
  const terms=query.split(/\s+/).filter(Boolean).map(normalize),matches=cards.filter(card=>(topic==='all'||card.dataset.category===topic)&&terms.every(t=>normalize(card.dataset.search).includes(t)));
  matches.sort((a,b)=>sort.value==='title'?a.dataset.title.localeCompare(b.dataset.title,'ko'):sort.value==='updated'?b.dataset.updated.localeCompare(a.dataset.updated)||Number(a.dataset.order)-Number(b.dataset.order):Number(a.dataset.order)-Number(b.dataset.order));
  cards.forEach(c=>{c.hidden=true});matches.forEach((card,i)=>{grid.append(card);card.hidden=i>=limit});
  filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===topic)));
  const label=filters.find(b=>b.dataset.topic===topic).textContent;
  heading.textContent=params.has('s')?(query?'“'+query+'” 안내글 '+matches.length+'건':'안내글 '+matches.length+'건'):(topic==='all'?'재취업 준비 자료':label+' 안내');
  count.textContent='총 '+matches.length+'편';empty.hidden=matches.length!==0;more.hidden=matches.length<=limit;
  more.textContent='더 보기 ('+Math.max(0,matches.length-limit)+'편 남음)';
 }
 filters.forEach(b=>b.addEventListener('click',()=>{topic=b.dataset.topic;limit=12;render()}));
 sort.addEventListener('change',()=>{limit=12;render()});more.addEventListener('click',()=>{limit+=12;render()});
 render();
})();
