// Generate immutable assets from the single maintained source set.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../outputs'),assets=path.join(root,'assets'),generated=path.join(assets,'generated');
const version=fs.readFileSync(path.join(assets,'version.js'),'utf8').match(/GermanWorksheetsVersion\s*=\s*'([0-9]+\.[0-9]+\.[0-9]+)'/)?.[1];
if(!version)throw new Error('Missing application version');
fs.mkdirSync(generated,{recursive:true});
const files=new Map();
for(const name of fs.readdirSync(assets).filter(n=>/\.(js|css)$/.test(n))){
 const data=fs.readFileSync(path.join(assets,name)),hash=crypto.createHash('sha256').update(data).digest('hex').slice(0,12);
 const target=name.replace(/\.(js|css)$/,'.'+hash+'.$1');fs.writeFileSync(path.join(generated,target),data);files.set(name,'assets/generated/'+target);
}
// Embed the reader pictures for canvas PDF export from local file:// pages too.
const pictures={};
for(const [folder,extension,mime] of [['alphabet-reader','.png','image/png'],['doppellaute-reader','.jpg','image/jpeg']]){
 for(const name of fs.readdirSync(path.join(assets,folder)).sort().filter(name=>name.endsWith(extension))){
  const data=fs.readFileSync(path.join(assets,folder,name)).toString('base64');
  pictures[folder+'/'+path.basename(name,extension)]='data:'+mime+';base64,'+data;
 }
}
const bundle='const readerPictures='+JSON.stringify(pictures)+';';
const hash=crypto.createHash('sha256').update(bundle).digest('hex').slice(0,12);
const bundleName='reader-pictures.'+hash+'.js';
fs.writeFileSync(path.join(generated,bundleName),bundle);
files.set('reader-pictures.js','assets/generated/'+bundleName);
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){
 const file=path.join(root,name),original=fs.readFileSync(file,'utf8');
 const stamped=original.replace(/((?:src|href)=")([^"?#]+)(?:\?([^"#]*))?(")/g,(match,prefix,target,query,end)=>{
  if(target.startsWith('assets/')&&/\.(js|css)$/.test(target)){
   const source=path.basename(target).replace(/\.[a-f0-9]{12}(?=\.(js|css)$)/,'');
   if(!files.has(source))throw new Error('Missing asset: '+target);
   return prefix+files.get(source)+end;
  }
  if(target.endsWith('.html')&&query?.includes('packet=1')){const params=new URLSearchParams(query);params.set('v',version);return prefix+target+'?'+params.toString()+end}
  return match;
 });
 if(stamped!==original)fs.writeFileSync(file,stamped);
}
fs.writeFileSync(path.join(assets,'release.json'),JSON.stringify({version})+'\n');
console.log('Generated content-hashed assets for '+version);
