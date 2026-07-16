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
