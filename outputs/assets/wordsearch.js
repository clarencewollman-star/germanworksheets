let pageWidth=612,pageHeight=792;



const song=document.getElementById('song'),generate=document.getElementById('generate'),download=document.getElementById('download'),message=document.getElementById('message'),pages=document.getElementById('pages');let sheets=[];let lastStudentCount=0,lastChosen=[];
const clueFont=document.getElementById('clue-font');
const clueMode=document.getElementById('clue-mode');
const gridCase=document.getElementById('grid-case');
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
function reviewWords(){const verses=puzzleVerses(song.value),tbody=document.getElementById('choices');tbody.replaceChildren();document.getElementById('review').hidden=!verses.length;for(let v=0;v<verses.length;v++)for(let i=0;i<verses[v].length;i++){const line=verses[v][i],tr=document.createElement('tr'),label=document.createElement('td'),cell=document.createElement('td'),select=document.createElement('select');label.textContent='Verse '+(v+1)+', line '+(i+1)+': '+line;select.setAttribute('aria-label','Answer for verse '+(v+1)+', line '+(i+1));const auto=document.createElement('option');auto.value='auto';auto.textContent='Choose automatically';select.append(auto);for(const c of candidates(line).sort((a,b)=>wordScore(b)-wordScore(a))){const o=document.createElement('option');o.value=String(c.index);o.textContent=c.raw+' ('+c.word.length+')';select.append(o)}select.value=wordChoices[v+':'+i]===undefined?'auto':String(wordChoices[v+':'+i]);select.addEventListener('change',()=>{if(select.value==='auto')delete wordChoices[v+':'+i];else wordChoices[v+':'+i]=Number(select.value);download.disabled=true;pages.replaceChildren();sheets=[];message.textContent='Word choice updated. Click Create word search.'});cell.append(select);tr.append(label,cell);tbody.append(tr)}}

