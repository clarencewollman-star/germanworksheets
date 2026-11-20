(() => {
 const prefix = '#bible-text=';
 if (!location.hash.startsWith(prefix)) return;
 const input = document.getElementById(document.currentScript.dataset.input);

 // Import after the saved text and settings are restored.
 document.addEventListener('DOMContentLoaded', () => {
  let text;
  try { text = decodeURIComponent(location.hash.slice(prefix.length)); }
  catch { return; }
  if (!text.trim()) return;
  input.value = text;
  input.dispatchEvent(new Event('input', {bubbles: true}));
  try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch {}
 }, {once: true});
})();
