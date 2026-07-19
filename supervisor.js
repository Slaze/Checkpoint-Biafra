/**
 * Inspector Nwosu — Gameplay Supervisor (v1.19)
 * ─────────────────────────────────────────
 * Observes play, learns locally, invents drama within the game's doctrine,
 * and applies SAFE runtime upgrades (narrative, soft difficulty, scenarios).
 *
 * What this is NOT:
 * - Unsupervised rewriting of engine.js / repo files (that needs a human).
 * - A guarantee of "true AGI". Learning = local weights + optional LLM.
 *
 * Optional online brain: multi-provider LLM chain (xAI, OpenRouter open models,
 * Groq/Llama, Gemini, OpenAI, local Ollama, custom OpenAI-compat). Keys stay in
 * localStorage only. If every online provider fails, offline templates continue.
 *
 * ADMIN UI: NW button/panel is ADMIN-ONLY.
 * - Localhost / file: always admin (offline dev).
 * - Production: GitHub OAuth session via /api/auth/* (httpOnly cookie).
 *   Public players never see NW. Gesture on splash version → sign in.
 */
(function () {
  'use strict';
  if (window.__NwosuSupervisor) return;

  var STORE_KEY = 'cb_supervisor_v1';
  var KEY_API = 'cb_xai_api_key'; // legacy single-key slot (migrated into LLM config)
  var KEY_LLM = 'cb_llm_config_v1';
  var KEY_ON = 'cb_supervisor_on';
  var KEY_HIST = 'cb_supervisor_history_notes';
  var AUTH_LOGIN_URL = '/api/auth/login';
  var AUTH_SESSION_URL = '/api/auth/session';
  var AUTH_LOGOUT_URL = '/api/auth/logout';

  /** Browser-callable providers (OpenAI-compatible chat + Gemini). */
  var LLM_PROVIDERS = {
    xai: {
      id: 'xai',
      label: 'xAI Grok',
      kind: 'openai',
      base: 'https://api.x.ai/v1',
      defaultModel: 'grok-4-1-fast-non-reasoning',
      placeholder: 'xai-...',
      hint: 'console.x.ai',
    },
    openrouter: {
      id: 'openrouter',
      label: 'OpenRouter (open models)',
      kind: 'openai',
      base: 'https://openrouter.ai/api/v1',
      defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
      placeholder: 'sk-or-...',
      hint: 'openrouter.ai — free Llama/Gemma/etc.',
    },
    groq: {
      id: 'groq',
      label: 'Groq (Llama)',
      kind: 'openai',
      base: 'https://api.groq.com/openai/v1',
      defaultModel: 'llama-3.3-70b-versatile',
      placeholder: 'gsk_...',
      hint: 'console.groq.com',
    },
    gemini: {
      id: 'gemini',
      label: 'Google Gemini',
      kind: 'gemini',
      defaultModel: 'gemini-2.0-flash',
      placeholder: 'AIza...',
      hint: 'aistudio.google.com',
    },
    openai: {
      id: 'openai',
      label: 'OpenAI',
      kind: 'openai',
      base: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
      placeholder: 'sk-...',
      hint: 'platform.openai.com',
    },
    ollama: {
      id: 'ollama',
      label: 'Ollama (local open models)',
      kind: 'openai',
      base: 'http://127.0.0.1:11434/v1',
      defaultModel: 'llama3.2',
      // Put "local" in the key field to enable (no cloud secret needed)
      placeholder: 'type local to enable',
      hint: 'ollama run llama3.2 — key field: local',
      keyOptional: false,
      enableToken: true,
    },
    custom: {
      id: 'custom',
      label: 'Custom OpenAI-compat',
      kind: 'openai',
      defaultModel: 'llama3',
      placeholder: 'key if required (or local)',
      hint: 'Any /v1/chat/completions host + base URL',
      keyOptional: true,
      needsBase: true,
    },
  };

  var DEFAULT_LLM_ORDER = [
    'xai',
    'openrouter',
    'groq',
    'gemini',
    'openai',
    'ollama',
    'custom',
  ];

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

  function defaultLlmConfig() {
    return {
      version: 1,
      order: DEFAULT_LLM_ORDER.slice(),
      keys: {},
      models: {},
      customBase: '',
      ollamaBase: 'http://127.0.0.1:11434/v1',
      fallback: true,
      lastOk: null,
      lastErr: null,
    };
  }

  function loadLlmConfig() {
    var cfg = defaultLlmConfig();
    try {
      var raw = localStorage.getItem(KEY_LLM);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          cfg.order = Array.isArray(parsed.order) ? parsed.order : cfg.order;
          cfg.keys = parsed.keys && typeof parsed.keys === 'object' ? parsed.keys : {};
          cfg.models = parsed.models && typeof parsed.models === 'object' ? parsed.models : {};
          cfg.customBase = parsed.customBase || '';
          cfg.ollamaBase = parsed.ollamaBase || cfg.ollamaBase;
          cfg.fallback = parsed.fallback !== false;
          cfg.lastOk = parsed.lastOk || null;
          cfg.lastErr = parsed.lastErr || null;
        }
      }
      // Migrate legacy single xAI key
      var legacy = (localStorage.getItem(KEY_API) || '').trim();
      if (legacy && !cfg.keys.xai) {
        cfg.keys.xai = legacy;
        saveLlmConfig(cfg);
      }
    } catch (e) {}
    return cfg;
  }

  function saveLlmConfig(cfg) {
    try {
      localStorage.setItem(KEY_LLM, JSON.stringify(cfg));
      if (cfg.keys && cfg.keys.xai) {
        localStorage.setItem(KEY_API, cfg.keys.xai);
      }
    } catch (e) {}
  }

  var llmConfig = loadLlmConfig();

  function getApiKey(providerId) {
    if (providerId) {
      return (llmConfig.keys[providerId] || '').trim();
    }
    // Any configured provider (backward compat for callers)
    var list = configuredProviders();
    if (!list.length) return '';
    return (llmConfig.keys[list[0].id] || list[0].id || '').trim();
  }

  function configuredProviders() {
    var list = [];
    var order = llmConfig.order && llmConfig.order.length ? llmConfig.order : DEFAULT_LLM_ORDER;
    for (var i = 0; i < order.length; i++) {
      var id = order[i];
      var p = LLM_PROVIDERS[id];
      if (!p) continue;
      var key = (llmConfig.keys[id] || '').trim();
      if (id === 'custom') {
        if ((llmConfig.customBase || '').trim() && (key || p.keyOptional)) {
          list.push(p);
        }
        continue;
      }
      // Ollama / token-enabled local: key "local" or any non-empty enables
      if (key) list.push(p);
    }
    // If fallback off, only first configured
    if (!llmConfig.fallback && list.length > 1) return [list[0]];
    return list;
  }

  function providerModel(p) {
    return (llmConfig.models[p.id] || p.defaultModel || '').trim();
  }

  function providerBase(p) {
    if (p.id === 'custom') return (llmConfig.customBase || '').replace(/\/$/, '');
    if (p.id === 'ollama') return (llmConfig.ollamaBase || p.base || '').replace(/\/$/, '');
    return (p.base || '').replace(/\/$/, '');
  }

  function extractJsonScenario(text) {
    if (!text) return null;
    var json = String(text)
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    // salvage first {...} if model wrapped prose
    if (json.charAt(0) !== '{') {
      var a = json.indexOf('{');
      var b = json.lastIndexOf('}');
      if (a >= 0 && b > a) json = json.slice(a, b + 1);
    }
    try {
      var sc = JSON.parse(json);
      if (sc && sc.title && sc.choices) return sc;
    } catch (e) {}
    return null;
  }

  function inventPrompt(context) {
    return (
      'You are Inspector Nwosu, supervisor at a 1967-70 Nigerian Civil War federal checkpoint game. ' +
      'Doctrine goals: ' +
      DOCTRINE.goals.join('; ') +
      '. Forbidden: ' +
      DOCTRINE.forbidden.join('; ') +
      '. ' +
      'Invent ONE short dramatic intervention as JSON only: {"title":"...","body":"...","choices":[{"label":"...","pay":0,"effect":{"loyalty":0}}]} ' +
      'Period voice, household consequences, no modern tech. Context: ' +
      JSON.stringify(context).slice(0, 1200)
    );
  }

  function callOpenAICompat(p, prompt) {
    var base = providerBase(p);
    if (!base) return Promise.reject(new Error(p.id + ' missing base URL'));
    var key = (llmConfig.keys[p.id] || '').trim();
    var headers = {
      'Content-Type': 'application/json',
    };
    // "local" / empty tokens are enable flags, not real bearer secrets
    if (key && !/^(local|none|ollama|true|1)$/i.test(key)) {
      headers.Authorization = 'Bearer ' + key;
    }
    if (p.id === 'openrouter') {
      headers['HTTP-Referer'] = (typeof location !== 'undefined' && location.origin) || 'https://checkpoint-biafra.vercel.app';
      headers['X-Title'] = 'Checkpoint Biafra · Inspector Nwosu';
    }
    return fetch(base + '/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: providerModel(p),
        messages: [
          { role: 'system', content: 'Return only valid JSON for a checkpoint moral scenario.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
      }),
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error(p.id + ' ' + r.status + ' ' + String(t).slice(0, 120));
        });
      }
      return r.json();
    }).then(function (data) {
      var text =
        (data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content) ||
        '';
      var sc = extractJsonScenario(text);
      if (!sc) throw new Error(p.id + ' bad json');
      return sc;
    });
  }

  function callGemini(p, prompt) {
    var key = (llmConfig.keys.gemini || '').trim();
    if (!key) return Promise.reject(new Error('gemini missing key'));
    var model = providerModel(p) || 'gemini-2.0-flash';
    var url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(model) +
      ':generateContent?key=' +
      encodeURIComponent(key);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  'Return only valid JSON for a checkpoint moral scenario.\n\n' + prompt,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.8 },
      }),
    })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            throw new Error('gemini ' + r.status + ' ' + String(t).slice(0, 120));
          });
        }
        return r.json();
      })
      .then(function (data) {
        var text =
          (data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0] &&
            data.candidates[0].content.parts[0].text) ||
          '';
        var sc = extractJsonScenario(text);
        if (!sc) throw new Error('gemini bad json');
        return sc;
      });
  }

  function callProvider(p, prompt) {
    if (p.kind === 'gemini') return callGemini(p, prompt);
    return callOpenAICompat(p, prompt);
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

  function inventDayDrama(s, opts) {
    opts = opts || {};
    var force = !!opts.force;
    var now = Date.now();
    // Ambient invent is throttled + probabilistic; force skips gates (admin button / online fallback)
    if (!force && now - session.lastInvent < 40000) return;
    if (!force && Math.random() > 0.55 * store.dramaIntensity) return;
    session.lastInvent = now;

    var inv = inventScenario();
    showInventedScenario(inv.scenario, inv.key);
    appendLog('invent', inv.key + (force ? ' (force)' : ''));
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

  // ── Optional online brain (multi-provider fallback) ──────────
  function onlineInvent(context) {
    var providers = configuredProviders();
    if (!providers.length) return Promise.resolve(null);
    var prompt = inventPrompt(context);
    var errors = [];

    function tryAt(i) {
      if (i >= providers.length) {
        llmConfig.lastErr = errors.slice(-3).join(' | ') || 'all providers failed';
        saveLlmConfig(llmConfig);
        appendLog('api_fail', llmConfig.lastErr);
        return Promise.resolve(null);
      }
      var p = providers[i];
      appendLog('api_try', p.id + ' · ' + providerModel(p));
      return callProvider(p, prompt)
        .then(function (sc) {
          llmConfig.lastOk = { id: p.id, model: providerModel(p), at: Date.now() };
          llmConfig.lastErr = null;
          saveLlmConfig(llmConfig);
          appendLog('api_ok', p.id);
          return sc;
        })
        .catch(function (e) {
          var msg = String((e && e.message) || e);
          errors.push(msg);
          appendLog('api_fail', msg.slice(0, 140));
          return tryAt(i + 1);
        });
    }

    return tryAt(0);
  }

  function inventDayDramaOnlineAware(s, opts) {
    opts = opts || {};
    var force = !!opts.force;
    var now = Date.now();
    if (!force && now - session.lastInvent < 45000) return;
    if (!force && Math.random() > 0.5 * store.dramaIntensity) return;
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
        var src =
          (llmConfig.lastOk && llmConfig.lastOk.id) || 'online';
        showInventedScenario(sc, src);
        appendLog('invent_online', src + ': ' + sc.title);
      } else {
        // Offline fallback must not re-roll random / re-enter online path
        _inventDayDrama(s, { force: true });
      }
    });
  }

  // Override invent path when any online provider is configured
  var _inventDayDrama = inventDayDrama;
  inventDayDrama = function (s, opts) {
    if (configuredProviders().length) inventDayDramaOnlineAware(s, opts);
    else _inventDayDrama(s, opts);
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
  function buildProviderFieldsHtml() {
    var html = '';
    for (var i = 0; i < DEFAULT_LLM_ORDER.length; i++) {
      var id = DEFAULT_LLM_ORDER[i];
      var p = LLM_PROVIDERS[id];
      if (!p) continue;
      html +=
        '<div class="nwosu-prov" data-prov="' +
        id +
        '">' +
        '<label class="nwosu-label">' +
        escapeHtml(p.label) +
        (p.hint ? ' · ' + escapeHtml(p.hint) : '') +
        '</label>' +
        '<input type="password" class="nwosu-input nwosu-key-in" data-key-for="' +
        id +
        '" placeholder="' +
        escapeHtml(p.placeholder || 'key') +
        ' · this browser only" autocomplete="off"/>' +
        '<input type="text" class="nwosu-input nwosu-model-in" data-model-for="' +
        id +
        '" placeholder="model: ' +
        escapeHtml(p.defaultModel || '') +
        '" autocomplete="off"/>' +
        '</div>';
    }
    html +=
      '<label class="nwosu-label">Custom base URL (OpenAI-compat)</label>' +
      '<input type="text" id="nwosu-custom-base" class="nwosu-input" placeholder="https://host/v1" autocomplete="off"/>' +
      '<label class="nwosu-label">Ollama base (if not local default)</label>' +
      '<input type="text" id="nwosu-ollama-base" class="nwosu-input" placeholder="http://127.0.0.1:11434/v1" autocomplete="off"/>';
    return html;
  }

  function wireProviderFields() {
    var keyIns = document.querySelectorAll('.nwosu-key-in');
    for (var i = 0; i < keyIns.length; i++) {
      (function (el) {
        var id = el.getAttribute('data-key-for');
        var existing = (llmConfig.keys[id] || '').trim();
        el.value = existing ? '••••••••' : '';
        el.onchange = function () {
          var v = el.value.trim();
          if (!v || v.indexOf('••') === 0) return;
          llmConfig.keys[id] = v;
          if (id === 'xai') {
            try {
              localStorage.setItem(KEY_API, v);
            } catch (e) {}
          }
          saveLlmConfig(llmConfig);
          appendLog('key', id + ' key saved locally');
          refreshPanel();
          el.value = '••••••••';
        };
      })(keyIns[i]);
    }
    var modelIns = document.querySelectorAll('.nwosu-model-in');
    for (var j = 0; j < modelIns.length; j++) {
      (function (el) {
        var id = el.getAttribute('data-model-for');
        el.value = llmConfig.models[id] || '';
        el.onchange = function () {
          var v = el.value.trim();
          if (v) llmConfig.models[id] = v;
          else delete llmConfig.models[id];
          saveLlmConfig(llmConfig);
          appendLog('model', id + ' → ' + (v || 'default'));
        };
      })(modelIns[j]);
    }
    var cb = document.getElementById('nwosu-custom-base');
    if (cb) {
      cb.value = llmConfig.customBase || '';
      cb.onchange = function () {
        llmConfig.customBase = cb.value.trim();
        saveLlmConfig(llmConfig);
      };
    }
    var ob = document.getElementById('nwosu-ollama-base');
    if (ob) {
      ob.value = llmConfig.ollamaBase || '';
      ob.onchange = function () {
        llmConfig.ollamaBase = ob.value.trim() || 'http://127.0.0.1:11434/v1';
        saveLlmConfig(llmConfig);
      };
    }
  }

  // ── Admin gate (server session on prod; localhost always admin) ─
  var adminState = {
    resolved: false,
    authenticated: false,
    login: null,
  };

  function isLocalDevHost() {
    try {
      var h = (location.hostname || '').toLowerCase();
      return (
        h === 'localhost' ||
        h === '127.0.0.1' ||
        h === '0.0.0.0' ||
        h === '::1' ||
        location.protocol === 'file:'
      );
    } catch (e) {
      return false;
    }
  }

  function isAdmin() {
    if (isLocalDevHost()) return true;
    return !!adminState.authenticated;
  }

  function stripAdminQueryFromUrl() {
    try {
      var u = new URL(location.href);
      var dirty = false;
      ['nwosu_admin', 'admin'].forEach(function (k) {
        if (u.searchParams.has(k)) {
          u.searchParams.delete(k);
          dirty = true;
        }
      });
      if (!dirty) return;
      var next = u.pathname + (u.search || '') + (u.hash || '');
      if (window.history && history.replaceState) {
        history.replaceState({}, '', next);
      }
    } catch (e) {}
  }

  function fetchServerSession() {
    if (isLocalDevHost()) {
      adminState.resolved = true;
      adminState.authenticated = true;
      adminState.login = 'local-dev';
      return Promise.resolve(adminState);
    }
    return fetch(AUTH_SESSION_URL, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then(function (r) {
        return r.json().catch(function () {
          return { authenticated: false };
        });
      })
      .then(function (data) {
        adminState.resolved = true;
        adminState.authenticated = !!(data && data.authenticated);
        adminState.login = (data && data.login) || null;
        return adminState;
      })
      .catch(function () {
        adminState.resolved = true;
        adminState.authenticated = false;
        adminState.login = null;
        return adminState;
      });
  }

  function lockAdminUi() {
    var root = document.getElementById('nwosu-root');
    if (root && root.parentNode) root.parentNode.removeChild(root);
    var modal = document.getElementById('nwosu-login-modal');
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
  }

  function serverLogout() {
    return fetch(AUTH_LOGOUT_URL, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .catch(function () {})
      .then(function () {
        adminState.authenticated = false;
        adminState.login = null;
        lockAdminUi();
        // Drop elevated public API surface
        window.__NwosuSupervisor = {
          isAdmin: isAdmin,
          loginUrl: AUTH_LOGIN_URL,
          refreshSession: resolveAdminAndMaybeShowUi,
        };
      });
  }

  function showLoginModal() {
    if (document.getElementById('nwosu-login-modal')) return;
    var m = document.createElement('div');
    m.id = 'nwosu-login-modal';
    m.className = 'nwosu-login-modal';
    m.innerHTML =
      '<div class="nwosu-login-card" role="dialog" aria-label="Admin sign in">' +
      '<button type="button" class="nwosu-x nwosu-login-x" id="nwosu-login-close">✕</button>' +
      '<strong class="nwosu-login-title">Admin access</strong>' +
      '<p class="nwosu-login-body">Sign in with GitHub. Only allowlisted accounts can open Inspector Nwosu.</p>' +
      '<a class="nwosu-btn nwosu-login-btn" href="' +
      AUTH_LOGIN_URL +
      '">Sign in with GitHub</a>' +
      '<p class="nwosu-hint">Public players: close this and keep playing.</p>' +
      '</div>';
    document.body.appendChild(m);
    document.getElementById('nwosu-login-close').onclick = function () {
      if (m.parentNode) m.parentNode.removeChild(m);
    };
    m.addEventListener('click', function (ev) {
      if (ev.target === m && m.parentNode) m.parentNode.removeChild(m);
    });
  }

  /** 5 clicks on splash version (or title) within 3s → login or open NW */
  function installAdminGesture() {
    if (isLocalDevHost()) return;
    var clicks = [];
    function onVersionClick(ev) {
      var now = Date.now();
      clicks.push(now);
      clicks = clicks.filter(function (t) {
        return now - t < 3000;
      });
      if (clicks.length < 5) return;
      clicks = [];
      if (ev && ev.preventDefault) ev.preventDefault();
      fetchServerSession().then(function () {
        if (isAdmin()) {
          exposeAdminApi();
          ensurePanel();
          refreshPanel();
          var fab = document.getElementById('nwosu-fab');
          if (fab) fab.focus();
        } else {
          showLoginModal();
        }
      });
    }
    function bindEl(el) {
      if (!el || el.__nwosuGesture) return !!el;
      el.__nwosuGesture = true;
      el.style.cursor = 'default';
      el.addEventListener('click', onVersionClick);
      return true;
    }
    function bind() {
      var found = false;
      [
        document.querySelector('.splash-version'),
        document.querySelector('.splash .version'),
        document.querySelector('.splash-title'),
        document.querySelector('h1.splash-title'),
        document.getElementById('splash-title'),
      ].forEach(function (el) {
        if (bindEl(el)) found = true;
      });
      return found;
    }
    if (!bind()) {
      var tries = 0;
      var iv = setInterval(function () {
        if (bind() || ++tries > 40) clearInterval(iv);
      }, 250);
    }
  }

  function resolveAdminAndMaybeShowUi() {
    return fetchServerSession().then(function () {
      stripAdminQueryFromUrl();
      if (isAdmin()) {
        exposeAdminApi();
        ensurePanel();
        refreshPanel();
      }
      return isAdmin();
    });
  }

  function ensurePanel() {
    if (!isAdmin()) return;
    if (document.getElementById('nwosu-root')) return;
    var root = document.createElement('div');
    root.id = 'nwosu-root';
    root.setAttribute('data-admin-only', '1');
    root.innerHTML =
      '<button type="button" id="nwosu-fab" class="nwosu-fab" title="Inspector Nwosu (admin)">NW</button>' +
      '<div id="nwosu-panel" class="nwosu-panel" hidden>' +
      '<div class="nwosu-panel-h">' +
      '<div><strong>Inspector Nwosu</strong><span>Admin · ' +
      escapeHtml(adminState.login || 'session') +
      '</span></div>' +
      '<button type="button" id="nwosu-close" class="nwosu-x">✕</button>' +
      '</div>' +
      '<div class="nwosu-panel-b">' +
      '<p class="nwosu-doctrine">Admin console — GitHub OAuth on live; hidden from public. Goal: teach the human cost of 1967–70 through a checkpoint desk.</p>' +
      '<label class="nwosu-row"><input type="checkbox" id="nwosu-on"/> Supervisor on</label>' +
      '<label class="nwosu-row"><input type="checkbox" id="nwosu-hist"/> History notes on EOD</label>' +
      '<label class="nwosu-row"><input type="checkbox" id="nwosu-fallback" checked/> Fallback chain (try next LLM if one fails)</label>' +
      '<p class="nwosu-hint">Keys stay in this browser only. Order: xAI → OpenRouter → Groq → Gemini → OpenAI → Ollama → custom. Offline templates always last.</p>' +
      '<details class="nwosu-details" id="nwosu-llm-details">' +
      '<summary>Online brains · API keys</summary>' +
      '<div class="nwosu-llm-fields">' +
      buildProviderFieldsHtml() +
      '</div>' +
      '<button type="button" id="nwosu-clear-keys" class="nwosu-btn nwosu-btn-ghost">Clear all keys</button>' +
      '</details>' +
      '<div class="nwosu-actions">' +
      '<button type="button" id="nwosu-assess" class="nwosu-btn">Assess growth</button>' +
      '<button type="button" id="nwosu-invent" class="nwosu-btn">Invent scenario now</button>' +
      '<button type="button" id="nwosu-probe" class="nwosu-btn nwosu-btn-ghost">Test LLMs</button>' +
      '<button type="button" id="nwosu-lock" class="nwosu-btn nwosu-btn-ghost">' +
      (isLocalDevHost() ? 'Dev host' : 'Sign out') +
      '</button>' +
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
    var fb = document.getElementById('nwosu-fallback');
    fb.checked = llmConfig.fallback !== false;
    fb.onchange = function () {
      llmConfig.fallback = fb.checked;
      saveLlmConfig(llmConfig);
      appendLog('cfg', fb.checked ? 'fallback on' : 'fallback off (first only)');
      refreshPanel();
    };
    wireProviderFields();
    document.getElementById('nwosu-clear-keys').onclick = function () {
      llmConfig.keys = {};
      llmConfig.lastOk = null;
      llmConfig.lastErr = null;
      try {
        localStorage.removeItem(KEY_API);
      } catch (e) {}
      saveLlmConfig(llmConfig);
      wireProviderFields();
      appendLog('key', 'all keys cleared');
      refreshPanel();
      speak('Online brains cleared. I still have paper templates.');
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
      inventDayDrama(gameState(), { force: true });
    };
    document.getElementById('nwosu-probe').onclick = function () {
      probeProviders();
    };
    document.getElementById('nwosu-lock').onclick = function () {
      if (isLocalDevHost()) {
        speak('On localhost the admin UI stays available. On the live site use Sign out after GitHub login.');
        return;
      }
      speak('Signing out…');
      serverLogout();
    };
  }

  /** Alt+Shift+N on live: session check → panel or GitHub login modal */
  function installAdminHotkey() {
    if (isLocalDevHost()) return;
    document.addEventListener('keydown', function (ev) {
      if (!(ev.altKey && ev.shiftKey && (ev.key === 'N' || ev.key === 'n'))) return;
      fetchServerSession().then(function () {
        if (isAdmin()) {
          exposeAdminApi();
          ensurePanel();
          refreshPanel();
        } else {
          showLoginModal();
        }
      });
    });
  }

  function probeProviders() {
    var list = configuredProviders();
    if (!list.length) {
      speak('No online providers configured. Add a key or enable Ollama.');
      appendLog('probe', 'none configured');
      return;
    }
    speak('Probing ' + list.length + ' brain(s)…');
    var prompt =
      'Return only this JSON: {"title":"Probe","body":"ok","choices":[{"label":"OK","pay":0,"effect":{}}]}';
    var i = 0;
    function next() {
      if (i >= list.length) {
        refreshPanel();
        speak('Probe finished. See NW log.');
        return;
      }
      var p = list[i++];
      callProvider(p, prompt)
        .then(function () {
          appendLog('probe_ok', p.id + ' · ' + providerModel(p));
          next();
        })
        .catch(function (e) {
          appendLog('probe_fail', p.id + ': ' + String((e && e.message) || e).slice(0, 100));
          next();
        });
    }
    next();
  }

  function brainStatusLine() {
    var list = configuredProviders();
    if (!list.length) return 'offline templates';
    var names = list
      .map(function (p) {
        return p.id;
      })
      .join(' → ');
    var last =
      llmConfig.lastOk && llmConfig.lastOk.id
        ? ' · last ok: ' + llmConfig.lastOk.id
        : llmConfig.lastErr
          ? ' · last err'
          : '';
    return names + last;
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
      escapeHtml(brainStatusLine()) +
      '</b></div>' +
      '<div>Auth: <b>' +
      escapeHtml(
        isLocalDevHost()
          ? 'local-dev'
          : adminState.authenticated
            ? 'github:' + (adminState.login || '?')
            : 'signed out'
      ) +
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
    installHooks();
    installAdminHotkey();
    installAdminGesture();
    resolveAdminAndMaybeShowUi();
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

  // Public surface: minimal. Full admin tools only after session.
  window.__NwosuSupervisor = {
    isAdmin: isAdmin,
    loginUrl: AUTH_LOGIN_URL,
    refreshSession: resolveAdminAndMaybeShowUi,
    lock: function () {
      if (isLocalDevHost()) return Promise.resolve(false);
      return serverLogout().then(function () {
        return true;
      });
    },
  };

  // Admin-only API attached after unlock (and immediately on localhost)
  function exposeAdminApi() {
    if (!isAdmin()) return;
    window.__NwosuSupervisor.doctrine = DOCTRINE;
    window.__NwosuSupervisor.observe = observe;
    window.__NwosuSupervisor.assess = assessAndGrow;
    window.__NwosuSupervisor.invent = function (force) {
      inventDayDrama(gameState(), { force: force !== false });
    };
    window.__NwosuSupervisor.speak = speak;
    window.__NwosuSupervisor.getStore = function () {
      return JSON.parse(JSON.stringify(store));
    };
    window.__NwosuSupervisor.getLlmConfig = function () {
      // Redact key material in returned config
      var c = JSON.parse(JSON.stringify(llmConfig));
      if (c.keys) {
        Object.keys(c.keys).forEach(function (k) {
          if (c.keys[k]) c.keys[k] = '•••';
        });
      }
      return c;
    };
    window.__NwosuSupervisor.providers = LLM_PROVIDERS;
    window.__NwosuSupervisor.probe = probeProviders;
    window.__NwosuSupervisor.applySafeUpgrade = applySafeUpgrade;
    window.__NwosuSupervisor.logout = serverLogout;
  }

  if (isLocalDevHost()) exposeAdminApi();
})();
