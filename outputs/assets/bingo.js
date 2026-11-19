(() => {
  const get = name => document.getElementById('bingo-' + name);
  const form = get('form');
  const settings = get('settings');
  const status = get('status');
  const error = get('error');
  const preview = get('preview');
  const save = get('save');
  const width = 612;
  const height = 792;
  const scale = 3;
  const ink = '#202822';
  let pdf;

  const letters = [...'abcdefghijklmnopqrstuvwxyz'].map(cue => ({
    cue,
    pictures: ['alphabet-reader/' + cue]
  }));
  const groupedSounds = new Map();
  for (const [key, [form]] of Object.entries(readerCards)) {
    const cue = form.replace(/^_/, '-');
    if (!groupedSounds.has(cue)) groupedSounds.set(cue, {cue, pictures: []});
    // The reader uses near-identical eye pictures for au and äu. Use two
    // copies of the alphabet tree for Bäume so the bingo cues are distinct.
    groupedSounds.get(cue).pictures.push(key === 'aeu' ? 'alphabet-reader/b' : 'doppellaute-reader/' + key);
  }
  const pools = {letters, sounds: [...groupedSounds.values()]};
  for (const [kind, entries] of Object.entries(pools)) {
    entries.forEach(({cue}, index) => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `bingo-${kind}-${index}`;
      checkbox.checked = true;
      label.append(checkbox, cue);
      get(kind).append(label);
    });
  }

  function updateControls() {
    const kind = get('kind').value;
    const numbers = kind === 'numbers';
    const pictures = !numbers && get('display').value === 'pictures';
    get('range').hidden = !numbers;
    get('from').disabled = !numbers;
    get('to').disabled = !numbers;
    get('pool').hidden = numbers;
    get('pool-summary').textContent = kind === 'letters' ? 'Choose letters' : 'Choose sounds';
    get('letters').hidden = kind !== 'letters';
    get('sounds').hidden = kind !== 'sounds';
    get('display-control').hidden = numbers;
    get('case-control').hidden = kind !== 'letters' || pictures;
    get('font-control').hidden = pictures;
  }

  function clearResult() {
    pdf = undefined;
    save.disabled = true;
    preview.hidden = true;
    preview.replaceChildren();
    error.hidden = true;
    status.textContent = 'Two cards per printed page.';
  }

  form.addEventListener('input', clearResult);
  form.addEventListener('change', () => {
    updateControls();
    clearResult();
  });
  document.addEventListener('DOMContentLoaded', updateControls);
  for (const [name, checked] of [['all', true], ['none', false]]) {
    get(name).addEventListener('click', () => {
      for (const box of get(get('kind').value).querySelectorAll('input')) {
        if (box.checked === checked) continue;
        box.checked = checked;
        box.dispatchEvent(new Event('input', {bubbles: true}));
      }
    });
  }

  function readPool(kind) {
    if (kind !== 'numbers') {
      return pools[kind].filter((_, index) => get(`${kind}-${index}`).checked);
    }
    const from = get('from').valueAsNumber;
    const to = get('to').valueAsNumber;
    if (to < from) throw new Error('The ending number must be at least the starting number.');
    return Array.from({length: to - from + 1}, (_, i) => ({cue: String(from + i)}));
  }

  function drawCards(pool, players, playableSquares) {
    const signatures = new Set();
    const cards = [];
    while (cards.length < players) {
      // Partially shuffle the pool to pick entries and positions without replacement.
      for (let i = 0; i < playableSquares; i++) {
        const pick = i + Math.floor(Math.random() * (pool.length - i));
        [pool[i], pool[pick]] = [pool[pick], pool[i]];
      }
      const card = pool.slice(0, playableSquares);
      const signature = card.map(entry => entry.cue).join(',');
      if (signatures.has(signature)) continue;
      signatures.add(signature);
      cards.push(card);
    }
    return cards;
  }

  function centeredText(ctx, text, family, size, cx, cy, maxWidth, maxHeight) {
    ctx.font = `${size}px ${family}`;
    let metrics = ctx.measureText(text);
    const fit = Math.min(1, maxWidth / (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight),
      maxHeight / (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent));
    if (fit < 1) {
      ctx.font = `${size * fit}px ${family}`;
      metrics = ctx.measureText(text);
    }
    ctx.fillText(text, cx + (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2,
      cy + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2);
  }

  function paintPictures(ctx, entry, keys, images, x, y, width, height) {
    const slots = entry.cue === 'äu' ? [keys[0], keys[0]] : keys;
    const slotWidth = width / slots.length;
    slots.forEach((key, index) => {
      const image = images.get(key);
      const fit = Math.min(slotWidth / image.naturalWidth, height / image.naturalHeight);
      const w = image.naturalWidth * fit;
      const h = image.naturalHeight * fit;
      ctx.drawImage(image, x + index * slotWidth + (slotWidth - w) / 2, y + (height - h) / 2, w, h);
    });
  }

  function paintCard(ctx, card, number, top, options) {
    const {size, pictures, font, casing, kind, images} = options;
    const left = 60;
    const gridWidth = width - left * 2;
    const gridHeight = 300;
    const cellWidth = gridWidth / size;
    const cellHeight = gridHeight / size;
    const gridTop = top + 28;
    const freeIndex = size % 2 ? Math.floor(size * size / 2) : -1;
    const encode = {Fraktur: convertFraktur, Hand: convert, Handschrift: convertHandschrift}[font];

    ctx.fillStyle = ink;
    ctx.font = 'bold 19px Arial';
    ctx.fillText('Bingo', left, top + 18);
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Karte ' + number, width - left, top + 18);
    ctx.textAlign = 'left';

    let index = 0;
    for (let cell = 0; cell < size * size; cell++) {
      const x = left + (cell % size) * cellWidth;
      const y = gridTop + Math.floor(cell / size) * cellHeight;
      if (cell === freeIndex) {
        ctx.fillStyle = '#edf1ee';
        ctx.fillRect(x, y, cellWidth, cellHeight);
        ctx.fillStyle = ink;
        centeredText(ctx, 'FREI', 'Arial', 14, x + cellWidth / 2, y + cellHeight / 2, cellWidth - 16, cellHeight - 16);
        continue;
      }
      const entry = card[index++];
      if (pictures) {
        const key = entry.pictures[Math.floor(Math.random() * entry.pictures.length)];
        paintPictures(ctx, entry, [key], images, x + 9, y + 6, cellWidth - 18, cellHeight - 12);
      } else {
        const upper = kind === 'letters' && (casing === 'upper' || (casing === 'mixed' && Math.random() < .5));
        const cue = upper ? entry.cue.toUpperCase() : entry.cue;
        centeredText(ctx, encode ? encode(cue) : cue, font, cellHeight * .66,
          x + cellWidth / 2, y + cellHeight / 2, cellWidth - 18, cellHeight - 16);
      }
    }

    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(left, gridTop, gridWidth, gridHeight);
    ctx.beginPath();
    for (let i = 1; i < size; i++) {
      ctx.moveTo(left + i * cellWidth, gridTop);
      ctx.lineTo(left + i * cellWidth, gridTop + gridHeight);
      ctx.moveTo(left, gridTop + i * cellHeight);
      ctx.lineTo(width - left, gridTop + i * cellHeight);
    }
    ctx.stroke();
  }

  function paintCaller(ctx, entries, page, pages, {kind, pictures, images}) {
    ctx.fillStyle = ink;
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Bingo · Checkliste', 60, 70);
    ctx.font = '12px Arial';
    ctx.fillText('Markiere jeden Eintrag, sobald er aufgerufen wurde.', 60, 92);
    if (pages > 1) ctx.fillText(`Seite ${page} / ${pages}`, 60, 755);
    ctx.font = pictures ? '13px Arial' : '16px Arial';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    const columns = pictures ? 3 : 4;
    const columnWidth = 492 / columns;
    const rowHeight = pictures ? 62 : 25;
    entries.forEach((entry, i) => {
      const x = 60 + (i % columns) * columnWidth;
      const y = 120 + Math.floor(i / columns) * rowHeight;
      const center = y + (pictures ? 26 : 6);
      let label = entry.cue;
      if (kind === 'letters') label = label.toUpperCase();
      if (label === 'äu' && pictures) label = 'äu (Bäume)';
      if (label === 'st') label = 'st (Stuhl)';
      if (label === '-st') label = '-st (Obst)';
      ctx.strokeRect(x, center - 6, 12, 12);
      if (pictures) paintPictures(ctx, entry, entry.pictures, images, x + 19, y, 61, 52);
      ctx.fillText(label, x + (pictures ? 85 : 20), center + 5);
    });
  }

  function addPreview(canvas, caption) {
    const figure = document.createElement('figure');
    const label = document.createElement('figcaption');
    label.textContent = caption;
    const copy = document.createElement('canvas');
    copy.width = width * 1.5;
    copy.height = height * 1.5;
    copy.setAttribute('role', 'img');
    copy.setAttribute('aria-label', caption);
    copy.getContext('2d').drawImage(canvas, 0, 0, copy.width, copy.height);
    figure.append(label, copy);
    preview.append(figure);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (settings.disabled) return;
    updateControls();
    if (!form.reportValidity()) return;
    clearResult();
    settings.disabled = true;
    let canvas;
    try {
      const kind = get('kind').value;
      const size = Number(get('size').value);
      const players = get('players').valueAsNumber;
      const font = get('font').value;
      const casing = get('case').value;
      const pictures = kind !== 'numbers' && get('display').value === 'pictures';
      const playableSquares = size * size - size % 2;
      const pool = readPool(kind);
      if (pool.length < playableSquares) {
        throw new Error(`Choose at least ${playableSquares} different entries for a ${size} × ${size} card. You have ${pool.length}.`);
      }
      const cards = drawCards(pool.slice(), players, playableSquares);
      const used = new Set(cards.flatMap(card => card.map(entry => entry.cue)));
      const entries = pool.filter(entry => used.has(entry.cue));
      const images = new Map();
      status.textContent = 'Creating your bingo cards…';
      if (pictures) {
        await Promise.all(entries.flatMap(entry => entry.pictures).map(async key => {
          const image = new Image();
          image.src = readerPictures[key];
          await image.decode();
          images.set(key, image);
        }));
      } else {
        await document.fonts.load('40px ' + font);
      }

      const options = {size, pictures, font, casing, kind, images};
      const pages = [];
      canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      const clearPage = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
      };
      for (let i = 0; i < cards.length; i += 2) {
        clearPage();
        paintCard(ctx, cards[i], i + 1, 36, options);
        if (cards[i + 1]) {
          paintCard(ctx, cards[i + 1], i + 2, 408, options);
          ctx.strokeStyle = '#8a938d';
          ctx.lineWidth = .6;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(36, height / 2);
          ctx.lineTo(width - 36, height / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (i === 0) addPreview(canvas, 'First card sheet');
        pages.push(GermanPDF.canvasPage(canvas));
        // Let the browser update the progress message during larger print runs.
        if (i % 8 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }
      if (get('caller').checked) {
        const perPage = pictures ? 27 : 96;
        const total = Math.ceil(entries.length / perPage);
        for (let i = 0; i < total; i++) {
          clearPage();
          const checklist = entries.slice(i * perPage, (i + 1) * perPage);
          paintCaller(ctx, checklist, i + 1, total, options);
          if (i === 0) addPreview(canvas, 'Caller checklist');
          pages.push(GermanPDF.canvasPage(canvas));
        }
      }
      pdf = GermanPDF.fromPages(pages);
      preview.hidden = false;
      status.textContent = `${players} ${players === 1 ? 'card' : 'cards'} · ${pages.length} PDF ${pages.length === 1 ? 'page' : 'pages'}`;
    } catch (failure) {
      clearResult();
      error.textContent = failure.message || 'Could not create the bingo cards. Please try again.';
      error.hidden = false;
    } finally {
      settings.disabled = false;
      save.disabled = !pdf;
      if (canvas) canvas.width = canvas.height = 1;
    }
  });

  save.addEventListener('click', () => {
    if (pdf) GermanPDF.download(pdf, 'Bingo.pdf');
  });
})();
