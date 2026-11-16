(() => {
  const el = id => document.getElementById(id);
  const alphabet = [...'abcdefghijklmnopqrstuvwxyzäöüß'];
  const fonts = ['Arial', 'Hand', 'Handschrift', 'Fraktur'];
  const similar = ['bdpq', 'mnurhw', 'aäoöe', 'uüvwy', 'iljt', 'csßz', 'fkt', 'gxq'];
  const groups = ['au','ch','ck','ei','eu','ie','pf','sch','sp','st','tz','äu'];
  const colors = ['#b32230','#205baf','#217443'];
  const colorNames = ['rot','blau','grün'];
  const pick = list => list[Math.floor(Math.random() * list.length)];
  function shuffle(items) {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  const upper = ch => ch === 'ß' ? 'ẞ' : ch.toUpperCase();
  function row(letter, casing, searchCase, pool, families, activity, focus, lensFont = 'auto') {
    const both = searchCase === 'both';
    const capital = casing === 'Uppercase' || (casing === 'Mixed' && Math.random() < .5);
    const target = capital ? upper(letter) : letter;
    const searchCapital = searchCase === 'opposite' ? !capital : capital;
    const numberOfTargets = activity === 'color' ? 3 : activity === 'pair' ? 2 : 1;
    const otherTargets = shuffle([...new Set(focus)].filter(ch => ch !== letter));
    const extra = shuffle(pool.filter(ch => ch !== letter && !otherTargets.includes(ch)));
    const targets = [letter, ...otherTargets, ...extra].slice(0,numberOfTargets);
    function makeChoices() {
      const optionsPerRow = 16;
      const correct = activity === 'color' ? 10 + Math.floor(Math.random() * 3) : 5 + Math.floor(Math.random() * 2);
      const options = shuffle(families);
      const matches = Array.from({length:correct}, (_, i) => ({
        ch: (both && i % 2 ? !searchCapital : searchCapital) ? upper(targets[i % numberOfTargets]) : targets[i % numberOfTargets],
        mark:i % numberOfTargets, font:options[i % options.length], match:true
      }));
      const others = shuffle(pool.filter(ch => !targets.includes(ch)));
      const alike = ch => activity === 'groups'
        ? [...letter].some(c => ch.includes(c))
        : similar.some(group => group.includes(ch) && targets.some(target => group.includes(target)));
      const similarFirst = others.filter(alike);
      const different = others.filter(ch => !alike(ch));
      const ordered = [...similarFirst, ...different];
      const distractors = Array.from({length:optionsPerRow-correct}, (_,i) => ordered[i % ordered.length]).map(ch => ({
        ch:(both ? Math.random()<.5 : searchCapital) ? upper(ch) : ch, font:pick(families), match:false
      }));
      return shuffle([...matches,...distractors]);
    }
    const targetFont = activity === 'letters' && fonts.includes(lensFont) ? lensFont : pick(families);
    return {target,targets:targets.map(ch => capital ? upper(ch) : ch),activity,font:targetFont,choices:activity==='color' ? [...makeChoices(), ...makeChoices()] : makeChoices()};
  }
  function glyph(ctx,ch,font,x,y,size,color='#17251d') {
    const encoded = {Hand:convert, Handschrift:convertHandschrift, Fraktur:convertFraktur}[font];
    ctx.font = size+'px '+font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    const text = encoded ? encoded(ch) : ch;
    const metrics = ctx.measureText(text);
    // Center the ink, including accents and script flourishes, inside the circle.
    const inkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const inkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    ctx.save();
    ctx.translate(x, y);
    const fit = Math.min(1, 40 / Math.max(1, inkWidth), 30 / Math.max(1, inkHeight));
    ctx.scale(fit, fit);
    ctx.fillText(text, (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2,
      (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2);
    ctx.restore();
  }
  const blockHeight = 110;
  function drawRow(ctx,row,top,circled) {
    if (row.targets.length > 1) {
      row.targets.forEach((ch,i)=>{
        const y = top + (i+.5)*blockHeight*(row.choices.length/16)/row.targets.length;
        if(row.activity==='color'){
          glyph(ctx,ch,row.font,73,y,27,colors[i]);
          ctx.fillStyle=colors[i];ctx.font='11px Arial';ctx.textAlign='left';
          ctx.fillText(colorNames[i],92,y+4);
        }else{
          glyph(ctx,ch,row.font,85,y,31);
          drawMark(ctx,85,y,i);
        }
      });
    } else {
    const lensX = 84;
    const lensY = top + 49;
    ctx.save();
    ctx.strokeStyle = '#405449';
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(lensX - 21, lensY + 21);
    ctx.lineTo(lensX - 33, lensY + 33);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lensX, lensY, 29, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
    glyph(ctx,row.target,row.font,lensX,lensY,36);
    }
    const columns=8;
    row.choices.forEach(({ch,font,match,mark},i)=>{
      const x=120+(i%columns+.5)*444/columns;
      const y=top+26+Math.floor(i/16)*blockHeight+Math.floor((i%16)/columns)*51;
      const colored = circled && match && row.activity==='color';
      glyph(ctx,ch,font,x,y,31,colored ? colors[mark] : '#17251d');
      if(circled && match && !colored) drawMark(ctx,x,y,mark);
    });
  }
  function drawMark(ctx,x,y,mark){
    ctx.beginPath();
    if(mark===1) ctx.rect(x-22,y-22,44,44);
    else ctx.ellipse(x,y,25,23,0,0,2*Math.PI);
    ctx.stroke();
  }
  function connectSet(next, targets, families) {
    const letters = new Set();
    const count = Math.min(5, new Set(targets).size);
    while (letters.size < count) letters.add(next());
    const left = [...letters];
    const right = shuffle(left);
    if (count > 1 && left.every((ch,i)=>ch===right[i])) right.push(right.shift());
    return {left,right,leftFont:pick(families),rightFont:pick(families)};
  }
  function drawConnections(c,set,top,key) {
    const y = i => top + (i+.5)*220/set.left.length;
    set.left.forEach((ch,i)=>{
      glyph(c,upper(ch),set.leftFont,155,y(i),34);
      glyph(c,set.right[i],set.rightFont,457,y(i),34);
      for(const x of [188,424]){
        c.beginPath();c.arc(x,y(i),2,0,2*Math.PI);c.fill();
      }
      if(key){
        c.beginPath();c.moveTo(188,y(i));c.lineTo(424,y(set.right.indexOf(ch)));c.stroke();
      }
    });
  }
  const abc = 'abcdefghijklmnopqrstuvwxyz';
  function missingSet(letter,casing,families) {
    const index = abc.indexOf(letter);
    const start = Math.max(0,Math.min(abc.length-5,index-Math.floor(Math.random()*5)));
    const capitals = casing==='Uppercase' || (casing==='Mixed' && Math.random()<.5);
    const sequence = abc.slice(start,start+5);
    return {sequence:capitals?sequence.toUpperCase():sequence, gap:index-start,font:pick(families)};
  }
  function drawSequence(c,set,top,key) {
    [...set.sequence].forEach((ch,i)=>{
      const x=100+i*103;
      if(i!==set.gap || key) glyph(c,ch,set.font,x,top+47,34);
      if(i===set.gap)c.fillRect(x-28,top+70,56,1);
    });
  }
  function render(model,index,key,scale) {
    const canvas=document.createElement('canvas');
    canvas.width=612*scale;canvas.height=792*scale;
    const c=canvas.getContext('2d');c.scale(scale,scale);
    c.fillStyle='white';c.fillRect(0,0,612,792);
    const left = 48, right = 564, top = 76;
    c.save();
    c.strokeStyle = '#67766d';
    c.lineWidth = 0.8;
    c.beginPath();
    const setHeight = (model.activity === 'missing' ? 570 : 660) / model.rows.length;
    const gridTop = model.activity === 'missing' ? top+90 : top;
    c.rect(left, gridTop, right-left, setHeight*model.rows.length);
    for (let i=1; i<model.rows.length; i++) {
      const y = gridTop+i*setHeight;
      c.moveTo(left,y);
      c.lineTo(right,y);
    }
    c.stroke();
    c.restore();
    c.fillStyle='#17251d';c.strokeStyle='#28352d';
    c.font='12px Arial';c.fillText('Name',400,66);c.fillRect(439,66,125,.7);
    if(model.activity==='missing'){
      c.font='12px Arial';c.fillText('Alphabet',left,top+16);
      [...abc].forEach((ch,i)=>{
        const x=left+20+(i%13)*39;
        const y=top+34+Math.floor(i/13)*30;
        glyph(c,model.upperStrip?upper(ch):ch,model.stripFont,x,y,21);
      });
    }
    model.rows.forEach((r,i)=>{
      const y=gridTop+i*setHeight;
      if(model.activity==='connect') drawConnections(c,r,y,key);
      else if(model.activity==='missing') drawSequence(c,r,y,key);
      else drawRow(c,r,y,key);
    });
    c.textAlign='right';c.fillStyle='#465449';c.font='10px Arial';
    c.fillText((key?'Lösung · ':'')+'Seite '+(index+1),564,749);
    return canvas;
  }
  let models=[];
  const modes=()=>el('pdf-pages').value==='both'?[false,true]:[el('pdf-pages').value==='key'];
  function preview(){
    el('pages').replaceChildren();
    for(const key of modes())models.forEach((m,i)=>{
      const img=new Image();img.alt=(key?'Answer key ':'Worksheet ')+(i+1);
      img.src=render(m,i,key,1).toDataURL();el('pages').append(img);
    });
  }
  function invalidate(){
    const activity=el('activity').value;
    el('letter-case').parentElement.hidden=activity==='connect';
    el('search-case').parentElement.hidden=['connect','missing'].includes(activity);
    el('target-font-field').hidden = el('activity').value !== 'letters';
    models=[];el('save').disabled=true;el('pages').replaceChildren();el('status').textContent='';
    el('focus').placeholder=el('activity').value==='groups'?'ei, ie, sch':'m, n, u, ü';
    el('custom-field').hidden=el('letter-order').value!=='custom';
  }
  async function create(){
    invalidate();
    const casing=el('letter-case').value;
    const searchCase=el('search-case').value;
    const order=el('letter-order').value;
    const styles = {any:fonts, Arial:['Arial'], Handschrift:['Handschrift'], Hand:['Hand'],
      fraktur:['Fraktur'], script:['Hand','Handschrift'], mixed:['Hand','Handschrift','Fraktur']};
    const availableFonts = styles[el('font-style').value];
    const activity=el('activity').value;
    const pool=activity==='missing'?[...abc]:activity==='connect'?alphabet.filter(ch=>ch!=='ß'):activity==='groups'?groups:alphabet.filter(ch=>ch!=='ß'||(casing==='Lowercase'&&searchCase==='same'));
    const raw=el('focus').value.normalize('NFC').toLowerCase().trim();
    const custom = activity==='groups' ? raw.split(/[\s,;]+/).filter(Boolean) : [...raw.replace(/[\s,;]+/g,'')];
    const targets=order==='custom'?custom:pool;
    if(!targets.length){el('status').textContent='Enter at least one focus letter.';return}
    const count=Number(el('count').value);
    if(!Number.isInteger(count)||count<1||count>50){el('status').textContent='Choose 1 to 50 worksheet pages.';return}
    if(targets.some(ch=>!pool.includes(ch))){el('status').textContent=activity==='missing'?'Use letters A–Z for alphabet sequences.':activity==='connect'?'Use letters A–Z or Ä, Ö, Ü for capital and lowercase pairs.':activity==='groups'?'Choose groups from '+groups.join(', ')+'.':'Use German letters. For ß, choose lowercase and exact-case matching.';return}
    let sequence=[], index=0;
    function nextLetter(){
      if(index===sequence.length){
        sequence=order==='random'?shuffle(targets):targets;
        index=0;
      }
      return sequence[index++];
    }
    if(activity==='connect' && new Set(targets).size<2){el('status').textContent='Enter at least two different letters to connect.';return}
    models=Array.from({length:count},()=>{
      if(activity==='connect') return {activity,rows:Array.from({length:3},()=>connectSet(nextLetter,targets,availableFonts))};
      if(activity==='missing') return {activity,stripFont:pick(availableFonts),upperStrip:casing==='Uppercase',rows:Array.from({length:6},()=>missingSet(nextLetter(),casing,availableFonts))};
      return {activity,rows:Array.from({length:activity==='color'?3:6},()=>row(nextLetter(),casing,searchCase,pool,availableFonts,activity,targets,el('target-font').value))
      };
    });
    preview();el('save').disabled=false;
  }
  for(const id of ['activity','letter-order','font-style','target-font','letter-case','search-case','count','focus']){
    el(id).addEventListener('input',invalidate);
    el(id).addEventListener('change',invalidate);
  }
  el('pdf-pages').addEventListener('change',preview);
  el('create').addEventListener('click',create);
  el('save').addEventListener('click',()=>{
    const pages=[];
    for(const key of modes())models.forEach((m,i)=>{
      const canvas=render(m,i,key,3);pages.push(GermanPDF.canvasPage(canvas));canvas.width=canvas.height=1;
    });
    GermanPDF.download(GermanPDF.fromPages(pages),'Buchstaben finden.pdf');
  });
  el('create').disabled=true;
  Promise.all(fonts.slice(1).map(f=>document.fonts.load('32px '+f))).then(()=>{
    el('create').disabled=false;invalidate();
  }).catch(()=>{el('status').textContent='The worksheet fonts could not load. Refresh to try again.'});
})();
