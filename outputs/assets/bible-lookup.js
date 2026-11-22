(() => {
 const source = document.getElementById('lookup-source');
 const difficulty = document.getElementById('lookup-difficulty');
 const bookPicker = document.getElementById('lookup-books');
 const create = document.getElementById('lookup-create');
 const save = document.getElementById('lookup-save');
 const status = document.getElementById('lookup-status');
 const review = document.getElementById('lookup-review');
 const list = document.getElementById('lookup-verse-list');
 const preview = document.getElementById('lookup-preview');
 const sheets = document.getElementById('lookup-sheets');
 const {loadBook, verseText} = Luther1912;
 const sections = {ot: 'Old Testament', nt: 'New Testament', ap: 'Apocrypha'};
 const levels = {easy: [1, 1], medium: [2, 2], hard: [3, 5]};
 const pools = new Map();
 const wordPattern = /\p{L}[\p{L}\p{M}]*(?:[-\u2010\u2011'’]\p{L}[\p{L}\p{M}]*)*/gu;
 const measure = document.createElement('canvas').getContext('2d');
 const family = 'Fraktur, serif';
 const bodySize = 18;
 const width = 612;
 const height = 792;
 const left = 48;
 const right = width - left;
 const textX = left + 28;
 const contentWidth = right - textX;
 const spacing = 25;
 const ns = 'http://www.w3.org/2000/svg';
 let questions = [];
 let pickVerse;
 let busy = false;

 for (const [section, title] of Object.entries(sections)) {
  const group = document.createElement('details');
  const summary = document.createElement('summary');
  const choices = document.createElement('div');
  summary.textContent = title;
  choices.className = 'lookup-books';
  for (const book of luther1912Catalog.filter(book => book.section === section)) {
   const label = document.createElement('label');
   const checkbox = document.createElement('input');
   checkbox.type = 'checkbox';
   checkbox.value = book.id;
   label.lang = 'de';
   label.append(checkbox, book.name);
   choices.append(label);
  }
  group.append(summary, choices);
  bookPicker.append(group);
 }

 function selectedBooks() {
  if (source.value === 'books') {
   const chosen = new Set([...bookPicker.querySelectorAll('input:checked')].map(input => Number(input.value)));
   return luther1912Catalog.filter(book => chosen.has(book.id));
  }
  return luther1912Catalog.filter(book => book.section === source.value || (source.value === 'both' && book.section !== 'ap'));
 }

 async function bookPool(book) {
  if (pools.has(book.id)) return pools.get(book.id);
  const chapters = await loadBook(book.id);
  const pool = [];
  for (const [chapter, rows] of Object.entries(chapters)) {
   const duplicates = new Set();
   const numbers = new Set();
   for (const [number] of rows) {
    if (numbers.has(number)) duplicates.add(number);
    numbers.add(number);
   }
   for (const [number, verse] of rows) {
    // Students need an unambiguous citation to look up in the reader.
    if (duplicates.has(number)) continue;
    const text = verseText(verse);
    const words = [...text.matchAll(wordPattern)];
    pool.push({key: book.id + '/' + chapter + '/' + number, reference: book.name + ' ' + chapter + ':' + number, text, words});
   }
  }
  pools.set(book.id, pool);
  return pool;
 }

 function randomIndex(length) {
  return Math.floor(Math.random() * length);
 }

 function makeQuestion(verse, [min, max]) {
  const {words, text} = verse;
  const length = min + randomIndex(Math.min(max, words.length - 2) - min + 1);
  const spans = [];
  for (let i = 0; i + length <= words.length; i++) {
   const start = words[i].index;
   const last = words[i + length - 1];
   const end = last.index + last[0].length;
   const answer = text.slice(start, end);
   const plain = answer.split(/\s+/).every((word, j) => word === words[i + j]?.[0]);
   const substantial = words.slice(i, i + length).some(word => word[0].length >= 4);
   spans.push({start, end, preference: Number(plain) * 2 + Number(substantial)});
  }
  const best = Math.max(...spans.map(span => span.preference));
  const choices = spans.filter(span => span.preference === best);
  const {start, end} = choices[randomIndex(choices.length)];
  return {reference: verse.reference, before: text.slice(0, start), answer: text.slice(start, end), after: text.slice(end), length};
 }

 function newSampler(books, level) {
  const order = [...books];
  for (let i = order.length - 1; i > 0; i--) {
   const j = randomIndex(i + 1);
   [order[i], order[j]] = [order[j], order[i]];
  }
  const used = new Set();
  let cursor = 0;
  return async () => {
   for (let attempt = 0; attempt < order.length; attempt++) {
    const book = order[cursor++ % order.length];
    const pool = await bookPool(book);
    const choices = pool.filter(verse => verse.words.length >= level[0] + 2 && !used.has(verse.key));
    if (!choices.length) continue;
    const verse = choices[randomIndex(choices.length)];
    used.add(verse.key);
    return makeQuestion(verse, level);
   }
   return null;
  };
 }

 function draw(sheet, name, attributes, text) {
  const node = document.createElementNS(ns, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  sheet.append(node);
 }

 function label(sheet, text, x, y, size, extra = {}) {
  draw(sheet, 'text', {x, y, 'font-family': family, 'font-size': size, 'font-kerning': 'none', fill: '#19241f', ...extra}, convertFraktur(text));
 }

 function rule(sheet, x1, x2, y, color, weight, extra = {}) {
  draw(sheet, 'line', {x1, x2, y1: y, y2: y, stroke: color, 'stroke-width': weight, ...extra});
 }

 function verseLines(question) {
  measure.font = bodySize + 'px ' + family;
  measure.fontKerning = 'none';
  const textWidth = text => measure.measureText(convertFraktur(text)).width;
  const space = textWidth(' ');
  const punctuation = question.after.match(/^[.,;:!?…)\]}"’]+/)?.[0] || '';
  const makeTokens = text => text.trim().split(/\s+/).filter(Boolean).map(word => ({text: word, width: textWidth(word)}));
  const blank = Math.min(contentWidth - textWidth(punctuation), Math.max([0, 112, 174, 244][Math.min(question.length, 3)], textWidth(question.answer) + 35));
  const tokens = [
   ...makeTokens(question.before),
   {blank, text: punctuation, width: blank + textWidth(punctuation)},
   ...makeTokens(question.after.slice(punctuation.length))
  ];
  const lines = [[]];
  let cursor = 0;
  for (const token of tokens) {
   if (cursor && cursor + space + token.width > contentWidth) {
    lines.push([]);
    cursor = 0;
   }
   const x = cursor ? cursor + space : 0;
   lines.at(-1).push({...token, x});
   cursor = x + token.width;
  }
  return lines;
 }

 function renderSheets() {
  const pages = [];
  const top = 134;
  const bottom = 738;
  let pageRows = [];
  let usedHeight = 0;
  for (const [index, question] of questions.entries()) {
   const lines = verseLines(question);
   const rowHeight = Math.max(86, 32 + lines.length * spacing);
   if (pageRows.length === 5 || (pageRows.length && usedHeight + rowHeight > bottom - top)) {
    pages.push(pageRows);
    pageRows = [];
    usedHeight = 0;
   }
   pageRows.push({index, question, lines, rowHeight});
   usedHeight += rowHeight;
  }
  if (pageRows.length) pages.push(pageRows);

  sheets.replaceChildren(...pages.map((rows, pageIndex) => {
   const page = document.createElement('div');
   page.className = 'page lookup-sheet';
   const sheet = document.createElementNS(ns, 'svg');
   sheet.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
   sheet.setAttribute('role', 'img');
   sheet.setAttribute('aria-label', 'Worksheet page ' + (pageIndex + 1));
   page.append(sheet);
   draw(sheet, 'rect', {width, height, fill: '#fff'});
   label(sheet, 'Name', right - 164, 41, 13);
   rule(sheet, right - 130, right, 43, '#526359', .65);
   label(sheet, 'Bibelstellen nachschlagen', left, 77, 31);
   label(sheet, 'Schlage jede Bibelstelle nach. Ergänze die fehlenden Wörter.', left, 104, 16);
   rule(sheet, left, right, 120, '#75847c', .7);
   const padding = Math.min(20, (bottom - top - rows.reduce((sum, row) => sum + row.rowHeight, 0)) / rows.length);
   let y = top;
   for (const [position, row] of rows.entries()) {
    label(sheet, (row.index + 1) + '.', left, y + 12, 16);
    label(sheet, row.question.reference, textX, y + 12, 16);
    for (const [lineIndex, line] of row.lines.entries()) {
     const baseline = y + 38 + lineIndex * spacing;
     for (const token of line) {
      if (token.blank) rule(sheet, textX + token.x, textX + token.x + token.blank, baseline + 2, '#17241c', .9, {'data-verse-blank': row.index + 1});
      if (token.text) label(sheet, token.text, textX + token.x + (token.blank || 0), baseline, bodySize);
     }
    }
    y += row.rowHeight + padding;
    if (position < rows.length - 1) rule(sheet, left, right, y - 4, '#bac5bf', .55);
   }
   rule(sheet, left, right, 748, '#75847c', .65);
   label(sheet, 'Lutherbibel 1912', left, 765, 12);
   label(sheet, (pageIndex + 1) + ' / ' + pages.length, right, 765, 12, {'text-anchor': 'end'});
   return page;
  }));
 }

 function render() {
  list.replaceChildren(...questions.map((question, index) => {
   const item = document.createElement('li');
   const row = document.createElement('div');
   row.className = 'lookup-verse';
   const reference = document.createElement('strong');
   reference.textContent = question.reference;
   const passage = document.createElement('p');
   const marked = document.createElement('mark');
   marked.textContent = question.answer;
   passage.append(question.before, marked, question.after);
   const replace = document.createElement('button');
   replace.type = 'button';
   replace.className = 'btn btn-outline-secondary';
   replace.setAttribute('aria-label', 'Replace ' + question.reference);
   replace.lang = 'en';
   replace.textContent = '×';
   replace.addEventListener('click', async () => {
    await run('Finding a different verse…', 'Could not replace the verse. Try again.', async () => {
     const replacement = await pickVerse();
     if (!replacement) {
      status.textContent = 'There are no unused verses at this difficulty in the selected books.';
      return;
     }
     questions[index] = replacement;
     render();
     status.textContent = 'Verse ' + (index + 1) + ' replaced.';
    });
    list.children[index]?.querySelector('button').focus({preventScroll: true});
   });
   row.append(reference, passage, replace);
   item.append(row);
   return item;
  }));
  review.hidden = preview.hidden = !questions.length;
  renderSheets();
 }

 function updateControls() {
  source.disabled = difficulty.disabled = bookPicker.disabled = create.disabled = busy;
  save.disabled = busy || !questions.length;
  for (const button of list.querySelectorAll('button')) button.disabled = busy;
 }

 async function run(message, errorMessage, task) {
  if (busy) return;
  busy = true;
  updateControls();
  status.textContent = message;
  try {
   await task();
  } catch {
   status.textContent = errorMessage;
  } finally {
   busy = false;
   updateControls();
  }
 }

 function clearWorksheet() {
  questions = [];
  review.hidden = preview.hidden = true;
  list.replaceChildren();
  sheets.replaceChildren();
  status.textContent = '';
  updateControls();
 }

 source.addEventListener('change', () => {
  bookPicker.hidden = source.value !== 'books';
  clearWorksheet();
 });
 difficulty.addEventListener('change', clearWorksheet);
 bookPicker.addEventListener('change', clearWorksheet);
 create.addEventListener('click', () => {
  const books = selectedBooks();
  if (!books.length) {
   status.textContent = 'Choose at least one book.';
   return;
  }
  run('Finding verses…', 'Could not load the Bible verses or build the worksheet. Try again.', async () => {
   await document.fonts.load(bodySize + 'px ' + family);
   const sample = newSampler(books, levels[difficulty.value]);
   const found = [];
   while (found.length < 10) {
    const question = await sample();
    if (!question) break;
    found.push(question);
   }
   questions = found;
   pickVerse = sample;
   render();
   status.textContent = found.length === 10 ? '10 verses ready.' : (
    found.length ? 'Found ' + found.length + ' eligible verses. Choose more books for a set of 10.' : 'No verses fit these settings. Try a different difficulty or choose more books.'
   );
  });
 });
 save.addEventListener('click', () => run('Creating PDF…', 'Could not create the PDF. Try again.', async () => {
  const pages = await GermanPDF.fromSVG([...sheets.querySelectorAll('svg')], width, height);
  await GermanPDF.download(GermanPDF.fromPages(pages), 'Bible Lookup Worksheet.pdf');
  status.textContent = '';
 }));
})();
