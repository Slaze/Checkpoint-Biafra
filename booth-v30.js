/* v1.30 booth: unique names/popups/infractions, side-event ledger, Igbo bias, typos */
(function () {
  if (window.__cbBooth30) return;
  window.__cbBooth30 = true;
  window.__loadHooked = true;
  window.__cbNoSuspScan = true;
  window.__showSideEvent = function () {};

  function deckTake(key, arr) {
    if (!arr || !arr.length) return null;
    window.__cbDecks = window.__cbDecks || {};
    var d = window.__cbDecks[key];
    if (!d || !d.length) {
      d = arr.slice();
      for (var i = d.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = d[i]; d[i] = d[j]; d[j] = t;
      }
      window.__cbDecks[key] = d;
    }
    return window.__cbDecks[key].pop();
  }

  function makeTypo(name) {
    var parts = String(name || 'OKONKWO').toUpperCase().split(/\s+/);
    var idx = 0;
    var best = 0;
    for (var p = 0; p < parts.length; p++) {
      if (parts[p].length > best) { best = parts[p].length; idx = p; }
    }
    var s = parts[idx];
    if (s.length < 4) { idx = 0; s = parts[0]; }
    var mid = Math.max(1, Math.min(s.length - 2, Math.floor(s.length / 2)));
    var mode = Math.floor(Math.random() * 3);
    var out;
    if (mode === 0) {
      out = s.slice(0, mid) + s.slice(mid + 1);
    } else if (mode === 1 && s.length > mid + 1) {
      out = s.slice(0, mid) + s.charAt(mid + 1) + s.charAt(mid) + s.slice(mid + 2);
    } else {
      out = s.slice(0, mid + 1) + s.charAt(mid) + s.slice(mid + 1);
    }
    if (out === s) out = s.slice(0, -1) + (s.slice(-1) === 'O' ? 'U' : 'O');
    parts[idx] = out;
    return parts.join(' ');
  }

  var WINDOW_BEATS = [
    'Sweat at the hairline. Speaks before the papers are fully on the wood.',
    'Keeps one palm on the bundle as if the desk might take it.',
    'Looks past you at the queue, then at the stamp pad, then at you.',
    'Voice is even. The hands are not.',
    'A child-noise from the compound. Does not turn around.',
    'Dust on the hem. Road dust, not booth dust.',
    'Asks what the bulletin said this morning. You do not answer.',
    'Counts the remaining travellers with the eyes, not the mouth.',
    'The previous officer at Bay 4 already saw this face. No note was left.',
    'Breath smells of kola. Waits without sitting.',
    'A lorry horn. The papers jump. One corner is wet.',
    'Claims the appointment is for someone who cannot walk this far.',
    'The name is said twice, slower the second time, as if teaching you.',
    'A church medal, a market bag, a federal envelope — all in one hand.',
    'Will not say who is waiting on the other side of the bridge.',
    'Thumbprint on the reverse of the tax ticket is smudged, not missing.',
    'Says the clerk in Enugu wrote it in a hurry. Offers no clerk name.',
    'Puts a baptism card on the wood as if it were a Movement Pass.',
    'The queue behind them has gone quiet. They do not notice.',
    'A fly walks the passport photograph. They do not brush it off.',
    'Mentions a cousin at Bay 2. Bay 2 is empty today.',
    'The bundle is tied with market twine, not the usual clip.',
    'Asks if you remember yesterday. You do not confirm.',
    'Left sleeve is wet to the elbow. The right is dry.',
    'Speaks Igbo first, then English, then Igbo again when the stamp does not move.'
  ];

  var DECOYS = ['bapt_card', 'market_union', 'school_id', 'driving_old', 'town_union'];

  var EXTRA_SIDES = [
    {id:'war-nsukka', title:'NSUKKA ROAD CLOSED', body:'A runner from Bay 1: mortar on the Nsukka road. Three lorries turned back. Your queue does not know. Headquarters has not written it down.',
      choices:[
        {label:'KEEP STAMPING — TELL NO ONE', effect:{loyalty:2,witness:-1}, pay:0, correct:true},
        {label:'WARN THE QUEUE', effect:{compassion:2,loyalty:-1}, pay:-400, correct:false},
        {label:'CLOSE THE WINDOW UNTIL ORDERS', effect:{survival:1}, pay:-200, correct:true}
      ]},
    {id:'other-bay6', title:'BAY 6 SENDS A BUNDLE', body:'The officer at Bay 6 is gone to the latrine. His traveller is at your wood. The papers are not yours. The stamp pad is.',
      choices:[
        {label:'STAMP THEM — CLEAR HIS QUEUE', effect:{loyalty:-1,corruption:1}, pay:800, correct:false},
        {label:'SEND THE BUNDLE BACK UNSTAMPED', effect:{loyalty:2}, pay:0, correct:true},
        {label:'HOLD BOTH TRAVELLERS', effect:{survival:1,witness:1}, pay:200, correct:true}
      ]},
    {id:'war-aba', title:'ABA POST WENT SILENT', body:'Radio from Aba Junction died at 11:10. The last word was a name you know. Nwosu is in Block C. The queue is still moving.',
      choices:[
        {label:'LOG IT. KEEP THE WINDOW OPEN', effect:{loyalty:1,witness:1}, pay:0, correct:true},
        {label:'LEAVE THE DESK — FIND NWOSU', effect:{survival:-1}, pay:-600, correct:false},
        {label:'POCKET THE NAME. SAY NOTHING', effect:{corruption:1,witness:-1}, pay:0, correct:false}
      ]},
    {id:'other-enugu', title:'ENUGU ASKS FOR A FAVOUR', body:'A clerk from Enugu registry calls the booth phone. He wants one traveller waved. He will "remember the household." He names a sum.',
      choices:[
        {label:'TAKE THE FAVOUR', effect:{corruption:3,survival:1}, pay:2800, correct:false},
        {label:'REFUSE — LOG THE CALL', effect:{loyalty:2,witness:1}, pay:0, correct:true},
        {label:'HANG UP. DO NOT LOG', effect:{survival:1}, pay:0, correct:true}
      ]},
    {id:'war-bridge', title:'THE BRIDGE IS MINED — MAYBE', body:'A woman in the queue shouts that the Ogoja bridge has mines. Two men laugh. One does not. No bulletin covers mines.',
      choices:[
        {label:'DETAIN THE WOMAN FOR PANIC', effect:{loyalty:1,compassion:-2}, pay:400, correct:false},
        {label:'SEND A RUNNER TO THE BRIDGE', effect:{witness:2}, pay:-300, correct:true},
        {label:'IGNORE. STAMP THE NEXT', effect:{survival:1,witness:-1}, pay:0, correct:false}
      ]},
    {id:'other-audit', title:'INTERNAL AFFAIRS AT BAY 3', body:'Two men in identical jackets are counting stamps at Bay 3. They have not reached you. Bay 3 just docked a week\'s wage.',
      choices:[
        {label:'HIDE THE ENVELOPE IN THE DRAWER', effect:{corruption:2,survival:1}, pay:0, correct:false},
        {label:'LEAVE THE DESK CLEAN', effect:{loyalty:2}, pay:-200, correct:true},
        {label:'WALK OVER AND GREET THEM', effect:{witness:1,survival:-1}, pay:0, correct:true}
      ]},
    {id:'war-radio', title:'THE RADIO NAMES YOUR POST', body:'State radio: "irregularities at Ogoja-East." No names. The canteen goes quiet. Your stamp is still wet.',
      choices:[
        {label:'SLOW DOWN. CHECK EVERY LINE', effect:{loyalty:1,witness:1}, pay:0, correct:true},
        {label:'SPEED UP — LOOK BUSY', effect:{survival:1}, pay:200, correct:false},
        {label:'WRITE A PRIVATE NOTE HOME', effect:{compassion:1,rebellion:1}, pay:-100, correct:false}
      ]},
    {id:'other-nun', title:'THE NUNS WANT A NAME', body:'Sister Marie from the gate asks which traveller you turned back at noon. She has rice. She does not have a warrant.',
      choices:[
        {label:'GIVE HER THE NAME', effect:{compassion:2,loyalty:-1}, pay:0, correct:false},
        {label:'SEND HER TO NWOSU', effect:{loyalty:1}, pay:0, correct:true},
        {label:'TAKE THE RICE. SAY NOTHING', effect:{corruption:1,survival:1}, pay:500, correct:false}
      ]}
  ];

  var EXTRA_GOSSIP = [
    'Bay 2 is stamping with the Enugu pad. Nobody has asked why the seal is wrong.',
    'They say the night officer at Ogoja-West took a transfer to a post that does not exist.',
    'A list of Igbo names went to Block C. The Hausa names stayed in the drawer.',
    'The generator man wants kerosene money before dusk. Nwosu said the till is not for that.',
    'Someone left a Biafran sun drawn in chalk under Bay 4. It was gone by tea.',
    'Calabar called. They want our denial numbers. They did not want our approval numbers.',
    'The boy who sells groundnut said soldiers asked which bay is slowest. He sold them nothing.'
  ];
  var EXTRA_NWOSU = [
    'The other office is not your office. Their mistakes will still have your stamp if you touch them.',
    'War news is not a reason to close the window. Hunger is. You are not hungry yet.',
    'If the name is one letter off, it is still a name. Read it twice.',
    'Deny is not detain. Detain is not mercy. Do not look at me when you choose.',
    'I will not tell you which bay is being watched. You already know.'
  ];
  var EXTRA_RUMORS = [
    {title:'OWERRI WINDOW SHUT', body:'Owerri post nailed the shutters at noon. The notice said "reorganisation." The queue was still there at dusk.'},
    {title:'ONITSHA BRIDGE', body:'Onitsha market women say the bridge will not take lorries after dark. Headquarters has no bulletin for bridges.'},
    {title:'BAY 8 TRANSFER', body:'Bay 8 received transfer papers to a post in the North. The officer burned them in the latrine drum. The smoke was sweet.'},
    {title:'NSUKKA ROLL CALL', body:'Nsukka checkpoint did roll call twice this morning. One name did not answer. The chair was still warm.'}
  ];

  function uniqueFlag(kind, text) {
    window.state = window.state || {};
    state.usedFlagText = state.usedFlagText || {};
    if (!state.usedFlagText[text]) {
      state.usedFlagText[text] = true;
      return text;
    }
    var extra = deckTake('beats', WINDOW_BEATS) || 'Look again at the clerk\'s hand.';
    return text + ' ' + extra;
  }

  function soften(t) {
    var flags = (t.flags || []).slice();
    var joined = flags.join(' ').toLowerCase();
    var out = [];
    if (/mismatch|name on ticket|one letter off/i.test(joined) && t.name && t.name !== 'UNKNOWN') {
      var typo = makeTypo(t.name);
      t.typoName = typo;
      t.docOverrides = t.docOverrides || {};
      t.docOverrides.nin_mismatch = { 'NAME ON TICKET': typo };
      out.push(uniqueFlag('typo',
        'The tax ticket spells the name ' + typo + '. The passport spells ' + t.name +
        '. It is a one-letter error, or it is two people. Clerks do this when tired. Forgers do this on purpose. Turn back, or hold for secondary — the bulletin does not shout the answer.'));
    }
    flags.forEach(function (f) {
      var s = String(f);
      if (/mismatch|name on ticket|one letter off/i.test(s) && t.typoName) return;
      s = s.replace(/^CLASS [ABC]:\s*/i, '');
      if (/MISSING|no federal|movement pass absent|no documents/i.test(s)) {
        out.push(uniqueFlag('miss',
          'Required federal paper is not in the bundle. The traveller offers other identification instead. A missing Movement Pass is usually turned back. A missing Pass plus a story that will not sit still may be held. Read the rest of the desk before you choose.'));
        return;
      }
      if (/EXPIRED/i.test(s)) {
        out.push(uniqueFlag('exp',
          'The Movement Pass date is dead. Some officers send the bearer home to renew. Some hold the bearer because expired paper is also how a deserter walks. The face is waiting. The pad is wet.'));
        return;
      }
      if (/forged|serial matches|unlisted|not on|constructed|impossible date|31 FEB/i.test(s)) {
        out.push(uniqueFlag('forge',
          'Two papers in this bundle were written by the same tired hand, or by someone practising a seal. That can be a clerk. That can be an infiltrator. Deny sends them down the road. Detain keeps the road from swallowing the next queue.'));
        return;
      }
      if (/military|posture|bearing|uniform/i.test(s)) {
        out.push(uniqueFlag('mil',
          'The papers say civilian. The shoulders say drill. You may turn a farmer back for incomplete kit, or hold a soldier who has already left his unit. Nothing on the card will confess which.'));
        return;
      }
      if (/too perfect|inconsistent|photo/i.test(s)) {
        out.push(uniqueFlag('perf',
          'Every field agrees. The photograph does not quite agree with the neck. Perfect files are rare at a war post. Rare is not always guilty. It is only rare.'));
        return;
      }
      out.push(uniqueFlag('misc', s));
    });
    t.flags = out;
    return t;
  }

  function expandWindow(t) {
    var beat = deckTake('window', WINDOW_BEATS) || '';
    var base = (t.desc || '').replace(/\s+—\s+name mismatch.*$/i, '').replace(/\s+—\s+one letter off.*$/i, '').trim();
    if (base && !/[.!?]$/.test(base)) base += '.';
    var extra = [];
    extra.push(beat);
    if (t.docs && t.docs.length > 3) extra.push('Puts extra cards on the wood that are not Movement Passes.');
    if (t.typoName) extra.push('Says the name once, clearly, then glances at the ticket as if it might argue.');
    t.desc = [base].concat(extra.filter(Boolean)).join(' ');
    return t;
  }

  function addDecoys(t) {
    if (!t.docs) t.docs = [];
    if (t.docs.length === 0) return t;
    if (t.docs.length >= 4) return t;
    if (Math.random() > 0.55) return t;
    var d = DECOYS[Math.floor(Math.random() * DECOYS.length)];
    if (t.docs.indexOf(d) === -1) t.docs = t.docs.concat([d]);
    return t;
  }

  var origLoad = null;
  function wrapLoad() {
    if (typeof window.loadNextTraveller !== 'function') return false;
    if (window.loadNextTraveller.__v30) return true;
    window.__loadHooked = true;
    origLoad = window.loadNextTraveller;
    var wrapped = function () {
      if (window.__cbSideBusy) return;
      var trav = (window.state && state.traveller) || 0;
      if (shouldSide() && trav > 1) {
        window.__cbSideBusy = true;
        showSide(function () {
          window.__cbSideBusy = false;
          finishLoad();
        });
        return;
      }
      finishLoad();
    };
    wrapped.__v30 = true;
    wrapped.__v23 = true;
    wrapped.__patchedV7 = true;
    window.loadNextTraveller = wrapped;
    return true;
  }

  function finishLoad() {
    origLoad.apply(this, arguments);
    try {
      var t = window.state && state.currentTraveller;
      if (!t) return;
      t = Object.assign({}, t);
      t.flags = (t.flags || []).slice();
      t.docs = (t.docs || []).slice();
      t = soften(t);
      t = addDecoys(t);
      t = expandWindow(t);
      state.currentTraveller = t;
      if (typeof renderTraveller === 'function') renderTraveller(t);
      else if (window.renderTraveller) window.renderTraveller(t);
      if (window.renderDocs) window.renderDocs(t);
    } catch (e) {}
  }

  function shouldSide() {
    window.__cbSideUsed = window.__cbSideUsed || {};
    if (window.__cbSideCooldown > 0) { window.__cbSideCooldown--; return false; }
    return Math.random() < 0.18;
  }

  function applyLedger(ev, choice) {
    var pay = choice.pay || 0;
    var eff = choice.effect || {};
    if (window.state && state.axes) {
      Object.keys(eff).forEach(function (k) { state.axes[k] = (state.axes[k] || 0) + eff[k]; });
    }
    if (window.state && typeof state.totalPay === 'number' && pay) {
      state.totalPay += pay;
      if (pay < 0 || choice.correct === false) state.totalErrors = (state.totalErrors || 0) + (choice.correct === false ? 1 : 0);
    }
    if (window.state && state.dayResults) {
      state.dayResults.push({
        name: 'WINDOW · ' + ev.title,
        action: (choice.label || 'window').toLowerCase(),
        correct: !!choice.correct,
        payChange: pay
      });
    }
    if (typeof window.updateHUD === 'function') try { window.updateHUD(); } catch (e) {}
    if (pay) {
      var t = document.createElement('div');
      t.className = 'pay-flash';
      t.textContent = window.formatNotesSigned ? window.formatNotesSigned(pay) : String(pay);
      document.body.appendChild(t);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 1800);
    }
    try { if (window.saveState) window.saveState(); } catch (e) {}
  }

  function showSide(done) {
    var pool = (window.__sideEvents || []).filter(function (e) { return !window.__cbSideUsed[e.id]; });
    if (!pool.length) { done(); return; }
    var ev = pool[Math.floor(Math.random() * pool.length)];
    window.__cbSideUsed[ev.id] = true;
    window.__cbSideCooldown = 2;
    var box = document.createElement('div');
    box.className = 'side-event-card';
    box.setAttribute('role', 'dialog');
    var html = '<div class="se-tag">DECISION REQUIRED — COUNTS ON THE LEDGER</div><div class="se-title">' + ev.title + '</div><div class="se-body">' + ev.body + '</div><div class="se-choices">';
    ev.choices.forEach(function (c, i) { html += '<button type="button" data-i="' + i + '" class="se-btn">' + c.label + '</button>'; });
    html += '</div>';
    box.innerHTML = html;
    document.body.appendChild(box);
    box.querySelectorAll('.se-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var ix = parseInt(b.getAttribute('data-i'), 10);
        applyLedger(ev, ev.choices[ix] || {});
        if (box.parentNode) box.parentNode.removeChild(box);
        done();
      });
    });
  }

  function tagChoices() {
    if (!window.__sideEvents) window.__sideEvents = [];
    var have = {};
    window.__sideEvents.forEach(function (e) { have[e.id] = true; });
    EXTRA_SIDES.forEach(function (e) { if (!have[e.id]) window.__sideEvents.push(e); });
    (window.__sideEvents || []).forEach(function (ev) {
      (ev.choices || []).forEach(function (c) {
        var lab = (c.label || '').toUpperCase();
        if (c.correct === true || c.correct === false) return;
        if (/PUSH IT BACK|RETURN THE PASSPORT|REFUSE|REPORT TO NWOSU|DENY — PROCEDURE|APPROVE — CLEAN|CALL THE NUNS|HANG UP|LEAVE THE DESK CLEAN|LOG IT|SEND THE BUNDLE BACK|SEND HER TO NWOSU|SEND A RUNNER|KEEP STAMPING|CLOSE THE WINDOW/.test(lab)) c.correct = true;
        else if (/TAKE THE MONEY|POCKET|SPLIT THE BRIBE|SIGN AND TAKE|OPEN IT NOW|WAVE HER|ACCEPT THE BREAD|TAKE THE FAVOUR|HIDE THE ENVELOPE|GIVE HER THE NAME|TAKE THE RICE|SPEED UP|LEAVE THE DESK — FIND/.test(lab)) c.correct = false;
        else c.correct = false;
      });
    });
  }

  function igboBias() {
    var orig = window.__pickFreshName;
    if (!orig || orig.__v30) return;
    window.__pickFreshName = function (hint) {
      var s = String(hint || '').toLowerCase();
      var foreign = /\b(hausa|fulani|kano|lagos|yoruba|french|chinese|british|uk |red cross|bbc|claire|li weiming|ibrahim|bello|sani|musa|abdullahi|dangote|phillips-smith|harriet|marie therese|fontaine)\b/.test(s);
      if (!foreign) hint = (hint || '') + ' Igbo Enugu Onitsha';
      var name = orig(hint);
      window.__cbUsedFull = window.__cbUsedFull || {};
      var tries = 0;
      while (window.__cbUsedFull[name] && tries < 12) {
        name = orig(hint + ' ' + tries);
        tries++;
      }
      window.__cbUsedFull[name] = true;
      return name;
    };
    window.__pickFreshName.__v30 = true;
  }

  function uniquePopups() {
    if (window.__officeGossip && !window.__officeGossip.__v30pad) {
      window.__officeGossip = window.__officeGossip.concat(EXTRA_GOSSIP);
      window.__officeGossip.__v30pad = true;
    }
    if (window.__nwosuLines && !window.__nwosuLines.__v30pad) {
      window.__nwosuLines = window.__nwosuLines.concat(EXTRA_NWOSU);
      window.__nwosuLines.__v30pad = true;
    }
    if (window.__rumorEvents && !window.__rumorEvents.__v30pad) {
      window.__rumorEvents = window.__rumorEvents.concat(EXTRA_RUMORS);
      window.__rumorEvents.__v30pad = true;
    }
    if (window.__pickNwosu && !window.__pickNwosu.__v30) {
      var n = window.__nwosuLines || [];
      window.__pickNwosu = function () { return deckTake('nwosu', n) || n[0]; };
      window.__pickNwosu.__v30 = true;
    }
    if (window.__pickGossip && !window.__pickGossip.__v30) {
      var g = window.__officeGossip || [];
      window.__pickGossip = function () { return deckTake('gossip', g) || g[0]; };
      window.__pickGossip.__v30 = true;
    }
    if (window.__pickPersonalCondition && !window.__pickPersonalCondition.__v30) {
      var c = window.__personalConditions || [];
      window.__pickPersonalCondition = function () { return deckTake('cond', c) || c[0]; };
      window.__pickPersonalCondition.__v30 = true;
    }
    if (window.__triggerSpyReveal && !window.__triggerSpyReveal.__v30) {
      var prev = window.__triggerSpyReveal;
      window.__triggerSpyReveal = function () {
        var r = prev();
        if (!r) return null;
        window.__cbFateUsed = window.__cbFateUsed || {};
        var key = (r.name || '') + '|' + (r.fate || '');
        if (window.__cbFateUsed[key]) return null;
        window.__cbFateUsed[key] = true;
        return r;
      };
      window.__triggerSpyReveal.__v30 = true;
    }
    if (window.__rumorEvents) {
      window.__pickRumor = function () { return deckTake('rumor', window.__rumorEvents); };
    }
  }

  function stripBadges() {
    document.querySelectorAll('.susp-badge').forEach(function (b) {
      if (b.parentNode) b.parentNode.removeChild(b);
    });
  }

  function boot() {
    tagChoices();
    igboBias();
    uniquePopups();
    wrapLoad();
    stripBadges();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setInterval(function () { wrapLoad(); uniquePopups(); igboBias(); tagChoices(); stripBadges(); }, 1200);
})();
