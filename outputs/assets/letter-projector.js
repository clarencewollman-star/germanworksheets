const stage=document.getElementById('stage');
const font=document.getElementById('font');
const casing=document.getElementById('casing');
const full=document.getElementById('full');
const lowercase='abcdefghijklmnopqrstuvwxyzäöüß';
const uppercase='ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';
const count=document.getElementById('letter-count');
const pictures=document.getElementById('pictures');
const reveal=document.getElementById('reveal');
const next=document.getElementById('next');
const review=document.getElementById('review');
let keys=[];
let revealed=false;
let letters=[];
const seen=new Set();
let complete=false;
const firstNumber=document.getElementById('range-start');
const lastNumber=document.getElementById('range-end');
const numberOrder=document.getElementById('number-order');
let remainingNumbers=[],currentNumber=null,numberFamily='Arial';
function germanNumber(n){
 const small=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
 const tens=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
 if(n<20)return small[n];
 if(n<100){
  const unit=n%10;
  return (unit?(unit===1?'ein':small[unit])+'und':'')+tens[Math.floor(n/10)];
 }
 const base=n<1000?100:1000,high=Math.floor(n/base);
 return (high===1?'ein':germanNumber(high))+(base===100?'hundert':'tausend')+(n%base?germanNumber(n%base):'');
}
function chooseNumberFont(){
 numberFamily=font.value==='mixed'?['Arial','Hand','Handschrift','Fraktur'][Math.floor(Math.random()*4)]:font.value;
}
async function renderNumber(){
 if(currentNumber===null)return;
 const numeral=String(currentNumber),name=germanNumber(currentNumber);
 const labels=numberOrder.value==='name'?[name,numeral]:[numeral,name];
 const pending=numberOrder.value!=='together'&&!revealed;
 if(pending)labels.pop();
 next.textContent=pending?(numberOrder.value==='name'?'Reveal number':'Reveal name'):'Next number';
 stage.setAttribute('aria-label',labels.join(', ')+' — '+next.textContent);
 stage.replaceChildren(...labels.map(label=>{
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),text=document.createElementNS(ns,'text');
  const encode={Hand:convert,Handschrift:convertHandschrift,Fraktur:convertFraktur}[numberFamily];
  text.textContent=encode?encode(label):label;
  text.setAttribute('font-size','100');text.setAttribute('font-family',numberFamily);text.setAttribute('fill','#15271d');
  svg.appendChild(text);
  function fit(){
   if(!svg.isConnected)return;
   const box=text.getBBox();
   svg.setAttribute('viewBox',[box.x-5,box.y-5,box.width+10,box.height+10].join(' '));
  }
  queueMicrotask(fit);
  document.fonts.load('100px '+numberFamily,text.textContent).then(fit);
  return svg;
 }));
}
function drawNumber(){
 const lo=firstNumber.valueAsNumber,hi=lastNumber.valueAsNumber;
 const invalid=!Number.isInteger(lo)||!Number.isInteger(hi)||lo<0||hi>9999||lo>hi;
 document.getElementById('range-error').hidden=!invalid;
 next.disabled=stage.disabled=invalid;
 if(invalid){currentNumber=null;stage.replaceChildren();stage.removeAttribute('aria-label');return}
 if(!remainingNumbers.length)remainingNumbers=Array.from({length:hi-lo+1},(_,i)=>lo+i);
 const index=Math.floor(Math.random()*remainingNumbers.length);
 currentNumber=remainingNumbers[index];
 remainingNumbers[index]=remainingNumbers.at(-1);
 remainingNumbers.pop();
 revealed=false;
 stage.dataset.completion='✓ Range complete';
 stage.classList.toggle('alphabet-complete',!remainingNumbers.length);
 chooseNumberFont();
 renderNumber();
}
const colorOrder=document.getElementById('color-order');
let remainingColors=[],currentColor=null;
function renderColor(){
 stage.replaceChildren();
 if(!currentColor)return;
 const pending=colorOrder.value!=='together'&&!revealed;
 next.textContent=pending?(colorOrder.value==='name'?'Reveal color':'Reveal name'):'Next color';
 const swatch=document.createElement('span');swatch.className='color-swatch';swatch.style.background=currentColor.hex;
 const label=document.createElement('canvas');label.className='color-name';
 const encode={Hand:convert,Handschrift:convertHandschrift,Fraktur:convertFraktur}[numberFamily];
 const showSwatch=!pending||colorOrder.value==='color';
 const showName=!pending||colorOrder.value==='name';
 if(showSwatch)stage.append(swatch);
 if(showName){stage.append(label);paintLetter(label,numberFamily,encode?encode(currentColor.name):currentColor.name).then(()=>{label.style.width='auto';label.style.height='30%';});}
 stage.setAttribute('aria-label',(showName?currentColor.name:'Color swatch')+' — '+next.textContent);
}
function drawColor(){
 const chosen=selectedColors();
 next.disabled=stage.disabled=!chosen.length;
 if(!chosen.length){currentColor=null;stage.replaceChildren();stage.classList.remove('alphabet-complete');stage.setAttribute('aria-label','Choose at least one color');return;}
 if(!remainingColors.length)remainingColors=chosen.slice();
 currentColor=remainingColors.splice(Math.floor(Math.random()*remainingColors.length),1)[0];
 revealed=false;chooseNumberFont();
 stage.dataset.completion='✓ Colors complete';stage.classList.toggle('alphabet-complete',!remainingColors.length);renderColor();
}
colorOrder.addEventListener('change',()=>{revealed=false;if(review.value==='colors')renderColor()});
document.getElementById('color-choices').addEventListener('change',()=>{remainingColors=[];if(review.value==='colors')drawColor()});
function changeReview(){
 const numbers=review.value==='numbers',colors=review.value==='colors';
 document.getElementById('color-order-control').hidden=!colors;
 document.getElementById('color-choices').hidden=!colors;
 stage.classList.toggle('colors',colors);
 for(const control of document.querySelectorAll('[data-number-control]'))control.hidden=!numbers;
 for(const control of [casing,count,pictures])control.closest('label').hidden=numbers||colors;
 stage.classList.toggle('numbers',numbers);
 document.getElementById('range-error').hidden=true;
 next.disabled=stage.disabled=false;
 if(colors){stage.classList.remove('sounds','multiple','with-pictures');document.getElementById('reveal-option').hidden=true;remainingColors=[];drawColor();return;}
 if(numbers){
  stage.classList.remove('sounds','multiple','with-pictures');
  document.getElementById('reveal-option').hidden=true;
  remainingNumbers=[];drawNumber();
 }else restartAlphabet();
}
function awaitingReveal(){
 return pictures.checked && reveal.checked && !revealed;
}
function advance(){
 if(review.value==='colors'){if(!revealed&&colorOrder.value!=='together'){revealed=true;renderColor()}else drawColor();return;}
 if(review.value==='numbers'){
  if(currentNumber===null)return;
  if(!revealed && numberOrder.value!=='together'){revealed=true;renderNumber()}
  else drawNumber();
  return;
 }
 if(awaitingReveal()){
  revealed=true;
  updatePictures();
 }else nextLetter();
}
function updatePictures(){
 document.getElementById('reveal-option').hidden=!pictures.checked;
 const action=awaitingReveal()?'Reveal pictures':'Next page';
 next.textContent=action;
 stage.setAttribute('aria-label',letters.join(', ')+(complete?' — '+stage.dataset.completion:'')+' — '+action);
 stage.classList.toggle('with-pictures',pictures.checked);
 Array.from(stage.children).forEach((glyph,index)=>{
  let image=glyph.querySelector('img');
  if(!pictures.checked){
   image?.remove();
   return;
  }
  if(!image){
   image=document.createElement('img');
   image.alt='';
   image.draggable=false;
   image.src=review.value==='sounds'?'assets/doppellaute-reader/'+keys[index]+'.jpg?v=2':'assets/alphabet-reader/'+keys[index]+'.png';
   glyph.appendChild(image);
  }
  image.style.visibility=awaitingReveal()?'hidden':'visible';
 });
}
// Legacy script fonts store entry and exit strokes as separate characters.
 // At their advance boundaries the two outlines can leave a small step or gap.
