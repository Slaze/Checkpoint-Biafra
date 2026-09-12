# Checkpoint Biafra — Project Recap

## Latest session (2026-09-13) — v1.28 illustrated desk hands

### Goal
Hands must show on the live booth. User: they do not. Reference: Downloads `IMG_3716.jpg` / `IMG_3715.jpg` (first-person illustrated palms on desk).

### What changed
- Root cause: v1.27 Three.js primitives painted as tiny orange blobs at desk corners, then hid the 2D hand layer (`cb-hide-svg-after-three`). Original `.pov-hand` SVG was `display:none` from patch. Human never saw hands.
- Stopped loading `three-desk.js` from `patch.js` / `v20.js`. Retired module strips leftover `#cb-three`.
- Mounted sample-style plate `hands-male.png` (chroma-keyed from `IMG_3716` pose, olive cuffs, deep brown skin) via `desk-v22.js` at desk bottom, z-index 5.
- Booth always shows `.pov-hand` until PNG loads, then PNG is the live hands.
- Ship **v1.28**.

### Why
3D camera/composition ≠ first-person desk game. Sample is large palms-down plates at the bottom of the frame.

### How verified
- `node --check` desk-v22 / patch / v20 / three-desk / sw / engine.
- Local `_hand-accept.html`: `accept true`, PNG 864×383, no `#cb-three`.
- Local booth `?cb=128`: `phase-booth`, `cb-png-hands`, `__cbHandsReady`, splash v1.28. Screenshot: two illustrated hands on wood, papers between them.

### Current state
- Live + GitHub `7e4670b` + disk = **v1.28**. Hands visible on live booth.

### Next steps
- Hard-refresh live / wait SW `checkpoint-biafra-v1.28`.
- Optional female plate (male PNG scaled 0.92 for now).
- Human: LLM keys; NW GitHub click-confirm.

### Blockers / risks
- PNG is JPEG-sourced; thin outline fringe possible on some screens.
- Old PWA until new SW. `#cb-three{display:none}` is the belt.

---

## Prior session (2026-09-12) — ship v1.27 POV hands

### Goal
Round up pending work: v1.27 sat on disk since 2026-09-07. Live still `1.26`.

### What changed
- Committed + pushed existing v1.27 (procedural Three hands; SVG fallback until first sized paint).
- Did **not** commit debug fixtures `_hand-accept.html` / `_svg-only.html`, `.agents/`, `skills-lock.json`, `.DS_Store`.

### Why
Bare `import … from 'three'` never resolved on live. Hands stayed dead after CSS/SVG strip.

### How verified
- `node --check` on `three-desk.js`, `patch.js`, `sw.js`, `v20.js`, `engine.js`, `desk-v22.js`.
- Local `http://127.0.0.1:8766/_hand-accept.html`: `accept true`, `threeOk true`, `__cbThreeDeskReady`, 24 meshes, canvas CSS 390×520 (backing 780×1040). SVG visible at boot, hidden after Three paint.
- GitHub `8cf4159` on `main`. Live `version.json` = `1.27` immediately after push.
- Live CDP `https://checkpoint-biafra.vercel.app/?cb=127`: splash `v1.27`; new game to `phase-booth`; `__cbThreeDeskReady`; 24 meshes; desk 560×671; SW `sw.js?v=1.27`; console errors 0. Hands visible on desk screenshot.
- OAuth still wired: `GET /api/auth/session` 200 `{authenticated:false}`; `GET /api/auth/login` 302 GitHub authorize.

### Current state
- Live + GitHub + disk = **v1.27**. Pending ship closed.

### Next steps (leftover, not blockers)
- Optional: fold overlays; drop redundant `v20.js`.
- Human: LLM keys (xAI team 403 no credits) or OpenRouter/Groq/Gemini/Ollama for online invent.
- Human: 5× splash version or Alt+Shift+N, GitHub sign-in, confirm NW button (API login 302 already OK).

### Blockers / risks
- jsDelivr `three.module.js` not in app SW. Procedural hands skip GLB flake.
- Installed PWAs may hold old SW until skipWaiting + hard-refresh.

---

## Prior session (2026-09-07) — fix POV hands boot (v1.27)

### Goal
Hands must visibly load on the checkpoint desk during gameplay.

### What changed
- Rewrote `three-desk.js`: removed `GLTFLoader` / jsdelivr `examples/jsm` (bare `import … from 'three'` never resolved → module never ran).
- Now imports only `three.module.js` (full URL) and always mounts **procedural Mesh hands** (palm + fingers + cuff).
- No longer hides `.cb-hand-layer`; only hides legacy `.pov-hand` / `.pov-hand-svg`.
- Desk resize: polls / ResizeObserver when `#desk` is 0×0 until game screen shows.
- Ship **v1.27**: `patch.js` VER, `sw.js` CACHE + `patchHtml` (align 1.19–1.26 → 1.27), `version.json`, `index.html` splash/`?v=`, `engine.js` SW register, `manifest.json` `?cb=127`, `v20.js` cache-busters.

### Why
Live CDP: `Failed to resolve module specifier "three"` → `__cbThreeDeskGLB` stayed false → no `#cb-three`; CSS/SVG hands already stripped by `patch.js`.

### How verified
- `node --check` on `three-desk.js`, `patch.js`, `sw.js`, `v20.js`, `engine.js`.
- Module graph: only import is fully-qualified `three.module.js`.
- Chrome headless + SwiftShader: `#cb-three` present, `__cbThreeDeskReady`, 24 hand meshes, canvas 390×520.

### Current state
- Fix on disk only (**not pushed**). Needs deploy for live.

### Next steps
- Push / deploy v1.27; hard-refresh or wait for SW activate; confirm hands on live desk.

### Blockers / risks
- Still depends on jsDelivr for `three.module.js` (app SW does not cache that CDN). Procedural hands avoid GLB CDN flake.
- Old SW caches until v1.27 activates.

---

## Prior session (2026-09-07) — pull + fix overlay boot (v1.26)

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
