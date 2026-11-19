/* Create an editable Word document from the converted text and page settings. */
window.GermanWord = (() => {
 const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
 const wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const relationships = 'http://schemas.openxmlformats.org/package/2006/relationships';
 const installedFonts = {
  Hand: 'MexMW-BW Hand Schrift LightDB',
  Handschrift: 'Handschrift_complete',
  Fraktur: 'TFrakMedDFX',
  'system-ui': 'Arial'
 };

 const escapeXML = value => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
  .replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'})[ch]);

 function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
   crc ^= byte;
   for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
 }

 function packageDocument(files) {
  // A DOCX is a ZIP package. Store the small XML parts without compression.
  const encoder = new TextEncoder();
  const data = [];
  const directory = [];
  let offset = 0;
  let directoryLength = 0;
  for (const [path, xml] of Object.entries(files)) {
   const name = encoder.encode(path);
   const bytes = encoder.encode(xmlHeader + xml);
   const crc = crc32(bytes);

   const local = new DataView(new ArrayBuffer(30));
   local.setUint32(0, 0x04034b50, true);
   local.setUint16(4, 20, true);
   local.setUint16(12, 33, true); // January 1, 1980 in DOS date format.
   local.setUint32(14, crc, true);
   local.setUint32(18, bytes.length, true);
   local.setUint32(22, bytes.length, true);
   local.setUint16(26, name.length, true);
   data.push(local.buffer, name, bytes);

   const central = new DataView(new ArrayBuffer(46));
   central.setUint32(0, 0x02014b50, true);
   central.setUint16(4, 20, true);
   central.setUint16(6, 20, true);
   central.setUint16(14, 33, true);
   central.setUint32(16, crc, true);
   central.setUint32(20, bytes.length, true);
   central.setUint32(24, bytes.length, true);
   central.setUint16(28, name.length, true);
   central.setUint32(42, offset, true);
   directory.push(central.buffer, name);
   offset += local.byteLength + name.length + bytes.length;
   directoryLength += central.byteLength + name.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  const count = Object.keys(files).length;
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, count, true);
  end.setUint16(10, count, true);
  end.setUint32(12, directoryLength, true);
  end.setUint32(16, offset, true);
  return new Blob([...data, ...directory, end.buffer], {type:mime});
 }

 function run({text, red}, family, size) {
  const font = escapeXML(installedFonts[family]);
  const contents = text.split('\t').map(part =>
   `<w:t xml:space="preserve">${escapeXML(part)}</w:t>`
  ).join('<w:tab/>');
  return `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>` +
   `<w:color w:val="${red ? 'C82020' : '000000'}"/><w:sz w:val="${Math.round(size * 2)}"/>` +
   '<w:lang w:val="de-DE"/></w:rPr>' + contents + '</w:r>';
 }

 function create(verses, {size, landscape, columns, keepVerse}) {
  const paragraphs = verses.flatMap((verse, verseIndex) => verse.map(({family,runs}, lineIndex) => {
   const lastLine = lineIndex === verse.length - 1;
   const keep = keepVerse ? (lastLine ? '' : '<w:keepNext/>') + '<w:keepLines/>' : '';
   const after = lastLine && verseIndex < verses.length - 1 ? Math.round(size * 30) : 0;
   return `<w:p><w:pPr>${keep}<w:spacing w:after="${after}" w:line="360" w:lineRule="auto"/></w:pPr>` +
    runs.map(part => run(part, family, size)).join('') + '</w:p>';
  })).join('');
  const pageSize = landscape
   ? '<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>'
   : '<w:pgSz w:w="12240" w:h="15840"/>';
  const section = '<w:sectPr>' + pageSize +
   '<w:pgMar w:top="960" w:right="960" w:bottom="960" w:left="960" w:header="480" w:footer="480" w:gutter="0"/>' +
   `<w:cols w:num="${columns}" w:space="480"/></w:sectPr>`;

  return packageDocument({
   '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
   '_rels/.rels': `<Relationships xmlns="${relationships}"><Relationship Id="rId1" ` +
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
   'word/document.xml': `<w:document xmlns:w="${wordNamespace}"><w:body>${paragraphs}${section}</w:body></w:document>`
  });
 }

 return {create};
})();
