/* Shared PDF output for every German Worksheets tool. Page sizes are in points. */
window.GermanPDF={
 canvasPage(canvas,width=612,height=792,role='student'){
  return {dataUrl:canvas.toDataURL('image/jpeg',.98),width,height,pixelWidth:canvas.width,pixelHeight:canvas.height,role};
 },
 fromPages(pages){
  if(!pages.length)throw new Error('There are no pages to download.');
  const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
  const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length};
  const obj=(id,s)=>{offsets[id]=length;add(id+' 0 obj\n'+s+'\nendobj\n')};
  add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None /PickTrayByPDFSize true >> >>');
  obj(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
  pages.forEach((p,i)=>{const {width:w,height:h,pixelWidth:pw,pixelHeight:ph}=p;if(![w,h,pw,ph].every(n=>Number.isFinite(n)&&n>0))throw new Error('Invalid page dimensions.');
   const raw=atob(p.dataUrl.split(',')[1]),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),id=3+i*3;
   obj(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+w+' '+h+'] /Resources << /XObject << /Sheet '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>');
   offsets[id+1]=length;add((id+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+pw+' /Height '+ph+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bytes.length+' >>\nstream\n');add(bytes);add('\nendstream\nendobj\n');
   const content='q\n'+w+' 0 0 '+h+' 0 0 cm\n/Sheet Do\nQ\n';obj(id+2,'<< /Length '+enc.encode(content).length+' >>\nstream\n'+content+'endstream');
  });
  const xref=length;add('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');for(let i=1;i<offsets.length;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
  add('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');return new Blob(parts,{type:'application/pdf'});
 },
 download(blob,name){
  const file=typeof File==='function'?new File([blob],name,{type:'application/pdf'}):null;
  let shareable=false;try{shareable=!!(file&&navigator.share&&navigator.canShare?.({files:[file]}))}catch{}
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  document.getElementById('pdf-ready-dialog')?.close();
  const dialog=document.createElement('dialog');dialog.id='pdf-ready-dialog';
  dialog.style.cssText='width:calc(100% - 32px);max-width:420px;max-height:85vh;overflow:auto;box-sizing:border-box;border:1px solid #a9b9ad;border-radius:14px;padding:24px;background:white;color:#23342c;font:16px/1.5 system-ui';
  const heading=document.createElement('h2');heading.id='pdf-ready-title';heading.textContent='Print or save your PDF';heading.style.margin='0 0 12px';dialog.setAttribute('aria-labelledby',heading.id);
  const filename=document.createElement('p');filename.textContent=name;filename.style.overflowWrap='anywhere';
  const help=document.createElement('p');help.style.whiteSpace='pre-line';help.textContent=shareable?'1. Tap Share PDF below.\n2. Scroll down in the share menu and choose Print.\nOr choose Save to Files to keep a copy.':ios?'1. Tap Open PDF below.\n2. Tap Safari’s Share icon (square with an up arrow).\n3. Scroll down and choose Print.\nIf Print is missing, choose Save to Files, then open that file and use Share → Print.':'Open the PDF to print it, or choose Save PDF to download a copy.';
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;flex-wrap:wrap';
  const message=document.createElement('p');message.setAttribute('role','status');
  const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='font:inherit;min-height:44px;padding:10px 14px;border:1px solid #9aaea0;border-radius:8px;background:#f0f3f0;color:#23342c';b.addEventListener('click',action);actions.append(b);return b};
  // A fresh tap after generation gives iOS the user activation required for file sharing.
  if(shareable){const share=button('Share PDF',async()=>{share.disabled=true;message.textContent='';try{await navigator.share({files:[file]})}catch(e){if(e.name!=='AbortError')message.textContent='Safari could not share this PDF. Tap Open PDF, then use the browser’s Share menu, or save it to Files.'}finally{share.disabled=false}});share.style.background='#28583d';share.style.color='white'}else if(ios){const unavailable=button('Share PDF — unavailable',()=>{});unavailable.disabled=true;const reason=document.createElement('p');reason.textContent=window.isSecureContext===false?'Direct sharing needs an HTTPS connection. Use Open PDF below for now.':'Safari is not allowing this page to share PDF files. Use Open PDF below and Safari’s own Share menu.';help.textContent+='\n\n'+reason.textContent}
  const url=URL.createObjectURL(blob),open=document.createElement('a');open.href=url;open.target='_blank';open.rel='noopener';open.textContent='Open PDF';open.style.cssText='display:inline-flex;align-items:center;min-height:44px;padding:0 12px;color:#28583d';actions.append(open);
  button('Save PDF',()=>this.save(blob,name));button('Done',()=>dialog.close());
  dialog.append(heading,filename,help,actions,message);document.body.append(dialog);
  dialog.addEventListener('close',()=>{dialog.remove();setTimeout(()=>URL.revokeObjectURL(url),300000)},{once:true});dialog.showModal();
 },
 save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),300000)},
 async fromSVG(svgs,width,height){
  await document.fonts.ready;const result=[];
  for(const svg of svgs){const canvas=document.createElement('canvas');canvas.width=width*3;canvas.height=height*3;const c=canvas.getContext('2d');c.scale(3,3);c.fillStyle='white';c.fillRect(0,0,width,height);
   for(const el of svg.children){const a=n=>el.getAttribute(n),n=k=>Number(a(k)||0);c.save();
    if(el.tagName==='rect'){c.fillStyle=a('fill')||'black';c.fillRect(n('x'),n('y'),n('width'),n('height'))}
    else if(el.tagName==='line'){c.strokeStyle=a('stroke')||'black';c.lineWidth=n('stroke-width')||1;c.setLineDash((a('stroke-dasharray')||'').split(/[ ,]+/).filter(Boolean).map(Number));c.beginPath();c.moveTo(n('x1'),n('y1'));c.lineTo(n('x2'),n('y2'));c.stroke()}
    else if(el.tagName==='text'){c.font=n('font-size')+'px '+a('font-family');c.fontKerning='none';c.textAlign=a('text-anchor')==='end'?'right':'left';c.fillStyle=a('fill')||'black';c.fillText(el.textContent,n('x'),n('y'))}c.restore();
   }
   result.push(this.canvasPage(canvas,width,height));canvas.width=canvas.height=1;
  }return result;
 }
};
function makePDF(sheets){return GermanPDF.fromPages(sheets.map(c=>GermanPDF.canvasPage(c)))}
