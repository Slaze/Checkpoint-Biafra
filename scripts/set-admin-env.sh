#!/usr/bin/env bash
# Set Vercel env vars for Checkpoint Biafra GitHub OAuth admin.
# Usage:
#   export GITHUB_CLIENT_ID=...
#   export GITHUB_CLIENT_SECRET=...
#   ./scripts/set-admin-env.sh
#
# Optional:
#   export VERCEL_TOKEN=...   # if not already logged in via `vercel login`
#   export ADMIN_GITHUB_LOGINS=Slaze
#   export APP_BASE_URL=https://checkpoint-biafra.vercel.app

set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI not found. Install: npm i -g vercel" >&2
  exit 1
fi

if [[ -z "${GITHUB_CLIENT_ID:-}" || -z "${GITHUB_CLIENT_SECRET:-}" ]]; then
  echo "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET first (from GitHub OAuth App)." >&2
  echo "Create app at: https://github.com/settings/developers" >&2
  echo "  Homepage:  https://checkpoint-biafra.vercel.app" >&2
  echo "  Callback:  https://checkpoint-biafra.vercel.app/api/auth/callback" >&2
  exit 1
fi

ADMIN_GITHUB_LOGINS="${ADMIN_GITHUB_LOGINS:-Slaze}"
APP_BASE_URL="${APP_BASE_URL:-https://checkpoint-biafra.vercel.app}"

SECRET_FILE="${HOME}/.config/checkpoint-biafra/session_secret"
mkdir -p "$(dirname "$SECRET_FILE")"
if [[ ! -f "$SECRET_FILE" ]]; then
  python3 -c 'import secrets; print(secrets.token_urlsafe(48))' >"$SECRET_FILE"
  chmod 600 "$SECRET_FILE"
fi
SESSION_SECRET="$(tr -d '\n' <"$SECRET_FILE")"

# Link project if needed
if [[ ! -f .vercel/project.json ]]; then
  echo "Linking Vercel project…"
  vercel link --yes --project checkpoint-biafra ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} || \
    vercel link --yes ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}
fi

add_env() {
  local name="$1"
  local value="$2"
  local env="$3"
  # Remove existing silently, then add (vercel env add is interactive without pipe)
  vercel env rm "$name" "$env" --yes ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} 2>/dev/null || true
  printf '%s' "$value" | vercel env add "$name" "$env" ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}
  echo "  set $name ($env)"
}

echo "Setting env vars for production, preview, development…"
for env in production preview development; do
  add_env GITHUB_CLIENT_ID "$GITHUB_CLIENT_ID" "$env"
  add_env GITHUB_CLIENT_SECRET "$GITHUB_CLIENT_SECRET" "$env"
  add_env SESSION_SECRET "$SESSION_SECRET" "$env"
  add_env ADMIN_GITHUB_LOGINS "$ADMIN_GITHUB_LOGINS" "$env"
  add_env APP_BASE_URL "$APP_BASE_URL" "$env"
done

echo "Redeploying production…"
vercel --prod --yes ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}

echo "Done. Test: https://checkpoint-biafra.vercel.app/api/auth/session"
echo "Login:  https://checkpoint-biafra.vercel.app/api/auth/login"
