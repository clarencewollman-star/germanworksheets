const silentHGroups = {
 ah: ['wahr', 'zahm', 'kahl', 'lahm'],
 eh: ['weh', 'mehr', 'sehr', 'zehn'],
 ih: ['ihn', 'ihm', 'ihr', 'ihnen'],
 oh: ['roh', 'wohnen', 'froh', 'wohl'],
 uh: ['fuhr', 'ruht', 'fuhren'],
 äh: ['zäh', 'zählen', 'nähren', 'wählen'],
 öh: ['höhlen', 'höhnen', 'stöhnen'],
 üh: ['kühl', 'kühn', 'früh', 'fühlen'],
 ie: ['nie', 'die', 'sie', 'wie', 'vier', 'tief'],
 ieh: ['sieh', 'sieht', 'zieht', 'flieht'],
};
const silentHDecks = {
 patterns: Object.keys(silentHGroups),
 words: Object.values(silentHGroups).flat(),
};