function build(lines,verse=0){
 const used=new Set(),entries=lines.map((line,id)=>{const choices=optionsFor(line,verse,id),choice=choices.find(c=>!used.has(c.word))||choices[0];used.add(choice.word);return {...choice,line,id,number:id+1}});
 const longest=Math.max(...entries.map(e=>e.word.length)),base=Math.max(10,longest,Math.ceil(Math.sqrt(entries.reduce((n,e)=>n+e.word.length,0)*1.7)));
 const dirs=[[1,0],[0,1],[1,1]];
 for(let size=base;size<=base+10;size++)for(let attempt=0;attempt<12;attempt++){
  const grid=Array.from({length:size},()=>Array(size).fill(''));let success=true;
  for(const e of [...entries].sort((a,b)=>b.word.length-a.word.length)){
   const options=[];for(const [dx,dy]of dirs)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const ex=x+dx*(e.word.length-1),ey=y+dy*(e.word.length-1);if(ex>=size||ey>=size)continue;let overlap=0,valid=true;
    for(let i=0;i<e.word.length;i++){const existing=grid[y+dy*i][x+dx*i];if(existing&&existing!==e.word[i]){valid=false;break}if(existing)overlap++}
    if(valid)options.push({x,y,dx,dy,score:overlap+Math.random()*3});
   }
   if(!options.length){success=false;break}options.sort((a,b)=>b.score-a.score);Object.assign(e,options[0]);for(let i=0;i<e.word.length;i++)grid[e.y+e.dy*i][e.x+e.dx*i]=e.word[i];
  }
  if(success){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!grid[y][x])grid[y][x]=alphabet[Math.floor(Math.random()*alphabet.length)];entries.grid=grid;return {entries,remaining:[]}}
 }
 return {entries:[],remaining:lines.map((line,id)=>({line,id}))};
}
function canvasPage(){const cv=document.createElement('canvas');cv.width=pageWidth*3;cv.height=pageHeight*3;const c=cv.getContext('2d');c.scale(3,3);c.fillStyle='white';c.fillRect(0,0,pageWidth,pageHeight);c.fillStyle='#202822';return {cv,c}}
function wrapped(c,text,width){const lines=[];let line='';for(const w of text.split(/\s+/)){if(line&&c.measureText(line+' '+w).width>width){lines.push(line);line=w}else line+=(line?' ':'')+w}if(line)lines.push(line);return lines}
function drawSongTitle(c,title,verse,subtitle,fraktur){
 const titleFont=fraktur?'20px Fraktur':'bold 20px Arial';
 c.font=titleFont;const lines=wrapped(c,fraktur?convertFraktur(title):title,(pageWidth-96));let y=40,lastWidth=0;
 for(let i=0;i<lines.length;i++){c.font=titleFont;lastWidth=Math.min((pageWidth-96),c.measureText(lines[i]).width);c.fillText(lines[i],48,y,(pageWidth-96));if(i<lines.length-1)y+=25}
 const suffix=' · '+(typeof verse==='string'?'Verses ':'Verse ')+verse;c.font='bold 20px Arial';
 if(lastWidth+c.measureText(suffix).width<=(pageWidth-96))c.fillText(suffix,48+lastWidth,y);
 else{y+=25;c.fillText(suffix.trim().replace(/^· /,''),48,y,(pageWidth-96))}
 y+=25;c.font='11px Arial';c.fillText(subtitle,48,y,(pageWidth-96));return y+24;
}
function renderPuzzle(entries,answer,verse=1,title='Song'){
 const fraktur=clueFont.value==='fraktur',clueStyle=fraktur?'14px Fraktur':'12px Arial';let {cv,c}=canvasPage();const result=[cv];
 const top=drawSongTitle(c,title,verse,answer?'Answer key':(clueMode.value==='words'?'Find the words in the list: across, down or diagonally.':'Fill in the missing words, then find them: across, down or diagonally.'),fraktur);
 const grid=entries.grid,size=grid.length,cell=Math.min(25,(pageWidth-96)/size,Math.max(120,(pageHeight-327)-top)/size),left=(pageWidth-size*cell)/2;
 if(answer){c.strokeStyle='#b5d6be';c.lineWidth=cell*.78;c.lineCap='round';for(const e of entries){c.beginPath();c.moveTo(left+(e.x+.5)*cell,top+(e.y+.5)*cell);c.lineTo(left+(e.x+e.dx*(e.word.length-1)+.5)*cell,top+(e.y+e.dy*(e.word.length-1)+.5)*cell);c.stroke()}}
 c.fillStyle='#202822';c.textAlign='center';c.font=Math.max(7,cell*.62)+(fraktur?'px Fraktur':'px Arial');for(let y=0;y<size;y++)for(let x=0;x<size;x++)c.fillText(gridCase.value==='lower'?grid[y][x].toLocaleLowerCase('de-DE'):grid[y][x],left+(x+.5)*cell,top+(y+.72)*cell);c.textAlign='left';
 let y=top+size*cell+28;c.font=clueStyle;
 const clues=entries.map(e=>{const text=(answer||clueMode.value==='words')?e.raw:e.line.slice(0,e.index)+'________'+e.line.slice(e.index+e.raw.length);return wrapped(c,e.number+'. '+(fraktur?convertFraktur(text):text),((pageWidth-120)/2))});
 const mid=Math.ceil(clues.length/2),groups=[clues.slice(0,mid),clues.slice(mid)],positions=[{item:0,line:0},{item:0,line:0}];let columnTop=y;
 while(positions.some((p,i)=>p.item<groups[i].length)){
  for(let col=0;col<2;col++){const pos=positions[col],items=groups[col],x=col?(pageWidth/2+12):48;let cursor=columnTop;c.font=clueStyle;
   while(pos.item<items.length){const lines=items[pos.item],space=Math.floor(((pageHeight-48)-cursor)/17)+1,remaining=lines.length-pos.line;if(space<=0)break;if(!pos.line&&remaining>space&&remaining*17<(pageHeight-242))break;const count=Math.min(space,remaining);for(let k=0;k<count;k++){c.fillText(lines[pos.line++],x,cursor,((pageWidth-120)/2));cursor+=17}if(pos.line<lines.length)break;pos.item++;pos.line=0;cursor+=8}
  }
  if(positions.some((p,i)=>p.item<groups[i].length)){({cv,c}=canvasPage());result.push(cv);columnTop=drawSongTitle(c,title,verse,answer?'Answers · continued':clueMode.value==='words'?'Words · continued':'Song lines · continued',fraktur)}
 }
 return result;
}

