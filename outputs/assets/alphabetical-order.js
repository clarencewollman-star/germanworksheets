(() => {
 const input = document.getElementById('alphabet-text');
 const font = document.getElementById('alphabet-font');
 const includeKey = document.getElementById('alphabet-key');
 const create = document.getElementById('alphabet-create');
 const save = document.getElementById('alphabet-save');
 const status = document.getElementById('alphabet-status');
 const preview = document.getElementById('alphabet-pages');
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
 const writingSpacing = 29;
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

 function makePages(passage, wordCount, style) {
  const pages = [];
  const lines = wrapText(style.encode(passage), right - left);
  let textIndex = 0;
  let answer = 1;
  while (textIndex < lines.length || answer <= wordCount) {
   const sheet = newPage(pages, 'ABC-Reihenfolge', 'Worksheet');
   printText(sheet, 'Name', right - 166, 59, 11);
   draw(sheet, 'line', {x1: right - 132, x2: right, y1: 61, y2: 61, stroke: '#607068', 'stroke-width': .6});
   printText(sheet, 'Lies den Text. Schreibe jedes Wort einmal in alphabetischer Reihenfolge auf.', left, 91, 12);

   let y = top;
   while (textIndex < lines.length && y <= bottom) {
    const line = lines[textIndex++];
    if (line) printWord(sheet, line, left, y, style);
    y += style.spacing;
   }
   if (y > top) y += 16;
   const columnRows = Math.max(0, Math.floor((bottom - y) / writingSpacing) + 1);
   const count = Math.min(wordCount - answer + 1, columnRows * 2);
   inColumns(count, y, writingSpacing, (index, x, rowY) => {
    printText(sheet, (answer + index) + '.', x, rowY - 4, 10);
    draw(sheet, 'line', {x1: x + numberWidth, x2: x + columnWidth, y1: rowY, y2: rowY, stroke: '#607068', 'stroke-width': .65});
   });
   answer += count;
  }
  printPageNumbers(pages);
  return pages;
 }

 function makeAnswerKey(words, style) {
  const pages = [];
  const rows = [...words].sort(germanOrder.compare).flatMap((word, index) =>
   wrapText(style.encode(word), columnWidth - numberWidth).map((text, line) => ({text, number: line === 0 ? index + 1 : null}))
  );
  const perPage = (Math.floor((bottom - top) / style.spacing) + 1) * 2;
  for (let offset = 0; offset < rows.length; offset += perPage) {
   const sheet = newPage(pages, 'ABC-Reihenfolge · Lösungen', 'Answer key');
   inColumns(Math.min(perPage, rows.length - offset), top, style.spacing, (index, x, y) => {
    const {text, number} = rows[offset + index];
    if (number !== null) printText(sheet, number + '.', x, y, 10);
    printWord(sheet, text, x + numberWidth, y, style);
   });
  }
  printPageNumbers(pages);
  return pages;
 }

 async function createWorksheet() {
  const request = ++revision;
  const passage = input.value.trim().normalize('NFC');
  const unique = new Map();
  for (const word of passage.match(/\p{L}[\p{L}\p{M}]*(?:[-\u2010\u2011'’]\p{L}[\p{L}\p{M}]*)*/gu) || []) {
   const normalized = word.toLocaleLowerCase('de');
   if (!unique.has(normalized)) unique.set(normalized, word);
  }
  const wordCount = unique.size;
  if (!wordCount) {
   status.textContent = 'Paste text with at least one word.';
   input.focus();
   return;
  }
  const style = fonts[font.value];
  const withKey = includeKey.checked;
  preview.replaceChildren();
  save.disabled = true;
  try {
   await document.fonts.load(style.size + 'px ' + style.family);
   if (request !== revision) return;
   measure.font = style.size + 'px ' + style.family;
   const pages = makePages(passage, wordCount, style);
   if (withKey) pages.push(...makeAnswerKey(unique.values(), style));
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
  saving = save.disabled = true;
  save.textContent = 'Creating PDF…';
  try {
   const pages = await GermanPDF.fromSVG(sheets, width, height);
   await GermanPDF.download(GermanPDF.fromPages(pages), 'Alphabetical Order Worksheet.pdf');
  } catch {
   status.textContent = 'Could not create the PDF. Try again.';
  } finally {
   saving = false;
   save.disabled = !preview.childElementCount;
   save.textContent = 'Save PDF';
  }
 });
})();
