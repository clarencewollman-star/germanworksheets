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
