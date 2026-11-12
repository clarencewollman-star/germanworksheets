# German Worksheets — canonical source

This folder is the maintained application. The standalone generators and Packet Builder use the same files.

- Generator markup and controls: each `*-generator.html` file.
- Generator logic: `assets/handwriting.js`, `assets/crossword.js`, `assets/wordsearch.js`, etc.
- Shared font mapping: `assets/font-conversion.js`.
- Shared embedded fonts: `assets/fonts.css`.
- The Handschrift option uses `HANDSHRIFT_complete.ttf` (internal name `Handschrift_complete`, February 18, 2011), embedded under the stable CSS family `Handschrift`. Keep `assets/handschrift-metrics.js` synchronized with that font. Its word-conversion rules are separate from BW Hand Schrift.
- UI: AdminLTE 4.10.0, bundled locally in `assets/adminlte.min.css` and `assets/adminlte.min.js`, with its license alongside them. Shared layout and overrides are `assets/app-shell.js` and `assets/app-theme.css`. Keep packet iframe settings free of duplicate navigation.
- Shared PDF creation: `assets/pdf.js`. Preserve page dimensions and print scaling.
- Packet Builder embeds the real generator HTML pages, with `?packet=1`; do not copy their settings or generation algorithms into the packet.
- `assets/packet-bridge.js` connects each embedded page to the packet using postMessage. Requests must verify the sending window.
- Crossword and word-search `GermanGenerator.exportPages` use each tool's actual `create()` and return student/answer pages separately and answer choices indexed by nonblank source line.
- Keep all files in this folder together when moving the application.

The Python/PowerShell builders and templates in `../work/` are historical scratch files. Do not run them to rebuild the application: they predate this shared architecture and can overwrite current changes. Edit the canonical files here directly.
