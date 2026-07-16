const { readSession, json } = require('./_lib');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const session = readSession(req);
  if (!session) {
    json(res, 200, { authenticated: false });
    return;
  }
  json(res, 200, { authenticated: true, login: session.login });
};
