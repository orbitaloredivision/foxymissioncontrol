import express from 'express';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession, getUsersDb } from '../lib/userDatabase.js';
import { parseCookies, requireUser, SESSION_COOKIE } from '../middleware/auth.js';

const router = express.Router();

function cookieOptions(req, maxAge) {
  const secure = req.secure || req.get('x-forwarded-proto') === 'https';
  return { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge };
}

router.post('/login', async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const user = getUsersDb().prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE').get(username);
  if (!user || !user.active || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, error: 'Невірний логін або пароль' });
  }
  const session = createSession(user.id);
  res.cookie(SESSION_COOKIE, session.token, cookieOptions(req, session.expiresAt - Date.now()));
  res.json({ success: true, username: user.username });
});

router.post('/logout', (req, res) => {
  deleteSession(parseCookies(req)[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE, cookieOptions(req, 0));
  res.json({ success: true });
});

router.get('/session', requireUser, (req, res) => {
  res.json({ success: true, user: { id: req.user.id, username: req.user.username } });
});

// Kept for compatibility with older frontend builds. Login session is enough;
// the physical Master passcode is no longer required.
router.post('/verify', requireUser, (req, res) => res.json({ success: true, method: 'session' }));

export default router;
