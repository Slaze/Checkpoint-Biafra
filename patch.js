/* v1.25 live boot */
(function () {
  if (window.__cbLiveBoot) return;
  window.__cbLiveBoot = true;

  function hideOldHands() {
    var s = document.getElementById('cb-hide-old-hands');
    if (!s) {
      s = document.createElement('style');
      s.id = 'cb-hide-old-hands';
      s.textContent = '.pov-hand,.pov-hand-svg,.pov-hand-left,.pov-hand-right,.pov-hand-modal-left,.pov-hand-modal-right{display:none!important;visibility:hidden!important;opacity:0!important;width:0!important;height:0!important;pointer-events:none!important}';
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
  add('https://raw.githubusercontent.com/Slaze/Checkpoint-Biafra/ae33cb5e20a0c0b677f34806ab91dd2192c651f7/patch.js', false);
  add('features-v23.js?v=1.25', false);
  add('three-desk.js?v=1.25', true);
})();
