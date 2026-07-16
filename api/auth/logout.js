const { clearCookie, SESSION_COOKIE, json } = require('./_lib');

module.exports = function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  clearCookie(res, SESSION_COOKIE, req);
  json(res, 200, { ok: true });
};
