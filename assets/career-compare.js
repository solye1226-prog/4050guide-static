(() => {
 'use strict';
 const form=document.querySelector('#compare-conditions'),data=document.querySelector('#career-condition-data');
 if(!form||!data)return;
 const rows=JSON.parse(data.textContent),inputs=[...form.querySelectorAll('input[name="constraint"]')],status=document.querySelector('#compare-status');
 form.querySelector('fieldset').disabled=false;
 inputs.forEach(input=>{input.checked=false});
 function render(){
  const selected=inputs.filter(input=>input.checked).map(input=>input.value);
  for(const row of rows){
   const list=document.querySelector('[data-result="'+row.id+'"] ul');
   const messages=selected.length?selected.map(key=>row.notes[key]).filter(Boolean):[row.base];
   list.replaceChildren(...messages.map(message=>{const li=document.createElement('li');li.textContent=message;return li;}));
  }
  status.textContent=selected.length?'선택한 조건 '+selected.length+'개에 대해 네 직무의 확인 질문을 정리했습니다.':'직무별로 먼저 확인할 내용입니다.';
 }
 form.addEventListener('submit',event=>event.preventDefault());
 form.addEventListener('change',render);
 form.addEventListener('reset',event=>{event.preventDefault();inputs.forEach(input=>{input.checked=false});render();});
 render();
})();
