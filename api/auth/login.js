const {
  getBaseUrl,
  setCookie,
  createStateToken,
  STATE_COOKIE,
  STATE_TTL_SEC,
  html,
  redirect,
} = require('./_lib');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    html(
      res,
      503,
      '<!doctype html><title>Auth not configured</title><body style="font-family:system-ui;padding:2rem">' +
        '<h1>Admin login not configured</h1>' +
        '<p>Set <code>GITHUB_CLIENT_ID</code>, <code>GITHUB_CLIENT_SECRET</code>, ' +
        '<code>SESSION_SECRET</code>, and <code>ADMIN_GITHUB_LOGINS</code> in Vercel env.</p>' +
        '<p><a href="/">Back to game</a></p></body>'
    );
    return;
  }

  let state;
  try {
    state = createStateToken();
  } catch (e) {
    html(
      res,
      503,
      '<!doctype html><title>Auth not configured</title><body style="font-family:system-ui;padding:2rem">' +
        '<h1>SESSION_SECRET missing</h1><p><a href="/">Back to game</a></p></body>'
    );
    return;
  }

  setCookie(res, STATE_COOKIE, state, req, STATE_TTL_SEC);

  const base = getBaseUrl(req);
  const redirectUri = base + '/api/auth/callback';
  const url =
    'https://github.com/login/oauth/authorize' +
    '?client_id=' +
    encodeURIComponent(clientId) +
    '&redirect_uri=' +
    encodeURIComponent(redirectUri) +
    '&scope=' +
    encodeURIComponent('read:user') +
    '&state=' +
    encodeURIComponent(state);

  redirect(res, url);
};
