// ... existing code ...
function setLang(lang) {
  state.lang = lang;
  $('btnLangEn').classList.toggle('active', lang === 'en');
  $('btnLangBn').classList.toggle('active', lang === 'bn');
    applyLang(); // <-- This is the dangerous line
}
// ... existing code ...