function joinScriptStroke(ctx,boundary,em){
 const radius=Math.round(em*.016);
 const x=Math.round(boundary)-radius, width=2*radius+1;
 if(x<0 || x+width>ctx.canvas.width)return;
 const h=ctx.canvas.height;
 const pixels=ctx.getImageData(x,0,width,h);
 function runs(column){
  const spans=[];
  let start=-1;
  for(let y=0;y<=h;y++){
   const ink=y<h && pixels.data[(y*width+column)*4+3]>=128;
   if(ink && start<0)start=y;
   if(!ink && start>=0){spans.push([start,y]);start=-1}
  }
  return spans;
 }
 const a=runs(0),b=runs(width-1);
 // Only bridge unambiguous single strokes, never a loop or a separate mark.
 if(a.length!==1 || b.length!==1 || Math.abs(a[0][0]-b[0][0])>em*.06)return;
 ctx.clearRect(x+1,0,width-2,h);
 ctx.beginPath();
 ctx.moveTo(x+1,a[0][0]);ctx.lineTo(x+width-1,b[0][0]);
 ctx.lineTo(x+width-1,b[0][1]);ctx.lineTo(x+1,a[0][1]);
 ctx.closePath();ctx.fill();
}
// Rasterize complete glyph runs at a fixed resolution so changing the projection
// size never rounds the component strokes separately at the final display size.
async function paintLetter(canvas,family,text){
 const em=768;
 const descriptor=em+'px '+family;
 await document.fonts.load(descriptor,text);
 if(!canvas.isConnected)return;
 const ctx=canvas.getContext('2d');
 ctx.font=descriptor;
 const metrics=ctx.measureText(text);
 const pad=4;
 const left=Math.ceil(metrics.actualBoundingBoxLeft)+pad;
 const ascent=Math.ceil(metrics.actualBoundingBoxAscent)+pad;
 canvas.width=Math.max(1,left+Math.ceil(metrics.actualBoundingBoxRight)+pad);
 canvas.height=Math.max(1,ascent+Math.ceil(metrics.actualBoundingBoxDescent)+pad);
 ctx.font=descriptor;
 ctx.fillStyle='#15271d';
 ctx.fillText(text,left,ascent);
 if(family==='Hand'||family==='Handschrift'){
  if(text.startsWith('#'))joinScriptStroke(ctx,left+ctx.measureText('#').width,em);
  if(text.endsWith('$'))joinScriptStroke(ctx,left+ctx.measureText(text.slice(0,-1)).width,em);
 }
 canvas.style.width=canvas.width/em+'em';
 canvas.style.height=canvas.height/em+'em';
}
function showLetter(){
 const encoders={Hand:convert,Handschrift:convertHandschrift,Fraktur:convertFraktur};
 const available=['Arial','Hand','Handschrift','Fraktur'];
 stage.replaceChildren(...letters.map(letter=>{
  let family=font.value;
  if(family==='mixed'){
   const index=Math.floor(Math.random()*available.length);
   family=available.splice(index,1)[0];
  }
  const encode=encoders[family];
  const glyph=document.createElement('span');
  glyph.style.fontFamily=family+', sans-serif';
  const label=document.createElement('span');
  const finalSt=letter==='_st';
  if(finalSt)label.className='final-st';
  const text=finalSt?'st':letter;
  const encoded=encode?encode(text):text;
  if(encode){
   const canvas=document.createElement('canvas');
   label.appendChild(canvas);
   paintLetter(canvas,family,encoded).catch(()=>{label.textContent=encoded});
  }else label.textContent=text;
  glyph.appendChild(label);
  return glyph;
 }));
 updatePictures();
 stage.dataset.count=letters.length;
 stage.classList.toggle('multiple',letters.length>1);

}
function nextLetter(){
 revealed=false;
 const pool=casing.value==='lower'?lowercase:casing.value==='upper'?uppercase:lowercase+uppercase;
 if(complete)seen.clear();
 const sounds=review.value==='sounds';
 stage.classList.toggle('sounds',sounds);
 stage.dataset.completion=sounds?'✓ Doppellaute complete':'✓ Alphabet complete';
 const alphabet=sounds?Object.keys(readerCards):[...new Set([...pool].map(letter=>letter.toLowerCase()))]
  .filter(letter=>!pictures.checked || /^[a-z]$/.test(letter));
 const previous=keys;
 keys=[];
 const choices=alphabet.slice();
 letters=[];
 for(let i=0;i<Number(count.value);i++){
  const unseen=choices.filter(letter=>!seen.has(letter));
  const candidates=unseen.length?unseen:choices;
  const fresh=candidates.filter(letter=>!previous.includes(letter));
  const available=fresh.length?fresh:candidates;
  const key=available[Math.floor(Math.random()*available.length)];
  choices.splice(choices.indexOf(key),1);
  seen.add(key);
  keys.push(key);
  let forms;
  if(sounds){
   const variants=readerCards[key];
   forms=casing.value==='mixed'?variants:[casing.value==='upper'?variants.at(-1):variants[0]];
  }else forms=[...pool].filter(letter=>letter.toLowerCase()===key);
  letters.push(forms[Math.floor(Math.random()*forms.length)]);
 }
 complete=alphabet.every(letter=>seen.has(letter));
 stage.classList.toggle('alphabet-complete',complete);
 showLetter();
}
reveal.addEventListener('change',()=>{if(!['numbers','colors'].includes(review.value)){revealed=false;updatePictures()}});
function restartAlphabet(){
 if(['numbers','colors'].includes(review.value))return;
 seen.clear();
 complete=false;
 nextLetter();
}
review.addEventListener('change',changeReview);
for(const field of [firstNumber,lastNumber])field.addEventListener('input',()=>{if(review.value==='numbers'){remainingNumbers=[];drawNumber()}});
numberOrder.addEventListener('change',()=>{if(review.value==='numbers'){revealed=false;renderNumber()}});
pictures.addEventListener('change',restartAlphabet);
count.addEventListener('change',()=>{if(!['numbers','colors'].includes(review.value))nextLetter()});
stage.addEventListener('click',advance);
next.addEventListener('click',advance);
font.addEventListener('change',()=>{if(review.value==='colors'){chooseNumberFont();renderColor()}else if(review.value==='numbers'){chooseNumberFont();renderNumber()}else showLetter()});
casing.addEventListener('change',restartAlphabet);
document.addEventListener('keydown',event=>{
 if(!['Space','ArrowRight','PageDown'].includes(event.code)||event.target.closest('select, input'))return;
 if(event.code==='Space' && event.target.closest('button'))return;
 event.preventDefault();
 if(!event.repeat)advance();
});
const projection=document.getElementById('projection');
full.hidden=!projection.requestFullscreen;
document.getElementById('exit-full').addEventListener('click',()=>document.exitFullscreen());
full.addEventListener('click',async()=>{
 try{await projection.requestFullscreen();stage.focus()}
 catch{stage.focus()}
});
changeReview();
