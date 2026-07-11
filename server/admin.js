import express from 'express';
import bcrypt from 'bcryptjs';
import { getUsersDb } from './lib/userDatabase.js';
import { loadProfiles, saveProfiles } from './lib/profiles.js';
import { discoverDrones, pairDrone } from './lib/scripts.js';

const app = express();
app.use(express.urlencoded({ extended: false }));
const db = getUsersDb();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page = body => `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Master Admin</title><style>body{font:14px system-ui;margin:24px;max-width:1200px}table{border-collapse:collapse;width:100%;margin:16px 0}td,th{border:1px solid #aaa;padding:7px;text-align:left}form.inline{display:inline}input,button{padding:7px;margin:2px}fieldset{margin:18px 0}</style></head><body><h1>Master Admin · localhost only</h1>${body}</body></html>`;
const go = res => res.redirect('/');
let lastDiscovery = null;
const validIp = value => {
  const parts = String(value || '').split('.');
  return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255);
};
const validId = value => /^\d+$/.test(String(value || ''));

function saveSlave({ id, name, ip, crsfPort = 1091, telemetryPort = 1091, videoUrl = '' }) {
  db.prepare(`INSERT INTO slaves(id,name,ip,crsf_port,telemetry_port,video_url,last_seen) VALUES(?,?,?,?,?,?,NULL) ON CONFLICT(id) DO UPDATE SET name=excluded.name,ip=excluded.ip,crsf_port=excluded.crsf_port,telemetry_port=excluded.telemetry_port,video_url=COALESCE(excluded.video_url,slaves.video_url)`).run(id, name, ip, crsfPort, telemetryPort, videoUrl || null);
  const profiles = loadProfiles();
  const i = profiles.drones.findIndex(p => p && String(p.droneId) === String(id));
  const base = { droneId: String(id), name, ipAddress: ip, frontCameraUrl: videoUrl || '', updatedAt: Date.now() };
  if (i >= 0) profiles.drones[i] = { ...profiles.drones[i], ...base };
  else {
    const empty = profiles.drones.findIndex(p => p === null);
    if (empty >= 0) profiles.drones[empty] = base;
    else profiles.drones.push(base);
  }
  saveProfiles(profiles);
}

app.get('/', (req, res) => {
  const users = db.prepare('SELECT id,username,active FROM users ORDER BY username').all();
  const slaves = db.prepare('SELECT * FROM slaves ORDER BY name,id').all();
  const grants = db.prepare('SELECT user_id,slave_id FROM user_slaves').all();
  const grantSet = new Set(grants.map(g => `${g.user_id}:${g.slave_id}`));
  const discovered = lastDiscovery?.drones || [];
  res.send(page(`
    <fieldset><legend>Discovery · локальна мережа Master</legend>
      <form method="post" action="/discover"><button>Знайти нові Slave</button></form>
      ${lastDiscovery ? `<p>${lastDiscovery.success ? `Знайдено: ${discovered.length}` : `Помилка: ${esc(lastDiscovery.error || 'Discovery failed')}`}</p>` : ''}
      ${discovered.length ? `<table><tr><th>ID</th><th>IP</th><th>MAC</th><th>Метод</th><th>Pair</th><th>Додати користувачу</th></tr>${discovered.map(d => `<tr><td>${esc(d.drone_id)}</td><td>${esc(d.ip)}</td><td>${esc(d.mac)}</td><td>${esc(d.method)}</td><td><form method="post" action="/discover/pair"><input type="hidden" name="id" value="${esc(d.drone_id)}"><input type="hidden" name="ip" value="${esc(d.ip)}"><button>Pair</button></form></td><td><form method="post" action="/discover/add"><input type="hidden" name="id" value="${esc(d.drone_id)}"><input type="hidden" name="ip" value="${esc(d.ip)}"><input name="name" value="Slave ${esc(d.drone_id)}" required><select name="user_id" required><option value="">Користувач…</option>${users.map(u => `<option value="${u.id}">${esc(u.username)}</option>`).join('')}</select><button>Додати й призначити</button></form></td></tr>`).join('')}</table>` : ''}
      ${lastDiscovery?.message ? `<pre>${esc(lastDiscovery.message)}</pre>` : ''}
    </fieldset>
    <fieldset><legend>Створити користувача</legend><form method="post" action="/users"><input name="username" placeholder="Логін" required><input name="password" type="password" minlength="8" placeholder="Пароль (мін. 8)" required><button>Створити</button></form></fieldset>
    <h2>Користувачі</h2><table><tr><th>ID</th><th>Логін</th><th>Стан</th><th>Пароль</th><th>Дії</th><th>Доступ до Slave</th></tr>${users.map(u=>`<tr><td>${u.id}</td><td>${esc(u.username)}</td><td>${u.active?'активний':'вимкнений'}</td><td><form class="inline" method="post" action="/users/${u.id}/password"><input name="password" type="password" minlength="8" required><button>Змінити</button></form></td><td><form class="inline" method="post" action="/users/${u.id}/toggle"><button>${u.active?'Деактивувати':'Активувати'}</button></form><form class="inline" method="post" action="/users/${u.id}/delete" onsubmit="return confirm('Видалити?')"><button>Видалити</button></form></td><td>${slaves.map(s=>`<form class="inline" method="post" action="/users/${u.id}/${grantSet.has(`${u.id}:${s.id}`)?'revoke':'grant'}/${s.id}"><button>${grantSet.has(`${u.id}:${s.id}`)?'−':'+'} ${esc(s.name)}</button></form>`).join(' ')}</td></tr>`).join('')}</table>
    <fieldset><legend>Додати/оновити Slave</legend><form method="post" action="/slaves"><input name="id" type="number" placeholder="Drone ID" required><input name="name" placeholder="Назва" required><input name="ip" placeholder="WireGuard/LAN IP" required><input name="crsf_port" type="number" value="1091" required><input name="telemetry_port" type="number" value="1091" required><input name="video_url" placeholder="video_url"><button>Зберегти</button></form></fieldset>
    <h2>Slave</h2><table><tr><th>ID</th><th>Назва</th><th>IP</th><th>CRSF</th><th>Telemetry</th><th>Video</th><th>Last seen</th><th></th></tr>${slaves.map(s=>`<tr><td>${s.id}</td><td>${esc(s.name)}</td><td>${esc(s.ip)}</td><td>${s.crsf_port}</td><td>${s.telemetry_port}</td><td>${esc(s.video_url)}</td><td>${s.last_seen||''}</td><td><form method="post" action="/slaves/${s.id}/delete" onsubmit="return confirm('Видалити Slave?')"><button>Видалити</button></form></td></tr>`).join('')}</table>`));
});

