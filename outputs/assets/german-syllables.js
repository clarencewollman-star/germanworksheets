const splitGermanSyllables = (() => {
 let hyphenate;
 return text => {
  hyphenate ??= createHyphenator(hyphenationPatternsDe1996, {hyphenChar: '-', minWordLength: 2});
  // Preserve existing hyphens, punctuation, and paragraph breaks.
  return text.replace(/[A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*/g, word => word.includes('-') ? word : hyphenate(word));
 };
})();
