/* v1.27 live boot — same-origin overlays only (no raw.githubusercontent) */
(function () {
  if (window.__cbLiveBoot) return;
  window.__cbLiveBoot = true;

  var VER = '1.27';

  function hideOldHands() {
    // Critic gate: never strip legacy POV until SVG layer or Three is present
    var hasSvg = !!document.getElementById('cb-hand-layer');
    var hasThree = !!window.__cbThreeDeskReady;
    if (!hasSvg && !hasThree) return;
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
  setInterval(hideOldHands, 400);

  function add(src, mod) {
    var key = src.split('?')[0];
    if (document.querySelector('script[src^="' + key + '"]')) return;
    var el = document.createElement('script');
    el.src = src;
    if (mod) el.type = 'module';
    document.head.appendChild(el);
  }

  // SVG officer hands first — guaranteed visible until Three paints (never hide .cb-hand-layer here)
  add('desk-v22.js?v=' + VER, false);
  // Gameplay wrappers (was pinned raw GitHub; browsers block that as text/plain+nosniff)
  add('patch-gameplay.js?v=' + VER, false);
  add('features-v23.js?v=' + VER, false);
  // Procedural Three hands (optional enhancement; SVG stays until Three proves paint)
  add('three-desk.js?v=' + VER, true);
})();
