(() => {
 const card = document.querySelector('.daily-verse');
 const link = card.querySelector('.daily-verse-link');
 const display = card.querySelector('.daily-verse-text');
 const plain = card.querySelector('.daily-verse-plain');
 const reference = card.querySelector('.daily-verse-citation');
 const status = card.querySelector('.daily-verse-status');
 const fonts = [
  {name: 'fraktur', encode: convertFraktur},
  {name: 'handschrift', encode: convertHandschrift},
  {name: 'hand', encode: convert},
  {name: 'arial', encode: text => text}
 ];
 let revision = 0;
 let midnightTimer;

 function randomIndex(seed, length) {
  let hash = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return ((hash ^ (hash >>> 16)) >>> 0) % length;
 }

 function verseForDay(verses, day) {
  // Shuffle in a repeatable order so each saved verse appears before any repeats.
  for (let index = verses.length - 1; index > 0; index--) {
   const other = randomIndex(index, index + 1);
   [verses[index], verses[other]] = [verses[other], verses[index]];
  }
  return verses[(day % verses.length + verses.length) % verses.length];
 }

 async function refreshVerse() {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth(), date = now.getDate();
  const day = Date.UTC(year, month, date) / 86400000;
  const nextMidnight = new Date(year, month, date + 1);
  clearTimeout(midnightTimer);
  midnightTimer = setTimeout(refreshVerse, nextMidnight - now);
  const request = ++revision;
  try {
   const response = await fetch('/api/feedback/daily-verses');
   if (!response.ok) throw new Error();
   const {verses} = await response.json();
   if (request !== revision) return;
   if (!verses.length) {
    link.hidden = true;
    status.hidden = false;
    status.textContent = 'No verses have been added yet.';
    return;
   }
   const [bookId, chapter, number] = verseForDay(verses, day);
   const book = luther1912Catalog.find(entry => entry.id === bookId);
   const passages = (await Luther1912.loadBook(bookId))[chapter];
   if (request !== revision) return;
   const [, source] = passages.find(entry => entry[0] === number);
   const font = fonts[(day % fonts.length + fonts.length) % fonts.length];
   const text = Luther1912.verseText(source);
   const encoded = font.encode(text);
   card.dataset.font = font.name;
   display.textContent = encoded;
   display.setAttribute('aria-hidden', String(encoded !== text));
   plain.textContent = encoded === text ? '' : text;
   reference.textContent = book.name + ' ' + chapter + ':' + number;
   link.href = 'bibel.html#' + bookId + '/' + chapter + '/' + number;
   status.hidden = true;
   link.hidden = false;
  } catch {
   if (request !== revision) return;
   link.hidden = true;
   status.hidden = false;
   status.textContent = 'Could not load today’s verse.';
  }
 }

 if (location.protocol === 'file:') {
  status.textContent = 'Open the test page on the website or local server to see the saved verse list.';
  return;
 }
 window.addEventListener('pageshow', event => {
  if (event.persisted) refreshVerse();
 });
 document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshVerse();
 });
 refreshVerse();
})();