function splitVerses(text){return text.trim().split(/\r?\n[ \t]*\r?\n(?:[ \t]*\r?\n)*/).map(v=>v.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)).filter(v=>v.length)}
async function create(){download.disabled=true;pages.replaceChildren();sheets=[];reviewWords();const verses=puzzleVerses(song.value);if(!verses.length){message.textContent='Paste a song first.';return}
for(let v=0;v<verses.length;v++){if(verses[v].length>40){message.textContent='Please use up to 40 lines per word search, or choose one word search per verse.';return}const invalid=verses[v].map((s,i)=>optionsFor(s,v,i).length?null:i+1).filter(Boolean);if(invalid.length){message.textContent='Verse '+(v+1)+': choose a word (3–24 letters) under Choose words, or revise lines: '+invalid.join(', ');return}}
generate.disabled=true;song.disabled=true;clueFont.disabled=true;verseMode.disabled=true;clueMode.disabled=true;gridCase.disabled=true;const pending=[],answers=[],chosen=[];
try{if(clueFont.value==='fraktur')await document.fonts.load('14px Fraktur');for(let v=0;v<verses.length;v++){message.textContent='Creating verse '+(v+1)+' of '+verses.length+'…';await new Promise(resolve=>setTimeout(resolve,30));const puzzle=build(verses[v],v);if(puzzle.remaining.length){message.textContent='Verse '+(v+1)+': could not place every answer. Try again or revise lines '+puzzle.remaining.map(e=>e.id+1).join(', ')+'.';return}const ordered=puzzle.entries;pending.push(...renderPuzzle(ordered,false,verseLabel(v),verses[0][0]).map(cv=>{cv.verse=v+1;return cv}));answers.push(...renderPuzzle(ordered,true,verseLabel(v),verses[0][0]).map(cv=>{cv.verse=v+1;return cv}));chosen.push(...ordered.map(e=>({...e,verse:v+1})))}
lastStudentCount=pending.length;lastChosen=chosen;sheets=[...pending,...answers];for(const cv of sheets)pages.append(cv);reviewWords();message.textContent=verses.length+' word search'+(verses.length===1?'':'s')+' · puzzles first, answer keys afterward.';download.disabled=false}catch(e){message.textContent='Could not create the word searches. Try fewer or shorter lines.';console.error(e)}finally{generate.disabled=false;song.disabled=false;clueFont.disabled=false;verseMode.disabled=false;clueMode.disabled=false;gridCase.disabled=false}}

verseMode.addEventListener('change',()=>{wordChoices={};sheets=[];pages.replaceChildren();download.disabled=true;reviewWords();message.textContent='Click Create word search to use this layout.'});gridCase.addEventListener('change',()=>{if(sheets.length)create()});clueMode.addEventListener('change',()=>{if(sheets.length)create()});clueFont.addEventListener('change',()=>{if(sheets.length)create()});generate.addEventListener('click',create);song.addEventListener('input',()=>{download.disabled=true;pages.replaceChildren();sheets=[];wordChoices={};reviewWords();message.textContent='Click Create word search to use your changes.'});download.addEventListener('click',()=>{if(!sheets.length)return;const title=song.value.trim().split(/\s+/).slice(0,3).join(' ').replace(/[<>:"/\\|?*\x00-\x1f]/g,'');GermanPDF.download(makePDF(sheets),'WS '+(title||'Word Search')+'.pdf')});

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
