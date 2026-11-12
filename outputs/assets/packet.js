const kinds=['handwriting','crossword','wordsearch'],labels={handwriting:'Handwriting',crossword:'Crossword',wordsearch:'Word search'};
const text=document.getElementById('text'),preview=document.getElementById('preview'),status=document.getElementById('status'),error=document.getElementById('error'),setup=document.getElementById('setup'),previewButton=document.getElementById('preview-button'),downloadButton=document.getElementById('download-button');
const frames=Object.fromEntries(kinds.map(k=>[k,document.getElementById('frame-'+k)])),ready=new Set(),pending=new Map();let requestId=0,busy=false,cached=null;
function invalidate(){cached=null;if(!busy){preview.replaceChildren();status.textContent='Ready to create your packet.'}}
function selected(){return kinds.filter(k=>document.getElementById('include-'+k).checked)}
function request(kind,method,payload){return new Promise((resolve,reject)=>{const id=++requestId,timer=setTimeout(()=>{pending.delete(id);reject(new Error(labels[kind]+' did not respond. Refresh the page and try again.'))},180000);pending.set(id,{resolve,reject,timer,kind});frames[kind].contentWindow.postMessage({channel:'german-worksheets',type:'request',id,method,payload},'*')})}
window.addEventListener('message',e=>{const d=e.data;if(!d||d.channel!=='german-worksheets'||!frames[d.kind]||e.source!==frames[d.kind].contentWindow)return;
 if(d.type==='ready'){ready.add(d.kind);request(d.kind,'text',text.value).catch(()=>{});if(ready.size===3)status.textContent='Ready to create your packet.'}
 else if(d.type==='height')frames[d.kind].style.height=Math.min(12000,Math.max(150,d.height))+'px';
 else if(d.type==='changed')invalidate();
 else if(d.type==='response'){const p=pending.get(d.id);if(p&&p.kind===d.kind){clearTimeout(p.timer);pending.delete(d.id);d.error?p.reject(new Error(labels[d.kind]+': '+d.error)):p.resolve(d.value)}}
});
let typing;function syncText(){for(const kind of ready)request(kind,'text',text.value).catch(()=>{})}
text.addEventListener('input',()=>{invalidate();clearTimeout(typing);typing=setTimeout(syncText,250)});
for(const kind of kinds)document.getElementById('include-'+kind).addEventListener('change',()=>{document.getElementById('settings-'+kind).hidden=!document.getElementById('include-'+kind).checked;document.getElementById('shared-label').hidden=!(selected().includes('crossword')&&selected().includes('wordsearch'));invalidate()});
document.getElementById('orientation').addEventListener('change',invalidate);
document.getElementById('answers').addEventListener('change',invalidate);document.getElementById('shared').addEventListener('change',invalidate);
function lock(value){busy=value;setup.classList.toggle('busy',value);setup.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=value)}
function showPreview(result){preview.replaceChildren();result.forEach((p,i)=>{const figure=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');image.src=p.dataUrl;image.alt=labels[p.activity]+(p.role==='answer'?' answer key':' worksheet')+', page '+(i+1);caption.textContent=(i+1)+'. Verse '+(p.verse||1)+' · '+labels[p.activity]+(p.role==='answer'?' · Answer key':'');figure.append(image,caption);preview.append(figure)})}
async function assemble(){
 const active=selected();if(!text.value.trim())throw new Error('Paste your text first.');if(!active.length)throw new Error('Choose at least one activity.');if(active.some(k=>!ready.has(k)))throw new Error('The tools are still loading. Please try again in a moment.');
 clearTimeout(typing);const students=[],answers=[];let choices;
 for(const kind of active){status.textContent='Creating '+labels[kind].toLowerCase()+'…';await request(kind,'text',text.value);const share=kind==='wordsearch'&&document.getElementById('shared').checked&&active.includes('crossword');const result=await request(kind,'export',{choices:share?choices:undefined,orientation:document.getElementById('orientation').value});if(kind==='crossword')choices=result.choices;
  for(const p of result.pages){p.activity=kind;(p.role==='answer'?answers:students).push(p)}
 }
 const byVerse=(a,b)=>(a.verse||1)-(b.verse||1)||kinds.indexOf(a.activity)-kinds.indexOf(b.activity);students.sort(byVerse);answers.sort(byVerse);
 return [...students,...(document.getElementById('answers').checked?answers:[])];
}
async function build(download){if(busy)return;error.textContent='';lock(true);try{if(!cached)cached=await assemble();showPreview(cached);status.textContent=cached.length+' pages · ready';if(download){const title=text.value.trim().split(/\s+/).slice(0,3).join(' ').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').replace(/[. ]+$/g,'').slice(0,100);GermanPDF.download(GermanPDF.fromPages(cached),'Packet '+(title||'German Worksheets')+'.pdf')}}catch(e){cached=null;preview.replaceChildren();error.textContent=e.message;status.textContent='Check the settings above.'}finally{lock(false)}}
previewButton.addEventListener('click',()=>build(false));downloadButton.addEventListener('click',()=>build(true));
