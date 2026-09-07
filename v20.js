/* Checkpoint Biafra v1.22 overlay */
(function () {
  if (window.__cbV20) return;
  window.__cbV20 = true;
  var APP_VERSION = '1.22';
  function naira(n) {
    var v = Math.max(0, Math.round(Number(n) || 0));
    return '₦' + v.toLocaleString();
  }
  function nairaSigned(n) {
    var v = Math.round(Number(n) || 0);
    var abs = '₦' + Math.abs(v).toLocaleString();
    if (v > 0) return '+' + abs;
    if (v < 0) return '−' + abs;
    return abs;
  }
  window.formatNotes = naira;
  window.formatNotesSigned = nairaSigned;
  function loadDesk() {
    if (document.querySelector('script[data-cb-desk]')) return;
    var s = document.createElement('script');
    s.src = 'desk-v22.js?v=1.22';
    s.setAttribute('data-cb-desk', '1');
    document.head.appendChild(s);
  }
  function boot() {
    loadDesk();
    document.body.classList.add('cb-v22');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setInterval(loadDesk, 2000);
})();
