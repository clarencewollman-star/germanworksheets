function puzzleFontFamily(){return clueFont.value==='Handschrift'?'Handschrift':'Fraktur'}
function puzzleFontText(text){return clueFont.value==='Handschrift'?convertHandschrift(text):convertFraktur(text)}
let pageWidth=612,pageHeight=792;



const song=document.getElementById('song'),generate=document.getElementById('generate'),download=document.getElementById('download'),message=document.getElementById('message'),pages=document.getElementById('pages');let sheets=[];let lastStudentCount=0,lastChosen=[];
const clueFont=document.getElementById('clue-font');
const puzzleSize=document.getElementById('puzzle-size');
puzzleSize.addEventListener('change',()=>{sheets=[];pages.replaceChildren();download.disabled=true;message.textContent='Size updated. Click Create crossword.'});
const verseMode=document.getElementById('verse-mode');
function puzzleVerses(text){const verses=splitVerses(text);return verseMode.value==='together'&&verses.length?[verses.flat()]:verses}
function verseLabel(index){const count=splitVerses(song.value).length;return verseMode.value==='together'&&count>1?'1–'+count:index+1}
const key=(x,y)=>x+','+y;
function candidates(line){return [...line.matchAll(/[A-Za-zÄÖÜäöüßẞ]+/g)].map(m=>({raw:m[0],word:m[0].toLocaleUpperCase('de-DE').replace(/ẞ/g,'SS'),index:m.index})).filter(c=>c.word.length>=3&&c.word.length<=24)}
function fit(board,word,x,y,dir){const dx=dir===0?1:0,dy=1-dx;if(board.has(key(x-dx,y-dy))||board.has(key(x+word.length*dx,y+word.length*dy)))return -1;let crosses=0;for(let i=0;i<word.length;i++){const xx=x+i*dx,yy=y+i*dy,cell=board.get(key(xx,yy));if(cell){if(cell.ch!==word[i]||cell.dirs.has(dir))return -1;crosses++}else if(board.has(key(xx-dy,yy-dx))||board.has(key(xx+dy,yy+dx)))return -1}return crosses}
function place(board,e){const dx=e.dir===0?1:0,dy=1-dx;[...e.word].forEach((ch,i)=>{const k=key(e.x+i*dx,e.y+i*dy),old=board.get(k);if(old)old.dirs.add(e.dir);else board.set(k,{ch,dirs:new Set([e.dir])})})}
function bounds(entries){return {minX:Math.min(...entries.map(e=>e.x)),minY:Math.min(...entries.map(e=>e.y)),maxX:Math.max(...entries.map(e=>e.x+(e.dir===0?e.word.length-1:0))),maxY:Math.max(...entries.map(e=>e.y+(e.dir===1?e.word.length-1:0)))}}
const fillerWords=new Set('und der die das den dem des ein eine einer eines einem einen es ist sind war waren wird werden sei seien sich ich du er sie wir ihr im am an auf aus bei mit von zu zum zur für oder aber auch als so da daß dass'.toUpperCase().split(' '));
let wordChoices={};
function wordScore(c){return (fillerWords.has(c.word)?-100:0)+(c.word.length>=4&&c.word.length<=10?20:0)+Math.min(c.word.length,10)}
function optionsFor(line,verse,id){const all=candidates(line),choice=wordChoices[verse+':'+id];return choice!==undefined?all.filter(c=>c.index===choice):all.filter(c=>!fillerWords.has(c.word)).sort((a,b)=>wordScore(b)-wordScore(a))}
function reviewWords(){const verses=puzzleVerses(song.value),tbody=document.getElementById('choices');tbody.replaceChildren();document.getElementById('review').hidden=!verses.length;for(let v=0;v<verses.length;v++)for(let i=0;i<verses[v].length;i++){const line=verses[v][i],tr=document.createElement('tr'),label=document.createElement('td'),cell=document.createElement('td'),select=document.createElement('select');label.textContent='Verse '+(v+1)+', line '+(i+1)+': '+line;select.setAttribute('aria-label','Answer for verse '+(v+1)+', line '+(i+1));const auto=document.createElement('option');auto.value='auto';auto.textContent='Choose automatically';select.append(auto);for(const c of candidates(line).sort((a,b)=>wordScore(b)-wordScore(a))){const o=document.createElement('option');o.value=String(c.index);o.textContent=c.raw+' ('+c.word.length+')';select.append(o)}select.value=wordChoices[v+':'+i]===undefined?'auto':String(wordChoices[v+':'+i]);select.addEventListener('change',()=>{if(select.value==='auto')delete wordChoices[v+':'+i];else wordChoices[v+':'+i]=Number(select.value);download.disabled=true;pages.replaceChildren();sheets=[];message.textContent='Word choice updated. Click Create crossword.'});cell.append(select);tr.append(label,cell);tbody.append(tr)}}

