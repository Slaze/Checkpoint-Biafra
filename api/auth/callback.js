const {
  getBaseUrl,
  parseCookies,
  setCookie,
  clearCookie,
  createSessionToken,
  verifySigned,
  isAllowlisted,
  SESSION_COOKIE,
  STATE_COOKIE,
  SESSION_TTL_SEC,
  html,
  redirect,
  escapeHtml,
} = require('./_lib');

async function exchangeCode(code, redirectUri) {
  const body = {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code: code,
    redirect_uri: redirectUri,
  };
  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('token exchange failed ' + r.status + ' ' + t.slice(0, 120));
  }
  const data = await r.json();
  if (data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'no access_token');
  }
  return data.access_token;
}

async function fetchGithubUser(accessToken) {
  const r = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + accessToken,
      'User-Agent': 'Checkpoint-Biafra-Admin',
    },
  });
  if (!r.ok) {
    throw new Error('github user ' + r.status);
  }
  return r.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const base = getBaseUrl(req);
  // Vercel may provide req.query; fall back to parsing req.url
  let code, state, err;
  if (req.query && typeof req.query === 'object') {
    code = req.query.code;
    state = req.query.state;
    err = req.query.error;
  } else {
    const url = new URL(req.url || '/', base);
    code = url.searchParams.get('code');
    state = url.searchParams.get('state');
    err = url.searchParams.get('error');
  }

  if (err) {
    html(
      res,
      400,
      '<!doctype html><title>Login cancelled</title><body style="font-family:system-ui;padding:2rem">' +
        '<h1>Login cancelled</h1><p>' +
        escapeHtml(err) +
        '</p><p><a href="/">Back to game</a></p></body>'
    );
    return;
  }

  const cookies = parseCookies(req);
  const stateCookie = cookies[STATE_COOKIE];
  clearCookie(res, STATE_COOKIE, req);

  if (!code || !state || !stateCookie) {
    html(
      res,
      400,
      '<!doctype html><title>Invalid OAuth</title><body style="font-family:system-ui;padding:2rem">' +
        '<h1>Invalid OAuth response</h1><p><a href="/api/auth/login">Try again</a></p></body>'
    );
    return;
  }

  // Cookie holds signed state token; query param must match exactly (CSRF).
  const statePayload = verifySigned(stateCookie);
  if (!statePayload || state !== stateCookie) {
    html(
      res,
      400,
      '<!doctype html><title>Invalid state</title><body style="font-family:system-ui;padding:2rem">' +
        '<h1>Invalid or expired OAuth state</h1><p><a href="/api/auth/login">Try again</a></p></body>'
    );
    return;
  }

  try {
    const redirectUri = base + '/api/auth/callback';
    const accessToken = await exchangeCode(code, redirectUri);
    const user = await fetchGithubUser(accessToken);
    const login = user && user.login;

    if (!isAllowlisted(login)) {
      console.warn('[auth] denied github login', login);
      html(
        res,
        403,
        '<!doctype html><title>Access denied</title><body style="font-family:system-ui;padding:2rem;background:#111;color:#e8dfc4">' +
          '<h1>Access denied</h1>' +
          '<p>GitHub user <strong>' +
          escapeHtml(login || 'unknown') +
          '</strong> is not on the admin allowlist.</p>' +
          '<p><a href="/" style="color:#d4a017">Back to game</a></p></body>'
      );
      return;
    }

    const session = createSessionToken(login);
    setCookie(res, SESSION_COOKIE, session, req, SESSION_TTL_SEC);
    redirect(res, base + '/?admin=1');
  } catch (e) {
    console.error('[auth] callback failed', String(e && e.message ? e.message : e));
    html(
      res,
      500,
      '<!doctype html><title>Login failed</title><body style="font-family:system-ui;padding:2rem">' +
        '<h1>Login failed</h1><p>Could not complete GitHub sign-in.</p>' +
        '<p><a href="/api/auth/login">Try again</a> · <a href="/">Game</a></p></body>'
    );
  }
};
