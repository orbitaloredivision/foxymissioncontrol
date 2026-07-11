import express from 'express';
import { join } from 'path';
import { requireSlave, requireUser } from '../middleware/auth.js';
import { config } from '../config.js';

const router = express.Router();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shell = (title, body) => `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{margin:0;background:#07130e;color:#b9ffd5;font:16px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}.box{width:min(92vw,440px);border:1px solid #28a866;background:#0b1d15;padding:28px;box-sizing:border-box}h1{margin-top:0}input,button,a.slave{width:100%;box-sizing:border-box;margin:8px 0;padding:13px;border:1px solid #28a866;background:#07130e;color:#b9ffd5;text-decoration:none;display:block}button{cursor:pointer;background:#146b42}small,.error{color:#ff8e8e}.row{display:flex;gap:8px}.row button{width:auto;margin-left:auto}</style></head><body>${body}</body></html>`;

router.get('/', (req, res) => res.redirect('/dashboard'));
router.get('/login', (req, res) => res.send(shell('Login', `<main class="box"><h1>Master Login</h1><form id="f"><input name="username" autocomplete="username" placeholder="Логін" required><input name="password" type="password" autocomplete="current-password" placeholder="Пароль" required><button>Увійти</button><div id="e" class="error"></div></form><script>f.onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(f));const r=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});const d=await r.json();if(r.ok)location='/dashboard';else document.getElementById('e').textContent=d.error||'Помилка входу'}</script></main>`)));

router.get('/slaves', requireUser, (req, res) => res.redirect('/dashboard'));

router.get('/dashboard', requireUser, (req, res, next) => {
  const sendDashboard = () => res.sendFile(join(config.frontendPath, 'index.html'));
  if (!req.query.slave) return sendDashboard();
  requireSlave(req, res, sendDashboard);
});
router.get('/settings', requireUser, (req, res) => res.sendFile(join(config.frontendPath, 'index.html')));
router.get('/control-settings', requireUser, (req, res) => res.sendFile(join(config.frontendPath, 'index.html')));

export default router;
