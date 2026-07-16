/**
 * Inspector Nwosu — Gameplay Supervisor (v1)
 * ─────────────────────────────────────────
 * Observes play, learns locally, invents drama within the game's doctrine,
 * and applies SAFE runtime upgrades (narrative, soft difficulty, scenarios).
 *
 * What this is NOT:
 * - Unsupervised rewriting of engine.js / repo files (that needs a human).
 * - A guarantee of "true AGI". Learning = local weights + optional LLM.
 *
 * Optional online brain: user pastes XAI_API_KEY in Settings (localStorage only).
 * If the API is unreachable, offline supervisor continues fully.
 */
(function () {
  'use strict';
  if (window.__NwosuSupervisor) return;

  var STORE_KEY = 'cb_supervisor_v1';
  var KEY_API = 'cb_xai_api_key';
  var KEY_ON = 'cb_supervisor_on';
  var KEY_HIST = 'cb_supervisor_history_notes';

  /** Immutable goal of Checkpoint Biafra — all interventions must serve this. */
  var DOCTRINE = {
    title: 'Checkpoint Biafra',
    era: '1967–1970 Nigerian Civil War / Biafran secession',
    setting: 'Federal checkpoint Ogoja-East; papers, hunger, conscience',
    goals: [
      'Teach the human cost of the war through ordinary desk power',
      'Make registration (background, household, origin) matter',
      'Punish carelessness with relatable household and social scars',
      'Reward attention without turning the player into a stamp machine god',
      'Leave memories for people who were not alive then',
      'Keep period texture: radio, tax tickets, movement passes — not modern apps',
      'Never glorify cruelty; show its bill',
    ],
    forbidden: [
      'Break core save/load or make the game unplayable',
      'Auto-rewrite shipped source files',
      'Push modern anachronisms (phones, NIN, WhatsApp, naira as 1967 cash)',
      'Remove historical gravity for pure comedy',
      'Give unlimited money or zero consequences',
    ],
  };

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return defaultStore();
  }

  function defaultStore() {
    return {
      version: 1,
      sessions: 0,
      totalDecisions: 0,
      totalErrors: 0,
      totalDays: 0,
      endingsSeen: {},
      patternWeights: {
        bribe_temptation: 1,
        family_hunger: 1,
        origin_suspicion: 1,
        desertion_boy: 1,
        radio_rumour: 1,
        market_cut: 1,
        midnight_list: 1,
        landlord: 1,
        nwosu_cold: 1,
      },
      playerProfile: {
        compassionBias: 0,
        loyaltyBias: 0,
        survivalBias: 0,
        riskTolerance: 0.5,
      },
      proposals: [],
      lastAssessment: null,
      dramaIntensity: 0.55,
      softDifficulty: 1,
    };
  }

  function saveStore(s) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  var store = loadStore();
  var session = {
    decisions: 0,
    errors: 0,
    morals: 0,
    lastSpeak: 0,
    lastInvent: 0,
    daySeen: {},
    started: Date.now(),
  };

  function enabled() {
    try {
      var v = localStorage.getItem(KEY_ON);
      if (v === null) return true;
      return v === '1' || v === 'true';
    } catch (e) {
      return true;
    }
  }

  function historyNotesOn() {
    try {
      return localStorage.getItem(KEY_HIST) !== '0';
    } catch (e) {
      return true;
    }
  }

  function getApiKey() {
    try {
      return (localStorage.getItem(KEY_API) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function gameState() {
    return window.state || {};
  }

  function player() {
    return gameState().player || {};
  }

  // ── Voice (human supervisor) ─────────────────────────────────
  function speak(text, kind) {
    if (!enabled() || !text) return;
    var now = Date.now();
    if (now - session.lastSpeak < 12000 && kind !== 'urgent') return;
    session.lastSpeak = now;

    var existing = document.getElementById('nwosu-toast');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.id = 'nwosu-toast';
    el.className = 'nwosu-toast' + (kind === 'urgent' ? ' nwosu-urgent' : '');
    el.innerHTML =
      '<div class="nwosu-toast-tag">INSPECTOR NWOSU</div>' +
      '<div class="nwosu-toast-body">' +
      escapeHtml(text) +
      '</div>';
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) {
        el.classList.add('nwosu-out');
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 400);
      }
    }, 7200);
    appendLog('speak', text);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function appendLog(type, detail) {
    if (!window.__nwosuLog) window.__nwosuLog = [];
    window.__nwosuLog.push({ t: Date.now(), type: type, detail: detail });
    if (window.__nwosuLog.length > 80) window.__nwosuLog.shift();
    var box = document.getElementById('nwosu-log');
    if (box) {
      var line = document.createElement('div');
      line.className = 'nwosu-log-line';
      line.textContent = type.toUpperCase() + ' · ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 160);
      box.insertBefore(line, box.firstChild);
    }
  }

  // ── Observe gameplay ─────────────────────────────────────────
  function observe(event, payload) {
    if (!enabled()) return;
    payload = payload || {};
    var s = gameState();

    if (event === 'decide') {
      session.decisions++;
      store.totalDecisions++;
      if (payload.correct === false) {
        session.errors++;
        store.totalErrors++;
        store.playerProfile.riskTolerance = Math.min(1, store.playerProfile.riskTolerance + 0.02);
      } else {
        store.playerProfile.riskTolerance = Math.max(0, store.playerProfile.riskTolerance - 0.005);
      }
      if (payload.action === 'approve' && payload.correct === false) {
        store.playerProfile.compassionBias += 0.05;
      }
      if (payload.action === 'detain' && payload.correct === true) {
        store.playerProfile.loyaltyBias += 0.03;
      }
      maybeWhisperAfterStamp(payload);
    }

    if (event === 'moral') {
      session.morals++;
      if (payload.axes) {
        if (payload.axes.compassion) store.playerProfile.compassionBias += 0.04;
        if (payload.axes.loyalty) store.playerProfile.loyaltyBias += 0.04;
        if (payload.axes.survival) store.playerProfile.survivalBias += 0.04;
      }
    }

    if (event === 'end_of_day') {
      store.totalDays++;
      var day = s.day || 0;
      session.daySeen[day] = true;
      assessAndGrow();
      inventDayDrama(s);
      if (historyNotesOn()) injectHistoryNote(s);
    }

    if (event === 'ending') {
      var id = (payload && payload.id) || 'unknown';
      store.endingsSeen[id] = (store.endingsSeen[id] || 0) + 1;
      store.sessions++;
      assessAndGrow();
      speak(
        endingSpeak(id, s),
        'urgent'
      );
    }

    if (event === 'session_start') {
      store.sessions++;
      if (store.sessions === 1) {
        speak('New posting. Read every bulletin twice. The first time you understand it. The second time you see what it does not say.');
      } else {
        speak(returningSpeak());
      }
    }

    saveStore(store);
    refreshPanel();
  }

  function maybeWhisperAfterStamp(payload) {
    var s = gameState();
    if (session.decisions < 3) return;
    if (Math.random() > 0.12 * store.dramaIntensity) return;

    var p = player();
    var lines = [];
    if (payload.correct === false) {
      lines.push('That stamp will be on a desk in Calabar before dusk. Make the next one cleaner.');
      lines.push('Errors feed Internal Affairs. They are hungrier than the queue.');
    }
    if ((s.missedBillsStreak || 0) >= 1) {
      lines.push(
        (p.family ? 'Your registration listed a household. ' : '') +
          'Empty pots do not care about your accuracy percentage.'
      );
    }
    if ((s.infiltrationCount || 0) >= 2) {
      lines.push('Patterns at a window look like collaboration from Headquarters.');
    }
    if (p.background === 'teacher' && Math.random() < 0.4) {
      lines.push('You used to mark attendance. Now the absences walk up to your glass.');
    }
    if (p.background === 'soldier' && Math.random() < 0.4) {
      lines.push('Boots under civilian cloth — you of all people should feel that.');
    }
    if (!lines.length) {
      lines.push('The queue does not end because you are tired.');
    }
    speak(lines[Math.floor(Math.random() * lines.length)]);
  }

  function returningSpeak() {
    var w = store.patternWeights;
    var top = Object.keys(w).sort(function (a, b) {
      return w[b] - w[a];
    })[0];
    var map = {
      family_hunger: 'Back again. Last time the house paid for the desk. Try not to invoice them twice.',
      bribe_temptation: 'Envelopes remember fingers. So do I.',
      origin_suspicion: 'Eastern names on the list again. Stamp carefully.',
      landlord: 'Landlords outlast republics. Keep the rent envelope honest.',
      nwosu_cold: 'I am still here. The desk is still the desk.',
    };
    return map[top] || 'You returned. Good. The war did not pause for your absence.';
  }

  function endingSpeak(id, s) {
    if (id === 'collaborator_dawn' || id === 'executed') {
      return 'The file closes with a hard stamp. Learn from it — the queue already did.';
    }
    if (id === 'empty_pot' || id === 'landlord_war') {
      return 'You kept the desk. You lost the house. That is also a kind of report.';
    }
    if (id === 'glory' || id === 'last_post') {
      return 'Correct stamps. Cold commendation. History rarely claps.';
    }
    return 'Assessment filed. If it troubles you, the posting did its work.';
  }

  // ── Assessment & self-improvement (local) ────────────────────
  function assessAndGrow() {
    var s = gameState();
    var acc =
      store.totalDecisions > 0
        ? 1 - store.totalErrors / Math.max(1, store.totalDecisions)
        : 1;

    var growth = [];
    if (acc < 0.75) {
      growth.push({
        area: 'procedure',
        note: 'Accuracy under 75%. Increase bulletin emphasis and Class A flag visibility.',
        action: 'soft_difficulty_up',
      });
      store.softDifficulty = Math.min(1.4, store.softDifficulty + 0.05);
      store.patternWeights.nwosu_cold += 0.2;
    }
    if ((s.billsMissedTotal || 0) >= 2 || (s.missedBillsStreak || 0) >= 2) {
      growth.push({
        area: 'household',
        note: 'Household stress high. Prioritise relatable hunger/landlord scenarios.',
        action: 'weight_family',
      });
      store.patternWeights.family_hunger += 0.35;
      store.patternWeights.landlord += 0.25;
      store.dramaIntensity = Math.min(0.9, store.dramaIntensity + 0.04);
    }
    if ((s.infiltrationCount || 0) >= 3) {
      growth.push({
        area: 'security',
        note: 'Breach pattern. Escalate suspicion drama; do not soften collaborator path.',
        action: 'weight_suspicion',
      });
      store.patternWeights.origin_suspicion += 0.3;
      store.patternWeights.midnight_list += 0.2;
    }
    if (store.playerProfile.compassionBias > store.playerProfile.loyaltyBias + 0.3) {
      growth.push({
        area: 'tone',
        note: 'Player leans merciful. Offer harder moral forks, not free money.',
        action: 'weight_moral_pressure',
      });
      store.patternWeights.bribe_temptation += 0.15;
      store.patternWeights.desertion_boy += 0.2;
    }
    if (acc > 0.92 && (s.billsMissedTotal || 0) === 0 && store.totalDays > 5) {
      growth.push({
        area: 'challenge',
        note: 'Player is mastering the desk. Invent quieter, crueller dilemmas.',
        action: 'drama_up',
      });
      store.dramaIntensity = Math.min(0.95, store.dramaIntensity + 0.05);
      store.patternWeights.radio_rumour += 0.2;
    }

    // Apply safe runtime upgrades from growth
    growth.forEach(function (g) {
      applySafeUpgrade(g);
    });

    store.lastAssessment = {
      at: Date.now(),
      accuracy: acc,
      softDifficulty: store.softDifficulty,
      dramaIntensity: store.dramaIntensity,
      growth: growth,
      profile: JSON.parse(JSON.stringify(store.playerProfile)),
    };
    store.proposals = (store.proposals || []).concat(
      growth.map(function (g) {
        return { at: Date.now(), from: 'assess', item: g };
      })
    ).slice(-40);

    appendLog('assess', growth.map(function (g) { return g.area; }).join(', ') || 'stable');
    saveStore(store);
  }

  /**
   * Safe upgrades only — narrative & soft parameters, never source rewrites.
   */
  function applySafeUpgrade(g) {
    if (!g || !g.action) return;
    if (g.action === 'soft_difficulty_up') {
      window.__sideEventChance = Math.min(0.42, 0.18 * store.softDifficulty);
    }
    if (g.action === 'drama_up' || g.action === 'weight_family' || g.action === 'weight_suspicion') {
      window.__sideEventChance = Math.min(0.45, (window.__sideEventChance || 0.2) + 0.03);
      seedSideEventsFromLearning();
    }
    if (g.action === 'weight_moral_pressure') {
      seedSideEventsFromLearning();
    }
    // Doctrine guard: never zero consequences
    if (window.__sideEventChance < 0.08) window.__sideEventChance = 0.08;
  }

  // ── Invent scenarios (offline brain) ─────────────────────────
  function pickWeighted(keys) {
    var w = store.patternWeights;
    var total = 0;
    keys.forEach(function (k) {
      total += w[k] || 1;
    });
    var r = Math.random() * total;
    for (var i = 0; i < keys.length; i++) {
      r -= w[keys[i]] || 1;
      if (r <= 0) return keys[i];
    }
    return keys[0];
  }

  function inventScenario(kind) {
    var p = player();
    var s = gameState();
    var name = p.firstname || p.name || 'Officer';
    var origin = p.state || 'home';
    var fam = p.family || 'household';
    var bg = p.background || 'civil';

    var bank = {
      family_hunger: {
        title: 'THE POT BEFORE THE STAMP',
        body:
          name +
          ', a runner from ' +
          origin +
          ' waits after the last traveller. Your ' +
          fam +
          ' sent word: the garri is finished. He will not leave until you answer — with notes, or with silence.',
        choices: [
          { label: 'Send what you can spare from the pay packet', pay: -900, effect: { survival: 1, compassion: 1 } },
          { label: 'Send him away. The desk comes first.', effect: { loyalty: 1, survival: -1 } },
          { label: 'Promise tomorrow. You already know what promises weigh.', effect: { survival: 0 } },
        ],
      },
      bribe_temptation: {
        title: 'ANOTHER ENVELOPE',
        body:
          'Not on the counter — in your kit bag, slipped by someone who knows your booth number. More than a week of food for a ' +
          fam +
          '. No face attached.',
        choices: [
          { label: 'Put it in Internal Affairs, sealed', effect: { loyalty: 2 } },
          { label: 'Keep it. The house is not a theory.', pay: 1200, effect: { survival: 2, corruption: 2, loyalty: -1 } },
          { label: 'Leave it. Pretend the bag was never opened.', effect: { survival: 1, witness: 1 } },
        ],
      },
      origin_suspicion: {
        title: 'THE LIST AGAIN',
        body:
          'A typed sheet of Eastern names circulates at tea. Yours is not on it. Yet. Someone asks casually where in ' +
          origin +
          ' your people still sleep.',
        choices: [
          { label: 'Change the subject. Stamp coldly the rest of the day.', effect: { survival: 1 } },
          { label: 'Report the sheet to Nwosu.', effect: { loyalty: 1, witness: 1 } },
          { label: 'Memorise every name. Burn nothing you can use later.', effect: { witness: 2, rebellion: 1 } },
        ],
      },
      desertion_boy: {
        title: 'BOOTS UNDER CLOTH',
        body:
          'A youth presents clean papers. His polish is military. ' +
          (bg === 'soldier' ? 'You know that walk.' : 'Even a civilian can feel it.') +
          ' He is young enough to be someone\'s last remaining son.',
        choices: [
          { label: 'Detain for Secondary. Desertion is desertion.', effect: { loyalty: 2, compassion: -1 } },
          { label: 'Approve. The war will find him either way.', effect: { compassion: 2, loyalty: -1 } },
          { label: 'Send him to another booth. You will not be the one.', effect: { survival: 1 } },
        ],
      },
      radio_rumour: {
        title: 'TWO RADIOS, ONE LIE',
        body:
          'Radio Lagos and the voice from the East contradict each other on the same bridge. The clerks choose a station like a football team. Your ' +
          (bg === 'radio' || bg === 'tech' ? 'trained ear' : 'stomach') +
          ' knows both can be wrong.',
        choices: [
          { label: 'Order the radio off. Only bulletins speak here.', effect: { loyalty: 1 } },
          { label: 'Let both play. Truth is not your department.', effect: { witness: 1 } },
          { label: 'Write what each said in your private book.', effect: { witness: 2 } },
        ],
      },
      market_cut: {
        title: 'THE MARKET WOMEN KNOW',
        body:
          'Before first light, women from the produce line leave a basin of oil at your door with no name. Payment for a soft window last week — or a bribe for next week. In ' +
          origin +
          ' they would call it relationship. Here it is a file waiting to be opened.',
        choices: [
          { label: 'Refuse. Return the basin to the gate.', effect: { loyalty: 1, corruption: -1 } },
          { label: 'Accept. Survival is a market.', pay: 600, effect: { survival: 1, corruption: 1 } },
          { label: 'Accept, then log an anonymous tip.', effect: { witness: 1, survival: 1, rebellion: 1 } },
        ],
      },
      midnight_list: {
        title: 'MIDNIGHT ADDENDUM',
        body:
          'A clerk slides you a handwritten addendum after lights-out: three travellers tomorrow are not to pass, no reason given. One surname matches a family from ' +
          origin +
          '.',
        choices: [
          { label: 'Obey. Ask nothing.', effect: { loyalty: 2 } },
          { label: 'Demand a stamped bulletin or refuse.', effect: { rebellion: 1, witness: 1 } },
          { label: 'Warn the matching name if they appear.', effect: { compassion: 2, loyalty: -2 } },
        ],
      },
      landlord: {
        title: 'THE LANDLORD\'S BOY',
        body:
          'The boy does not ask for money. He looks at your window long enough for the message to arrive: rent is not a rumour. Your registered ' +
          fam +
          ' is the collateral.',
        choices: [
          { label: 'Promise full envelope at week\'s end.', effect: { survival: 1 } },
          { label: 'Pay something tonight from the kit.', pay: -700, effect: { survival: 2 } },
          { label: 'Ignore him. The desk is louder.', effect: { loyalty: 1, survival: -1 } },
        ],
      },
      nwosu_cold: {
        title: 'NWOSU AT THE GLASS',
        body:
          'I stand at your booth without entering. "Read the next bulletin twice," I say. "Then look at the face. If you can still sleep, you are either innocent or finished."',
        choices: [
          { label: 'Nod. Return to the stamp pad.', effect: { loyalty: 1 } },
          { label: 'Ask what she is not saying.', effect: { witness: 1, rebellion: 1 } },
          { label: 'Tell her the house is paying for this desk.', effect: { survival: 1, compassion: 1 } },
        ],
      },
    };

    var key = kind || pickWeighted(Object.keys(bank));
    var sc = bank[key] || bank.nwosu_cold;
    // learning: scenarios that fire get slight weight bump (explored)
    store.patternWeights[key] = (store.patternWeights[key] || 1) + 0.05;
    saveStore(store);
    return { key: key, scenario: sc };
  }

  function inventDayDrama(s) {
    var now = Date.now();
    if (now - session.lastInvent < 40000) return;
    if (Math.random() > 0.55 * store.dramaIntensity) return;
    session.lastInvent = now;

    var inv = inventScenario();
    showInventedScenario(inv.scenario, inv.key);
    appendLog('invent', inv.key);
  }

  function showInventedScenario(sc, key) {
    if (!sc || document.getElementById('nwosu-scenario')) return;
    var box = document.createElement('div');
    box.id = 'nwosu-scenario';
    box.className = 'nwosu-scenario';
    var html =
      '<div class="nwosu-sc-tag">SUPERVISOR INTERVENTION · ' +
      escapeHtml((key || 'drama').replace(/_/g, ' ').toUpperCase()) +
      '</div>' +
      '<div class="nwosu-sc-title">' +
      escapeHtml(sc.title) +
      '</div>' +
      '<div class="nwosu-sc-body">' +
      escapeHtml(sc.body) +
      '</div><div class="nwosu-sc-choices"></div>';
    box.innerHTML = html;
    var ch = box.querySelector('.nwosu-sc-choices');
    (sc.choices || []).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'nwosu-sc-btn';
      b.textContent = c.label;
      b.addEventListener('click', function () {
        applyScenarioChoice(c);
        box.classList.add('nwosu-out');
        setTimeout(function () {
          if (box.parentNode) box.parentNode.removeChild(box);
        }, 350);
      });
      ch.appendChild(b);
    });
    document.body.appendChild(box);
    speak('Decision required. I will not make it for you.', 'urgent');
  }

  function applyScenarioChoice(c) {
    var s = gameState();
    if (!s) return;
    if (typeof c.pay === 'number') {
      s.totalPay = (s.totalPay || 0) + c.pay;
      if (typeof window.updateHUD === 'function') window.updateHUD();
    }
    if (c.effect && s.axes) {
      Object.keys(c.effect).forEach(function (k) {
        if (typeof window.addAxis === 'function') window.addAxis(k, c.effect[k]);
        else s.axes[k] = Math.max(0, Math.min(20, (s.axes[k] || 0) + c.effect[k]));
      });
    }
    if (c.effect && c.effect.corruption > 0) {
      s.flags = s.flags || {};
      s.flags.took_bribe = true;
      if (typeof window.rememberFlag === 'function') window.rememberFlag('took_bribe');
    }
    if (typeof window.pushMemory === 'function' && c.label) {
      window.pushMemory('Nwosu intervention: ' + c.label);
    }
    if (typeof window.saveState === 'function') window.saveState();
    observe('moral', { axes: c.effect || {}, source: 'supervisor' });
    // learning: player engaged with invention
    store.dramaIntensity = Math.min(0.95, store.dramaIntensity + 0.01);
    saveStore(store);
  }

  // ── Historical teaching notes ────────────────────────────────
  var HISTORY = [
    'Relief corridors and blockades made movement a matter of life — stamps were never only ink.',
    'Biafran and Federal radios told different wars at the same hour. Civilians lived between the two lies.',
    'Kwashiorkor and empty markets were not background; they were the bill the civilian desk could not stamp away.',
    'Checkpoints turned neighbours into categories: origin, permit, purpose. Categories are easier to punish than faces.',
    'After 1970, many files were closed. Memory was not. Silence around desks is also an archive.',
  ];

  function injectHistoryNote(s) {
    if (!historyNotesOn()) return;
    if (Math.random() > 0.4) return;
    var night = document.getElementById('eod-night');
    if (!night) return;
    var note = HISTORY[(s.day || 1) % HISTORY.length];
    var prev = night.textContent || '';
    if (prev.indexOf('HISTORY NOTE') !== -1) return;
    night.textContent =
      prev +
      (prev ? ' ' : '') +
      'HISTORY NOTE — ' +
      note;
  }

  // ── Seed dynamic side events into existing system ────────────
  function seedSideEventsFromLearning() {
    if (!window.__sideEvents || !Array.isArray(window.__sideEvents)) return;
    var inv = inventScenario();
    var sc = inv.scenario;
    var ev = {
      id: 'nwosu_' + inv.key + '_' + Date.now(),
      title: sc.title,
      body: sc.body,
      choices: (sc.choices || []).map(function (c) {
        return {
          label: c.label,
          pay: c.pay || 0,
          effect: c.effect || {},
        };
      }),
    };
    // Keep list bounded
    window.__sideEvents = window.__sideEvents.filter(function (e) {
      return !e.id || String(e.id).indexOf('nwosu_') !== 0;
    });
    window.__sideEvents.push(ev);
    // re-hook bribes in patch if needed — side events use effect objects
    appendLog('seed', inv.key);
  }

  // ── Optional online brain (xAI) ──────────────────────────────
  function onlineInvent(context) {
    var key = getApiKey();
    if (!key) return Promise.resolve(null);
    var prompt =
      'You are Inspector Nwosu, supervisor at a 1967-70 Nigerian Civil War federal checkpoint game. ' +
      'Doctrine goals: ' +
      DOCTRINE.goals.join('; ') +
      '. Forbidden: ' +
      DOCTRINE.forbidden.join('; ') +
      '. ' +
      'Invent ONE short dramatic intervention as JSON only: {"title":"...","body":"...","choices":[{"label":"...","pay":0,"effect":{"loyalty":0}}]} ' +
      'Period voice, household consequences, no modern tech. Context: ' +
      JSON.stringify(context).slice(0, 1200);

    return fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        messages: [
          { role: 'system', content: 'Return only valid JSON for a checkpoint moral scenario.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('api ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var text =
          (data.choices &&
            data.choices[0] &&
            data.choices[0].message &&
            data.choices[0].message.content) ||
          '';
        var json = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        var sc = JSON.parse(json);
        if (sc && sc.title && sc.choices) return sc;
        return null;
      })
      .catch(function (e) {
        appendLog('api_fail', String(e.message || e));
        return null;
      });
  }

  function inventDayDramaOnlineAware(s) {
    var now = Date.now();
    if (now - session.lastInvent < 45000) return;
    if (Math.random() > 0.5 * store.dramaIntensity) return;
    session.lastInvent = now;

    var ctx = {
      day: s.day,
      player: player(),
      axes: s.axes,
      billsMissed: s.billsMissedTotal,
      infiltration: s.infiltrationCount,
      profile: store.playerProfile,
    };

    onlineInvent(ctx).then(function (sc) {
      if (sc) {
        showInventedScenario(sc, 'online');
        appendLog('invent_online', sc.title);
      } else {
        inventDayDrama(s);
      }
    });
  }

  // Override invent path when API key present
  var _inventDayDrama = inventDayDrama;
  inventDayDrama = function (s) {
    if (getApiKey()) inventDayDramaOnlineAware(s);
    else _inventDayDrama(s);
  };

  // ── Hooks into engine ────────────────────────────────────────
  function wrap(name, after) {
    var tries = 0;
    function attempt() {
      var orig = window[name];
      if (typeof orig !== 'function') {
        if (tries++ < 40) setTimeout(attempt, 250);
        return;
      }
      if (orig.__nwosuWrapped) return;
      var wrapped = function () {
        var args = arguments;
        var r = orig.apply(this, args);
        try {
          after.apply(null, args);
        } catch (e) {
          appendLog('hook_err', name + ': ' + e.message);
        }
        return r;
      };
      wrapped.__nwosuWrapped = true;
      // preserve patch flags
      Object.keys(orig).forEach(function (k) {
        try {
          wrapped[k] = orig[k];
        } catch (e) {}
      });
      window[name] = wrapped;
    }
    attempt();
  }

  function installHooks() {
    wrap('decide', function (action) {
      var t = gameState().currentTraveller;
      var correct = t && t.correct === action;
      observe('decide', { action: action, correct: correct, name: t && t.name });
    });
    wrap('endOfDay', function (opts) {
      if (opts && opts.replay) return;
      observe('end_of_day', {});
    });
    wrap('showEndingScreen', function (ending) {
      observe('ending', ending || {});
      setTimeout(function () {
        injectAssessmentSupervisorNote(ending);
      }, 200);
    });
    wrap('startDay', function () {
      if (gameState().day === 1 && !session._started) {
        session._started = true;
        observe('session_start', {});
      }
    });
    wrap('chooseMoral', function (choice) {
      observe('moral', choice || {});
    });
    // Soft difficulty baseline
    window.__sideEventChance = Math.min(0.4, 0.16 * store.softDifficulty);
    seedSideEventsFromLearning();
    appendLog('online', enabled() ? 'supervisor active' : 'supervisor off');
  }

  function injectAssessmentSupervisorNote(ending) {
    var host = document.querySelector('#ending-assessment .assess-dossier');
    if (!host || host.querySelector('.assess-nwosu')) return;
    var a = store.lastAssessment;
    var sec = document.createElement('section');
    sec.className = 'assess-sec assess-nwosu';
    sec.innerHTML =
      '<h2>VI · SUPERVISOR\'S CLOSING REMARK</h2>' +
      '<p>' +
      escapeHtml(
        endingSpeak((ending && ending.id) || '', gameState()) +
          ' Sessions observed: ' +
          store.sessions +
          '. Drama pressure learned: ' +
          Math.round(store.dramaIntensity * 100) +
          '%.'
      ) +
      '</p>' +
      (a && a.growth && a.growth.length
        ? '<p class="assess-quiet">Growth focus: ' +
          escapeHtml(
            a.growth
              .map(function (g) {
                return g.area;
              })
              .join(', ')
          ) +
          '.</p>'
        : '');
    host.appendChild(sec);
  }

  // ── UI Panel ─────────────────────────────────────────────────
  function ensurePanel() {
    if (document.getElementById('nwosu-root')) return;
    var root = document.createElement('div');
    root.id = 'nwosu-root';
    root.innerHTML =
      '<button type="button" id="nwosu-fab" class="nwosu-fab" title="Inspector Nwosu">NW</button>' +
      '<div id="nwosu-panel" class="nwosu-panel" hidden>' +
      '<div class="nwosu-panel-h">' +
      '<div><strong>Inspector Nwosu</strong><span>Supervisor · adaptive</span></div>' +
      '<button type="button" id="nwosu-close" class="nwosu-x">✕</button>' +
      '</div>' +
      '<div class="nwosu-panel-b">' +
      '<p class="nwosu-doctrine">Goal: teach the human cost of 1967–70 through a checkpoint desk — memory, household, conscience.</p>' +
      '<label class="nwosu-row"><input type="checkbox" id="nwosu-on"/> Supervisor on</label>' +
      '<label class="nwosu-row"><input type="checkbox" id="nwosu-hist"/> History notes on EOD</label>' +
      '<label class="nwosu-label">Optional xAI key (local only)</label>' +
      '<input type="password" id="nwosu-key" class="nwosu-input" placeholder="xai-... stored in this browser only" autocomplete="off"/>' +
      '<div class="nwosu-actions">' +
      '<button type="button" id="nwosu-assess" class="nwosu-btn">Assess growth</button>' +
      '<button type="button" id="nwosu-invent" class="nwosu-btn">Invent scenario now</button>' +
      '</div>' +
      '<div id="nwosu-status" class="nwosu-status"></div>' +
      '<div id="nwosu-log" class="nwosu-log"></div>' +
      '</div></div>';
    document.body.appendChild(root);

    document.getElementById('nwosu-fab').onclick = function () {
      var p = document.getElementById('nwosu-panel');
      p.hidden = !p.hidden;
      refreshPanel();
    };
    document.getElementById('nwosu-close').onclick = function () {
      document.getElementById('nwosu-panel').hidden = true;
    };
    var on = document.getElementById('nwosu-on');
    on.checked = enabled();
    on.onchange = function () {
      localStorage.setItem(KEY_ON, on.checked ? '1' : '0');
      speak(on.checked ? 'I am watching the booth again.' : 'You are alone with the stamp. For now.');
    };
    var hist = document.getElementById('nwosu-hist');
    hist.checked = historyNotesOn();
    hist.onchange = function () {
      localStorage.setItem(KEY_HIST, hist.checked ? '1' : '0');
    };
    var keyIn = document.getElementById('nwosu-key');
    keyIn.value = getApiKey() ? '••••••••' : '';
    keyIn.onchange = function () {
      if (keyIn.value && keyIn.value.indexOf('••') !== 0) {
        localStorage.setItem(KEY_API, keyIn.value.trim());
        appendLog('key', 'api key saved locally');
      }
    };
    document.getElementById('nwosu-assess').onclick = function () {
      assessAndGrow();
      refreshPanel();
      speak('I filed a growth note. Drama and pressure will lean where you are weak.');
    };
    document.getElementById('nwosu-invent').onclick = function () {
      if (!enabled()) {
        speak('Turn me on first.');
        return;
      }
      session.lastInvent = 0;
      inventDayDrama(gameState());
    };
  }

  function refreshPanel() {
    var st = document.getElementById('nwosu-status');
    if (!st) return;
    var a = store.lastAssessment;
    st.innerHTML =
      '<div>Sessions: <b>' +
      store.sessions +
      '</b> · Decisions: <b>' +
      store.totalDecisions +
      '</b> · Errors: <b>' +
      store.totalErrors +
      '</b></div>' +
      '<div>Drama: <b>' +
      Math.round(store.dramaIntensity * 100) +
      '%</b> · Soft difficulty: <b>' +
      store.softDifficulty.toFixed(2) +
      '</b></div>' +
      '<div>Online brain: <b>' +
      (getApiKey() ? 'key present' : 'offline templates') +
      '</b></div>' +
      (a
        ? '<div class="nwosu-last">Last assess: ' +
          escapeHtml(
            (a.growth || [])
              .map(function (g) {
                return g.note;
              })
              .join(' · ') || 'stable'
          ) +
          '</div>'
        : '');
  }

  // ── Boot ─────────────────────────────────────────────────────
  function boot() {
    ensurePanel();
    installHooks();
    refreshPanel();
    // late re-seed hooks if patch wraps later
    setInterval(function () {
      if (!window.decide || !window.decide.__nwosuWrapped) installHooks();
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 600);
    });
  } else {
    setTimeout(boot, 600);
  }

  window.__NwosuSupervisor = {
    doctrine: DOCTRINE,
    observe: observe,
    assess: assessAndGrow,
    invent: function () {
      inventDayDrama(gameState());
    },
    speak: speak,
    getStore: function () {
      return JSON.parse(JSON.stringify(store));
    },
    applySafeUpgrade: applySafeUpgrade,
  };
})();
