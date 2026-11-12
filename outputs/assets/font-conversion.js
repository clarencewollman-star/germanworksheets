function convertWord(word){
 let end=word.at(-1), body=word;
 const finals={s:'+',d:'ï',r:'Ø','ß':'à'};
 if(finals[end])body=body.slice(0,-1)+finals[end];
 body=body.replace(/sch/g,'<').replace(/ch/g,'`').replace(/ck/g,'¤').replace(/tt/g,'µ').replace(/ff/g,'{').replace(/ll/g,'\\').replace(/tz/g,'~');
 if(/^[a-zäöüß]/.test(word))body='#'+body;
 if(/[emn]/.test(end))body+='$';
 return body;
}
function convert(text){return text.normalize('NFC').replace(/[A-Za-zÄÖÜäöüß]+/g,convertWord)}

function convertFraktur(text){return text.replace(/[A-Za-zÄÖÜäöüß]+/g,word=>word.replace(/ch/g,'¡').replace(/ck/g,'¿').replace(/tz/g,'|').replace(/s$/,'–'))}

// HANDSHFT.TTF conventions from the user's paired German/encoded hymn.
// Word-specific forms remain editable in the Text Converter.
function convertHandschrift(text){
 return text.normalize('NFC').replace(/[A-Za-zÄÖÜäöüß]+(?:['’][A-Za-zÄÖÜäöüß]*)?/g,word=>{
  const special={Wo:'Wú',Todestal:'TodeÛtal'};
  if(special[word])return special[word];
  const trailing=/['’]$/.test(word)?word.slice(-1):'';
  const core=trailing?word.slice(0,-1):word;
  const final=core.at(-1),finals={s:'+',d:'ï',r:'Ø','ß':'à'};
  let result=finals[final]?core.slice(0,-1)+finals[final]:core;
  result=result.replace(/sch/g,'<').replace(/ch/g,'`');
  if(/^[a-zäöüß]/.test(word)&&!word.startsWith('sch'))result='#'+result;
  if(/[emniu]/.test(final))result+='$';
  return result+trailing;
 });
}
