/* Checkpoint Biafra v1.22 — first-person desk + officer hands */
(function () {
  if (window.__cbDeskV22) return;
  window.__cbDeskV22 = true;

  function handSvg(female) {
    var w = female ? 0.92 : 1;
    var skin1 = female ? '#7a4a34' : '#6b3d28';
    var skin2 = female ? '#5e3828' : '#4e2c1e';
    var skin3 = female ? '#3f2418' : '#351910';
    var nail = female ? '#c4a090' : '#b08a78';
    var id = female ? 'F' : 'M';
    return (
      '<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" class="cb-hand-plate" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="sk' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + skin1 + '"/><stop offset=".55" stop-color="' + skin2 + '"/><stop offset="1" stop-color="' + skin3 + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="cf' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3d5429"/><stop offset="1" stop-color="#2a3a1c"/>' +
      '</linearGradient>' +
      '<filter id="sh' + id + '"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity=".45"/></filter>' +
      '</defs>' +
      '<g filter="url(#sh' + id + ')" transform="translate(200,280) scale(' + w + ') translate(-200,-280)">' +
      '<path d="M20 280 L28 210 Q40 198 70 198 L130 198 Q155 202 160 222 L168 280Z" fill="url(#cf' + id + ')"/>' +
      '<path d="M32 214 H150" stroke="#d4a017" stroke-width="2" opacity=".5"/>' +
      '<path fill="url(#sk' + id + ')" d="M48 208 C40 170 48 128 78 102 C90 78 118 70 138 88 C158 74 186 86 188 112 C210 108 228 128 220 150 C232 168 220 190 196 198 C180 220 140 228 108 216 C80 228 54 224 48 208Z"/>' +
      '<path fill="' + skin3 + '" opacity=".28" d="M72 168 C88 148 120 142 148 152 C140 178 110 188 86 180Z"/>' +
      '<ellipse cx="86" cy="96" rx="9" ry="11" fill="' + nail + '" transform="rotate(-18 86 96)"/>' +
      '<ellipse cx="118" cy="78" rx="8" ry="11" fill="' + nail + '"/>' +
      '<ellipse cx="148" cy="76" rx="8" ry="11" fill="' + nail + '"/>' +
      '<ellipse cx="174" cy="90" rx="7" ry="10" fill="' + nail + '"/>' +
      '<ellipse cx="192" cy="112" rx="6" ry="8" fill="' + nail + '"/>' +
      '<path d="M380 280 L372 210 Q360 198 330 198 L270 198 Q245 202 240 222 L232 280Z" fill="url(#cf' + id + ')"/>' +
      '<path d="M250 214 H368" stroke="#d4a017" stroke-width="2" opacity=".5"/>' +
      '<path fill="url(#sk' + id + ')" d="M352 208 C360 170 352 128 322 102 C310 78 282 70 262 88 C242 74 214 86 212 112 C190 108 172 128 180 150 C168 168 180 190 204 198 C220 220 260 228 292 216 C320 228 346 224 352 208Z"/>' +
      '<path fill="' + skin3 + '" opacity=".28" d="M328 168 C312 148 280 142 252 152 C260 178 290 188 314 180Z"/>' +
      '<ellipse cx="314" cy="96" rx="9" ry="11" fill="' + nail + '" transform="rotate(18 314 96)"/>' +
      '<ellipse cx="282" cy="78" rx="8" ry="11" fill="' + nail + '"/>' +
      '<ellipse cx="252" cy="76" rx="8" ry="11" fill="' + nail + '"/>' +
      '<ellipse cx="226" cy="90" rx="7" ry="10" fill="' + nail + '"/>' +
      '<ellipse cx="208" cy="112" rx="6" ry="8" fill="' + nail + '"/>' +
      '</g></svg>'
    );
  }

  var MALE_SVG = handSvg(false);
  var FEMALE_SVG = handSvg(true);

  function injectCss() {
    if (document.getElementById('cb-desk-v22')) return;
    var s = document.createElement('style');
    s.id = 'cb-desk-v22';
    s.textContent =
      '#desk.desk{background-color:#2a1a0e;background-image:radial-gradient(ellipse at 50% 0%,rgba(80,50,20,.35),transparent 55%),repeating-linear-gradient(90deg,rgba(255,220,160,.04) 0 2px,transparent 2px 11px),linear-gradient(180deg,#3a2414 0%,#24150c 55%,#1a1008 100%) !important;}' +
      '#desk.desk::before{opacity:.22}' +
      '.cb-hand-layer{position:absolute;left:0;right:0;bottom:0;height:46%;pointer-events:none;z-index:3;display:flex;align-items:flex-end;justify-content:center}' +
      '.cb-hand-layer svg{width:min(920px,108%);height:auto;display:block}' +
      '.pov-hand,.pov-hand-svg{display:none !important}' +
      '.doc-pov .doc-card{background:#f3e6c4 !important;box-shadow:0 10px 24px rgba(0,0,0,.45),inset 0 0 0 1px rgba(80,50,20,.2);border:1px solid #c9b27a}' +
      'body.doc-inspecting .cb-hand-layer{opacity:.28;transform:translateY(12%)}';
    document.head.appendChild(s);
  }

  function gender() {
    try {
      var g = (window.state && state.player && state.player.gender) || (window.ccSel && ccSel.gender) || '';
      return g === 'female' ? 'female' : 'male';
    } catch (e) { return 'male'; }
  }

  function mountHands() {
    injectCss();
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
    if (layer.getAttribute('data-g') === want && layer.innerHTML) return;
    layer.setAttribute('data-g', want);
    layer.innerHTML = want === 'female' ? FEMALE_SVG : MALE_SVG;
    document.body.classList.toggle('hands-female', want === 'female');
    document.body.classList.toggle('hands-male', want !== 'female');
  }

  function boot() { mountHands(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setInterval(mountHands, 1200);
})();