function build(lines,verse=0){let best=null;for(let attempt=0;attempt<100;attempt++){const board=new Map(),entries=[],used=new Set(),remaining=lines.map((line,id)=>({line,id,options:optionsFor(line,verse,id)}));const seed=remaining.splice(attempt%remaining.length,1)[0],first=seed.options[attempt%seed.options.length];const initial={...first,id:seed.id,line:seed.line,x:0,y:0,dir:0};entries.push(initial);used.add(first.word);place(board,initial);while(remaining.length){let chosen=null;for(let r=0;r<remaining.length;r++){const item=remaining[r];for(const c of item.options){if(used.has(c.word))continue;for(const [k,cell] of board){const [cx,cy]=k.split(',').map(Number);for(let i=0;i<c.word.length;i++){if(c.word[i]!==cell.ch)continue;for(const dir of [0,1]){const x=cx-(dir===0?i:0),y=cy-(dir===1?i:0),cross=fit(board,c.word,x,y,dir);if(cross<1)continue;const e={...c,id:item.id,line:item.line,x,y,dir},b=bounds([...entries,e]),area=(b.maxX-b.minX+1)*(b.maxY-b.minY+1),score=cross*100-area*.3+wordScore(c)+Math.random()*8;if(!chosen||score>chosen.score)chosen={r,e,score}}}}}}if(!chosen)break;entries.push(chosen.e);used.add(chosen.e.word);place(board,chosen.e);remaining.splice(chosen.r,1)}const b=bounds(entries),area=(b.maxX-b.minX+1)*(b.maxY-b.minY+1);if(!best||entries.length>best.entries.length||entries.length===best.entries.length&&area<best.area)best={entries,remaining,area};if(!remaining.length&&area<350)break}return best}
function canvasPage(){const cv=document.createElement('canvas');cv.width=pageWidth*3;cv.height=pageHeight*3;const c=cv.getContext('2d');c.scale(3,3);c.fillStyle='white';c.fillRect(0,0,pageWidth,pageHeight);c.fillStyle='#202822';return {cv,c}}
function wrapped(c,text,width){const lines=[];let line='';for(const w of text.split(/\s+/)){if(line&&c.measureText(line+' '+w).width>width){lines.push(line);line=w}else line+=(line?' ':'')+w}if(line)lines.push(line);return lines}
function drawSongTitle(c,title,verse,subtitle,fraktur){
 const titleFont=fraktur?((clueFont.value==='Handschrift'?'28px ':'20px ')+puzzleFontFamily()):'bold 20px Arial';
 c.font=titleFont;const lines=wrapped(c,fraktur?puzzleFontText(title):title,(pageWidth-2*puzzleMargins.side));let y=puzzleMargins.titleBaseline,lastWidth=0;
 for(let i=0;i<lines.length;i++){c.font=titleFont;lastWidth=Math.min((pageWidth-2*puzzleMargins.side),c.measureText(lines[i]).width);c.fillText(lines[i],puzzleMargins.side,y,(pageWidth-2*puzzleMargins.side));if(i<lines.length-1)y+=(clueFont.value==='Handschrift'?32:25)}
 const suffix=' · '+(typeof verse==='string'?'Verses ':'Verse ')+verse;c.font='bold 20px Arial';
 if(lastWidth+c.measureText(suffix).width<=(pageWidth-2*puzzleMargins.side))c.fillText(suffix,puzzleMargins.side+lastWidth,y);
 else{y+=(clueFont.value==='Handschrift'?32:25);c.fillText(suffix.trim().replace(/^· /,''),puzzleMargins.side,y,(pageWidth-2*puzzleMargins.side))}
 y+=(clueFont.value==='Handschrift'?32:25);c.font='11px Arial';c.fillText(subtitle,puzzleMargins.side,y,(pageWidth-2*puzzleMargins.side));return y+24;
}
function renderPuzzle(entries,answer,verse=1,title='Song'){const fraktur=(clueFont.value==='fraktur'||clueFont.value==='Handschrift'),clueStyle=fraktur?((clueFont.value==='Handschrift'?'22px ':'14px ')+puzzleFontFamily()):'12px Arial';let {cv,c}=canvasPage();const result=[cv],b=bounds(entries),cols=b.maxX-b.minX+1,rows=b.maxY-b.minY+1,top=drawSongTitle(c,title,verse,answer?'Answer key':'Complete each song line. Write one letter in each square.',fraktur),cell=puzzleCellSize(cols,rows,top,pageWidth,pageHeight,puzzleSize.value),left=(pageWidth-cell*cols)/2;const cells=new Map();for(const e of entries)[...e.word].forEach((ch,i)=>cells.set(key(e.x+(e.dir===0?i:0),e.y+(e.dir===1?i:0)),ch));c.lineWidth=.65;for(const [k,ch]of cells){const [x,y]=k.split(',').map(Number),xx=left+(x-b.minX)*cell,yy=top+(y-b.minY)*cell;c.strokeStyle='#333';c.strokeRect(xx,yy,cell,cell);if(answer){c.font=Math.max(7,cell*.52)+(clueFont.value==='Handschrift'?'px Handschrift':'px Arial');c.textAlign='center';c.fillText(ch,xx+cell/2,yy+cell*.78);c.textAlign='left'}}for(const e of entries){c.font=Math.max(5,cell*.27)+'px Arial';c.fillText(e.number,left+(e.x-b.minX)*cell+1,top+(e.y-b.minY)*cell+cell*.3)}let y=top+rows*cell+28;
const columnWidth=((pageWidth-2*puzzleMargins.side-24)/2),columnX=[puzzleMargins.side,(pageWidth/2+12)],bottom=(pageHeight-puzzleMargins.bottom),lineHeight=clueFont.value==='Handschrift'?26:17;
const groups=[0,1].map(dir=>entries.filter(e=>e.dir===dir).sort((a,b)=>a.number-b.number).map(e=>{
 const clue=answer?e.raw:e.line.slice(0,e.index)+puzzleAnswerBlank(e.raw)+e.line.slice(e.index+e.raw.length);
 c.font=clueStyle;
 return wrapped(c,e.number+'. '+(fraktur?puzzleFontText(clue):clue),columnWidth);
}));
const positions=[{item:0,line:0},{item:0,line:0}];let columnTop=y;
while(positions.some((p,i)=>p.item<groups[i].length)){
 for(let dir=0;dir<2;dir++){
  const pos=positions[dir],items=groups[dir],x=columnX[dir];if(pos.item>=items.length||columnTop+23+lineHeight>bottom)continue;
  c.font='bold 15px Arial';c.fillText(dir===0?'Across':'Down',x,columnTop);let cursor=columnTop+23;c.font=clueStyle;
  while(pos.item<items.length){const lines=items[pos.item],remaining=lines.length-pos.line,space=Math.floor((bottom-cursor)/lineHeight)+1;
   if(space<=0)break;
   // Keep a clue together when it can fit on a fresh continuation page.
   if(pos.line===0&&remaining>space&&remaining*lineHeight<(pageHeight-242))break;
   const count=Math.min(remaining,space);
   for(let k=0;k<count;k++){c.fillText(lines[pos.line++],x,cursor,columnWidth);cursor+=lineHeight}
   if(pos.line<lines.length)break;
   pos.item++;pos.line=0;cursor+=8;
  }
 }
 if(positions.some((p,i)=>p.item<groups[i].length)){
  ({cv,c}=canvasPage());result.push(cv);columnTop=drawSongTitle(c,title,verse,(answer?'Answer key':'Clues')+' · continued',fraktur);
 }
}
return result}

