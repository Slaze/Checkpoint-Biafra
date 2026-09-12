/* Checkpoint Biafra v1.28 — first-person illustrated desk hands (sample pose) */
(function () {
  if (window.__cbDeskV22) return;
  window.__cbDeskV22 = true;

  var HAND_SRC = 'hands-male.png?v=1.28';

  function injectCss() {
    if (document.getElementById('cb-desk-v22')) return;
    var s = document.createElement('style');
    s.id = 'cb-desk-v22';
    s.textContent =
      '#desk.desk{background-color:#2a1a0e;background-image:radial-gradient(ellipse at 50% 0%,rgba(80,50,20,.35),transparent 55%),repeating-linear-gradient(90deg,rgba(255,220,160,.04) 0 2px,transparent 2px 11px),linear-gradient(180deg,#3a2414 0%,#24150c 55%,#1a1008 100%) !important;}' +
      '#desk.desk::before{opacity:.22}' +
      /* 3D blobs covered the real hands — kill leftover Three canvas from old SW */
      '#cb-three{display:none!important}' +
      '.cb-hand-layer{position:absolute;left:0;right:0;bottom:0;height:44%;pointer-events:none;z-index:5;display:flex;align-items:flex-end;justify-content:center}' +
      '.cb-hand-layer img{width:100%;height:100%;object-fit:contain;object-position:bottom center;display:block;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}' +
      'body.hands-female .cb-hand-layer img{transform:scale(0.92);transform-origin:bottom center}' +
      /* PNG plate is the live hands. Keep original SVG as fallback until PNG paints. */
      'body.cb-png-hands .pov-hand,body.cb-png-hands .pov-hand-svg{display:none!important}' +
      '.phase-booth .pov-hand{opacity:1!important;visibility:visible!important}' +
      '.doc-pov .doc-card{background:#f3e6c4 !important;box-shadow:0 10px 24px rgba(0,0,0,.45),inset 0 0 0 1px rgba(80,50,20,.2);border:1px solid #c9b27a}' +
      'body.doc-inspecting .cb-hand-layer{opacity:.34;transform:translateY(8%)}';
    document.head.appendChild(s);
  }

  function gender() {
    try {
      var g = (window.state && state.player && state.player.gender) || (window.ccSel && ccSel.gender) || '';
      return g === 'female' ? 'female' : 'male';
    } catch (e) { return 'male'; }
  }

  function stripThree() {
    var c = document.getElementById('cb-three');
    if (c && c.parentNode) c.parentNode.removeChild(c);
    var hide = document.getElementById('cb-hide-svg-after-three');
    if (hide && hide.parentNode) hide.parentNode.removeChild(hide);
    window.__cbThreeDeskReady = false;
  }

  function mountHands() {
    injectCss();
    stripThree();
    var desk = document.getElementById('desk');
    if (!desk) return;
    var layer = document.getElementById('cb-hand-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'cb-hand-layer';
      layer.className = 'cb-hand-layer';
      layer.setAttribute('aria-hidden', 'true');
      desk.appendChild(layer);
    }
    var want = gender();
    document.body.classList.toggle('hands-female', want === 'female');
    document.body.classList.toggle('hands-male', want !== 'female');
    if (layer.getAttribute('data-src') === HAND_SRC && layer.querySelector('img')) return;
    layer.setAttribute('data-src', HAND_SRC);
    layer.setAttribute('data-g', want);
    var img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.src = HAND_SRC;
    img.onload = function () {
      document.body.classList.add('cb-png-hands');
      window.__cbHandsReady = true;
    };
    img.onerror = function () {
      document.body.classList.remove('cb-png-hands');
      window.__cbHandsReady = false;
    };
    layer.innerHTML = '';
    layer.appendChild(img);
  }

  function boot() { mountHands(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setInterval(mountHands, 1200);
})();
