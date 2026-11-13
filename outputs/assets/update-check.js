// Never interrupt work or reload automatically. Offline/local-file use is unchanged.
(() => {
 if(!/^https?:$/.test(location.protocol)||new URLSearchParams(location.search).get('packet')==='1')return;
 let checking=false,shown=false;
 async function check(){
  if(checking||shown||document.visibilityState==='hidden')return;
  checking=true;
  try{
   const response=await fetch('assets/release.json',{cache:'no-store'});
   if(!response.ok)return;
   const release=await response.json();
   if(!/^\d+\.\d+\.\d+$/.test(release.version)||release.version===window.GermanWorksheetsVersion)return;
   shown=true;
   const notice=document.createElement('aside');notice.className='gw-update-notice';notice.setAttribute('role','status');
   const label=document.createElement('p');label.textContent='Update available ('+release.version+'). Reload when you’re ready. Unsaved text will be cleared.';
   const reload=document.createElement('button');reload.type='button';reload.className='btn btn-primary';reload.textContent='Reload';reload.addEventListener('click',()=>location.reload());
   const later=document.createElement('button');later.type='button';later.className='btn btn-outline-secondary';later.textContent='Later';later.addEventListener('click',()=>notice.remove());
   notice.append(label,reload,later);document.body.append(notice);
  }catch{/* A network interruption must not affect worksheet generation. */}
  finally{checking=false}
 }
 document.addEventListener('visibilitychange',check);setInterval(check,300000);check();
})();
