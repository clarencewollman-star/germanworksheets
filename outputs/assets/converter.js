
function decodeFont(text,font){
 const mapping=(font==='Hand'||font==='Handschrift')?{'#':'','$':'','+':'s','ï':'d','Ø':'r','à':'ß','<':'sch','`':'ch','¤':'ck','µ':'tt','{':'ff','\\':'ll','~':'tz','ú':'o','Û':'s','ç':'v','é':'w','æ':'V','è':'W','í':'D','|':'F','õ':'O','ø':'Ö','Ù':'S','ó':'I'}:{'¡':'ch','¿':'ck','|':'tz','–':'s'};
 return [...text].map(c=>Object.prototype.hasOwnProperty.call(mapping,c)?mapping[c]:c).join('');
}
const direction=document.getElementById('direction');
const supports={"Hand": ["\u0000", "\r", " ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "\u00a0", "\u00a4", "\u00a7", "\u00a9", "\u00aa", "\u00ab", "\u00ae", "\u00b0", "\u00b2", "\u00b4", "\u00b5", "\u00b6", "\u00bb", "\u00bc", "\u00bd", "\u00be", "\u00c4", "\u00d4", "\u00d5", "\u00d6", "\u00d8", "\u00d9", "\u00db", "\u00dc", "\u00dd", "\u00df", "\u00e0", "\u00e1", "\u00e4", "\u00e6", "\u00e7", "\u00e8", "\u00e9", "\u00ea", "\u00ed", "\u00ef", "\u00f3", "\u00f5", "\u00f6", "\u00f8", "\u00fa", "\u00fc", "\u2014", "\u2018", "\u2019", "\u201a", "\u201c", "\u201d", "\u201e", "\u2020", "\u2022", "\u2026", "\u2030", "\u20ac"], "Fraktur": [" ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "\u00a0", "\u00a1", "\u00a2", "\u00a3", "\u00a4", "\u00a5", "\u00a6", "\u00a7", "\u00a8", "\u00a9", "\u00aa", "\u00ab", "\u00ac", "\u00ad", "\u00ae", "\u00af", "\u00b0", "\u00b1", "\u00b2", "\u00b3", "\u00b4", "\u00b5", "\u00b6", "\u00b8", "\u00b9", "\u00ba", "\u00bb", "\u00bc", "\u00bd", "\u00be", "\u00bf", "\u00c0", "\u00c1", "\u00c2", "\u00c3", "\u00c4", "\u00c5", "\u00c6", "\u00c7", "\u00c8", "\u00c9", "\u00ca", "\u00cb", "\u00cc", "\u00cd", "\u00ce", "\u00cf", "\u00d0", "\u00d1", "\u00d2", "\u00d3", "\u00d4", "\u00d5", "\u00d6", "\u00d7", "\u00d8", "\u00d9", "\u00da", "\u00db", "\u00dc", "\u00dd", "\u00de", "\u00df", "\u00e0", "\u00e1", "\u00e2", "\u00e3", "\u00e4", "\u00e5", "\u00e6", "\u00e7", "\u00e8", "\u00e9", "\u00ea", "\u00eb", "\u00ec", "\u00ed", "\u00ee", "\u00ef", "\u00f0", "\u00f1", "\u00f2", "\u00f3", "\u00f4", "\u00f5", "\u00f6", "\u00f7", "\u00f8", "\u00f9", "\u00fa", "\u00fb", "\u00fc", "\u00fd", "\u00fe", "\u00ff", "\u0152", "\u0153", "\u0160", "\u0161", "\u0178", "\u0192", "\u02c6", "\u02dc", "\u2013", "\u2014", "\u2018", "\u2019", "\u201a", "\u201c", "\u201d", "\u201e", "\u2020", "\u2021", "\u2022", "\u2026", "\u2030", "\u2039", "\u203a", "\u2122", "\u2219"]};
supports.Handschrift=Object.keys(handschriftWidths);
const input=document.getElementById('input'),output=document.getElementById('output'),font=document.getElementById('font'),preview=document.getElementById('preview'),copy=document.getElementById('copy'),status=document.getElementById('status'),hint=document.getElementById('hint'),warning=document.getElementById('warning');
function updatePreview(){const fontFile={Hand:'MexMW-BWHandSchrift-LightDB.ttf',Handschrift:'HANDSHRIFT_complete.ttf',Fraktur:'tfrakmed.ttf'}[font.value];const downloadFont=document.getElementById('download-font');downloadFont.href='assets/'+fontFile;downloadFont.download=fontFile;downloadFont.setAttribute('aria-label','Download '+font.options[font.selectedIndex].text+' font');const reverse=direction.value==='decode';preview.style.fontFamily=reverse?'system-ui':font.value;preview.style.fontSize=reverse?'24px':'40px';document.querySelector('label[for=input]').textContent=reverse?'Font-formatted text':'German text';document.querySelector('label[for=output]').textContent=reverse?'German text':'Converted text';scheduleLayout();copy.disabled=!output.value;status.textContent='';const allowed=new Set(supports[font.value]);const missing=[...new Set([...output.value].filter(c=>!allowed.has(c)&&!['\n','\r','\t'].includes(c)))];warning.textContent=!reverse&&missing.length?'This font does not include: '+missing.join(' '):'';hint.textContent=reverse?'Reverse conversion interprets special characters as font codes. Review punctuation and any manually chosen letter forms.':''}
function runConversion(){const text=input.value.normalize('NFC');output.value=direction.value==='decode'?decodeFont(text,font.value):font.value==='Handschrift'?convertHandschrift(text):font.value==='Hand'?convert(text):convertFraktur(text);updatePreview()}
direction.addEventListener('change',runConversion);input.addEventListener('input',runConversion);font.addEventListener('change',runConversion);output.addEventListener('input',updatePreview);
copy.addEventListener('click',async()=>{const text=output.value;try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(text);status.textContent=direction.value==='decode'?'Copied German text.':'Copied. Paste into Word and select the matching font.'}catch{output.focus();output.select();let copied=false;try{copied=document.execCommand('copy')}catch{}status.textContent=copied?'Copied.':'Text selected. Press Ctrl+C to copy.'}});
const layoutControl=id=>document.getElementById(id);
const printPages=layoutControl('print-pages');
let canSharePDF=false;
const sizeField=layoutControl('print-size');
const pdfName='German text.pdf';
let shareFile=null, shareTimer;
try{
 const mobile=/iPhone|iPod|iPad|Android/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 canSharePDF=mobile && !!navigator.share && !!navigator.canShare?.({files:[new File([],pdfName,{type:'application/pdf'})]});
}catch{canSharePDF=false}
function makePreviewPDF(){
 return GermanPDF.fromSVG([...preview.children],pageWidth,pageHeight).then(pages=>GermanPDF.fromPages(pages));
}
let layoutRevision=0, pageWidth, pageHeight;
async function scheduleLayout(){
 const revision=++layoutRevision;
 printPages.disabled=true;shareFile=null;clearTimeout(shareTimer);
 const family=direction.value==='decode'?'system-ui':font.value;
 const size=Math.min(96,Math.max(8,Number(layoutControl('print-size').value)||24));
 await document.fonts.load(size+'px '+family);
 if(revision!==layoutRevision)return;
 const landscape=layoutControl('orientation').value==='Landscape';
 pageWidth=landscape?792:612;
 pageHeight=landscape?612:792;
 const columns=Number(layoutControl('column-count').value)||1;
 const margin=48,gap=24,width=(pageWidth-2*margin-gap*(columns-1))/columns;
 const lineHeight=size*1.5, capacity=Math.floor((pageHeight-2*margin)/lineHeight);
 const ctx=document.createElement('canvas').getContext('2d');
 ctx.font=size+'px '+family;
 ctx.fontKerning='none';
 const ns='http://www.w3.org/2000/svg';
 preview.replaceChildren();
 let sheet,column=columns-1,row=capacity;
 function advance(){
  column=(column+1)%columns;row=0;
  if(column===0){
   sheet=document.createElementNS(ns,'svg');
   sheet.setAttribute('viewBox','0 0 '+pageWidth+' '+pageHeight);
   preview.appendChild(sheet);
  }
 }
 function wrap(line){
  const lines=[];let current='';
  for(const word of line.trim().split(/\s+/)){
   const joined=current?current+' '+word:word;
   if(ctx.measureText(joined).width<=width){current=joined;continue}
   if(current)lines.push(current);
   current='';
   for(const ch of word){
    if(current && ctx.measureText(current+ch).width>width){lines.push(current);current=''}
    current+=ch;
   }
  }
  return [...lines,current];
 }
 for(const verse of output.value.trim().split(/\n\s*\n/).filter(Boolean)){
  const lines=verse.split(/\r?\n/).flatMap(wrap);
  if(row>=capacity || (layoutControl('keep-verse').checked && row && row+1+Math.min(lines.length,capacity)>capacity))advance();
  else if(row && ++row>=capacity)advance();
  for(const line of lines){
   if(row>=capacity)advance();
   const node=document.createElementNS(ns,'text');
   for(const [key,value] of Object.entries({x:margin+column*(width+gap),y:margin+row*lineHeight+size,'font-size':size,'font-family':family,'font-kerning':'none',fill:'black'}))node.setAttribute(key,value);
   node.textContent=line;sheet.appendChild(node);row++;
  }
 }
 const pages=Array.from(preview.children);
 if(pages.length>1){
  pages.forEach((page,index)=>{
   const footer=document.createElementNS(ns,'text');
   footer.setAttribute('x',pageWidth-margin);
   footer.setAttribute('y',pageHeight-margin/2);
   footer.setAttribute('text-anchor','end');
   footer.setAttribute('font-family','Arial');
   footer.setAttribute('font-size','10');
   footer.setAttribute('fill','#444');
   footer.textContent=(index+1)+' / '+pages.length;
   page.appendChild(footer);
  });
 }
 printPages.disabled=!pages.length;
 if(canSharePDF && !printPages.disabled){
  printPages.disabled=true;
  shareTimer=setTimeout(async()=>{
   try{
    const blob=await makePreviewPDF();
    if(revision!==layoutRevision)return;
    shareFile=new File([blob],pdfName,{type:'application/pdf'});
    printPages.disabled=false;
   }catch{if(revision===layoutRevision)printPages.disabled=false}
  },200);
 }
}
for(const id of ['orientation','column-count','keep-verse']){
 layoutControl(id).addEventListener('change',scheduleLayout);
}
let lastSize=Number(sizeField.value)||24;
sizeField.addEventListener('input',()=>{
 if(sizeField.valueAsNumber>=8 && sizeField.valueAsNumber<=96){
  lastSize=Number(sizeField.value);
  scheduleLayout();
 }
});
sizeField.addEventListener('change',()=>{
 const size=Math.min(96,Math.max(8,Number(sizeField.value)||lastSize));
 sizeField.value=String(size);
 if(size!==lastSize){lastSize=size;scheduleLayout()}
});
printPages.addEventListener('click',async()=>{
 try{
  const file=shareFile;
  if(file){
   try{await navigator.share({files:[file]})}
   catch(error){if(error.name!=='AbortError')GermanPDF.save(file,pdfName)}
   return;
  }
  const blob=await makePreviewPDF();
  GermanPDF.save(blob,pdfName);
 }catch(error){status.textContent='Could not create the PDF. '+error.message}
});
updatePreview();