function splitVerses(text){return text.trim().split(/\r?\n[ \t]*\r?\n(?:[ \t]*\r?\n)*/).map(v=>v.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)).filter(v=>v.length)}
async function create(){download.disabled=true;pages.replaceChildren();sheets=[];reviewWords();const verses=puzzleVerses(song.value);if(!verses.length){message.textContent='Paste a song first.';return}
for(let v=0;v<verses.length;v++){if(verses[v].length>40){message.textContent='Please use up to 40 lines per crossword, or choose one crossword per verse.';return}const invalid=verses[v].map((s,i)=>optionsFor(s,v,i).length?null:i+1).filter(Boolean);if(invalid.length){message.textContent='Verse '+(v+1)+': choose a word (3–24 letters) under Choose words, or revise lines: '+invalid.join(', ');return}}
generate.disabled=true;puzzleSize.disabled=true;song.disabled=true;clueFont.disabled=true;verseMode.disabled=true;const pending=[],answers=[],chosen=[];
try{if((clueFont.value==='fraktur'||clueFont.value==='Handschrift'))await document.fonts.load(((clueFont.value==='Handschrift'?'22px ':'14px ')+puzzleFontFamily()));for(let v=0;v<verses.length;v++){message.textContent='Creating verse '+(v+1)+' of '+verses.length+'…';await new Promise(resolve=>setTimeout(resolve,30));const puzzle=build(verses[v],v);if(puzzle.remaining.length){message.textContent='Verse '+(v+1)+': could not connect every line. Try again or revise lines '+puzzle.remaining.map(e=>e.id+1).join(', ')+'.';return}const ordered=[...puzzle.entries].sort((a,b)=>a.y-b.y||a.x-b.x);let n=0,last='';for(const e of ordered){const start=key(e.x,e.y);if(start!==last){n++;last=start}e.number=n}pending.push(...renderPuzzle(ordered,false,verseLabel(v),verses[0][0]).map(cv=>{cv.verse=v+1;return cv}));answers.push(...renderPuzzle(ordered,true,verseLabel(v),verses[0][0]).map(cv=>{cv.verse=v+1;return cv}));chosen.push(...ordered.map(e=>({...e,verse:v+1})))}
lastStudentCount=pending.length;lastChosen=chosen;sheets=[...pending,...answers];for(const cv of sheets)pages.append(cv);reviewWords();message.textContent=verses.length+' crossword'+(verses.length===1?'':'s')+' · puzzles first, answer keys afterward.';download.disabled=false}catch(e){message.textContent='Could not create the crosswords. Try fewer or shorter lines.';console.error(e)}finally{generate.disabled=false;puzzleSize.disabled=false;song.disabled=false;clueFont.disabled=false;verseMode.disabled=false}}

