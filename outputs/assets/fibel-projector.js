(() => {
 const sectionPicker = document.getElementById('fibel-section');
 const readerView = document.getElementById('fibel-view');
 const reader = document.getElementById('fibel-reading');
 const open = document.getElementById('fibel-project');
 const projector = document.getElementById('fibel-projector');
 const shell = document.getElementById('fibel-projector-shell');
 const stage = document.getElementById('fibel-projector-stage');
 const title = document.getElementById('fibel-projector-title');
 const progress = document.getElementById('fibel-progress');
 const back = document.getElementById('fibel-back');
 const next = document.getElementById('fibel-next');
 const view = document.getElementById('fibel-project-view');
 const size = document.getElementById('fibel-text-size');
 const full = document.getElementById('fibel-full');
 let sectionIndex = 0;
 let lineIndex = 0;
 const groups = new Map();

 fibelSections.forEach((section, index) => {
  if (!groups.has(section.group)) {
   const group = document.createElement('optgroup');
   group.label = section.group;
   groups.set(section.group, group);
   sectionPicker.append(group);
  }
  const option = new Option(section.title + ' · ' + section.pages, index);
  option.lang = 'de';
  groups.get(section.group).append(option);
 });

 function readingLine(text) {
  const line = document.createElement('p');
  line.className = 'fibel-line';
  line.lang = 'de';
  const printed = document.createElement('span');
  printed.className = 'fibel-printed';
  const unbrokenWord = text.replace(/(\p{L})-(?=\p{L})/gu, '$1\u00ad');
  printed.textContent = convertFraktur(unbrokenWord).replaceAll('\u00ad', '-').replaceAll('ſ', 's');
  line.append(printed);
  if (printed.textContent !== text) {
   printed.setAttribute('aria-hidden', 'true');
   const plain = document.createElement('span');
   plain.className = 'visually-hidden';
   plain.textContent = text;
   line.append(plain);
  }
  return line;
 }

 function sectionContent(section, lines, picturesFirst = false) {
  const content = document.createElement('div');
  content.className = 'fibel-content';
  const text = document.createElement('div');
  text.className = 'fibel-text';
  text.append(...lines.map(readingLine));
  content.append(text);
  if (section.images.length) {
   const pictures = document.createElement('div');
   pictures.className = 'fibel-illustrations';
   for (const {file, alt, writing} of section.images) {
    const image = document.createElement('img');
    image.src = 'assets/fibel/illustrations/' + file;
    image.alt = alt;
    if (writing) image.classList.add('fibel-writing');
    pictures.append(image);
   }
   if (picturesFirst) content.prepend(pictures);
   else content.append(pictures);
  }
  return content;
 }

 function showReader() {
  sectionIndex = Number(sectionPicker.value);
  lineIndex = 0;
  const section = fibelSections[sectionIndex];
  const heading = document.createElement('h3');
  heading.lang = 'de';
  heading.textContent = section.title + ' · ' + section.pages;
  reader.replaceChildren(heading, sectionContent(section, section.lines));
  reader.scrollTop = 0;
 }

 function fitLine() {
  if (!projector.open || view.value !== 'line') return;
  const line = stage.querySelector('.fibel-line');
  if (!line) return;
  line.style.fontSize = '';
  const width = line.firstElementChild.getBoundingClientRect().width;
  if (width > line.clientWidth) {
   line.style.fontSize = Math.max(1, Math.floor(Number(size.value) * (line.clientWidth - 2) / width)) + 'px';
  }
 }

 function showProjection() {
  const section = fibelSections[sectionIndex];
  const oneLine = view.value === 'line';
  const lineCount = Math.max(1, section.lines.length);
  const lines = oneLine ? section.lines.slice(lineIndex, lineIndex + 1) : section.lines;
  stage.dataset.view = view.value;
  title.textContent = section.title + ' · ' + section.pages;
  progress.textContent = oneLine && section.lines.length ? 'Line ' + (lineIndex + 1) + ' of ' + lineCount : '';
  back.disabled = sectionIndex === 0 && (!oneLine || lineIndex === 0);
  next.disabled = sectionIndex === fibelSections.length - 1 && (!oneLine || lineIndex === lineCount - 1);
  back.setAttribute('aria-label', oneLine ? 'Previous line' : 'Previous section');
  next.setAttribute('aria-label', oneLine ? 'Next line' : 'Next section');
  stage.replaceChildren(sectionContent(section, lines, true));
  stage.scrollTop = 0;
  fitLine();
 }

 function step(direction) {
  const oneLine = view.value === 'line';
  const section = fibelSections[sectionIndex];
  if (oneLine && section.lines[lineIndex + direction] !== undefined) {
   lineIndex += direction;
  } else {
   const destination = fibelSections[sectionIndex + direction];
   if (!destination) return;
   sectionIndex += direction;
   lineIndex = oneLine && direction < 0 ? Math.max(0, destination.lines.length - 1) : 0;
  }
  showProjection();
 }

 sectionPicker.addEventListener('change', showReader);
 open.addEventListener('click', () => {
  view.value = readerView.value;
  lineIndex = 0;
  projector.showModal();
  showProjection();
  stage.focus({preventScroll: true});
 });
 for (const [button, direction] of [[back, -1], [next, 1]]) {
  button.addEventListener('click', () => {
   step(direction);
   stage.focus({preventScroll: true});
  });
 }
 view.addEventListener('change', () => {
  lineIndex = 0;
  readerView.value = view.value;
  showProjection();
  stage.focus({preventScroll: true});
 });
 size.addEventListener('input', () => {
  stage.style.setProperty('--fibel-font-size', size.value + 'px');
  fitLine();
 });
 stage.style.setProperty('--fibel-font-size', size.value + 'px');
 new ResizeObserver(fitLine).observe(stage);
 document.fonts.addEventListener('loadingdone', fitLine);

 projector.addEventListener('keydown', event => {
  if (event.target.closest('input, select') || (event.code === 'Space' && event.target.closest('button'))) return;
  if (['ArrowRight', 'PageDown', 'Space'].includes(event.code)) {
   event.preventDefault();
   if (!event.repeat) step(1);
  } else if (['ArrowLeft', 'PageUp'].includes(event.code)) {
   event.preventDefault();
   if (!event.repeat) step(-1);
  }
 });
 full.hidden = !document.fullscreenEnabled || !shell.requestFullscreen;
 full.addEventListener('click', async () => {
  try {
   if (document.fullscreenElement === shell) await document.exitFullscreen();
   else await shell.requestFullscreen();
  } catch {
   // The projector dialog also works without browser full screen.
  }
  if (projector.open) stage.focus({preventScroll: true});
 });
 document.addEventListener('fullscreenchange', () => {
  full.textContent = document.fullscreenElement === shell ? 'Leave full screen' : 'Full screen';
 });
 projector.addEventListener('close', () => {
  if (document.fullscreenElement === shell) document.exitFullscreen().catch(() => {});
  sectionPicker.value = String(sectionIndex);
  showReader();
  open.focus({preventScroll: true});
 });

 showReader();
})();
