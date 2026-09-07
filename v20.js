/* Checkpoint Biafra v1.20 */
(function () {
  if (window.__cbV20) return;
  window.__cbV20 = true;
  var APP_VERSION = '1.20';
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
  function installMoney() {
    window.formatNotes = naira;
    window.formatNotesSigned = nairaSigned;
  }
  var audioCtx = null, lastPay = null;
  function unlockAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  function tone(freq, dur, type, gain) {
    if (!audioCtx) return;
    try {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }
  function playCredit() { unlockAudio(); tone(880, 0.12, 'triangle', 0.07); setTimeout(function () { tone(1320, 0.16, 'sine', 0.05); }, 70); }
  function playDebit() { unlockAudio(); tone(220, 0.18, 'square', 0.05); setTimeout(function () { tone(140, 0.22, 'triangle', 0.06); }, 80); }
  function watchWallet() {
    var el = document.getElementById('hud-pay');
    if (!el) return;
    new MutationObserver(function () {
      var val = parseInt((el.textContent || '').replace(/[^\d-]/g, ''), 10);
      if (isNaN(val)) return;
      if (lastPay === null) { lastPay = val; return; }
      if (val > lastPay) playCredit();
      else if (val < lastPay) playDebit();
      lastPay = val;
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }
  function applyHands() {
    var g = '';
    try { g = (window.state && state.player && state.player.gender) || (window.ccSel && ccSel.gender) || ''; } catch (e) {}
    document.body.classList.remove('hands-male', 'hands-female');
    document.body.classList.add(g === 'female' ? 'hands-female' : 'hands-male');
  }
  function reasonFor(r) {
    if (!r) return 'No further note on file.';
    var act = (r.action || '').toUpperCase();
    if (r.correct) {
      if (r.action === 'approve') return act + ' was lawful. Papers agreed with the bulletin. Processing credit applied.';
      if (r.action === 'deny') return act + ' was lawful. A discrepancy or ban was present.';
      if (r.action === 'detain') return act + ' was lawful. File met a detain condition.';
      return act + ' matched standing orders.';
    }
    if (r.action === 'approve') return 'APPROVE was incorrect. Headquarters found a discrepancy or a ban. Wage docked.';
    if (r.action === 'deny') return 'DENY was incorrect. Papers were in order under today\'s bulletin.';
    if (r.action === 'detain') return 'DETAIN was incorrect. Nothing on the file met a detain rule.';
    return 'Action did not match the file.';
  }
  function showDetail(title, body) {
    var m = document.getElementById('cb-detail-modal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'cb-detail-modal';
      m.innerHTML = '<div class="cb-detail-card"><div class="cb-detail-kicker">FIBA FILE NOTE</div><div class="cb-detail-title"></div><div class="cb-detail-body"></div><button type="button" class="btn-primary" id="cb-detail-close">CLOSE</button></div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (e) {
        if (e.target === m || e.target.id === 'cb-detail-close') m.classList.remove('open');
      });
    }
    m.querySelector('.cb-detail-title').textContent = title || 'NOTE';
    m.querySelector('.cb-detail-body').textContent = body || '';
    m.classList.add('open');
  }
  function bindEodDetails() {
    var box = document.getElementById('eod-pay-breakdown');
    if (!box || box.__cbDetail) return;
    box.__cbDetail = true;
    box.addEventListener('click', function (ev) {
      var row = ev.target.closest('.eod-pay-row');
      if (!row) return;
      var results = (window.state && state.dayResults) || [];
      var label = (row.querySelector('span') || {}).textContent || '';
      var hit = null;
      for (var i = 0; i < results.length; i++) {
        var first = (results[i].name || '').split(' ')[0];
        if (label.indexOf(first) !== -1) { hit = results[i]; break; }
      }
      var body = hit
        ? (hit.name || 'Traveller') + ' — you chose ' + String(hit.action || '').toUpperCase() + (hit.correct ? ' (upheld).' : ' (overturned).') + '\n\n' + reasonFor(hit) + '\n\nTill: ' + nairaSigned(hit.payChange || 0)
        : (row.textContent || '').replace(/\s+/g, ' ').trim() + '\n\nHousehold or grade charge, not a single traveller file.';
      showDetail(label, body);
    });
  }
  var MEMO_HOOKS = [
    { test: /relief|food|garri|rice/i, tag: 'RELIEF COLUMN', line: 'A relief lorry is in the queue because of today\'s memo.' },
    { test: /press|journalist|camera/i, tag: 'PRESS PASS', line: 'A correspondent is at the window. The memo named the press.' },
    { test: /medical|hospital|clinic|sick/i, tag: 'MEDICAL', line: 'Someone holds a clinic letter. The memo made this a test.' },
    { test: /curfew|after.?dark|16:00|dusk/i, tag: 'LATE CROSSING', line: 'The memo on hours is now a person in front of you.' },
    { test: /watch.?list|detain|infiltrat/i, tag: 'WATCH LIST', line: 'A name on today\'s paper may be standing in this queue.' },
    { test: /tax|native authority|ticket/i, tag: 'TAX TICKET', line: 'The tax-ticket rule will lean on the next folder.' },
    { test: /biafra|secess|rising sun/i, tag: 'BIAFRAN PAPER', line: 'A rising-sun document is in circulation because the memo said so.' }
  ];
  function applyMemoToDay() {
    var body = document.getElementById('bulletin-body');
    var text = body ? body.innerText : '';
    if (!text || !window.state || !state.dayTravellers) return;
    var hook = null;
    for (var i = 0; i < MEMO_HOOKS.length; i++) if (MEMO_HOOKS[i].test.test(text)) { hook = MEMO_HOOKS[i]; break; }
    if (!hook) return;
    state._memoHook = hook;
    var t = state.dayTravellers[Math.min(2, state.dayTravellers.length - 1)];
    if (t) { t.memoHook = hook; t.desc = (t.desc ? t.desc + ' ' : '') + hook.line; }
  }
  function wrapLoadNext() {
    if (typeof loadNextTraveller !== 'function' || loadNextTraveller.__v20) return;
    var prev = loadNextTraveller;
    window.loadNextTraveller = function () {
      prev.apply(this, arguments);
      try {
        var list = state.dayTravellers || [];
        var t = list[state.traveller] || list[state.traveller - 1];
        if (t && t.memoHook) {
          var desc = document.getElementById('tp-desc');
          if (desc && desc.textContent.indexOf(t.memoHook.line) === -1) desc.textContent = (desc.textContent ? desc.textContent + ' — ' : '') + t.memoHook.line;
          var flags = document.getElementById('tp-flags');
          if (flags && !flags.querySelector('.memo-chip')) {
            var chip = document.createElement('span');
            chip.className = 'memo-chip';
            chip.textContent = t.memoHook.tag;
            flags.appendChild(chip);
          }
        }
      } catch (e) {}
    };
    window.loadNextTraveller.__v20 = true;
  }
  function showUpdateBanner() {
    if (document.getElementById('cb-update-banner')) return;
    var b = document.createElement('div');
    b.id = 'cb-update-banner';
    b.innerHTML = '<span>Update ready — v' + APP_VERSION + '</span><button type="button" id="cb-update-reload">RESTART</button>';
    document.body.appendChild(b);
    document.getElementById('cb-update-reload').onclick = function () { location.reload(); };
  }
  function watchUpdates() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('controllerchange', showUpdateBanner);
    fetch('./version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
      var seen = localStorage.getItem('cb_app_version');
      if (v && v.version && seen && seen !== v.version) showUpdateBanner();
      if (v && v.version) localStorage.setItem('cb_app_version', v.version);
    }).catch(function () {});
  }
  function boot() {
    installMoney(); applyHands(); watchWallet(); bindEodDetails(); wrapLoadNext(); watchUpdates(); applyMemoToDay();
    document.body.classList.add('cb-v20');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setInterval(function () { installMoney(); applyHands(); wrapLoadNext(); bindEodDetails(); applyMemoToDay(); }, 1500);
})();
