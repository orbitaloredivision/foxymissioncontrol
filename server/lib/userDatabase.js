import Database from 'better-sqlite3';
import crypto from 'crypto';
import { config } from '../config.js';

const db = new Database(config.usersDbPath, { timeout: 5000 });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS slaves (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    crsf_port INTEGER NOT NULL DEFAULT 1091,
    telemetry_port INTEGER NOT NULL DEFAULT 1091,
    video_url TEXT,
    last_seen INTEGER
  );
  CREATE TABLE IF NOT EXISTS user_slaves (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slave_id INTEGER NOT NULL REFERENCES slaves(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, slave_id)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS controller_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    config_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

const slaveColumns = new Set(db.prepare('PRAGMA table_info(slaves)').all().map(c => c.name));
for (const [name, definition] of Object.entries({
  wg_enabled: 'INTEGER NOT NULL DEFAULT 0',
  wg_address: 'TEXT',
  wg_endpoint: 'TEXT',
  wg_public_key: 'TEXT',
  wg_routed_subnet: 'TEXT',
  wg_keepalive: 'INTEGER NOT NULL DEFAULT 25'
})) {
  if (!slaveColumns.has(name)) db.exec(`ALTER TABLE slaves ADD COLUMN ${name} ${definition}`);
}
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_slaves_wg_address ON slaves(wg_address) WHERE wg_address IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_slaves_wg_endpoint ON slaves(wg_endpoint) WHERE wg_endpoint IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_slaves_wg_public_key ON slaves(wg_public_key) WHERE wg_public_key IS NOT NULL;
`);

export function getUsersDb() { return db; }
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + config.sessionHours * 60 * 60 * 1000;
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)')
    .run(hashToken(token), userId, expiresAt);
  return { token, expiresAt };
}
export function deleteSession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token));
}
export function getSessionUser(token) {
  if (!token) return null;
  return db.prepare(`
    SELECT u.id,u.username,u.active,s.expires_at
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.active=1
  `).get(hashToken(token), Date.now()) || null;
}
export function userHasSlave(userId, slaveId) {
  return !!db.prepare('SELECT 1 FROM user_slaves WHERE user_id=? AND slave_id=?')
    .get(userId, String(slaveId));
}
export function getUserSlaves(userId) {
  return db.prepare(`
    SELECT s.* FROM slaves s JOIN user_slaves us ON us.slave_id=s.id
    WHERE us.user_id=? ORDER BY s.name COLLATE NOCASE, s.id
  `).all(userId);
}
export function seedSlavesFromProfiles(profiles) {
  const upsert = db.prepare(`
    INSERT INTO slaves(id,name,ip,crsf_port,telemetry_port,video_url,last_seen)
    VALUES(?,?,?,?,?,?,NULL)
    ON CONFLICT(id) DO UPDATE SET
      name=CASE WHEN slaves.name='' THEN excluded.name ELSE slaves.name END,
      ip=CASE WHEN slaves.ip='' THEN excluded.ip ELSE slaves.ip END,
      video_url=COALESCE(slaves.video_url,excluded.video_url)
  `);
  for (const p of profiles?.drones || []) {
    if (!p?.droneId || !p?.ipAddress) continue;
    upsert.run(String(p.droneId), p.name || `Slave ${p.droneId}`, p.ipAddress, 1091, 1091,
      p.frontCameraUrlHd || p.frontCameraUrl || null);
  }
}
