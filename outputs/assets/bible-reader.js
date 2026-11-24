(() => {
 const locationButton = document.getElementById('bible-location');
 const picker = document.getElementById('bible-picker');
 const pickerTitle = document.getElementById('bible-picker-title');
 const bookGrid = document.getElementById('bible-book-grid');
 const chapterPanel = document.getElementById('bible-chapter-panel');
 const chapterGrid = document.getElementById('bible-chapter-grid');
 const font = document.getElementById('bible-font');
 const encoders = {fraktur: convertFraktur, hand: convert, handschrift: convertHandschrift};
 const heading = document.getElementById('bible-heading');
 const verses = document.getElementById('bible-verses');
 const copyButton = document.getElementById('bible-copy');
 const worksheetButton = document.getElementById('bible-worksheet');
 const converterButton = document.getElementById('bible-converter');
 const projectButton = document.getElementById('bible-project');
 const projector = document.getElementById('bible-projector');
 const projectorShell = document.getElementById('bible-projector-shell');
 const projectorStage = document.getElementById('bible-projector-stage');
 const projectorReference = document.getElementById('bible-projector-reference');
 const projectorText = document.getElementById('bible-projector-text');
 const projectorStatus = document.getElementById('bible-projector-status');
 const projectorBack = document.getElementById('bible-projector-back');
 const projectorNext = document.getElementById('bible-projector-next');
 const projectorSize = document.getElementById('bible-projector-size');
 const projectorSizeValue = document.getElementById('bible-projector-size-value');
 const projectorSyllables = document.getElementById('bible-projector-syllables');
 const projectorLineMode = document.getElementById('bible-projector-line-mode');
 const projectorLineCount = document.getElementById('bible-projector-line-count');
 const fullscreenButton = document.getElementById('bible-projector-fullscreen');
 const selectionActions = document.getElementById('bible-selection-actions');
 const selectionStatus = document.getElementById('bible-selection-status');
 const status = document.getElementById('bible-status');
 const previous = document.getElementById('bible-prev');
 const next = document.getElementById('bible-next');
 const {books, loadBook, verseText} = Luther1912;
 const sections = {ot:'Old Testament', ap:'Apocrypha', nt:'New Testament'};
 const ordered = [];
 const bookButtons = new Map();
 let currentBook;
 let currentChapter;
 let lastBookButton;
 let request = 0;
 let verseRows = [];
 let selectedPassage = '';
 let selectedVerseIndex;
 let verseSelected = false;
 let projection;
 let readerRange;

 const scriptGlyphs = {'#':'', '$':'', '<':'sch', '`':'ch', '¤':'ck', 'µ':'tt', '{':'ff', '\\':'ll', '~':'tz'};
 const frakturGlyphs = {'¡':'ch', '¿':'ck', '|':'tz'};

 // Map each displayed caret position back to the original German, including
 // legacy-font ligatures and joining marks with no corresponding letter.
 function sourceOffsets(text, display, glyphs) {
  const offsets = [0];
  let sourceIndex = 0;
  for (let i = 0; i < display.length; i++) {
   const glyph = display[i];
   const expansion = glyphs[glyph];
   sourceIndex += expansion !== undefined && glyph !== text[sourceIndex]
    && text.startsWith(expansion, sourceIndex) ? expansion.length : 1;
   offsets.push(sourceIndex);
  }
  return offsets;
 }

 function readSelection(selection) {
  if (!selection || selection.isCollapsed || !selection.rangeCount) return [];
  const range = selection.getRangeAt(0);
  if (!range.intersectsNode(verses)) return [];
  const rows = [];
  for (const [index, {node, text, offsets, number}] of verseRows.entries()) {
   if (!range.intersectsNode(node)) continue;
   const start = range.startContainer === node ? range.startOffset : 0;
   const end = range.endContainer === node ? range.endOffset : node.length;
   const line = text.slice(offsets ? offsets[start] : start, offsets ? offsets[end] : end);
   if (line.trim()) rows.push({index, number, text: line});
  }
  return rows;
 }

 function formatPassage(rows) {
  if (!rows.length) return '';
  const first = rows[0].number;
  const last = rows.at(-1).number;
  const verseRange = first === last ? first : first + '-' + last;
  const reference = currentBook.name + ' ' + currentChapter + ':' + verseRange;
  return [...rows.map(row => row.text), reference].join('\n');
 }

 function updateSelection(rows) {
  selectedVerseIndex = rows[0]?.index;
  const text = formatPassage(rows);
  if (!text) verseSelected = false;
  if (text === selectedPassage) return;
  selectedPassage = text;
  selectionActions.hidden = !text;
  selectionStatus.textContent = '';
 }

 document.addEventListener('selectionchange', () => {
  updateSelection(readSelection(window.getSelection()));
 });

 for (const button of [copyButton, worksheetButton, converterButton, projectButton]) {
  button.addEventListener('pointerdown', event => {
   // Keep the browser's text selection when using one of its actions.
   if (selectedPassage) event.preventDefault();
  });
 }

 document.addEventListener('copy', event => {
  const selection = window.getSelection();
  const withinPassage = verses.contains(selection?.anchorNode) && verses.contains(selection?.focusNode);
  const passage = withinPassage ? formatPassage(readSelection(selection)) : '';
  if (!passage || !event.clipboardData) return;
  event.clipboardData.setData('text/plain', passage);
  event.preventDefault();
 });

 function selectVerse(node, selection) {
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
  verseSelected = true;
  updateSelection(readSelection(selection));
 }

 verses.addEventListener('pointerdown', event => {
  // Dragging from a click-selected verse should start a new text highlight.
  if (!verseSelected || event.button !== 0 || event.shiftKey) return;
  window.getSelection().removeAllRanges();
  verseSelected = false;
 });

 copyButton.addEventListener('click', async () => {
  const text = selectedPassage;
  if (!text) return;
  const revision = request;
  try {
   await navigator.clipboard.writeText(text);
  } catch {
   const selection = window.getSelection();
   const range = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
   const focused = document.activeElement;
   const field = document.createElement('textarea');
   field.className = 'visually-hidden';
   field.value = text;
   document.body.append(field);
   field.select();
   let copied = false;
   try { copied = document.execCommand('copy'); } catch {}
   field.remove();
   focused?.focus({preventScroll: true});
   if (range && range.startContainer.isConnected) {
    selection.removeAllRanges();
    selection.addRange(range);
   }
   if (!copied) {
    selectionStatus.textContent = 'Could not copy the text. Highlight it and use your device’s Copy command.';
    return;
   }
  }
  if (revision === request && text === selectedPassage) selectionStatus.textContent = 'Text copied.';
 });

 function openTool(page) {
  if (selectedPassage) location.assign(page + '#bible-text=' + encodeURIComponent(selectedPassage));
 }
 worksheetButton.addEventListener('click', () => openTool('handwriting-worksheet-generator.html'));
 converterButton.addEventListener('click', () => openTool('text-converter.html'));

 function tile(text, label, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-outline-secondary';
  button.textContent = text;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', action);
  return button;
 }

 for (const [key, label] of Object.entries(sections)) {
  const section = document.createElement('section');
  const title = document.createElement('h3');
  title.textContent = label;
  const group = document.createElement('div');
  group.className = 'bibel-grid';
  group.dataset.section = key;
  for (const book of luther1912Catalog.filter(book => book.section === key)) {
   ordered.push(book);
   const button = tile(book.short, book.name, () => {
    lastBookButton = button;
    showChapterGrid(book);
   });
   button.title = book.name;
   button.lang = 'de';
   bookButtons.set(book.id, button);
   group.append(button);
  }
  section.append(title, group);
  bookGrid.append(section);
 }

 function showBookGrid() {
  pickerTitle.textContent = 'Choose a book';
  bookGrid.hidden = false;
  chapterPanel.hidden = true;
  if (lastBookButton) lastBookButton.focus();
  else {
   picker.scrollTop = 0;
   pickerTitle.focus();
  }
 }

 function showChapterGrid(book) {
  pickerTitle.textContent = book.name + ' · Choose a chapter';
  chapterGrid.replaceChildren(...book.chapters.map(chapter => {
   const button = tile(chapter, 'Chapter ' + chapter, () => {
    picker.close();
    navigate(book.id, chapter);
   });
   if (book === currentBook && chapter === currentChapter) button.setAttribute('aria-current', 'true');
   return button;
  }));
  bookGrid.hidden = true;
  chapterPanel.hidden = false;
  picker.scrollTop = 0;
  pickerTitle.focus();
 }

 locationButton.addEventListener('click', () => {
  lastBookButton = null;
  for (const [id, button] of bookButtons) {
   if (id === currentBook.id) button.setAttribute('aria-current', 'true');
   else button.removeAttribute('aria-current');
  }
  picker.showModal();
  showBookGrid();
 });
 document.getElementById('bible-picker-back').addEventListener('click', showBookGrid);

 function chapterTarget(book, chapter, delta) {
  const chapterIndex = book.chapters.indexOf(chapter);
  const sameBook = book.chapters[chapterIndex + delta];
  if (sameBook) return [book, sameBook];
  const other = ordered[ordered.indexOf(book) + delta];
  if (!other) return null;
  return [other, delta < 0 ? other.chapters.at(-1) : other.chapters[0]];
 }

 function appendVerseText(container, text, node) {
  if (node.data === text) {
   container.append(node);
   return;
  }
  const printed = document.createElement('span');
  printed.setAttribute('aria-hidden', 'true');
  printed.append(node);
  const spoken = document.createElement('span');
  spoken.className = 'visually-hidden';
  spoken.textContent = text;
  container.append(printed, spoken);
 }

 function updateProjectionButtons() {
  const {book, chapter, index, rows, loading, lines, lineIndex} = projection;
  projectorBack.disabled = Boolean(loading || ((!lines || lineIndex === 0) && index === 0 && !chapterTarget(book, chapter, -1)));
  projectorNext.disabled = Boolean(loading || ((!lines || lineIndex === lines.length - 1) && index === rows.length - 1 && !chapterTarget(book, chapter, 1)));
 }

 function projectionLines(readable, encoded) {
  // Measure the wrapped verse with the actual display font and width.
  const measure = document.createElement('div');
  measure.className = 'bibel-projector-text bibel-projector-measure';
  measure.setAttribute('aria-hidden', 'true');
  const node = document.createTextNode(encoded);
  measure.append(node);
  projectorText.after(measure);
  const range = document.createRange();
  const boundaries = [0];
  let offset = 0;
  let previousTop;
  for (const character of encoded) {
   range.setStart(node, offset);
   range.setEnd(node, offset + character.length);
   const rect = range.getClientRects()[0];
   if (rect?.width > 0) {
    if (previousTop !== undefined && Math.abs(rect.top - previousTop) > .5) boundaries.push(offset);
    previousTop = rect.top;
   }
   offset += character.length;
  }
  measure.remove();
  boundaries.push(encoded.length);
  const offsets = encoded === readable ? null : sourceOffsets(readable, encoded, projector.dataset.font === 'fraktur' ? frakturGlyphs : scriptGlyphs);
  return boundaries.slice(0, -1).map((start, index) => {
   const end = boundaries[index + 1];
   return {start, end, text: encoded.slice(start, end).trim(), spoken: readable.slice(offsets?.[start] ?? start, offsets?.[end] ?? end).trim()};
  });
 }

 function showProjectionLine() {
  const {lines, lineIndex} = projection;
  const line = lines[lineIndex];
  projectorText.replaceChildren();
  appendVerseText(projectorText, line.spoken, document.createTextNode(line.text));
  projectorLineCount.textContent = 'Line ' + (lineIndex + 1) + ' of ' + lines.length;
  projectorStage.scrollTop = 0;
  updateProjectionButtons();
 }

 function renderProjection({lastLine = false, offset = 0} = {}) {
  const {book, chapter, index, rows} = projection;
  const [number, source] = rows[index];
  const text = verseText(source);
  const encode = encoders[projector.dataset.font];
  const display = projectorSyllables.checked ? splitGermanSyllables(text) : text;
  const encoded = encode ? encode(display) : display;
  const reference = book.name + ' ' + chapter + ':' + number;
  if (projectorReference.textContent !== reference) projectorReference.textContent = reference;
  const lineMode = projectorLineMode.checked;
  projector.dataset.lineMode = String(lineMode);
  projectorLineCount.hidden = !lineMode;
  projectorBack.setAttribute('aria-label', lineMode ? 'Back one line' : 'Back one verse');
  projectorNext.setAttribute('aria-label', lineMode ? 'Next line' : 'Next verse');
  projectorStatus.textContent = '';
  if (lineMode) {
   const lines = projectionLines(display, encoded);
   projection.lines = lines;
   projection.lineIndex = lastLine ? lines.length - 1 : Math.max(0, lines.findIndex(line => offset < line.end));
   showProjectionLine();
   projection.lineWidth = projectorText.clientWidth;
   return;
  }
  projection.lines = null;
  projectorText.replaceChildren();
  appendVerseText(projectorText, text, document.createTextNode(encoded));
  projectorStage.scrollTop = 0;
  updateProjectionButtons();
 }

 function reflowProjection() {
  if (!projector.open || !projection?.lines) return;
  renderProjection({offset: projection.lines[projection.lineIndex].start});
 }

 function updateProjectionSize() {
  const value = projectorSize.value + ' px';
  projector.style.setProperty('--projection-size', projectorSize.value + 'px');
  projectorSizeValue.value = value;
  reflowProjection();
 }

 projectorSize.addEventListener('input', updateProjectionSize);
 projectorSize.addEventListener('change', updateProjectionSize);
 projectorSize.addEventListener('pointerup', () => projectorStage.focus({preventScroll: true}));
 for (const toggle of [projectorSyllables, projectorLineMode]) {
  toggle.addEventListener('change', () => {
   if (!projector.open) return;
   renderProjection();
   projectorStage.focus({preventScroll: true});
  });
 }
 new ResizeObserver(() => {
  if (projection?.lineWidth !== projectorText.clientWidth) reflowProjection();
 }).observe(projectorText);
 document.fonts.addEventListener('loadingdone', reflowProjection);

 projectButton.addEventListener('click', () => {
  const rows = books.get(currentBook.id)?.[currentChapter];
  if (!rows?.[selectedVerseIndex] || projector.open) return;
  const selection = window.getSelection();
  readerRange = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  projection = {book: currentBook, chapter: currentChapter, index: selectedVerseIndex, rows};
  projector.dataset.font = font.value;
  updateProjectionSize();
  projector.showModal();
  renderProjection();
  projectorStage.focus({preventScroll: true});
 });

 async function stepProjection(delta) {
  if (!projection || projection.loading) return;
  const {book, chapter, index, rows, lines, lineIndex} = projection;
  const nextLine = lineIndex + delta;
  if (lines?.[nextLine]) {
   projection.lineIndex = nextLine;
   showProjectionLine();
   return;
  }
  const nextIndex = index + delta;
  if (rows[nextIndex]) {
   projection.index = nextIndex;
   renderProjection({lastLine: delta < 0});
   return;
  }
  const target = chapterTarget(book, chapter, delta);
  if (!target) return;
  const [targetBook, targetChapter] = target;
  const waiting = projection;
  waiting.loading = true;
  updateProjectionButtons();
  try {
   const chapters = await loadBook(targetBook.id);
   if (projection !== waiting || !projector.open) return;
   const targetRows = chapters[targetChapter];
   projection = {book: targetBook, chapter: targetChapter, index: delta < 0 ? targetRows.length - 1 : 0, rows: targetRows};
   renderProjection({lastLine: delta < 0});
  } catch {
   if (projection !== waiting || !projector.open) return;
   waiting.loading = false;
   updateProjectionButtons();
   projectorStatus.textContent = 'Could not load the next passage. Try again.';
  }
 }

 for (const [button, delta] of [[projectorBack, -1], [projectorNext, 1]]) {
  button.addEventListener('click', event => {
   if (event.detail > 0) projectorStage.focus({preventScroll: true});
   stepProjection(delta);
  });
 }
 projector.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const key = event.key && event.key !== 'Unidentified' ? event.key : event.code;
  const paging = key === 'PageUp' || key === 'PageDown';
  if (!paging && event.target.closest('input')) return;
  const backward = key === 'ArrowLeft' || key === 'PageUp';
  const forward = key === 'ArrowRight' || key === 'PageDown'
   || ((key === ' ' || key === 'Space') && !event.target.closest('button'));
  if (!backward && !forward) return;
  event.preventDefault();
  if (!event.repeat) stepProjection(backward ? -1 : 1);
 });

 fullscreenButton.hidden = !document.fullscreenEnabled || !projectorShell.requestFullscreen;
 fullscreenButton.addEventListener('click', async () => {
  try {
   if (document.fullscreenElement === projectorShell) await document.exitFullscreen();
   else await projectorShell.requestFullscreen();
  } catch {
   projectorStatus.textContent = 'Could not change full screen mode.';
  } finally {
   if (projector.open) projectorStage.focus({preventScroll: true});
  }
 });
 document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement === projectorShell ? 'Leave full screen' : 'Full screen';
 });
 projector.addEventListener('close', () => {
  projection = null;
  if (document.fullscreenElement === projectorShell) document.exitFullscreen().catch(() => {});
  if (readerRange && verses.contains(readerRange.startContainer) && verses.contains(readerRange.endContainer)) {
   const selection = window.getSelection();
   selection.removeAllRanges();
   selection.addRange(readerRange);
   updateSelection(readSelection(selection));
   projectButton.focus({preventScroll: true});
  }
  readerRange = null;
 });

 async function render() {
  const revision = ++request;
  const book = currentBook;
  const chapter = currentChapter;
  const encode = encoders[font.value];
  heading.textContent = book.name + ' ' + chapter;
  locationButton.textContent = heading.textContent + ' ▾';
  locationButton.lang = 'de';
  previous.disabled = !chapterTarget(book, chapter, -1);
  next.disabled = !chapterTarget(book, chapter, 1);
  verses.dataset.font = font.value;
  status.hidden = books.has(book.id);
  status.textContent = 'Loading chapter…';
  verses.replaceChildren();
  verseRows = [];
  updateSelection([]);
  try {
   const chapters = await loadBook(book.id);
   if (revision !== request) return;
   const fragment = document.createDocumentFragment();
   for (const [number, sourceText] of chapters[chapter]) {
    const text = verseText(sourceText);
    const display = encode ? encode(text) : text;
    const row = document.createElement('p');
    row.lang = 'de';
    const numberLabel = document.createElement('sup');
    const verseNumber = document.createElement('button');
    verseNumber.type = 'button';
    verseNumber.className = 'bibel-verse-number';
    verseNumber.textContent = number;
    verseNumber.lang = 'en';
    verseNumber.setAttribute('aria-label', 'Select verse ' + number);
    numberLabel.append(verseNumber);
    const node = document.createTextNode(display);
    row.append(numberLabel, ' ');
    appendVerseText(row, text, node);
    const offsets = encode ? sourceOffsets(text, display, font.value === 'fraktur' ? frakturGlyphs : scriptGlyphs) : null;
    verseRows.push({number, node, text, offsets});
    row.addEventListener('click', event => {
     const selection = window.getSelection();
     if (event.target === verseNumber || selection.isCollapsed) selectVerse(node, selection);
    });
    fragment.append(row);
   }
   verses.replaceChildren(fragment);
   status.hidden = true;
  } catch {
   if (revision !== request) return;
   status.textContent = 'Could not load the chapter. Please reload the page.';
   status.hidden = false;
  }
 }

 function show(bookId, chapter) {
  const book = ordered.find(book => book.id === bookId) || ordered[0];
  currentBook = book;
  currentChapter = book.chapters.includes(chapter) ? chapter : book.chapters[0];
  render();
 }

 function showFromHash() {
  const [book, chapter] = location.hash.slice(1).split('/').map(Number);
  show(book, chapter);
 }

 function navigate(book, chapter) {
  const hash = '#' + book + '/' + chapter;
  if (location.hash === hash) show(book, chapter);
  else location.hash = hash;
 }

 font.addEventListener('change', render);
 function step(delta) {
  const target = chapterTarget(currentBook, currentChapter, delta);
  if (target) {
   navigate(target[0].id, target[1]);
   heading.focus();
  }
 }
 previous.addEventListener('click', () => step(-1));
 next.addEventListener('click', () => step(1));
 window.addEventListener('hashchange', showFromHash);
 showFromHash();
})();
