// Shared starting text for the crossword, word search, and Packet Builder.
window.GermanDefaultSong = `1. Jesu, du allein
Sollst mein Führer sein,
Zeige selbst mir deine Wege,
Deiner Wahrheit schmale Stege,
Steh' mit Kraft mir bei,
Dir zu wandeln treu.

2. Weil du kommen bist,
Was verloren ist
Wiederum zurecht zu führen
Und kein Schäflein zu verlieren,
Darum pfleg' dein' Knecht,
Führe mich zurecht.

3. Guter, treuer Hirt,
Wenn ich bin verirrt,
Ein verlornes Schaf auf Erden,
Führe mich zu deiner Herde,
Führe mich dahin,
Wo ich bei dir bin.

4. Soll's zum Sterben geh'n,
Wollst du bei mir steh'n,
Mich durchs Todestal geleiten,
Und zur Herrlichkeit bereiten,
Daß ich mich mag seh'n,
Einst zur Rechten steh'n.`;
const defaultSongInput = document.getElementById('song') || document.getElementById('text');
if (defaultSongInput && !defaultSongInput.value.trim()) defaultSongInput.value = window.GermanDefaultSong;