verseMode.addEventListener('change',()=>{wordChoices={};sheets=[];pages.replaceChildren();download.disabled=true;reviewWords();message.textContent='Click Create crossword to use this layout.'});clueFont.addEventListener('change',()=>{if(sheets.length)create()});generate.addEventListener('click',create);song.addEventListener('input',()=>{download.disabled=true;pages.replaceChildren();sheets=[];wordChoices={};reviewWords();message.textContent='Click Create crossword to use your changes.'});download.addEventListener('click',()=>{if(!sheets.length)return;const title=song.value.trim().split(/\s+/).slice(0,3).join(' ').replace(/[<>:"/\\|?*\x00-\x1f]/g,'');GermanPDF.download(makePDF(sheets),'CW '+(title||'Crossword')+'.pdf')});

window.GermanGenerator={
 setText(text){if(song.value!==text){song.value=text;song.dispatchEvent(new Event('input',{bubbles:true}))}},
 async exportPages(shared,layout){pageWidth=layout==='landscape'?792:612;pageHeight=layout==='landscape'?612:792;const previousChoices={...wordChoices};try{
  if(shared){wordChoices={};let offset=0;const groups=puzzleVerses(song.value);for(let v=0;v<groups.length;v++){for(let i=0;i<groups[v].length;i++){if(shared[offset+i]!==undefined)wordChoices[v+':'+i]=shared[offset+i]}offset+=groups[v].length}reviewWords()}
  await create();if(download.disabled||!sheets.length)throw new Error(message.textContent||'Could not create puzzle.');
  const groups=puzzleVerses(song.value),choices={};for(const e of lastChosen){const offset=groups.slice(0,e.verse-1).reduce((n,g)=>n+g.length,0);choices[offset+e.id]=e.index}
  return {pages:sheets.map((cv,i)=>({...GermanPDF.canvasPage(cv,pageWidth,pageHeight,i<lastStudentCount?'student':'answer'),verse:cv.verse})),choices};
  }finally{if(shared){wordChoices=previousChoices;reviewWords()}}
 }
};
