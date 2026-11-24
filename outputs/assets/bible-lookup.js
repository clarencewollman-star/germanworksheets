(() => {
 const source = document.getElementById('lookup-source');
 const difficulty = document.getElementById('lookup-difficulty');
 const bookPicker = document.getElementById('lookup-books');
 const manual = document.getElementById('lookup-manual');
 const references = document.getElementById('lookup-references');
 const create = document.getElementById('lookup-create');
 const save = document.getElementById('lookup-save');
 const status = document.getElementById('lookup-status');
 const review = document.getElementById('lookup-review');
 const reviewHelp = document.getElementById('lookup-review-help');
 const list = document.getElementById('lookup-verse-list');
 const preview = document.getElementById('lookup-preview');
 const sheets = document.getElementById('lookup-sheets');
 const {loadBook, verseText} = Luther1912;
 const worksheetSize = 10;
 const sections = {ot: 'Old Testament', nt: 'New Testament', ap: 'Apocrypha'};
 const englishBookNames = {
  1: ['Genesis', 'Gen', 'Ge', 'Gn'],
  2: ['Exodus', 'Exod', 'Ex'],
  3: ['Leviticus', 'Lev', 'Lv'],
  4: ['Numbers', 'Num', 'Nu', 'Nm'],
  5: ['Deuteronomy', 'Deut', 'Dt'],
  6: ['Joshua', 'Josh', 'Jos'],
  7: ['Judges', 'Judg', 'Jdg', 'Jgs'],
  8: ['Ruth', 'Ru', 'Rth'],
  9: ['1 Samuel', '1 Sam', '1 Sa'],
  10: ['2 Samuel', '2 Sam', '2 Sa'],
  11: ['1 Kings', '1 Kgs', '1 Kin', '1 Ki'],
  12: ['2 Kings', '2 Kgs', '2 Kin', '2 Ki'],
  13: ['1 Chronicles', '1 Chron', '1 Chr', '1 Ch'],
  14: ['2 Chronicles', '2 Chron', '2 Chr', '2 Ch'],
  15: ['Ezra', 'Ezr'],
  16: ['Nehemiah', 'Neh'],
  17: ['Esther', 'Esth', 'Est'],
  18: ['Job', 'Jb'],
  19: ['Psalms', 'Psalm', 'Psa', 'Ps', 'Pss'],
  20: ['Proverbs', 'Prov', 'Pr', 'Prv'],
  21: ['Ecclesiastes', 'Eccles', 'Eccl', 'Ecc', 'Ec'],
  22: ['Song of Solomon', 'Song of Songs', 'Song', 'SOS', 'Canticles', 'Cant'],
  23: ['Isaiah', 'Isa', 'Is'],
  24: ['Jeremiah', 'Jer'],
  25: ['Lamentations', 'Lam'],
  26: ['Ezekiel', 'Ezek', 'Eze'],
  27: ['Daniel', 'Dan', 'Dn'],
  28: ['Hosea', 'Hos'],
  29: ['Joel', 'Jl'],
  30: ['Amos', 'Am'],
  31: ['Obadiah', 'Obad', 'Ob'],
  32: ['Jonah', 'Jon', 'Jnh'],
  33: ['Micah', 'Mic'],
  34: ['Nahum', 'Nah'],
  35: ['Habakkuk', 'Hab'],
  36: ['Zephaniah', 'Zeph', 'Zep'],
  37: ['Haggai', 'Hag'],
  38: ['Zechariah', 'Zech', 'Zec'],
  39: ['Malachi', 'Mal'],
  40: ['Matthew', 'Matt', 'Mat', 'Mt'],
  41: ['Mark', 'Mk', 'Mrk'],
  42: ['Luke', 'Lk', 'Luk'],
  43: ['John', 'Jn', 'Jhn'],
  44: ['Acts', 'Acts of the Apostles', 'Ac'],
  45: ['Romans', 'Rom', 'Ro', 'Rm'],
  46: ['1 Corinthians', '1 Cor', '1 Co'],
  47: ['2 Corinthians', '2 Cor', '2 Co'],
  48: ['Galatians', 'Gal'],
  49: ['Ephesians', 'Eph'],
  50: ['Philippians', 'Phil', 'Php'],
  51: ['Colossians', 'Col'],
  52: ['1 Thessalonians', '1 Thess', '1 Thes', '1 Th'],
  53: ['2 Thessalonians', '2 Thess', '2 Thes', '2 Th'],
  54: ['1 Timothy', '1 Tim', '1 Ti'],
  55: ['2 Timothy', '2 Tim', '2 Ti'],
  56: ['Titus', 'Tit'],
  57: ['Philemon', 'Philem', 'Phlm', 'Phm'],
  58: ['Hebrews', 'Heb'],
  59: ['James', 'Jas', 'Jm'],
  60: ['1 Peter', '1 Pet', '1 Pe', '1 Pt'],
  61: ['2 Peter', '2 Pet', '2 Pe', '2 Pt'],
  62: ['1 John', '1 Jn', '1 Jhn'],
  63: ['2 John', '2 Jn', '2 Jhn'],
  64: ['3 John', '3 Jn', '3 Jhn'],
  65: ['Jude', 'Jud'],
  66: ['Revelation', 'Rev', 'Re', 'Apocalypse'],
  67: ['Judith', 'Jdt', 'Jth'],
  68: ['Wisdom', 'Wisdom of Solomon', 'Wis', 'Wisd'],
  69: ['Tobit', 'Tobias', 'Tob'],
  70: ['Sirach', 'Ecclesiasticus', 'Sir'],
  71: ['Baruch', 'Bar'],
  72: ['1 Maccabees', '1 Macc', '1 Mac'],
  73: ['2 Maccabees', '2 Macc', '2 Mac'],
  74: ['Additions to Daniel', 'Add Daniel', 'Add Dan'],
  75: ['Additions to Esther', 'Rest of Esther', 'Add Esther', 'Add Est'],
  76: ['Prayer of Manasseh', 'Prayer of Manasses', 'Pr Man']
 };
 const bookOrdinals = {first: '1', second: '2', third: '3', i: '1', ii: '2', iii: '3'};
 const booksByName = new Map();
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

 for (const book of luther1912Catalog) {
  for (const name of [book.name, book.short, ...englishBookNames[book.id]]) {
   booksByName.set(bookNameKey(name), book);
  }
 }

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

 function bookNameKey(name) {
  return name.normalize('NFD').toLowerCase()
   .replace(/^(first|second|third|iii|ii|i)(?=[.\s])/, ordinal => bookOrdinals[ordinal])
   .replace(/[\p{M}.\s]/gu, '');
 }

 async function manualVerses() {
  const lines = references.value.split('\n').map(line => line.trim()).filter(Boolean);
  if (!lines.length) return {error: 'Enter at least one verse reference.'};
  const found = new Map();
  for (const line of lines) {
   const match = line.match(/^(.+?)\s+(\d+)\s*[:,]\s*(\d+)(?:\s*[-–—]\s*(\d+))?$/);
   if (!match) return {error: 'Check “' + line + '”. Use a reference like John 3:16.'};
   const [, name, chapterText, firstText, lastText = firstText] = match;
   const book = booksByName.get(bookNameKey(name));
   if (!book) return {error: 'Unknown book in “' + line + '”. Use an English or German book name or abbreviation.'};
   const chapter = Number(chapterText);
   const first = Number(firstText);
   const last = Number(lastText);
   if (!book.chapters.includes(chapter)) return {error: 'Chapter ' + chapterText + ' was not found in ' + book.name + '.'};
   if (!first || !Number.isSafeInteger(last) || last < first) return {error: 'Check the verse numbers in “' + line + '”.'};
   if (last - first + 1 > worksheetSize) return {error: 'Enter up to ' + worksheetSize + ' verses per worksheet.'};
   const pool = await bookPool(book);
   for (let number = first; number <= last; number++) {
    const key = book.id + '/' + chapter + '/' + number;
    const verse = pool.find(entry => entry.key === key);
    if (!verse) return {error: 'Could not find a unique verse for ' + book.name + ' ' + chapter + ':' + number + '.'};
    if (!verse.words.length) return {error: verse.reference + ' has no words to use for this exercise.'};
    found.set(key, verse);
    if (found.size > worksheetSize) return {error: 'Enter up to ' + worksheetSize + ' verses per worksheet.'};
   }
  }
  return {verses: [...found.values()]};
 }

 function randomIndex(length) {
  return Math.floor(Math.random() * length);
 }

 function makeQuestion(verse, [min, max]) {
  const {words, text} = verse;
  const maximum = Math.min(max, Math.max(1, words.length - 2));
  const minimum = Math.min(min, maximum);
  const length = minimum + randomIndex(maximum - minimum + 1);
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
  const manualSelection = source.value === 'manual';
  const buttonAction = manualSelection ? 'Remove' : 'Replace';
  reviewHelp.textContent = 'The highlighted words will be blank. Use × to ' + buttonAction.toLowerCase() + ' a verse.';
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
   const button = document.createElement('button');
   button.type = 'button';
   button.className = 'btn btn-outline-secondary';
   button.setAttribute('aria-label', buttonAction + ' ' + question.reference);
   button.lang = 'en';
   button.textContent = '×';
   button.addEventListener('click', async () => {
    if (manualSelection) {
     questions.splice(index, 1);
     render();
     updateControls();
     status.textContent = question.reference + ' removed from the worksheet.';
     const nextButton = list.children[Math.min(index, questions.length - 1)]?.querySelector('button');
     (nextButton || references).focus({preventScroll: true});
     return;
    }
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
   row.append(reference, passage, button);
   item.append(row);
   return item;
  }));
  review.hidden = preview.hidden = !questions.length;
  renderSheets();
 }

 function updateControls() {
  source.disabled = difficulty.disabled = bookPicker.disabled = references.disabled = create.disabled = busy;
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

 function updateSource() {
  bookPicker.hidden = source.value !== 'books';
  manual.hidden = source.value !== 'manual';
  clearWorksheet();
 }

 source.addEventListener('change', updateSource);
 updateSource();
 difficulty.addEventListener('change', clearWorksheet);
 bookPicker.addEventListener('change', clearWorksheet);
 create.addEventListener('click', () => {
  if (source.value === 'manual') {
   run('Looking up verses…', 'Could not load the Bible verses or build the worksheet. Try again.', async () => {
    const {verses, error} = await manualVerses();
    if (error) {
     status.textContent = error;
     return;
    }
    await document.fonts.load(bodySize + 'px ' + family);
    const level = levels[difficulty.value];
    questions = verses.map(verse => makeQuestion(verse, level));
    render();
    status.textContent = (questions.length === 1 ? '1 verse ready.' : questions.length + ' verses ready.')
     + (questions.some(question => question.length < level[0]) ? ' Short verses use fewer missing words.' : '');
   });
   return;
  }
  const books = selectedBooks();
  if (!books.length) {
   status.textContent = 'Choose at least one book.';
   return;
  }
  run('Finding verses…', 'Could not load the Bible verses or build the worksheet. Try again.', async () => {
   await document.fonts.load(bodySize + 'px ' + family);
   const sample = newSampler(books, levels[difficulty.value]);
   const found = [];
   while (found.length < worksheetSize) {
    const question = await sample();
    if (!question) break;
    found.push(question);
   }
   questions = found;
   pickVerse = sample;
   render();
   status.textContent = found.length === worksheetSize ? worksheetSize + ' verses ready.' : (
    found.length ? 'Found ' + found.length + ' eligible verses. Choose more books for a set of ' + worksheetSize + '.' : 'No verses fit these settings. Try a different difficulty or choose more books.'
   );
  });
 });
 save.addEventListener('click', () => run('Creating PDF…', 'Could not create the PDF. Try again.', async () => {
  const pages = await GermanPDF.fromSVG([...sheets.querySelectorAll('svg')], width, height);
  await GermanPDF.download(GermanPDF.fromPages(pages), 'Bible Lookup Worksheet.pdf');
  status.textContent = '';
 }));
})();
