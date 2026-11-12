/* Packet Builder embeds the real generator page and calls its public export API. */
(() => {
 if(window.parent===window||new URLSearchParams(location.search).get('packet')!=='1')return;
 const kind=document.body.dataset.generator,api=window.GermanGenerator;
 const verseControl=document.getElementById('verse-mode');if(verseControl)verseControl.value='separate';
 const send=data=>parent.postMessage({channel:'german-worksheets',kind,...data},'*');
 const css=document.createElement('style');css.textContent=`body{background:white}main{margin:0!important;padding:10px!important;max-width:none!important}main>a,header,h1,#pages,#source,label[for=source],#song,label[for=song],#generate,#download,#print,#orientation,label[for=orientation],#verse-mode,label[for=verse-mode]{display:none!important}.controls,.panel{margin:0!important;padding:8px!important;border:0!important;box-shadow:none!important}#review select{max-width:100%}`;document.head.append(css);
 function resize(){const el=document.querySelector('main')||document.body;send({type:'height',height:Math.ceil(el.getBoundingClientRect().height)+22})}
 new ResizeObserver(resize).observe(document.querySelector('main')||document.body);
 document.addEventListener('input',()=>send({type:'changed'}));document.addEventListener('change',()=>send({type:'changed'}));
 window.addEventListener('message',async event=>{
  if(event.source!==parent||event.data?.channel!=='german-worksheets'||event.data.type!=='request')return;
  const {id,method,payload}=event.data;
  try{let value;
   if(method==='text'){api.setText(String(payload||''));value=true}
   else if(method==='export'){value=await api.exportPages(payload?.choices,payload?.orientation,true)}
   else throw new Error('Unknown packet operation.');
   send({type:'response',id,value});resize();
  }catch(e){send({type:'response',id,error:e.message||String(e)})}
 });
 document.fonts.ready.then(()=>{send({type:'ready'});resize()});
})();
