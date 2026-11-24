(() => {
 const input = document.getElementById('alphabet-text');
 const font = document.getElementById('alphabet-font');
 const includeKey = document.getElementById('alphabet-key');
 const create = document.getElementById('alphabet-create');
 const save = document.getElementById('alphabet-save');
 const status = document.getElementById('alphabet-status');
 const preview = document.getElementById('alphabet-pages');
 const activity = document.getElementById('syllable-activity');
 const syllablePractice = document.querySelector('main').dataset.wordWorksheet === 'syllables';
 const title = syllablePractice ? 'Silben schreiben' : 'ABC-Reihenfolge';
 const instruction = syllablePractice
  ? 'Schreibe jedes Wort mit Silbenstrichen. Beispiel: Blu-men.'
  : 'Lies den Text. Schreibe jedes Wort einmal in alphabetischer Reihenfolge auf.';
 const ns = 'http://www.w3.org/2000/svg';
 const width = 612;
 const height = 792;
 const left = 48;
 const right = width - left;
 const top = 122;
 const bottom = height - 50;
 const columnGap = 24;
 const columnWidth = (right - left - columnGap) / 2;
 const numberWidth = 25;
 const promptGap = 46;
 const writingSpacing = syllablePractice ? 78 : 29;
 const family = 'Arial, sans-serif';
 const fonts = {
  Arial: {family, size: 14, spacing: 20, encode: text => text},
  Fraktur: {family: 'Fraktur, serif', size: 17, spacing: 23, encode: convertFraktur},
  Hand: {family: 'Hand, cursive', size: 20, spacing: 28, encode: convert},
  Handschrift: {family: 'Handschrift, cursive', size: 22, spacing: 29, encode: convertHandschrift}
 };
 const germanOrder = new Intl.Collator('de', {sensitivity: 'accent'});
 const measure = document.createElement('canvas').getContext('2d');
 measure.fontKerning = 'none';
 let saving = false;
 let revision = 0;

 function draw(sheet, name, attributes, text) {
  const element = document.createElementNS(ns, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text !== undefined) element.textContent = text;
  sheet.append(element);
 }

 function printText(sheet, text, x, y, size, extra = {}) {
  draw(sheet, 'text', {x, y, 'font-family': family, 'font-size': size, fill: '#17241f', ...extra}, text);
 }

 function wrapText(passage, maxWidth) {
  const fits = text => measure.measureText(text).width <= maxWidth;
  const lines = [];
  for (const paragraph of passage.split('\n')) {
   let line = '';
   for (const word of paragraph.split(/\s+/).filter(Boolean)) {
    const joined = line ? line + ' ' + word : word;
    if (fits(joined)) {
     line = joined;
     continue;
    }
    if (line) lines.push(line);
    line = '';
    for (const character of word) {
     if (line && !fits(line + character)) {
      lines.push(line);
      line = '';
     }
     line += character;
    }
   }
   lines.push(line);
  }
  return lines;
 }

 function newPage(pages, title, label) {
  const sheet = document.createElementNS(ns, 'svg');
  sheet.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  sheet.setAttribute('role', 'img');
  sheet.setAttribute('aria-label', label + ' page ' + (pages.length + 1));
  const page = document.createElement('div');
  page.className = 'page alphabet-page';
  page.append(sheet);
  pages.push(page);
  draw(sheet, 'rect', {width, height, fill: '#fff'});
  printText(sheet, title, left, 60, 23);
  return sheet;
 }

 function printPageNumbers(pages) {
  if (pages.length < 2) return;
  pages.forEach((page, index) => printText(page.firstChild, (index + 1) + ' / ' + pages.length, right, height - 29, 9, {'text-anchor': 'end'}));
 }

 function inColumns(count, y, spacing, drawRow) {
  const leftCount = Math.ceil(count / 2);
  for (let i = 0; i < count; i++) {
   const firstColumn = i < leftCount;
   const x = firstColumn ? left : left + columnWidth + columnGap;
   drawRow(i, x, y + (firstColumn ? i : i - leftCount) * spacing);
  }
 }

 function printWord(sheet, text, x, y, style) {
  printText(sheet, text, x, y, style.size, {'font-family': style.family, 'font-kerning': 'none'});
 }

 function printWordToFit(sheet, word, x, y, style, maxWidth) {
  const text = style.encode(word);
  const fit = Math.min(1, maxWidth / measure.measureText(text).width);
  printWord(sheet, text, x, y, {...style, size: style.size * fit});
 }

 function printInstructions(sheet, instructions) {
  printText(sheet, 'Name', right - 166, 59, 11);
  draw(sheet, 'line', {x1: right - 132, x2: right, y1: 61, y2: 61, stroke: '#607068', 'stroke-width': .6});
  printText(sheet, instructions, left, 91, 12);
 }

 function practiceAnswer(word) {
  return word.replace(/[^-\u2010\u2011]+/g, part => {
   const split = splitGermanSyllables(part);
   // Spoken syllable practice can separate an initial vowel, as in O-ma.
   return split.replace(/^([aeiouäöü])(?=[bcdfghjklmnprstvwyz][aeiouäöü])/i, '$1-');
  });
 }

 function makePages(passage, exercises, style) {
  const pages = [];
  const lines = wrapText(style.encode(passage), right - left);
  let textIndex = 0;
  let answer = 1;
  while (textIndex < lines.length || answer <= exercises.length) {
   const sheet = newPage(pages, title, 'Worksheet');
   printInstructions(sheet, instruction);

   let y = top;
   while (textIndex < lines.length && y <= bottom) {
    const line = lines[textIndex++];
    if (line) printWord(sheet, line, left, y, style);
    y += style.spacing;
   }
   if (y > top) y += syllablePractice ? 52 : 16;
   else if (syllablePractice) y += 45;
   const columnRows = Math.max(0, Math.floor((bottom - y) / writingSpacing) + 1);
   const count = Math.min(exercises.length - answer + 1, columnRows * 2);
   inColumns(count, y, writingSpacing, (index, x, rowY) => {
    const exercise = exercises[answer + index - 1];
    const labelY = rowY - (exercise.prompt ? promptGap : 4);
    printText(sheet, (answer + index) + '.', x, labelY, 10);
    if (exercise.prompt) {
     printWordToFit(sheet, exercise.prompt, x + numberWidth, labelY, style, columnWidth - numberWidth - 2);
    }
    draw(sheet, 'line', {x1: x + numberWidth, x2: x + columnWidth, y1: rowY, y2: rowY, stroke: '#607068', 'stroke-width': .65});
   });
   answer += count;
  }
  printPageNumbers(pages);
  return pages;
 }

 function makeAnswerKey(exercises, style) {
  const pages = [];
  const rows = exercises.flatMap(({answer}, index) =>
   wrapText(style.encode(answer), columnWidth - numberWidth).map((text, line) => ({text, number: line === 0 ? index + 1 : null}))
  );
  const perPage = (Math.floor((bottom - top) / style.spacing) + 1) * 2;
  for (let offset = 0; offset < rows.length; offset += perPage) {
   const sheet = newPage(pages, title + ' · Lösungen', 'Answer key');
   inColumns(Math.min(perPage, rows.length - offset), top, style.spacing, (index, x, y) => {
    const {text, number} = rows[offset + index];
    if (number !== null) printText(sheet, number + '.', x, y, 10);
    printWord(sheet, text, x + numberWidth, y, style);
   });
  }
  printPageNumbers(pages);
  return pages;
 }

 function makeSortingPages(exercises, style, answerKey = false) {
  const pages = [];
  const bank = answerKey ? [] : wrapText(style.encode(exercises.map(exercise => exercise.prompt).join(', ')), right - left);
  const groups = [[], [], []];
  for (const {prompt, answer} of exercises) {
   const syllables = answer.split(/[-\u2010\u2011]/).length;
   groups[Math.min(syllables, 3) - 1].push(prompt);
  }
  const headings = ['1 Silbe', '2 Silben', '3 oder mehr Silben'];
  const rows = Math.max(...groups.map(group => group.length));
  const sortColumnWidth = (right - left - columnGap * 2) / 3;
  const rowSpacing = answerKey ? style.spacing + 2 : 39;
  const heading = answerKey ? 'Wörter nach Silben sortieren · Lösungen' : 'Wörter nach Silben sortieren';
  let bankIndex = 0;
  let row = 0;
  while (bankIndex < bank.length || row < rows) {
   const sheet = newPage(pages, heading, answerKey ? 'Answer key' : 'Worksheet');
   if (!answerKey) printInstructions(sheet, 'Sortiere die Wörter nach der Anzahl ihrer Silben.');
   let y = top;
   while (bankIndex < bank.length && y <= bottom) {
    printWord(sheet, bank[bankIndex++], left, y, style);
    y += style.spacing;
   }
   if (y > top) y += 18;
   const firstRow = y + (answerKey ? 24 : 38);
   if (firstRow > bottom) continue;
   const count = Math.min(rows - row, Math.floor((bottom - firstRow) / rowSpacing) + 1);
   for (const [index, group] of groups.entries()) {
    const x = left + index * (sortColumnWidth + columnGap);
    printText(sheet, headings[index], x, y, 12);
    for (let i = 0; i < Math.min(count, group.length - row); i++) {
     const rowY = firstRow + i * rowSpacing;
     if (answerKey) {
      printWordToFit(sheet, group[row + i], x, rowY, style, sortColumnWidth - 2);
     } else {
      draw(sheet, 'line', {x1: x, x2: x + sortColumnWidth, y1: rowY, y2: rowY, stroke: '#607068', 'stroke-width': .65});
     }
    }
   }
   row += count;
  }
  printPageNumbers(pages);
  return pages;
 }

 async function createWorksheet() {
  const request = ++revision;
  const sorting = activity?.value === 'sort';
  preview.replaceChildren();
  save.disabled = true;
  const passage = input.value.trim().normalize('NFC');
  const unique = new Map();
  for (const word of passage.match(/\p{L}[\p{L}\p{M}]*(?:[-\u2010\u2011'’]\p{L}[\p{L}\p{M}]*)*/gu) || []) {
   const normalized = word.toLocaleLowerCase('de');
   if (!unique.has(normalized)) unique.set(normalized, word);
  }
  const words = [...unique.values()];
  const exercises = syllablePractice
   ? words.map(prompt => ({prompt, answer: practiceAnswer(prompt)})).filter(({prompt, answer}) => sorting || answer !== prompt)
   : words.sort(germanOrder.compare).map(answer => ({answer}));
  const wordCount = exercises.length;
  if (!wordCount) {
   status.textContent = syllablePractice && !sorting ? 'Paste text with a word the worksheet can split, such as Blumen.' : 'Paste text with at least one word.';
   input.focus();
   return;
  }
  const style = fonts[font.value];
  const withKey = includeKey.checked;
  try {
   await document.fonts.load(style.size + 'px ' + style.family);
   if (request !== revision) return;
   measure.font = style.size + 'px ' + style.family;
   const pages = sorting ? makeSortingPages(exercises, style) : makePages(passage, exercises, style);
   if (withKey) pages.push(...(sorting ? makeSortingPages(exercises, style, true) : makeAnswerKey(exercises, style)));
   preview.replaceChildren(...pages);
   save.disabled = saving;
   status.textContent = wordCount + (wordCount === 1 ? ' word' : ' words') + ' · ' + pages.length + (pages.length === 1 ? ' page' : ' pages');
  } catch {
   if (request !== revision) return;
   preview.replaceChildren();
   status.textContent = 'Could not create the worksheet. Try again.';
  }
 }

 create.addEventListener('click', createWorksheet);
 activity?.addEventListener('change', () => {
  const sorting = activity.value === 'sort';
  document.getElementById('syllable-rewrite-help').hidden = sorting;
  document.getElementById('syllable-sort-help').hidden = !sorting;
  if (input.value.trim()) createWorksheet();
 });
 for (const control of [font, includeKey]) {
  control.addEventListener('change', () => {
   if (input.value.trim()) createWorksheet();
  });
 }
 input.addEventListener('input', () => {
  revision++;
  preview.replaceChildren();
  save.disabled = true;
  status.textContent = '';
 });

 save.addEventListener('click', async () => {
  const sheets = [...preview.querySelectorAll('svg')];
  if (!sheets.length || saving) return;
  const filename = syllablePractice ? 'Syllable Practice Worksheet.pdf' : 'Alphabetical Order Worksheet.pdf';
  const worksheetName = activity?.value === 'sort' ? 'Syllable Sorting Worksheet.pdf' : filename;
  saving = save.disabled = true;
  save.textContent = 'Creating PDF…';
  try {
   const pages = await GermanPDF.fromSVG(sheets, width, height);
   await GermanPDF.download(GermanPDF.fromPages(pages), worksheetName);
  } catch {
   status.textContent = 'Could not create the PDF. Try again.';
  } finally {
   saving = false;
   save.disabled = !preview.childElementCount;
   save.textContent = 'Save PDF';
  }
 });
})();
