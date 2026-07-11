/**
 * Drone discovery and pairing API routes
 * - GET /api/discover - Discover drones on network
 * - POST /api/pair - Pair with a drone
 */
import express from 'express';
import { discoverDrones, pairDrone, runDroneConf } from '../lib/scripts.js';

const router = express.Router();

/**
 * GET /api/discover
 * Discover drones on the network using discover.sh
 */
router.get('/discover', async (req, res) => {
  res.status(403).json({ error: 'Discovery is available only in the local admin panel' });
});

/**
 * POST /api/pair
 * Pair with a drone using pair.sh
 * Body: { ip: string, droneId: string }
 */
router.post('/pair', async (req, res) => {
  res.status(403).json({ error: 'Pairing is available only in the local admin panel' });
});

/**
 * POST /api/drone-conf
 * Run drone_conf.sh to apply IP and CRSF speed changes
 * Body: { oldIp: string, newIp: string, newCrsfSpeed: number|null, newCrsf2Speed: number|null }
 */
router.post('/drone-conf', async (req, res) => {
  const { oldIp, newIp, newCrsfSpeed, newCrsf2Speed } = req.body;
  
  const result = await runDroneConf(oldIp, newIp, newCrsfSpeed, newCrsf2Speed);
  
  let errorMessage = result.scriptError || result.error;
  if (!errorMessage && result.result === false && result.stdout) {
    try {
      const jsonMatch = result.stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && typeof parsed.error === 'string') {
          errorMessage = parsed.error;
        }
      }
    } catch (e) { /* ignore */ }
  }
  
  res.json({
    success: result.success,
    result: result.result,
    errorMessage,
    command: result.command,
    stdout: result.stdout,
    stderr: result.stderr,
    parseError: result.parseError
  });
});

export default router;


