/* Shared AdminLTE presentation. Generator logic stays in its existing modules. */
(() => {
  const main=document.querySelector('main');
  if(!main)return;
  const embedded=new URLSearchParams(location.search).get('packet')==='1';
  document.body.classList.add('gw-ui');
  for(const el of main.querySelectorAll('select'))el.classList.add('form-select');
  for(const el of main.querySelectorAll('textarea,input:not([type=checkbox]):not([type=radio])'))el.classList.add('form-control');
  for(const el of main.querySelectorAll('input[type=checkbox],input[type=radio]'))el.classList.add('form-check-input');
  for(const el of main.querySelectorAll('button'))el.classList.add('btn',el.classList.contains('primary')?'btn-primary':'btn-outline-secondary');
  for(const el of main.querySelectorAll('.panel,.controls'))el.classList.add('card');
  if(embedded){document.body.classList.add('gw-embedded');return}
  const groups=[
    {name:'Writing',items:[['handwriting-worksheet-generator.html','Handwriting','Aa']]},
    {name:'Reading & Vocabulary',items:[['flashcard-generator.html','Flashcards','▤'],['reading-practice-generator.html','Sound blending','Ab']]},
    {name:'Puzzles',items:[['crossword-generator.html','Crossword','▦'],['wordsearch-generator.html','Word search','⌕']]},
    {name:'Packets',items:[['packet-builder.html','Packet Builder','▣']]},
    {name:'Utilities',items:[['text-converter.html','Text converter','⇄']]}
  ];
  const items=[['index.html','Home','⌂',''],...groups.flatMap(group=>group.items.map(item=>[...item,group.name]))];
  const current=location.pathname.split('/').pop()||'index.html';
  const title=items.find(i=>i[0]===current)?.[1]||'German Worksheets';
  document.body.classList.add('layout-fixed','sidebar-expand-lg','bg-body-tertiary');
  const wrapper=document.createElement('div');wrapper.className='app-wrapper';
  const navbar=document.createElement('nav');navbar.className='app-header navbar navbar-expand bg-body';navbar.setAttribute('aria-label','Page navigation');
  navbar.innerHTML='<div class="container-fluid"><button class="btn gw-menu" type="button" data-lte-toggle="sidebar" aria-label="Toggle navigation" aria-controls="gw-sidebar"><span aria-hidden="true">☰</span></button><span class="gw-current"></span><a class="gw-brand-mobile" href="index.html">German Worksheets</a></div>';
  navbar.querySelector('.gw-current').textContent=title;
  const sidebar=document.createElement('aside');sidebar.id='gw-sidebar';sidebar.className='app-sidebar bg-body-secondary shadow';sidebar.setAttribute('data-bs-theme','dark');
  sidebar.innerHTML='<div class="sidebar-brand"><a href="index.html" class="brand-link"><span class="gw-logo" aria-hidden="true">GW</span><span class="brand-text fw-semibold">German Worksheets</span></a></div><div class="sidebar-wrapper"><nav aria-label="Worksheet tools"><ul class="nav sidebar-menu flex-column" role="list"></ul></nav></div>';
  const list=sidebar.querySelector('ul');
  let previousGroup='';
  for(const [href,label,icon,group]of items){if(group&&group!==previousGroup){previousGroup=group;const heading=document.createElement('li');heading.className='nav-header gw-group-label';heading.textContent=group;list.append(heading)}const li=document.createElement('li');li.className='nav-item';const a=document.createElement('a');a.className='nav-link'+(href===current?' active':'');a.href=href;if(href===current)a.setAttribute('aria-current','page');const mark=document.createElement('span');mark.className='nav-icon gw-nav-icon';mark.textContent=icon;mark.setAttribute('aria-hidden','true');const text=document.createElement('p');text.textContent=label;a.append(mark,text);li.append(a);list.append(li)}
  main.classList.add('app-main');
  const footer=document.createElement('footer');footer.className='app-footer';footer.textContent='German Worksheets';
  const oldVersion=document.getElementById('app-version');if(oldVersion)oldVersion.remove();
  const version=document.createElement('span');version.id='app-version';version.className='float-end';footer.append(version);
  wrapper.append(navbar,sidebar,main,footer);document.body.append(wrapper);
  for(const a of main.querySelectorAll(':scope > a:not(.tool),:scope > header > a'))a.hidden=true;
  if(current==='index.html'){
    main.classList.add('gw-home');
    const cards=new Map([...main.querySelectorAll('.tool')].map(card=>[card.getAttribute('href'),card]));
    for(const [index,group]of groups.entries()){
      const section=document.createElement('section');section.className='gw-tool-group';
      const heading=document.createElement('h2');heading.id='tool-group-'+index;heading.textContent=group.name;section.setAttribute('aria-labelledby',heading.id);
      const grid=document.createElement('div');grid.className='gw-tools';
      for(const [href]of group.items){const card=cards.get(href);if(!card)continue;card.classList.add('card');card.removeAttribute('style');card.querySelector('.content')?.classList.add('card-body');card.querySelector('.action')?.classList.add('btn','btn-primary');grid.append(card)}
      section.append(heading,grid);main.append(section);
    }
  }
  const menu=navbar.querySelector('button');
  const updateMenu=()=>{const mobile=matchMedia('(max-width: 991.98px)').matches;menu.setAttribute('aria-expanded',String(mobile?document.body.classList.contains('sidebar-open'):!document.body.classList.contains('sidebar-collapse')))};
  new MutationObserver(updateMenu).observe(document.body,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',updateMenu);updateMenu();
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('sidebar-open')){menu.click();menu.focus()}});
})();
