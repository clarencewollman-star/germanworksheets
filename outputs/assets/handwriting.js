const handFont=document.getElementById('hand-font');
function handwritingConvert(text){return handFont.value==='Handschrift'?convertHandschrift(text):convert(text)}
handFont.addEventListener('change',()=>{encoded.value=handwritingConvert(source.value);document.fonts.load('26px '+handFont.value).then(render)});

const source=document.getElementById('source'),encoded=document.getElementById('encoded'),size=document.getElementById('size'),pages=document.getElementById('pages'),status=document.getElementById('status'),warning=document.getElementById('warning'),printButton=document.getElementById('print');
const fontSize=document.getElementById('font-size');
const worksheetType=document.getElementById('worksheet-type');
const includeOriginal=document.getElementById('include-original');
const originalFont=document.getElementById('original-font');
const originalPassageEncoders={Hand:convert,Handschrift:convertHandschrift,Fraktur:convertFraktur};
function includesOriginalPassage(){return worksheetType.value==='missing'&&includeOriginal.checked}
function originalPassageFont(){return originalFont.value==='worksheet'?handFont.value:originalFont.value}
const orientation=document.getElementById('orientation');
try{const savedLayout=localStorage.getItem('handwriting-page-layout');if(['portrait','landscape'].includes(savedLayout))orientation.value=savedLayout}catch{}
function pageDimensions(){return orientation.value==='portrait'?{w:612,h:792}:{w:792,h:612}}
function applyPageLayout(){const {w,h}=pageDimensions();document.getElementById('page-layout').textContent='@page{size:letter '+orientation.value+';margin:0}@media print{.page,.page svg{width:'+w/72+'in;height:'+h/72+'in}}';}
orientation.addEventListener('change',()=>{try{localStorage.setItem('handwriting-page-layout',orientation.value)}catch{}render()});
const traceShade=document.getElementById('trace-shade');
try{const savedShade=localStorage.getItem('handwriting-trace-shade');if(['#dedede','#b8b8b8','#909090','#606060','#202020'].includes(savedShade))traceShade.value=savedShade}catch{}
traceShade.addEventListener('change',()=>{try{localStorage.setItem('handwriting-trace-shade',traceShade.value)}catch{}render()});
const repeatCount=document.getElementById('repeat-count'),blankGuides=document.getElementById('blank-guides');
const presetDefaults={small:30,medium:40,large:50};
const presets={...presetDefaults};
const presetStorageKey='handwriting-size-presets:v2';
try {
 const stored=localStorage.getItem(presetStorageKey);
 const saved=JSON.parse(stored ?? localStorage.getItem('handwriting-size-presets') ?? '{}');
 const oldDefaults={small:20,medium:26,large:34};
 for(const key of Object.keys(presets)){
  const value=saved?.[key];
  // Older browsers saved all three values even when only one had been edited.
  if(stored===null && value===oldDefaults[key])continue;
  if(Number.isInteger(value) && value>=16 && value<=120)presets[key]=value;
 }
}catch{}
function refreshPresets(){
 for(const [key,value] of Object.entries(presets)){
  document.getElementById('preset-'+key).value=value;
  size.querySelector('option[value="'+key+'"]').textContent=key[0].toUpperCase()+key.slice(1)+' · '+value+' pt';
 }
}
refreshPresets();
if(size.value!=='custom')fontSize.value=presets[size.value];
const presetStatus=document.getElementById('preset-status');
for(const key of Object.keys(presets)){
 document.getElementById('preset-'+key).addEventListener('change',event=>{
  presets[key]=Math.max(16,Math.min(120,Math.round(Number(event.target.value)||presetDefaults[key])));
  refreshPresets();
  try {
   const overrides=Object.entries(presets).filter(([name,value])=>value!==presetDefaults[name]);
   localStorage.setItem(presetStorageKey,JSON.stringify(Object.fromEntries(overrides)));
   presetStatus.textContent='Sizes saved.';
  }catch{
   presetStatus.textContent='Sizes updated for this session; browser storage is unavailable.';
  }
  if(size.value===key){fontSize.value=presets[key];render()}
 });
}
const widths={"\u0000": 0, "\r": 500, " ": 504, "!": 507, "\"": 591, "#": 154, "$": 200, "%": 838, "&": 733, "'": 292, "(": 723, ")": 557, "*": 605, "+": 421, ",": 374, "-": 524, ".": 220, "/": 731, "0": 510, "1": 436, "2": 519, "3": 485, "4": 548, "5": 519, "6": 494, "7": 476, "8": 529, "9": 488, ":": 312, ";": 397, "<": 939, "=": 1059, ">": 688, "?": 658, "@": 685, "A": 836, "B": 796, "C": 734, "D": 746, "E": 615, "F": 630, "G": 692, "H": 338, "I": 662, "J": 672, "K": 771, "L": 711, "M": 1305, "N": 910, "O": 550, "P": 701, "Q": 722, "R": 910, "S": 597, "T": 656, "U": 966, "V": 991, "W": 1359, "X": 819, "Y": 1030, "Z": 591, "[": 647, "\\": 788, "]": 598, "^": 750, "_": 863, "`": 488, "a": 572, "b": 477, "c": 291, "d": 439, "e": 465, "f": 341, "g": 603, "h": 332, "i": 296, "j": 301, "k": 550, "l": 392, "m": 764, "n": 526, "o": 445, "p": 493, "q": 573, "r": 520, "s": 408, "t": 487, "u": 526, "v": 653, "w": 833, "x": 515, "y": 655, "z": 483, "{": 691, "|": 630, "}": 833, "~": 836, "\u00a0": 630, "\u00a4": 770, "\u00a7": 637, "\u00a9": 850, "\u00aa": 783, "\u00ab": 796, "\u00ae": 808, "\u00b0": 1083, "\u00b2": 591, "\u00b4": 796, "\u00b5": 983, "\u00b6": 883, "\u00bb": 744, "\u00bc": 861, "\u00bd": 874, "\u00be": 859, "\u00c4": 836, "\u00d4": 446, "\u00d5": 704, "\u00d6": 550, "\u00d8": 520, "\u00d9": 597, "\u00db": 532, "\u00dc": 989, "\u00dd": 372, "\u00df": 705, "\u00e0": 683, "\u00e1": 477, "\u00e4": 574, "\u00e6": 963, "\u00e7": 557, "\u00e8": 1359, "\u00e9": 731, "\u00ea": 515, "\u00ed": 700, "\u00ef": 397, "\u00f3": 646, "\u00f5": 550, "\u00f6": 446, "\u00f8": 550, "\u00fa": 446, "\u00fc": 526, "\u2014": 1025, "\u2018": 655, "\u2019": 296, "\u201a": 374, "\u201c": 591, "\u201d": 591, "\u201e": 627, "\u2020": 780, "\u2022": 244, "\u2026": 814, "\u2030": 1076, "\u20ac": 684}, supported=new Set(Object.keys(widths));
// Manual conventions inferred from the user's examples; editable for word-specific choices.
function width(text,pt){return [...text].reduce((sum,ch)=>sum+((handFont.value==='Handschrift'?handschriftWidths:widths)[ch]??600),0)*pt/1000}
// Keep Handschrift four points beyond the top of its slant guide.
function writingStart(pt){return handFont.value==='Handschrift'?28+pt*(.214*.72+.08+.981*.62):Math.max(48,32+pt*.597)}
function wrapToWidth(text,limit,measure){
 const lines=[];
 for(const paragraph of text.split('\n')){
  let line='';
  for(const word of paragraph.split(/\s+/).filter(Boolean)){
   const joined=line?line+' '+word:word;
   if(measure(joined)<=limit){
    line=joined;
    continue;
   }
   if(line)lines.push(line);
   line='';
   if(measure(word)<=limit){
    line=word;
    continue;
   }
   for(const char of word){
    if(line&&measure(line+char)>limit){
     lines.push(line);
     line='';
    }
    line+=char;
   }
  }
  lines.push(line);
 }
 return lines;
}
function wrap(text,pt){return wrapToWidth(text,pageDimensions().w-48-writingStart(pt),line=>width(line,pt))}
function worksheetRows(text,pt,repeats,blanks){const rows=[];for(let n=0;n<repeats;n++){for(const line of wrap(text,pt)){rows.push({text:line,guide:!!line});if(line)for(let b=0;b<blanks;b++)rows.push({text:'',guide:true})}}return rows}

