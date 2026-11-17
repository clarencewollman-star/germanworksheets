(() => {
  const el = id => document.getElementById(id);
  let messages = [], selected = null, request = 0;
  async function api(path, data) {
    const response = await fetch('/api/feedback/' + path, data === undefined ? {} : {
      method:'POST', headers:{'Content-Type':'application/json','X-Feedback-Request':'1'}, body:JSON.stringify(data)
    });
    const value = await response.json();
    if (response.status === 401) {
      el('login-form').hidden = false; el('inbox').hidden = true;
      selected = null; messages = []; el('detail').hidden = true; el('message-list').replaceChildren();
    }
    if (!response.ok) throw new Error(value.error || 'Request failed.');
    return value;
  }
  function report(error) { el('admin-status').textContent = error.message || 'Could not connect. Please try again.'; }
  function list() {
    const filter = el('filter').value;
    const visible = messages.filter(m => filter === 'all' || (filter === 'unread' ? m.unread : m.status === filter));
    el('message-list').replaceChildren(...visible.map(message => {
      const button = document.createElement('button'); button.type='button'; button.className='inbox-message';
      button.setAttribute('aria-current', String(message.id === selected?.id));
      const title=document.createElement('strong'), summary=document.createElement('span'), meta=document.createElement('small');
      title.textContent=(message.unread?'● ':'')+(message.name||'Anonymous');
      summary.textContent=message.message;
      meta.textContent=message.status+' · '+new Date(message.created*1000).toLocaleString();
      button.append(title,summary,meta); button.addEventListener('click',()=>open(message.id).catch(report));
      return button;
    }));
    if(!visible.length)el('message-list').textContent='No messages here.';
  }
  async function refresh() {
    const result=await api('messages'); messages=result.messages;
    el('unread-count').textContent=result.unread+' unread';
    el('login-form').hidden=true; el('inbox').hidden=false;
    if(selected && !messages.some(m=>m.id===selected.id)){selected=null;el('detail').hidden=true;}
    list();
  }
  function detail() {
    el('detail').hidden=false;
    el('message-title').textContent=selected.name||'Anonymous';
    el('message-meta').textContent=[selected.email,new Date(selected.created*1000).toLocaleString(),selected.page,'Version '+selected.version].filter(Boolean).join(' · ');
    el('message-body').textContent=selected.message;
    el('message-status').value=selected.status;
    el('read-toggle').textContent=selected.unread?'Mark read':'Mark unread';
    el('message-image').hidden=!selected.has_image;
    if(selected.has_image)el('message-image').src='/api/feedback/messages/'+selected.id+'/screenshot';
    else el('message-image').removeAttribute('src');
    el('email-sender').hidden=!selected.email;
    el('email-sender').href='mailto:'+encodeURIComponent(selected.email)+'?subject='+encodeURIComponent('Your German Worksheets feedback');
  }
  async function open(id) {
    const revision=++request;
    const message=await api('messages/'+id);
    if(revision!==request)return;
    await api('update',{id,status:message.status,unread:false});
    if(revision!==request)return;
    selected={...message,unread:false};detail();await refresh();
    if(matchMedia('(max-width:700px)').matches)el('detail').scrollIntoView({behavior:'smooth'});
  }
  async function update(status, unread) {
    if(!selected)return;
    const id=selected.id;
    await api('update',{id,status,unread});
    if(selected?.id===id){selected.status=status;selected.unread=unread;detail()}
    await refresh();
  }
  el('login-form').addEventListener('submit',async event=>{
    event.preventDefault();const button=event.submitter;button.disabled=true;el('admin-status').textContent='';
    try{await api('login',{username:el('username').value,password:el('password').value});el('password').value='';await refresh()}
    catch(error){report(error)}finally{button.disabled=false}
  });
  el('refresh').addEventListener('click',()=>refresh().catch(report));
  el('filter').addEventListener('change',list);
  el('message-status').addEventListener('change',()=>update(el('message-status').value,!!selected?.unread).catch(report));
  el('read-toggle').addEventListener('click',()=>update(selected.status,!selected.unread).catch(report));
  el('delete-message').addEventListener('click',async()=>{
    if(!selected||!confirm('Delete this message and its screenshot permanently?'))return;
    try{await api('delete',{id:selected.id});selected=null;request++;el('detail').hidden=true;await refresh()}catch(error){report(error)}
  });
  el('logout').addEventListener('click',async()=>{
    try{await api('logout',{});location.reload()}catch(error){report(error)}
  });
  if(location.protocol==='file:')el('admin-status').textContent='Open /admin on the running local server or website to use the inbox.';
  else refresh().catch(error=>{if(error.message!=='Please sign in.')report(error)});
})();
