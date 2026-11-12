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
 download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)},
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
