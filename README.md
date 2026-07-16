# Checkpoint Biafra
The Republic of Biafra has just declared independence from Nigeria. You are an immigration/checkpoint officer at the eastern border town of Ogoja bridgehead, a contested crossing point.


## Inspector Nwosu (AI Supervisor)

Runtime supervisor that **observes gameplay**, **learns locally** (preferences, weak spots, drama weights in `localStorage`), invents **period-grounded scenarios**, and applies **safe runtime upgrades** (side-event pressure, narrative interventions, history notes).

- **Admin only:** the **NW** button is hidden from public players. On localhost it always shows. On the live site unlock once (secret PIN / admin URL) — public never see keys or the panel.
- Optional **multi-LLM keys** (xAI, OpenRouter open models, Groq/Llama, Gemini, OpenAI, local Ollama, custom OpenAI-compat) are stored only in this browser; **fallback chain** tries the next provider if one fails; offline templates always work.
- Nwosu will **not** rewrite `engine.js` on disk; code changes stay human-gated. Narrative and soft difficulty adapt in-session.

Doctrine: teach the human cost of 1967–70 through a checkpoint desk — household, conscience, memory.


## Admin (Inspector Nwosu)

The **NW** admin console is **not shown to public players**.

| Where | Access |
|--------|--------|
| Localhost / `127.0.0.1` | NW always available (dev) |
| Production | **GitHub OAuth** — only allowlisted logins |

### Production setup (one-time)

1. Create a GitHub **OAuth App** (Settings → Developer settings → OAuth Apps):
   - Homepage: `https://checkpoint-biafra.vercel.app`
   - Callback: `https://checkpoint-biafra.vercel.app/api/auth/callback`
2. In **Vercel → Project → Settings → Environment Variables** set:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `SESSION_SECRET` (long random string, 32+ chars)
   - `ADMIN_GITHUB_LOGINS=Slaze` (comma-separated for more admins)
   - Optional: `APP_BASE_URL=https://checkpoint-biafra.vercel.app`
3. Redeploy.

### Sign in on live site

- Click the splash **version line** 5 times within 3 seconds, **or** press `Alt+Shift+N`
- Choose **Sign in with GitHub**
- After allowlisted login, the **NW** button appears
- **Sign out** from the panel clears the session cookie

### API routes

- `GET /api/auth/login` — start OAuth
- `GET /api/auth/callback` — OAuth return
- `GET /api/auth/session` — `{ authenticated, login? }`
- `POST /api/auth/logout` — clear session

