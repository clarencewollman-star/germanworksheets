// Match the handwriting worksheet's header inset and reserve room for hole punching.
const puzzleMargins = {side:48,titleBaseline:76,bottom:48};
function puzzleAnswerBlank(word){return '_'.repeat(Math.max(12,Math.min(28,[...word].length+6)))}
function puzzleCellSize(columns,rows,top,width,height,size='medium'){
 const availableWidth=width-2*puzzleMargins.side;
 const regular=Math.min(25,availableWidth/columns,Math.max(120,height-330-top)/rows);
 const scale={small:.75,medium:1,large:1.3}[size]||1;
 return Math.min(regular*scale,availableWidth/columns,Math.max(24,height-puzzleMargins.bottom-top-100)/rows);
}
