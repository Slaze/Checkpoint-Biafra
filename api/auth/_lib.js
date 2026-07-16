/**
 * Shared helpers for Checkpoint Biafra admin GitHub OAuth.
 * Zero deps — Node crypto only. Deployed as Vercel serverless.
 */

const crypto = require('crypto');

const SESSION_COOKIE = 'cb_admin_session';
const STATE_COOKIE = 'cb_oauth_state';
const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days
const STATE_TTL_SEC = 60 * 10; // 10 minutes

function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function b64urlJson(obj) {
  return b64url(JSON.stringify(obj));
}

function fromB64url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function getSessionSecret() {
  const s = process.env.SESSION_SECRET || '';
  if (!s || s.length < 16) return null;
  return s;
}

function signPayload(payloadObj) {
  const secret = getSessionSecret();
  if (!secret) throw new Error('SESSION_SECRET missing or too short');
  const body = b64urlJson(payloadObj);
  const sig = b64url(crypto.createHmac('sha256', secret).update(body).digest());
  return body + '.' + sig;
}

function verifySigned(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  const i = token.lastIndexOf('.');
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = b64url(crypto.createHmac('sha256', secret).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function adminAllowlist() {
  const raw = process.env.ADMIN_GITHUB_LOGINS || 'Slaze';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowlisted(login) {
  if (!login) return false;
  return adminAllowlist().includes(String(login).toLowerCase());
}

function getBaseUrl(req) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) return 'https://checkpoint-biafra.vercel.app';
  return proto + '://' + host;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function cookieAttrs(req, maxAgeSec) {
  const base = getBaseUrl(req);
  const secure = base.startsWith('https://') || process.env.VERCEL === '1';
  const parts = [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + String(maxAgeSec),
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function setCookie(res, name, value, req, maxAgeSec) {
  const prev = res.getHeader('Set-Cookie');
  const next = name + '=' + encodeURIComponent(value) + '; ' + cookieAttrs(req, maxAgeSec);
  if (!prev) res.setHeader('Set-Cookie', next);
  else if (Array.isArray(prev)) res.setHeader('Set-Cookie', prev.concat(next));
  else res.setHeader('Set-Cookie', [prev, next]);
}

function clearCookie(res, name, req) {
  const base = getBaseUrl(req);
  const secure = base.startsWith('https://') || process.env.VERCEL === '1';
  let c =
    name +
    '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  if (secure) c += '; Secure';
  const prev = res.getHeader('Set-Cookie');
  if (!prev) res.setHeader('Set-Cookie', c);
  else if (Array.isArray(prev)) res.setHeader('Set-Cookie', prev.concat(c));
  else res.setHeader('Set-Cookie', [prev, c]);
}

function createSessionToken(login) {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({
    sub: login,
    iat: now,
    exp: now + SESSION_TTL_SEC,
  });
}

function createStateToken() {
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  return signPayload({ nonce: nonce, iat: now, exp: now + STATE_TTL_SEC, purpose: 'oauth_state' });
}

function readSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const payload = verifySigned(token);
  if (!payload || !payload.sub) return null;
  if (!isAllowlisted(payload.sub)) return null;
  return { login: payload.sub };
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function html(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

module.exports = {
  SESSION_COOKIE,
  STATE_COOKIE,
  SESSION_TTL_SEC,
  STATE_TTL_SEC,
  getBaseUrl,
  parseCookies,
  setCookie,
  clearCookie,
  createSessionToken,
  createStateToken,
  verifySigned,
  readSession,
  isAllowlisted,
  adminAllowlist,
  json,
  html,
  redirect,
  getSessionSecret,
};
