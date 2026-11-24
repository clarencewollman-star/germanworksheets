
const words=document.getElementById('words'),style=document.getElementById('style'),size=document.getElementById('size'),pages=document.getElementById('pages'),status=document.getElementById('status'),error=document.getElementById('error'),save=document.getElementById('save');
const frakturSupported=new Set([" ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "\u00a0", "\u00a1", "\u00a2", "\u00a3", "\u00a4", "\u00a5", "\u00a6", "\u00a7", "\u00a8", "\u00a9", "\u00aa", "\u00ab", "\u00ac", "\u00ad", "\u00ae", "\u00af", "\u00b0", "\u00b1", "\u00b2", "\u00b3", "\u00b4", "\u00b5", "\u00b6", "\u00b8", "\u00b9", "\u00ba", "\u00bb", "\u00bc", "\u00bd", "\u00be", "\u00bf", "\u00c0", "\u00c1", "\u00c2", "\u00c3", "\u00c4", "\u00c5", "\u00c6", "\u00c7", "\u00c8", "\u00c9", "\u00ca", "\u00cb", "\u00cc", "\u00cd", "\u00ce", "\u00cf", "\u00d0", "\u00d1", "\u00d2", "\u00d3", "\u00d4", "\u00d5", "\u00d6", "\u00d7", "\u00d8", "\u00d9", "\u00da", "\u00db", "\u00dc", "\u00dd", "\u00de", "\u00df", "\u00e0", "\u00e1", "\u00e2", "\u00e3", "\u00e4", "\u00e5", "\u00e6", "\u00e7", "\u00e8", "\u00e9", "\u00ea", "\u00eb", "\u00ec", "\u00ed", "\u00ee", "\u00ef", "\u00f0", "\u00f1", "\u00f2", "\u00f3", "\u00f4", "\u00f5", "\u00f6", "\u00f7", "\u00f8", "\u00f9", "\u00fa", "\u00fb", "\u00fc", "\u00fd", "\u00fe", "\u00ff", "\u0152", "\u0153", "\u0160", "\u0161", "\u0178", "\u0192", "\u02c6", "\u02dc", "\u2013", "\u2014", "\u2018", "\u2019", "\u201a", "\u201c", "\u201d", "\u201e", "\u2020", "\u2021", "\u2022", "\u2026", "\u2030", "\u2039", "\u203a", "\u2122", "\u2219"]);
const formatted=document.getElementById('formatted');
const supported=new Set(["\u0000","\r"," ","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/","0","1","2","3","4","5","6","7","8","9",":",";","<","=",">","?","@","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_","`","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","{","|","}","~"," ","¤","§","©","ª","«","®","°","²","´","µ","¶","»","¼","½","¾","Ä","Ô","Õ","Ö","Ø","Ù","Û","Ü","Ý","ß","à","á","ä","æ","ç","è","é","ê","í","ï","ó","õ","ö","ø","ú","ü","—","‘","’","‚","“","”","„","†","•","…","‰","€"]);let canvases=[],ready=false;
const cardSet=document.getElementById('card-set');
const pictureCase=document.getElementById('picture-case');
const silentHShow=document.getElementById('silent-h-show');
function pairedLabel(upper,lower){return upper+' '+lower+(lower==='s'?' ſ':'')}
function pictureLabel(card){
 if(cardSet.value==='colors')return card.name;
 if(cardSet.value==='alphabet'){
  if(pictureCase.value==='lower')return card.forms[0];
  if(pictureCase.value==='upper')return card.forms[1];
  return pairedLabel(card.forms[1],card.forms[0]);
 }
 return [...card.forms].reverse().join(' ');
}
function withLongS(cards,isS,makeCard){
 const index=cards.findIndex(isS);
 if(index<0)return cards;
 return [...cards.slice(0,index+1),makeCard(cards[index]),...cards.slice(index+1)];
}
function encodeCard(word){
 const encode=style.value==='Handschrift'?convertHandschrift:style.value==='script'?convert:
  style.value==='fraktur'&&(cardSet.value!=='words'||!formatted.checked)?convertFraktur:text=>text;
 const longS={Handschrift:'Ý',script:'Ý',fraktur:'s',print:'ſ'}[style.value];
 return word.split('ſ').map(part=>encode(part)).join(longS);
}
pictureCase.addEventListener('change',render);
silentHShow.addEventListener('change',render);
const pictureDecks=new Map();
function pictureDeck(kind){
 if(pictureDecks.has(kind))return pictureDecks.get(kind);
 const alphabet=kind==='alphabet';
 const entries=alphabet?[...'abcdefghijklmnopqrstuvwxyz'].map(k=>[k,[k,k.toUpperCase()]]):Object.entries(readerCards);
 const folder=alphabet?'alphabet-reader':'doppellaute-reader';
 const pending=Promise.all(entries.map(async ([key,forms])=>{
  const image=new Image();
  image.src=readerPictures[folder+'/'+key];
  await image.decode();
  return {forms,image};
 }));
 pictureDecks.set(kind,pending);
 pending.catch(()=>pictureDecks.delete(kind));
 return pending;
}
let deck=[];
let selection=0;
async function selectDeck(){
 const revision=++selection;
 const kind=cardSet.value;
 document.getElementById('picture-case-control').hidden=kind!=='alphabet';
 document.getElementById('color-choices').hidden=kind!=='colors';
 document.getElementById('silent-h-control').hidden=kind!=='silent-h';
 const custom=kind==='words';
 document.getElementById('word-controls').hidden=!custom;
 document.getElementById('formatted-label').hidden=!custom||style.value!=='fraktur';
 deck=[];
 render();
 if(custom||kind==='silent-h')return;
 if(kind==='colors'){deck=selectedColors();render();return;}
 try{
  const loaded=await pictureDeck(kind);
  if(revision!==selection)return;
  deck=loaded;
  render();
 }catch{if(revision===selection)error.textContent='Could not load the reader pictures. Reopen the page to try again.'}
}
cardSet.addEventListener('change',selectDeck);
function render(){
if(!ready)return;
pages.replaceChildren();canvases=[];error.textContent='';
const kind=cardSet.value;
const illustrated=['colors','alphabet','sounds'].includes(kind);
const cards=kind==='colors'?selectedColors():kind==='alphabet' && pictureCase.value==='lower'
 ?withLongS(deck,card=>card.forms[0]==='s',card=>({forms:['ſ','S'],image:card.image})):deck;
const list=kind==='silent-h'?silentHDecks[silentHShow.value]:illustrated?cards.map(pictureLabel)
 :words.value.split(/\r?\n/).map(s=>s.trim().normalize('NFC')).filter(Boolean);
save.disabled=true;if(!list.length){status.textContent=kind==='colors'?'Choose at least one color.':illustrated?'Loading pictures…':'Add words to create cards.';return}if(list.length>300){error.textContent='Please use up to 300 cards at a time.';return}const handschrift=style.value==='Handschrift',script=style.value==='script',fraktur=style.value==='fraktur',pt=Math.max(16,Math.min(160,Number(size.value)||64)),converted=list.map(w=>kind==='sounds'&&w==='_st'?'st':w).map(encodeCard);if(script||fraktur||handschrift){const missing=[...new Set(converted.join('').split('').filter(c=>!(handschrift?new Set(Object.keys(handschriftWidths)):fraktur?frakturSupported:supported).has(c)))];if(missing.length){error.textContent='This font does not include: '+missing.join(' ')+'. Use Print or change these characters.';return}}
let fitted=0;
const family=handschrift?'Handschrift':script?'Hand':fraktur?'Fraktur':'Arial';
const textWidth=illustrated?306:540;
const uniformSize=kind==='colors'||kind==='silent-h';
let deckSize=pt;
if(uniformSize){
 const measure=document.createElement('canvas').getContext('2d');
 measure.font=pt+'px '+family;
 for(const word of converted){
  const m=measure.measureText(word);
  const width=Math.max(m.width,m.actualBoundingBoxLeft+m.actualBoundingBoxRight);
  const height=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
  deckSize=Math.min(deckSize,pt*Math.min(1,textWidth/Math.max(1,width),216/Math.max(1,height)));
 }
}

for(let start=0;start<list.length;start+=3){const canvas=document.createElement('canvas');canvas.width=1836;canvas.height=2376;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Flashcards: '+list.slice(start,start+3).join(', '));const c=canvas.getContext('2d');c.scale(3,3);c.fillStyle='white';c.fillRect(0,0,612,792);c.strokeStyle='#a0a0a0';c.lineWidth=.5;c.setLineDash([4,4]);for(const y of [264,528]){c.beginPath();c.moveTo(18,y);c.lineTo(594,y);c.stroke()}c.setLineDash([]);
converted.slice(start,start+3).forEach((word,i)=>{let actual=deckSize;c.font=actual+'px '+family;let m=c.measureText(word);const finalSt=kind==='sounds' && list[start+i]==='_st';
if(!uniformSize){
 const width=Math.max(m.width,m.actualBoundingBoxLeft+m.actualBoundingBoxRight)+(finalSt ? .58*actual:0);
 if(width>textWidth){actual*=textWidth/width;fitted++;c.font=actual+'px '+family;m=c.measureText(word)}
 const height=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
 if(height>216){actual*=216/height;c.font=actual+'px '+family;m=c.measureText(word)}
}
c.fillStyle='#202822';if(illustrated){
 if(kind==='colors'){c.fillStyle=cards[start+i].hex;c.beginPath();c.roundRect(370,i*264+52,194,160,12);c.fill();c.strokeStyle='#999';c.lineWidth=.7;c.stroke();c.fillStyle='#202822';}else{
 const image=cards[start+i].image;
 const scale=Math.min(206/image.naturalWidth,207/image.naturalHeight);
 const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
 c.drawImage(image,467-w/2,i*264+132-h/2,w,h);
 }
}
const lead=finalSt ? .58*actual : 0;
const x=((illustrated?354:612)+lead-m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2+m.actualBoundingBoxLeft;const y=i*264+132+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2;if(finalSt)c.fillRect(x-m.actualBoundingBoxLeft-lead,y-.035*actual,.5*actual,.035*actual);
c.fillText(word,x,y)});canvases.push(canvas);pages.append(canvas)}status.textContent=list.length+' cards · '+canvases.length+' pages'+(fitted?' · '+fitted+' fitted to card width':'');save.disabled=false}
// A self-contained PDF writer: each page embeds its high-resolution rendered card sheet.

function alphabetCards(mode,german){
 const upper=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],lower=[...'abcdefghijklmnopqrstuvwxyz'];
 if(german){upper.push('Ä','Ö','Ü');lower.push('ä','ö','ü')}
 if(mode==='upper')return upper;
 const lowercase=withLongS(lower,letter=>letter==='s',()=>'ſ');
 if(mode==='lower')return german?[...lowercase,'ß']:lowercase;
 if(mode==='separate')return [...upper,...lowercase,...(german?['ß']:[])];
 return [...upper.map((letter,i)=>pairedLabel(letter,lower[i])),...(german?['ß']:[])];
}
document.getElementById('add-alphabet').addEventListener('click',()=>{
 const letters=alphabetCards(document.getElementById('alphabet-style').value,document.getElementById('german-letters').checked);
 const existing=words.value.trimEnd();words.value=(existing?existing+'\n':'')+letters.join('\n');words.dispatchEvent(new Event('input',{bubbles:true}));render();
});
let timer;words.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(render,200)});style.addEventListener('change',()=>{document.getElementById('formatted-label').hidden=cardSet.value!=='words'||style.value!=='fraktur';render()});formatted.addEventListener('change',render);size.addEventListener('input',render);size.addEventListener('change',()=>{size.value=Math.max(16,Math.min(160,Math.round(Number(size.value)||64)));render()});
save.addEventListener('click',()=>{
 clearTimeout(timer);render();if(save.disabled)return;
 const titles={
  colors:'Farben',
  alphabet:'Alphabet',
  sounds:'Doppellaute und Umlaute',
  'silent-h':silentHShow.value==='patterns'?'Stummes h - Buchstabengruppen':'Stummes h - Wörter'
 };
 const title=titles[cardSet.value]||words.value.trim().split(/\s+/).slice(0,3).join(' ').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').replace(/[. ]+$/g,'').slice(0,100);
 GermanPDF.download(makePDF(canvases),'FC '+(title||'Flashcards')+'.pdf');
});
Promise.all([document.fonts.load('64px Handschrift'),document.fonts.load('64px Hand'),document.fonts.load('64px Fraktur')]).then(()=>{ready=true;selectDeck()}).catch(()=>{error.textContent='Could not load the fonts. Reopen the file in your browser.'});

document.getElementById("color-choices").addEventListener("change",render);
