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
function awaitingReveal(){
 return pictures.checked && reveal.checked && !revealed;
}
function advance(){
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
  if(letter==='_st'){
   const label=document.createElement('span');
   label.className='final-st';
   label.textContent=encode?encode('st'):'st';
   glyph.appendChild(label);
  }else glyph.textContent=encode?encode(letter):letter;
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
reveal.addEventListener('change',()=>{revealed=false;updatePictures()});
function restartAlphabet(){
 seen.clear();
 complete=false;
 nextLetter();
}
review.addEventListener('change',restartAlphabet);
pictures.addEventListener('change',restartAlphabet);
count.addEventListener('change',nextLetter);
stage.addEventListener('click',advance);
next.addEventListener('click',advance);
font.addEventListener('change',showLetter);
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
nextLetter();