app.post('/users', async (req,res)=>{ const hash=await bcrypt.hash(String(req.body.password),12); db.prepare('INSERT INTO users(username,password_hash,active) VALUES(?,?,1)').run(String(req.body.username).trim(),hash); go(res); });
app.post('/users/:id/password', async (req,res)=>{ const hash=await bcrypt.hash(String(req.body.password),12); db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,req.params.id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(req.params.id); go(res); });
app.post('/users/:id/toggle',(req,res)=>{ db.prepare('UPDATE users SET active=1-active WHERE id=?').run(req.params.id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(req.params.id); go(res); });
app.post('/users/:id/delete',(req,res)=>{ db.prepare('DELETE FROM users WHERE id=?').run(req.params.id); go(res); });
app.post('/users/:id/grant/:slaveId',(req,res)=>{ db.prepare('INSERT OR IGNORE INTO user_slaves(user_id,slave_id) VALUES(?,?)').run(req.params.id,req.params.slaveId); go(res); });
app.post('/users/:id/revoke/:slaveId',(req,res)=>{ db.prepare('DELETE FROM user_slaves WHERE user_id=? AND slave_id=?').run(req.params.id,req.params.slaveId); go(res); });
app.post('/slaves',(req,res)=>{
  saveSlave({ id:req.body.id, name:req.body.name, ip:req.body.ip, crsfPort:req.body.crsf_port, telemetryPort:req.body.telemetry_port, videoUrl:req.body.video_url });
  go(res);
});
app.post('/slaves/:id/delete',(req,res)=>{ db.prepare('DELETE FROM slaves WHERE id=?').run(req.params.id); go(res); });
app.post('/discover', async (req, res) => {
  const result = await discoverDrones();
  lastDiscovery = { ...result, message: [result.stdout, result.stderr].filter(Boolean).join('\n') };
  go(res);
});
app.post('/discover/pair', async (req, res) => {
  if (!validIp(req.body.ip) || !validId(req.body.id)) return res.status(400).send(page('<p>Некоректний IP або ID.</p>'));
  const result = await pairDrone(req.body.ip, req.body.id);
  lastDiscovery = { ...(lastDiscovery || {}), message: [result.command, result.stdout, result.stderr, result.error].filter(Boolean).join('\n') };
  go(res);
});
app.post('/discover/add', (req, res) => {
  if (!validIp(req.body.ip) || !validId(req.body.id) || !validId(req.body.user_id)) return res.status(400).send(page('<p>Некоректні дані Slave.</p>'));
  const user = db.prepare('SELECT id FROM users WHERE id=?').get(req.body.user_id);
  if (!user) return res.status(404).send(page('<p>Користувача не знайдено.</p>'));
  saveSlave({ id:req.body.id, name:String(req.body.name || `Slave ${req.body.id}`).trim(), ip:req.body.ip });
  db.prepare('INSERT OR IGNORE INTO user_slaves(user_id,slave_id) VALUES(?,?)').run(user.id, req.body.id);
  go(res);
});

export function startAdmin(host, port) {
  return app.listen(port, host, () => console.log(`Admin panel: http://${host}:${port}`));
}
