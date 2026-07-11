import dgram from 'dgram';
import { WebSocketServer } from 'ws';
import { parseCookies, SESSION_COOKIE } from '../middleware/auth.js';
import { getSessionUser, getUserSlaves, userHasSlave } from './userDatabase.js';

const CRSF_ADDRESS = 0xc8;
const CRSF_FRAMETYPE_RC_CHANNELS_PACKED = 0x16;
const MASTER_PREFIX = 0x69;
const MAX_INPUT_AGE_MS = 300;
const MIN_PACKET_INTERVAL_MS = 15;
const LEASE_INPUT_TIMEOUT_MS = 1500;

const leases = new Map();
const udp = dgram.createSocket('udp4');

function crc8DvbS2(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc & 0x80) ? ((crc << 1) ^ 0xd5) & 0xff : (crc << 1) & 0xff;
  }
  return crc;
}

function microsecondsToTicks(value) {
  const us = Math.max(988, Math.min(2012, Number(value) || 1500));
  return Math.max(172, Math.min(1811, Math.round((us - 1500) * 8 / 5 + 992)));
}

export function buildMasterRcPacket(channels) {
  const values = Array.from({ length: 16 }, (_, i) => microsecondsToTicks(channels[i]));
  const payload = Buffer.alloc(22);
  let bitOffset = 0;
  for (const value of values) {
    for (let bit = 0; bit < 11; bit += 1) {
      if (value & (1 << bit)) payload[Math.floor(bitOffset / 8)] |= 1 << (bitOffset % 8);
      bitOffset += 1;
    }
  }
  const body = Buffer.concat([Buffer.from([CRSF_FRAMETYPE_RC_CHANNELS_PACKED]), payload]);
  const frame = Buffer.concat([Buffer.from([CRSF_ADDRESS, body.length + 1]), body, Buffer.from([crc8DvbS2(body)])]);
  return Buffer.concat([Buffer.from([MASTER_PREFIX]), frame]);
}

function rejectUpgrade(socket, status, message) {
  socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`);
  socket.destroy();
}

export function attachControlWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });

  server.on('upgrade', (req, socket, head) => {
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { return rejectUpgrade(socket, '400 Bad Request', 'Bad request'); }
    if (url.pathname !== '/control') return rejectUpgrade(socket, '404 Not Found', 'Not found');

    const origin = req.headers.origin;
    try {
      if (!origin || new URL(origin).host !== req.headers.host) return rejectUpgrade(socket, '403 Forbidden', 'Bad origin');
    } catch { return rejectUpgrade(socket, '403 Forbidden', 'Bad origin'); }

    const user = getSessionUser(parseCookies(req)[SESSION_COOKIE]);
    const slaveId = url.searchParams.get('slave');
    if (!user) return rejectUpgrade(socket, '401 Unauthorized', 'Authentication required');
    if (!slaveId || !userHasSlave(user.id, slaveId)) return rejectUpgrade(socket, '403 Forbidden', 'Forbidden');
    if (leases.has(String(slaveId))) return rejectUpgrade(socket, '409 Conflict', 'Slave already controlled');

    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req, { user, slaveId: String(slaveId) }));
  });

  wss.on('connection', (ws, req, context) => {
    const { user, slaveId } = context;
    const slave = getUserSlaves(user.id).find(item => String(item.id) === slaveId);
    if (!slave) return ws.close(1008, 'Forbidden');

    const lease = { ws, userId: user.id, lastInput: Date.now(), lastPacket: 0 };
    leases.set(slaveId, lease);
    ws.send(JSON.stringify({ type: 'ready', slaveId }));

    // A browser tab can disappear without a clean WebSocket close. Do not let
    // such a stale tab lock this Slave forever and force every reconnect to 409.
    const watchdog = setInterval(() => {
      if (leases.get(slaveId) !== lease) return clearInterval(watchdog);
      if (Date.now() - lease.lastInput > LEASE_INPUT_TIMEOUT_MS) {
        leases.delete(slaveId);
        clearInterval(watchdog);
        try { ws.close(4000, 'TX16 input timeout'); } catch { /* already closed */ }
      }
    }, 500);

    ws.on('message', raw => {
      const now = Date.now();
      if (leases.get(slaveId) !== lease || now - lease.lastPacket < MIN_PACKET_INTERVAL_MS) return;
      let message;
      try { message = JSON.parse(raw.toString()); } catch { return; }
      if (message?.type !== 'channels' || !Array.isArray(message.channels) || message.channels.length !== 16) return;
      if (!Number.isFinite(message.timestamp) || Math.abs(now - message.timestamp) > MAX_INPUT_AGE_MS) return;

      const packet = buildMasterRcPacket(message.channels);
      lease.lastInput = now;
      lease.lastPacket = now;
      udp.send(packet, Number(slave.crsf_port || 1091), slave.ip, error => {
        if (error) console.error(`[CONTROL] UDP ${slaveId}:`, error.message);
      });
    });

    const cleanup = () => {
      clearInterval(watchdog);
      if (leases.get(slaveId) === lease) leases.delete(slaveId);
    };
    ws.on('close', cleanup);
    ws.on('error', cleanup);
  });

  return wss;
}
