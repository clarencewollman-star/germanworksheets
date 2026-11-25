(() => {
  const el = id => document.getElementById(id);
  let messages = [], selected = null, request = 0;
  const verseSettings = el('daily-verse-settings');
  const verseList = el('daily-verse-list');
  const verseStatus = el('daily-verse-editor-status');
  const saveVerses = el('save-daily-verses');
  let verseListLoaded = false;
  async function api(path, data) {
    const response = await fetch('/api/feedback/' + path, data === undefined ? {} : {
      method:'POST', headers:{'Content-Type':'application/json','X-Feedback-Request':'1'}, body:JSON.stringify(data)
    });
    const value = await response.json();
    if (response.status === 401) {
      el('login-form').hidden = false; el('inbox').hidden = true;
      selected = null; messages = []; el('detail').hidden = true; el('message-list').replaceChildren();
      verseSettings.open = false; verseListLoaded = false;
    }
    if (!response.ok) throw new Error(value.error || 'Request failed.');
    return value;
  }
  function report(error) { el('admin-status').textContent = error.message || 'Could not connect. Please try again.'; }
  function showVerseList(verses) {
    verseList.value = verses.map(([id, chapter, number]) => {
      const book = luther1912Catalog.find(book => book.id === id);
      return book.name + ' ' + chapter + ':' + number;
    }).join('\n');
  }
  async function readVerseList() {
    const verses = new Map();
    for (const line of verseList.value.split('\n').map(value => value.trim()).filter(Boolean)) {
      const {book, chapter, first, last, error} = parseBibleReference(line);
      if (error) throw new Error(error);
      if (book.section !== 'nt') throw new Error('“' + line + '” is outside the New Testament.');
      const chapters = await Luther1912.loadBook(book.id);
      const numbers = new Set(chapters[chapter].map(([number]) => number));
      for (let number = first; number <= last; number++) {
        if (!numbers.has(number)) throw new Error(book.name + ' ' + chapter + ':' + number + ' was not found.');
        const entry = [book.id, chapter, number];
        verses.set(entry.join('/'), entry);
      }
    }
    return [...verses.values()];
  }
  verseSettings.addEventListener('toggle', async () => {
    if (!verseSettings.open || verseListLoaded) return;
    verseListLoaded = true;
    verseList.disabled = saveVerses.disabled = true;
    verseStatus.textContent = 'Loading saved verses…';
    try {
      const {verses} = await api('daily-verses');
      showVerseList(verses);
      verseList.disabled = saveVerses.disabled = false;
      verseStatus.textContent = '';
    } catch (error) {
      verseListLoaded = false;
      verseStatus.textContent = error.message;
    }
  });
  el('daily-verse-form').addEventListener('submit', async event => {
    event.preventDefault();
    verseList.disabled = saveVerses.disabled = true;
    verseStatus.textContent = 'Checking verses…';
    try {
      const {verses} = await api('daily-verses', {verses: await readVerseList()});
      showVerseList(verses);
      verseStatus.textContent = verses.length === 1 ? '1 verse saved.' : verses.length + ' verses saved.';
    } catch (error) {
      verseStatus.textContent = error.message;
    } finally {
      verseList.disabled = saveVerses.disabled = false;
    }
  });
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
  async function initialize() {
    const status = await api('setup-status');
    el('setup-form').hidden = !status.needsSetup;
    el('login-form').hidden = status.needsSetup;
    if (!status.needsSetup) await refresh().catch(error => { if(error.message !== 'Please sign in.') report(error); });
  }
  el('setup-form').addEventListener('submit', async event => {
    event.preventDefault();
    if(el('setup-password').value !== el('setup-confirm').value) return report(new Error('Passwords do not match.'));
    const button=event.submitter; button.disabled=true;
    try {
      await api('setup',{code:el('setup-code').value,username:el('setup-user').value,password:el('setup-password').value});
      el('username').value=el('setup-user').value;
      el('setup-form').reset();el('setup-form').hidden=true;el('login-form').hidden=false;
      el('admin-status').textContent='Account created. Sign in with your new password.';
    } catch(error) { report(error); } finally { button.disabled=false; }
  });
  el('account-toggle').addEventListener('click',async()=>{
    if(!el('account-form').hidden){el('account-form').hidden=true;return;}
    try{const account=await api('account');el('account-user').value=account.username;el('account-form').hidden=false;}catch(error){report(error);}
  });
  el('account-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(el('account-password').value!==el('account-confirm').value)return report(new Error('Passwords do not match.'));
    const button=event.submitter;button.disabled=true;
    try {
      await api('change-password',{username:el('account-user').value,currentPassword:el('account-current').value,password:el('account-password').value});
      el('username').value=el('account-user').value;el('account-form').reset();el('account-form').hidden=true;
      el('inbox').hidden=true;el('login-form').hidden=false;el('password').value='';
      selected=null;messages=[];request++;el('detail').hidden=true;el('message-list').replaceChildren();
      el('admin-status').textContent='Account updated. Sign in with your new password.';
    }catch(error){report(error);}finally{button.disabled=false;}
  });
  if(location.protocol==='file:')el('admin-status').textContent='Open /admin on the running local server or website to use the inbox.';
  else initialize().catch(report);
})();