function missingWordRows(passage,pt,pageWidth){
 const paragraphs=passage.normalize('NFC').trim().split(/\r?\n/);
 const lastLine=paragraphs.at(-1);
 const referencePattern=/^(?:[1-4]\.?\s*)?[\p{L}\p{M}][\p{L}\p{M} .-]*\s+\d+:\d+(?:[-–]\d+)?(?:,\s*\d+(?:[-–]\d+)?)*$/u;
 const reference=referencePattern.test(lastLine.trim())?paragraphs.pop().trim():'';
 const wordParts=/[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*|[^\p{L}\p{M}]+/gu;
 const limit=pageWidth-48-writingStart(pt),space=width(' ',pt);
 const rows=[];
 let wordNumber=0;
 for(const paragraph of paragraphs){
  let parts=[],used=0;
  for(const token of paragraph.split(/\s+/).filter(Boolean)){
   // Wrap a whole token so quotation marks and other punctuation stay with its word.
   const tokenParts=token.match(wordParts).map(part=>{
    const text=handwritingConvert(part);
    const advance=width(text,pt);
    if(/^\p{L}/u.test(part)&&++wordNumber%2===0){
     return {advance:Math.max(pt*1.8,advance*1.25)};
    }
    return {advance,text};
   });
   const tokenWidth=tokenParts.reduce((sum,part)=>sum+part.advance,0);
   if(tokenWidth>limit)return {error:'A word is too wide for this page. Choose a smaller size or the Landscape layout.'};
   if(parts.length&&used+space+tokenWidth>limit){
    rows.push(parts);
    parts=[];
    used=0;
   }
   if(parts.length)used+=space;
   for(const part of tokenParts){
    parts.push({...part,x:used});
    used+=part.advance;
   }
  }
  rows.push(parts);
 }
 if(wordNumber<2)return {error:'Add at least two words to make a missing-word worksheet.'};
 return {rows,reference};
}

const ns='http://www.w3.org/2000/svg';
function node(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e}

function worksheetPage(pageWidth,pageHeight,label,studentFields=true){
 const page=document.createElement('div');
 page.className='page';
 const svg=node('svg',{viewBox:'0 0 '+pageWidth+' '+pageHeight,role:'img','aria-label':label+' page '+(pages.children.length+1)});
 svg.append(node('rect',{width:pageWidth,height:pageHeight,fill:'white'}));
 if(studentFields){
  svg.append(node('text',{x:48,y:66,'font-family':'Arial,sans-serif','font-size':10,fill:'#555'},'Name: __________________________'));
  svg.append(node('text',{x:pageWidth-48,y:66,'text-anchor':'end','font-family':'Arial,sans-serif','font-size':10,fill:'#555'},'Datum: __________________'));
 }
 page.append(svg);
 pages.append(page);
 return svg;
}

function drawWritingGuides(svg,pageWidth,baseline,pt){
 const isHandschrift=handFont.value==='Handschrift';
 const blue='#a4e9f8',red='#ff9297',left=24,right=pageWidth-24;
 const top=baseline-pt*(isHandschrift?.6:.8),bottom=baseline+pt*(isHandschrift?.381:.466),mid=baseline-pt*(isHandschrift?.214:.31);
 for(const [y,color,dash] of [[top,blue,false],[mid,blue,true],[baseline,red,false],[bottom,blue,false]]){
  const attrs={x1:left,x2:right,y1:y,y2:y,stroke:color,'stroke-width':.5};
  if(dash)attrs['stroke-dasharray']='3.5 3.5';
  svg.append(node('line',attrs));
 }
 // HANDSHFT's t/l downstrokes rise about 1 unit for 0.62 units across (~58 degrees).
 const marker=isHandschrift?(baseline-mid)*.72:pt*.22;
 const markerY=isHandschrift?mid+((baseline-mid)-marker)/2:baseline-pt*.265;
 const slantStart=isHandschrift?left+marker+pt*.08:left+pt*.28;
 const slantEnd=isHandschrift?slantStart+(bottom-top)*.62:left+pt*.597;
 svg.append(node('line',{x1:slantStart,y1:bottom,x2:slantEnd,y2:top,stroke:blue,'stroke-width':.5}));
 for(const x of [left,right-marker])svg.append(node('rect',{x,y:markerY,width:marker,height:marker,fill:blue}));
}

function drawWorksheetText(svg,text,x,y,pt,fill,family=handFont.value||'Hand'){
 svg.append(node('text',{x,y,'font-family':family,'font-size':pt,fill,'font-kerning':'none','font-variant-ligatures':'none'},text));
}

function renderTracing(text,pt,repeats,blanks,pageWidth,pageHeight){
 const lines=worksheetRows(text,pt,repeats,blanks);
 const isHandschrift=handFont.value==='Handschrift';
 const step=pt*(isHandschrift?1.25:1.6),firstBaseline=84+pt*(isHandschrift?.6:.8);
 const perPage=Math.max(1,Math.floor((pageHeight-24-pt*.55-firstBaseline)/step+1e-9)+1);
 for(let offset=0;offset<lines.length;offset+=perPage){
  const svg=worksheetPage(pageWidth,pageHeight,'Tracing worksheet');
  for(let i=0;i<perPage;i++){
   const row=lines[offset+i]||{text:'',guide:true};
   if(!row.guide)continue;
   const baseline=firstBaseline+i*step;
   drawWritingGuides(svg,pageWidth,baseline,pt);
   drawWorksheetText(svg,row.text,writingStart(pt),baseline,pt,traceShade.value);
  }
 }
}

const passageMeasure=document.createElement('canvas').getContext('2d');

function renderOriginalPassage(text,pt,pageWidth,pageHeight){
 const selectedFont=originalPassageFont();
 const family=selectedFont==='Arial'?'Arial, sans-serif':selectedFont;
 const modelSize=Math.min(pt,22),margin=48,firstBaseline=margin+modelSize;
 const paragraph=text.normalize('NFC').trim();
 const content=originalPassageEncoders[selectedFont]?.(paragraph)??paragraph;
 passageMeasure.font=modelSize+'px '+family;
 passageMeasure.fontKerning='none';
 const lines=wrapToWidth(content,pageWidth-margin*2,line=>{
  const metrics=passageMeasure.measureText(line);
  return Math.max(0,metrics.actualBoundingBoxLeft)+Math.max(metrics.width,metrics.actualBoundingBoxRight);
 });
 const originalPage=()=>worksheetPage(pageWidth,pageHeight,'Original passage',false);
 let svg=originalPage(),y=firstBaseline;
 for(const line of lines){
  if(line){
   const metrics=passageMeasure.measureText(line);
   const topBaseline=Math.max(firstBaseline,margin+metrics.actualBoundingBoxAscent);
   y=Math.max(y,topBaseline);
   if(y+Math.max(modelSize*.55,metrics.actualBoundingBoxDescent)>pageHeight-margin){
    svg=originalPage();
    y=topBaseline;
   }
   const x=margin+Math.max(0,metrics.actualBoundingBoxLeft);
   drawWorksheetText(svg,line,x,y,modelSize,'#202020',family);
  }
  y+=modelSize*1.45;
 }
}

function renderMissingWords(exercise,pt,repeats,blanks,pageWidth,pageHeight){
 const isHandschrift=handFont.value==='Handschrift';
 const step=pt*(isHandschrift?1.25:1.6),ascender=pt*(isHandschrift?.6:.8),descender=pt*.55;
 const bottom=pageHeight-24,x=writingStart(pt),shade=traceShade.value;
 const referenceLines=exercise.reference?wrap(handwritingConvert(exercise.reference),pt):[];
 const newPage=()=>worksheetPage(pageWidth,pageHeight,'Missing-word worksheet');
 const firstBaseline=84+ascender;
 let svg=newPage(),baseline=firstBaseline;
 function ensureRow(){
  if(baseline+descender<=bottom)return;
  svg=newPage();
  baseline=firstBaseline;
 }
 for(let repeat=0;repeat<repeats;repeat++){
  for(const parts of exercise.rows){
   if(!parts.length){
    baseline+=step;
    continue;
   }
   ensureRow();
   drawWritingGuides(svg,pageWidth,baseline,pt);
   for(const part of parts){
    const start=x+part.x;
    if(part.text!==undefined)drawWorksheetText(svg,part.text,start,baseline,pt,shade);
    else svg.append(node('line',{class:'missing-word-line',x1:start,x2:start+part.advance,y1:baseline,y2:baseline,stroke:'#b63238','stroke-width':1.35}));
   }
   baseline+=step;
   for(let blank=0;blank<blanks;blank++){
    ensureRow();
    drawWritingGuides(svg,pageWidth,baseline,pt);
    baseline+=step;
   }
  }
  for(const line of referenceLines){
   ensureRow();
   drawWritingGuides(svg,pageWidth,baseline,pt);
   drawWorksheetText(svg,line,x,baseline,pt,shade);
   baseline+=step;
  }
 }
}

function render(){
 applyPageLayout();
 const {w:pageWidth,h:pageHeight}=pageDimensions();
 const pt=Math.max(16,Math.min(120,Number(fontSize.value)||presets.medium));
 const omitWords=worksheetType.value==='missing';
 const text=omitWords?handwritingConvert(source.value):encoded.value;
 const alphabet=handFont.value==='Handschrift'?new Set(Object.keys(handschriftWidths)):supported;
 const missing=[...new Set([...text].filter(ch=>!alphabet.has(ch)&&!['\n','\r','\t'].includes(ch)))];
 warning.textContent=missing.length?'This font has no character for: '+missing.join(' ')+' — replace these characters before printing.':'';
 pages.replaceChildren();
 if(!text.trim()){
  status.textContent='Add text to create a worksheet.';
  printButton.disabled=true;
  return;
 }
 const repeats=Math.max(1,Math.min(100,Math.round(Number(repeatCount.value)||1)));
 const blanks=Number(blankGuides.value);
 if(omitWords){
  const exercise=missingWordRows(source.value,pt,pageWidth);
  if(exercise.error){
   warning.textContent=exercise.error;
   status.textContent='';
   printButton.disabled=true;
   return;
  }
  if(includesOriginalPassage())renderOriginalPassage(source.value,pt,pageWidth,pageHeight);
  renderMissingWords(exercise,pt,repeats,blanks,pageWidth,pageHeight);
 }else{
  renderTracing(text,pt,repeats,blanks,pageWidth,pageHeight);
 }
 status.textContent=pages.children.length+' '+orientation.value+' page'+(pages.children.length===1?'':'s');printButton.disabled=missing.length>0;
}

function syncWorksheetType(){
 const omitWords=worksheetType.value==='missing';
 document.getElementById('original-passage-option').hidden=!omitWords;
 document.getElementById('original-font-option').hidden=!includesOriginalPassage();
 document.getElementById('handwriting-codes').hidden=omitWords;
}
syncWorksheetType();
function refreshOriginalPassage(){
 syncWorksheetType();
 if(includesOriginalPassage())document.fonts.load('22px '+originalPassageFont()).then(render);
 render();
}
worksheetType.addEventListener('change',refreshOriginalPassage);
includeOriginal.addEventListener('change',refreshOriginalPassage);
originalFont.addEventListener('change',refreshOriginalPassage);
repeatCount.addEventListener('input',render);repeatCount.addEventListener('change',()=>{repeatCount.value=Math.max(1,Math.min(100,Math.round(Number(repeatCount.value)||1)));render()});blankGuides.addEventListener('change',render);
source.addEventListener('input',()=>{encoded.value=handwritingConvert(source.value);render()});encoded.addEventListener('input',render);size.addEventListener('change',()=>{document.getElementById('custom-size').hidden=size.value!=='custom';if(size.value==='custom'){fontSize.focus();return}fontSize.value=presets[size.value];render()});
function updateSize(value){const pt=Math.max(16,Math.min(120,Math.round(Number(value)||presets.medium)));fontSize.value=pt;size.value='custom';render()}
fontSize.addEventListener('input',()=>{if(fontSize.value&&Number(fontSize.value)>=16&&Number(fontSize.value)<=120)updateSize(fontSize.value)});fontSize.addEventListener('change',()=>updateSize(fontSize.value));printButton.addEventListener('click',downloadWorksheetPDF);
document.fonts.load('26px Hand').then(()=>{encoded.value=handwritingConvert(source.value);render()}).catch(()=>{status.textContent='The handwriting font could not load. Reopen the file in Edge or Chrome.'});
async function exportHandwritingPages(){
 if(includesOriginalPassage())await document.fonts.load('22px '+originalPassageFont());
 await document.fonts.ready;render();if(printButton.disabled)throw new Error(warning.textContent||'Add text to create a worksheet.');const {w,h}=pageDimensions();return GermanPDF.fromSVG([...pages.querySelectorAll('svg')].map(s=>s.cloneNode(true)),w,h);
}
async function downloadWorksheetPDF(){printButton.disabled=true;printButton.textContent='Creating PDF…';try{const result=await exportHandwritingPages();const title=source.value.trim().split(/\s+/).slice(0,3).join(' ').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').slice(0,100);GermanPDF.download(GermanPDF.fromPages(result),'HW '+(title||'Worksheet')+'.pdf')}catch(e){warning.textContent=e.message}finally{printButton.textContent='Save PDF';render()}}

window.GermanGenerator={setText(text){if(source.value!==text){source.value=text;source.dispatchEvent(new Event("input",{bubbles:true}))}},async exportPages(shared,layout,groupVerses=false,groupSize=1){const previous=orientation.value,originalText=source.value,originalEncoded=encoded.value;try{if(layout)orientation.value=layout;if(!groupVerses)return {pages:await exportHandwritingPages()};const verses=originalText.trim().split(/\r?\n[ \t]*\r?\n(?:[ \t]*\r?\n)*/).filter(v=>v.trim()),result=[];const size=Number.isInteger(groupSize)&&groupSize>0?groupSize:1;
 for(let start=0;start<verses.length;start+=size){
   source.value=verses.slice(start,start+size).join('\n\n');
   encoded.value=handwritingConvert(source.value);
   const pages=await exportHandwritingPages();
   result.push(...pages.map(page=>({...page,verse:start+1})));
 }
 return {pages:result}}finally{source.value=originalText;encoded.value=originalEncoded;orientation.value=previous;render()}}};
