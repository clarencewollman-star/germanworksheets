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
 const status = document.getElementById('bible-status');
 const previous = document.getElementById('bible-prev');
 const next = document.getElementById('bible-next');
 const books = new Map();
 window.luther1912Books = books;
 const pending = new Map();
 const sections = {ot:'Altes Testament', ap:'Apokryphen', nt:'Neues Testament'};
 const ordered = [];
 const bookButtons = new Map();
 let currentBook;
 let currentChapter;
 let lastBookButton;
 let request = 0;

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
   bookButtons.set(book.id, button);
   group.append(button);
  }
  section.append(title, group);
  bookGrid.append(section);
 }

 function showBookGrid() {
  pickerTitle.textContent = 'Buch wählen';
  bookGrid.hidden = false;
  chapterPanel.hidden = true;
  if (lastBookButton) lastBookButton.focus();
  else {
   picker.scrollTop = 0;
   pickerTitle.focus();
  }
 }

 function showChapterGrid(book) {
  pickerTitle.textContent = book.name + ' · Kapitel wählen';
  chapterGrid.replaceChildren(...book.chapters.map(chapter => {
   const button = tile(chapter, 'Kapitel ' + chapter, () => {
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

 function loadBook(id) {
  if (books.has(id)) return Promise.resolve(books.get(id));
  if (pending.has(id)) return pending.get(id);
  const loading = new Promise((resolve, reject) => {
   const script = document.createElement('script');
   script.src = 'assets/bible-1912/' + id + '.js';
   script.onload = () => books.has(id) ? resolve(books.get(id)) : reject(new Error('Unbekanntes Buch'));
   script.onerror = () => reject(new Error('Buch konnte nicht geladen werden'));
   document.head.append(script);
  }).finally(() => pending.delete(id));
  pending.set(id, loading);
  return loading;
 }

 function chapterTarget(delta) {
  const chapterIndex = currentBook.chapters.indexOf(currentChapter);
  const sameBook = currentBook.chapters[chapterIndex + delta];
  if (sameBook) return [currentBook.id, sameBook];
  const other = ordered[ordered.indexOf(currentBook) + delta];
  if (!other) return null;
  return [other.id, delta < 0 ? other.chapters.at(-1) : other.chapters[0]];
 }

 async function render() {
  const revision = ++request;
  const book = currentBook;
  const chapter = currentChapter;
  const encode = encoders[font.value];
  heading.textContent = book.name + ' ' + chapter;
  locationButton.textContent = heading.textContent + ' ▾';
  previous.disabled = !chapterTarget(-1);
  next.disabled = !chapterTarget(1);
  verses.dataset.font = font.value;
  status.hidden = books.has(book.id);
  status.textContent = 'Kapitel wird geladen …';
  verses.replaceChildren();
  try {
   const chapters = await loadBook(book.id);
   if (revision !== request) return;
   const fragment = document.createDocumentFragment();
   for (const [number, sourceText] of chapters[chapter]) {
    const text = sourceText.replace(/[»«]/g, '');
    const row = document.createElement('p');
    const label = document.createElement('sup');
    label.textContent = number;
    row.append(label, ' ');
    if (encode) {
     const printed = document.createElement('span');
     printed.setAttribute('aria-hidden', 'true');
     printed.textContent = encode(text);
     const spoken = document.createElement('span');
     spoken.className = 'visually-hidden';
     spoken.textContent = text;
     row.append(printed, spoken);
    } else row.append(text);
    fragment.append(row);
   }
   verses.replaceChildren(fragment);
   status.hidden = true;
  } catch {
   if (revision !== request) return;
   status.textContent = 'Kapitel konnte nicht geladen werden. Bitte lade die Seite neu.';
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
  const target = chapterTarget(delta);
  if (target) {
   navigate(...target);
   heading.focus();
  }
 }
 previous.addEventListener('click', () => step(-1));
 next.addEventListener('click', () => step(1));
 window.addEventListener('hashchange', showFromHash);
 showFromHash();
})();
