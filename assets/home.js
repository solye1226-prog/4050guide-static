(() => {
 'use strict';
 const form=document.querySelector('#budget-form');
 if(!form)return;
 const $=id=>document.getElementById(id);
 const money=n=>n.toLocaleString('ko-KR')+'원';
 const inputs=['budget-tuition','budget-days','budget-travel','budget-extra'].map($);
 function calculate(){
  const valid=inputs.every(input=>input.value.trim()!==''&&input.checkValidity()&&Number.isSafeInteger(input.valueAsNumber));
  $('budget-error').hidden=valid;
  if(!valid){$('budget-total').textContent='계산 대기';$('budget-breakdown').textContent='입력값을 확인해 주세요.';return;}
  const [fee,days,travel,extra]=inputs.map(input=>input.valueAsNumber);
  $('budget-total').textContent=money(fee+days*travel+extra);
  $('budget-breakdown').textContent=`훈련비 ${money(fee)} + 교통비 ${money(days*travel)} + 준비비 ${money(extra)}`;
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
 calculate();filter();
})();
