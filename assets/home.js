(() => {
 'use strict';
 const tabs=[...document.querySelectorAll('[data-stage]')];
 if(tabs.length){
  const tablist=document.querySelector('[data-stage-tabs]');tablist.hidden=false;tablist.setAttribute('role','tablist');
  const choose=tab=>{
   tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById('path-'+t.dataset.stage).hidden=!selected;});
  };
  tabs.forEach((tab,index)=>{
   const panel=document.getElementById('path-'+tab.dataset.stage);tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panel.id);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);
   tab.addEventListener('click',()=>choose(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();choose(tabs[next]);tabs[next].focus();}});
  });choose(tabs[0]);
 }
 const form=document.querySelector('#budget-form');
 if(!form)return;
 const $=id=>document.getElementById(id);
 const money=n=>n.toLocaleString('ko-KR')+'원';
 const inputs=['budget-tuition','budget-days','budget-travel','budget-extra'].map($);
 const bInputs=['budget-b-tuition','budget-b-days','budget-b-travel','budget-b-extra'].map($);
 const validInputs=items=>items.every(input=>input.value.trim()!==''&&input.checkValidity()&&Number.isSafeInteger(input.valueAsNumber));
 const values=items=>items.map(input=>input.valueAsNumber);
 const total=([fee,days,travel,extra])=>fee+days*travel+extra;
 function compare(){
  if(!bInputs.every(Boolean))return;
  const validA=validInputs(inputs),validB=validInputs(bInputs);$('budget-b-error').hidden=validB;$('budget-export').disabled=!(validA&&validB);
  if(validB){const b=values(bInputs);$('budget-b-total').textContent=money(total(b));$('budget-b-breakdown').textContent=`훈련비 ${money(b[0])} + 교통비 ${money(b[1]*b[2])} + 준비비 ${money(b[3])}`;}
  else{$('budget-b-total').textContent='계산 대기';$('budget-b-breakdown').textContent='B안의 입력값을 확인해 주세요.';}
  if(!validA||!validB){$('budget-difference').textContent='두 안의 입력값을 확인해 주세요.';$('budget-threshold').textContent='비용 차이 계산을 보류했습니다.';return;}
  const a=values(inputs),b=values(bInputs),delta=total(a)-total(b);
  $('budget-difference').textContent=delta===0?'두 안의 단순 합계가 같습니다.':`${delta>0?'B':'A'}안의 단순 합계가 ${money(Math.abs(delta))} 적습니다.`;
  let text='통학일수가 같아 공통 교통비에 따른 비용 교차점은 없습니다.';
  if(a[2]!==b[2])text='왕복 교통비가 서로 달라 공통 단가 기준은 계산하지 않습니다.';
  else if(a[1]!==b[1]){const threshold=(b[0]+b[3]-a[0]-a[3])/(a[1]-b[1]);text=threshold>=0?`같은 왕복 교통비를 가정하면 비용 순서가 바뀌는 기준은 하루 약 ${money(Math.round(threshold))}입니다. 반올림한 비교용 값입니다.`:'현재 가정에서는 0원 이상 공통 교통비 구간의 비용 교차점이 없습니다.';}
  $('budget-threshold').textContent=text;
 }
 function calculate(){
  const valid=inputs.every(input=>input.value.trim()!==''&&input.checkValidity()&&Number.isSafeInteger(input.valueAsNumber));
  $('budget-error').hidden=valid;
  if(!valid){$('budget-total').textContent='계산 대기';$('budget-breakdown').textContent='입력값을 확인해 주세요.';compare();return;}
  const [fee,days,travel,extra]=inputs.map(input=>input.valueAsNumber);
  $('budget-total').textContent=money(fee+days*travel+extra);
  $('budget-breakdown').textContent=`훈련비 ${money(fee)} + 교통비 ${money(days*travel)} + 준비비 ${money(extra)}`;
  compare();
 }
 $('budget-course').addEventListener('change',()=>{
  const option=$('budget-course').selectedOptions[0];
  $('budget-tuition').value=option.dataset.pay;
  $('budget-days').value=option.dataset.days;
  $('budget-source').href=option.dataset.url;
  $('budget-note').textContent=option.dataset.note+' 일반 표시 부담액이며 개인별 확정 금액이 아닙니다.';
  calculate();
 });
 form.addEventListener('input',calculate);
 form.addEventListener('submit',event=>event.preventDefault());
 if($('budget-b-form')){
  $('budget-b-form').addEventListener('input',compare);$('budget-b-form').addEventListener('submit',event=>event.preventDefault());
  $('budget-b-course').addEventListener('change',()=>{const option=$('budget-b-course').selectedOptions[0];$('budget-b-tuition').value=option.dataset.pay;$('budget-b-days').value=option.dataset.days;$('budget-b-source').href=option.dataset.url;$('budget-b-note').textContent=option.dataset.note+' 일반 표시 부담액이며 개인별 확정 금액이 아닙니다.';compare();});
  $('budget-export').addEventListener('click',()=>{
   if(!validInputs(inputs)||!validInputs(bInputs))return;
   const a=values(inputs),b=values(bInputs),rows=[['4050가이드 훈련비 비교 · 입력값의 단순 산술이며 견적·지원 판정이 아닙니다.'],['항목','A안','B안'],['선택 표본',$('budget-course').selectedOptions[0].textContent,$('budget-b-course').selectedOptions[0].textContent],['원문',$('budget-source').href,$('budget-b-source').href],['부담 훈련비',a[0],b[0]],['통학일수',a[1],b[1]],['왕복 교통비',a[2],b[2]],['추가 준비비',a[3],b[3]],['합계',total(a),total(b)],['A안 합계 - B안 합계',total(a)-total(b)],['입력값 수정 시 표본 원문의 금액과 다를 수 있습니다. 지원금·환급·시험비·기회비용은 자동 산정하지 않습니다.']];
   const csv='\uFEFF'+rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');
   const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='4050-training-cost-comparison.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
 }
 function filter(){
  const group=$('job-group').value,entry=$('job-entry').checked,day=$('job-day').checked;
  let count=0;
  document.querySelectorAll('.focus-jobs tbody tr').forEach(row=>{
   const match=(!group||row.dataset.group===group)&&(!entry||row.dataset.entry==='true')&&(!day||row.dataset.night==='false');
   row.hidden=!match;if(match)count++;
  });
  $('job-count').textContent=`조건에 맞는 표본 ${count}건`;
  $('job-empty').hidden=count!==0;
 }
 ['job-group','job-entry','job-day'].forEach(id=>$(id).addEventListener('change',filter));
 const openJobs=()=>{if(location.hash==='#job-samples'&&$('job-details'))$('job-details').open=true;};
 document.querySelectorAll('a[href="#job-samples"]').forEach(link=>link.addEventListener('click',()=>{if($('job-details'))$('job-details').open=true;}));window.addEventListener('hashchange',openJobs);openJobs();
 calculate();filter();
})();
