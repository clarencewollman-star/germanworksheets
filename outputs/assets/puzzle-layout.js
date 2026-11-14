// Match the handwriting worksheet's header inset and reserve room for hole punching.
const puzzleMargins = {side:48,titleBaseline:76,bottom:48};
function puzzleAnswerBlank(word){return '_'.repeat(Math.max(12,Math.min(28,[...word].length+6)))}
function puzzleCellSize(columns,rows,top,width,height,size='medium'){
 const availableWidth=width-2*puzzleMargins.side;
 const regular=Math.min(25,availableWidth/columns,Math.max(120,height-330-top)/rows);
 const scale={small:.75,medium:1,large:1.3}[size]||1;
 return Math.min(regular*scale,availableWidth/columns,Math.max(24,height-puzzleMargins.bottom-top-100)/rows);
}

function versesPerPuzzle(mode, count) {
  if (mode === 'together') return Math.max(1, count);
  return ['2', '3', '4'].includes(mode) ? Number(mode) : 1;
}
function groupPuzzleVerses(verses, mode) {
  const size = versesPerPuzzle(mode, verses.length);
  const groups = [];
  for (let i = 0; i < verses.length; i += size) {
    groups.push(verses.slice(i, i + size).flat());
  }
  return groups;
}
function puzzleVerseLabel(index, count, mode) {
  const size = versesPerPuzzle(mode, count);
  const first = index * size + 1;
  const last = Math.min(first + size - 1, count);
  return first === last ? first : first + '–' + last;
}
function drawPuzzleClue(ctx, text, x, baseline, maxWidth) {
  if (!text.includes('__')) {
    ctx.fillText(text, x, baseline, maxWidth);
    return;
  }
  ctx.save();
  ctx.translate(x, baseline);
  ctx.scale(Math.min(1, maxWidth / ctx.measureText(text).width), 1);
  let offset = 0;
  for (const part of text.split(/(_{2,})/)) {
    const width = ctx.measureText(part).width;
    if (part.startsWith('__')) ctx.fillRect(offset, 1, width, 0.85);
    else if (part) ctx.fillText(part, offset, 0);
    offset += width;
  }
  ctx.restore();
}

function drawPuzzleName(ctx, pageWidth) {
  const right = pageWidth - puzzleMargins.side;
  ctx.save();
  ctx.font = '12px Arial';
  ctx.fillText('Name', right - 162, puzzleMargins.titleBaseline);
  ctx.fillRect(right - 126, puzzleMargins.titleBaseline, 126, 0.7);
  ctx.restore();
}
function printablePuzzlePages(pages, studentCount, selection) {
  if (selection === 'student') return pages.slice(0, studentCount);
  if (selection === 'keys') return pages.slice(studentCount);
  return pages;
}
