(() => {
 const books = new Map();
 const pending = new Map();
 window.luther1912Books = books;

 function loadBook(id) {
  if (books.has(id)) return Promise.resolve(books.get(id));
  if (pending.has(id)) return pending.get(id);
  const loading = new Promise((resolve, reject) => {
   const script = document.createElement('script');
   script.src = 'assets/bible-1912/' + id + '.js';
   script.onload = () => books.has(id) ? resolve(books.get(id)) : reject(new Error('Unknown book'));
   script.onerror = () => reject(new Error('Could not load the book'));
   document.head.append(script);
  }).finally(() => pending.delete(id));
  pending.set(id, loading);
  return loading;
 }

 function verseText(source) {
  return source.replace(/[»«]/g, '').normalize('NFC');
 }

 window.Luther1912 = {books, loadBook, verseText};
})();
