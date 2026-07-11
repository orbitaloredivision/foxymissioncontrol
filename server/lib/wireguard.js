import fs from 'fs';
import { execFileSync } from 'child_process';
import { config } from '../config.js';
import { getUsersDb } from './userDatabase.js';

const KEY_RE = /^[A-Za-z0-9+/]{42,43}=$/;
const ENDPOINT_RE = /^(?:[A-Za-z0-9.-]+|\[[0-9A-Fa-f:]+\]):([1-9][0-9]{0,4})$/;

function normalizeEndpoint(value) {
  const endpoint = String(value || '').trim();
  if (!endpoint) return '';
  if (/^[A-Za-z0-9.-]+$/.test(endpoint)) return `${endpoint}:51820`;
  return endpoint;
}

function allocateAddress(db) {
  const used = new Set(db.prepare('SELECT wg_address FROM slaves WHERE wg_address IS NOT NULL').all().map(r => r.wg_address));
  for (let n = 2; n < 65535; n += 1) {
    const address = `10.77.${Math.floor(n / 256)}.${n % 256}/32`;
    if (!used.has(address)) return address;
  }
  throw new Error('WireGuard address pool is exhausted');
}

function syncWithRollback(db, previous) {
  try {
    syncWireGuard();
  } catch (error) {
    db.prepare(`UPDATE slaves SET wg_enabled=?,wg_address=?,wg_endpoint=?,wg_public_key=?,wg_routed_subnet=?,wg_keepalive=? WHERE id=?`)
      .run(previous.wg_enabled, previous.wg_address, previous.wg_endpoint, previous.wg_public_key,
        previous.wg_routed_subnet, previous.wg_keepalive, previous.id);
    try { syncWireGuard(); } catch { /* preserve the original apply error */ }
    throw error;
  }
}

export function masterPublicKey() {
  try { return fs.readFileSync(config.wireguardPublicKeyPath, 'utf8').trim(); }
  catch { return ''; }
}

export function configureSlaveWireGuard(slaveId, input = {}) {
  const db = getUsersDb();
  const slave = db.prepare('SELECT * FROM slaves WHERE id=?').get(slaveId);
  if (!slave) throw new Error('Slave not found');
  const enabled = input.enabled === true;
  const endpoint = normalizeEndpoint(input.endpoint || input.serverEndpoint);
  const publicKey = String(input.publicKey || input.clientPublicKey || '').trim();
  const routedSubnet = String(input.routedSubnet || input.allowedIps || '').trim();
  const keepalive = Math.max(0, Math.min(65535, Number(input.persistentKeepalive) || 25));
  if (!enabled) {
    db.prepare(`UPDATE slaves SET wg_enabled=0,wg_endpoint=?,wg_public_key=?,wg_routed_subnet=?,wg_keepalive=? WHERE id=?`)
      .run(endpoint || slave.wg_endpoint || null, publicKey || slave.wg_public_key || null,
        routedSubnet || slave.wg_routed_subnet || null, keepalive, slaveId);
    syncWithRollback(db, slave);
    return {
      enabled: false,
      configured: Boolean(endpoint || slave.wg_endpoint) && Boolean(publicKey || slave.wg_public_key),
      clientAddress: slave.wg_address || null,
      endpoint: endpoint || slave.wg_endpoint || '',
      clientPublicKey: publicKey || slave.wg_public_key || '',
      routedSubnet: routedSubnet || slave.wg_routed_subnet || '',
      persistentKeepalive: keepalive,
      masterAddress: config.wireguardMasterAddress,
      masterPublicKey: masterPublicKey()
    };
  }
  if (!ENDPOINT_RE.test(endpoint) || Number(endpoint.match(ENDPOINT_RE)[1]) > 65535) throw new Error('Endpoint must be a public IP/hostname with optional :port');
  if (!KEY_RE.test(publicKey)) throw new Error('Invalid MikroTik WireGuard public key');
  const address = slave.wg_address || allocateAddress(db);
  try {
    db.prepare(`UPDATE slaves SET wg_enabled=1,wg_address=?,wg_endpoint=?,wg_public_key=?,wg_routed_subnet=?,wg_keepalive=? WHERE id=?`)
      .run(address, endpoint, publicKey, routedSubnet || null, keepalive, slaveId);
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) throw new Error('WireGuard address, endpoint or public key is already assigned to another Slave');
    throw error;
  }
  syncWithRollback(db, slave);
  return { enabled: true, configured: true, clientAddress: address, endpoint, clientPublicKey: publicKey, routedSubnet, persistentKeepalive: keepalive, masterAddress: config.wireguardMasterAddress, masterPublicKey: masterPublicKey() };
}

export function syncWireGuard() {
  const db = getUsersDb();
  const peers = db.prepare(`SELECT id,wg_address,wg_endpoint,wg_public_key,wg_routed_subnet,wg_keepalive FROM slaves WHERE wg_enabled=1 ORDER BY id`).all();
  const payload = { interface: 'wg0', masterAddress: config.wireguardMasterAddress, peers };
  const temp = `${config.wireguardPeersPath}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(payload, null, 2), { mode: 0o600 });
  fs.renameSync(temp, config.wireguardPeersPath);
  execFileSync('sudo', [config.wireguardApplyScript], { timeout: 10000, stdio: 'pipe' });
}
