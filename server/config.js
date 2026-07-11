// Server Configuration
// Edit these values for your environment

export const config = {
  // Path to SQLite telemetry database
  dbPath: process.env.TELEMETRY_DB_PATH || '/home/orangepi/code/telemetry.db',
  
  // Path to drone scripts folder (discover.sh, pair.sh)
  scriptsPath: process.env.SCRIPTS_PATH || '/home/orangepi/code',
  
  // Path to mediamtx config folder
  mediamtxPath: process.env.MEDIAMTX_PATH || '/home/orangepi/mmtx',
  
  // Server port
  port: process.env.SERVER_PORT || 3001,
  
  // CORS origin (frontend URL)
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  ,
  // Multi-user database and local-only admin panel
  usersDbPath: process.env.USERS_DB_PATH || '/home/orangepi/guidashboard/users.db',
  sessionHours: Number(process.env.SESSION_HOURS || 12),
  adminHost: process.env.ADMIN_HOST || '127.0.0.1',
  adminPort: Number(process.env.ADMIN_PORT || 3002),
  frontendPath: process.env.FRONTEND_PATH || '/var/www/html'
  ,
  wireguardPeersPath: process.env.WIREGUARD_PEERS_PATH || '/home/orangepi/guidashboard/wireguard-peers.json',
  wireguardPublicKeyPath: process.env.WIREGUARD_PUBLIC_KEY_PATH || '/home/orangepi/guidashboard/master-wg-public.key',
  wireguardApplyScript: process.env.WIREGUARD_APPLY_SCRIPT || '/usr/local/sbin/master-wg-sync',
  wireguardMasterAddress: process.env.WIREGUARD_MASTER_ADDRESS || '10.77.0.1/16'
};


