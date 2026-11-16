const stage=document.getElementById('stage');
const font=document.getElementById('font');
const casing=document.getElementById('casing');
const full=document.getElementById('full');
const lowercase='abcdefghijklmnopqrstuvwxyzäöüß';
const uppercase='ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';
const count=document.getElementById('letter-count');
let letters=[];
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
  glyph.textContent=encode?encode(letter):letter;
  return glyph;
 }));
 stage.dataset.count=letters.length;
 stage.classList.toggle('multiple',letters.length>1);
 stage.setAttribute('aria-label',letters.join(', ')+' — next page');
}
function nextLetter(){
 const pool=casing.value==='lower'?lowercase:casing.value==='upper'?uppercase:lowercase+uppercase;
 const choices=[...pool].filter(letter=>!letters.includes(letter));
 letters=[];
 for(let i=0;i<Number(count.value);i++){
  const index=Math.floor(Math.random()*choices.length);
  letters.push(choices.splice(index,1)[0]);
 }
 showLetter();
}
count.addEventListener('change',nextLetter);
stage.addEventListener('click',nextLetter);
document.getElementById('next').addEventListener('click',nextLetter);
font.addEventListener('change',showLetter);
casing.addEventListener('change',nextLetter);
document.addEventListener('keydown',event=>{
 if(!['Space','ArrowRight','PageDown'].includes(event.code)||event.target.closest('select, input'))return;
 if(event.code==='Space' && event.target.closest('button'))return;
 event.preventDefault();
 if(!event.repeat)nextLetter();
});
full.hidden=!stage.requestFullscreen;
full.addEventListener('click',async()=>{
 try{await stage.requestFullscreen();stage.focus()}
 catch{stage.focus()}
});
nextLetter();
