const parseBibleReference = (() => {
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

 function bookNameKey(name) {
  return name.normalize('NFD').toLowerCase()
   .replace(/^(first|second|third|iii|ii|i)(?=[.\s])/, ordinal => bookOrdinals[ordinal])
   .replace(/[\p{M}.\s]/gu, '');
 }

 for (const book of luther1912Catalog) {
  for (const name of [book.name, book.short, ...englishBookNames[book.id]]) {
   booksByName.set(bookNameKey(name), book);
  }
 }

 return line => {
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
  return {book, chapter, first, last};
 };
})();
