// Follow the device appearance consistently, including embedded packet settings.
(() => {
 const preference=window.matchMedia('(prefers-color-scheme: dark)');
 const apply=()=>document.documentElement.setAttribute('data-bs-theme',preference.matches?'dark':'light');
 apply();preference.addEventListener('change',apply);
})();
