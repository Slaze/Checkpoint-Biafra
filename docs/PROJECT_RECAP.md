# Checkpoint Biafra — Project Recap

## Latest session (2026-09-07) — pull + fix overlay boot (v1.26)

### Goal
Pull behind local clone; make gameplay overlays actually load on live.

### What changed
- Fast-forwarded Desktop `main` to `origin/main` (was 17 behind / v1.19).
- Added same-origin `patch-gameplay.js` (content from `ae33cb5:patch.js`).
- `patch.js` v1.26: load `patch-gameplay.js` + `features-v23.js` + `three-desk.js` — **removed** `raw.githubusercontent.com` (blocked by `text/plain` + `nosniff`).
- `sw.js` → CACHE `checkpoint-biafra-v1.26`; caches `patch-gameplay.js`; `patchHtml` only aligns `v1.19–1.25` → `v1.26` (no extra `v20.js` inject).
- Bumped `index.html` splash/`?v=`, `engine.js` SW register, `manifest.json` `start_url` `?cb=126`, `version.json` → **1.26**.

### Why
Live boot never ran the big gameplay patch; version strings were inconsistent so ships looked dead.

### How verified
- `node --check` on patch/sw/patch-gameplay/features.
- Local serve + browser: `__cbLiveBoot`, `__patchV7`, splash `v1.26`, scripts same-origin.
- After push: live `version.json` / CDP flags.

### Current state
- Fix on disk (and pushed if deploy succeeded). Hard-refresh or wait for SW activate on installed PWAs.

### Next steps
- Optional: fold overlays into fewer files; drop redundant `v20.js`.
- Confirm NW OAuth still works after SW bump.

### Blockers / risks
- Old clients on CACHE v1.24 until new SW activates (`skipWaiting` + network-first helps).

---

## Prior session (2026-09-07) — diagnosis (pre-fix)

Local was 17 behind; live overlays + raw GitHub `nosniff` blocked gameplay patch; HTML still tagged v1.19.

---

# Checkpoint Biafra — Project Recap

## Latest session (2026-07-19) — audit fix (v1.19)

### Findings fixed
- **Invent scenario now** could no-op (random + cooldown gates) — added `{ force: true }`
- Online invent fail → offline still re-rolled random — offline fallback now forced
- OAuth error pages: XSS escape for `error` and GitHub login
- Cookie parse: decodeURIComponent try/catch
- Login: require both CLIENT_ID and CLIENT_SECRET
- Preview env vars were missing — re-added all five
- Callback query parsing hardened for Vercel `req.query`
- Admin gesture also binds splash title

### Verified
- node --check supervisor + api
- Live session/login still OK before deploy of this patch

---

# Checkpoint Biafra — Project Recap

## Latest session (2026-07-16) — GitHub OAuth admin (v1.18)

### Goals
- Real backend login for NW admin (GitHub OAuth + allowlist)

### Changes
- `api/auth/*`: login, callback, session, logout + HMAC session cookies
- `supervisor.js`: production admin only via `/api/auth/session`; localhost still open
- Hidden entry: 5× click splash version or Alt+Shift+N → GitHub sign-in modal
- SW never caches `/api/*`
- vercel.json no-store on API

### Setup still required (human)
- Create GitHub OAuth App + set Vercel env vars (see README)

### Verification
- node --check on api + supervisor
- session sign/verify + allowlist unit smoke

---

# Checkpoint Biafra — Project Recap

## Latest session (2026-07-16) — admin-only NW UI (v1.17)

### Goals
- NW admin panel must not be visible to public online players

### Changes
- Admin gate on NW fab/panel only
- Localhost always admin; live site needs PIN unlock
- Unlock: ?nwosu_admin=PIN, Alt+Shift+N, or __NwosuSupervisor.unlock(pin)
- Hide admin UI button locks production browser

### Admin PIN
- PIN: OgojaBridge1967 (hashed in source; rotate if leaked)

### Verification
- node --check supervisor.js OK

---

# Checkpoint Biafra — Project Recap

## Latest session (2026-07-16) — multi-LLM Nwosu

### Goals
- Wire xAI key for Inspector Nwosu online invent
- Add fallback to other (open) LLMs when xAI fails/stops

### Changes
- Secure local key store: `~/.config/xai/api_key` (mode 600); browser `localStorage` for game
- **v1.16** multi-provider fallback in `supervisor.js`:
  - Order: xAI → OpenRouter (open models) → Groq/Llama → Gemini → OpenAI → Ollama (local) → custom OpenAI-compat
  - Keys/models/base URLs in `localStorage` (`cb_llm_config_v1`); legacy `cb_xai_api_key` migrated
  - Offline templates always last; fixed online-fail re-entry bug (now calls offline path)
  - NW panel: expandable keys, per-provider model override, fallback toggle, **Test LLMs** probe
- Cache bump `sw.js` / asset `?v=1.16`

### Verification
- xAI key authenticates but team has **no credits** (403) — online invent needs credits or another provider
- `node --check supervisor.js` OK
- Keys never committed

### Current state
- Live deploy may lag until push; local multi-LLM ready
- Offline Nwosu fully works without any key

### Next steps
- Add OpenRouter / Groq / Gemini key (or Ollama) for real open-model invent while xAI has no credits
- Optional: server-side proxy so keys never touch the browser on production
- Rotate xAI key if chat exposure is a concern after buying credits

### Blockers
- xAI team credits/licenses empty (console.x.ai)
