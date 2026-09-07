/* v1.26 live boot — same-origin overlays only (no raw.githubusercontent) */
(function () {
  if (window.__cbLiveBoot) return;
  window.__cbLiveBoot = true;

  var VER = '1.26';

  function hideOldHands() {
    var s = document.getElementById('cb-hide-old-hands');
    if (!s) {
      s = document.createElement('style');
      s.id = 'cb-hide-old-hands';
      s.textContent =
        '.pov-hand,.pov-hand-svg,.pov-hand-left,.pov-hand-right,.pov-hand-modal-left,.pov-hand-modal-right{display:none!important;visibility:hidden!important;opacity:0!important;width:0!important;height:0!important;pointer-events:none!important}';
      document.documentElement.appendChild(s);
    }
    var nodes = document.querySelectorAll('.pov-hand, .pov-hand-svg');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] && nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }
  hideOldHands();
  setInterval(hideOldHands, 400);

  function add(src, mod) {
    var key = src.split('?')[0];
    if (document.querySelector('script[src^="' + key + '"]')) return;
    var el = document.createElement('script');
    el.src = src;
    if (mod) el.type = 'module';
    document.head.appendChild(el);
  }

  // Gameplay wrappers (was pinned raw GitHub; browsers block that as text/plain+nosniff)
  add('patch-gameplay.js?v=' + VER, false);
  add('features-v23.js?v=' + VER, false);
  add('three-desk.js?v=' + VER, true);
})();
