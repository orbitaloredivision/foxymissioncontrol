import { getSessionUser, userHasSlave } from '../lib/userDatabase.js';

export const SESSION_COOKIE = 'master_session';

export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const at = part.indexOf('=');
    if (at > 0) out[part.slice(0, at).trim()] = decodeURIComponent(part.slice(at + 1).trim());
  }
  return out;
}

export function requireUser(req, res, next) {
  const user = getSessionUser(parseCookies(req)[SESSION_COOKIE]);
  if (!user) {
    if (req.originalUrl.startsWith('/api/')) return res.status(401).json({ error: 'Authentication required' });
    return res.redirect('/login');
  }
  req.user = user;
  next();
}

export function requireSlave(req, res, next) {
  const slaveId = req.params.droneId || req.params.slaveId || req.query.slave ||
    req.query.droneId || req.body?.droneId || req.body?.slaveId;
  if (!slaveId) return res.status(400).json({ error: 'Slave ID is required' });
  if (!userHasSlave(req.user.id, slaveId)) return res.status(403).json({ error: 'Forbidden' });
  req.slaveId = String(slaveId);
  next();
}
