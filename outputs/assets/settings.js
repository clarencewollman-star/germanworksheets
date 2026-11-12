/* Browser-local preferences only: never store worksheet text or generated PDFs. */
(() => {
 const embedded=new URLSearchParams(location.search).get('packet')==='1';
 const key='german-worksheets:settings:v1:'+location.pathname+(embedded?':packet':'');
 const controls=[...document.querySelectorAll('select[id],input[id]')].filter(el=>
  el.tagName==='SELECT'||['number','checkbox','radio','range','color'].includes(el.type)
 ).filter(el=>!(embedded&&['orientation','verse-mode'].includes(el.id)));
 let saved={};try{const value=JSON.parse(localStorage.getItem(key)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))saved=value}catch{}
 function restore(el){
  const value=saved[el.id];if(value===undefined)return false;
  if(el.type==='checkbox'||el.type==='radio'){if(typeof value!=='boolean')return false;el.checked=value;return true}
  if(typeof value!=='string')return false;
  if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===value))return false;
  if(el.type==='number'||el.type==='range'){
   const n=Number(value);if(!value.trim()||!Number.isFinite(n)||(el.min!==''&&n<Number(el.min))||(el.max!==''&&n>Number(el.max)))return false;
  }
  el.value=value;return true;
 }
 controls.forEach(restore);
 let restoring=false;
 function save(event){
  const el=event.target;if(restoring||!controls.includes(el))return;
  if(el.type==='number'&&(!el.value||!el.checkValidity()))return;
  saved[el.id]=(el.type==='checkbox'||el.type==='radio')?el.checked:el.value;
  // These controls update one another; retain their resulting state together.
  if(['size','font-size','preset-small','preset-medium','preset-large'].includes(el.id)){
   for(const related of controls.filter(c=>['size','font-size','preset-small','preset-medium','preset-large'].includes(c.id)))saved[related.id]=related.value;
  }
  try{localStorage.setItem(key,JSON.stringify(saved))}catch{}
 }
 document.addEventListener('input',save);document.addEventListener('change',save);
 document.addEventListener('DOMContentLoaded',()=>{
  restoring=true;
  try{
   // Some older generators initialize their own defaults. Restore after that,
   // then notify their existing handlers to update previews and visibility.
   const restored=controls.filter(restore);
   for(const el of restored){
    if(el.id.startsWith('preset-'))continue;
    if(el.id==='font-size'&&document.getElementById('size')?.value!=='custom')continue;
    el.dispatchEvent(new Event('change',{bubbles:true}));
   }
  }finally{restoring=false}
 },{once:true});
})();
