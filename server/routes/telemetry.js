/**
 * Telemetry API routes
 * - GET /api/telemetry - Get telemetry records
 * - GET /api/drones/active - Get active drone status
 */
import express from 'express';
import fs from 'fs';
import { getDb } from '../lib/database.js';
import { getUserSlaves, userHasSlave } from '../lib/userDatabase.js';

const router = express.Router();
const ACTIVE_FILE_PATH = '/dev/shm/active';

/**
 * GET /api/drones/active
 * Get the current active control status for all drones
 * 
 * EXCLUSIVE ACTIVE CONTROL: Only ONE drone can be active at a time.
 * `/dev/shm/active` is the same authoritative selection used by Master.
 * Control must become active before telemetry, otherwise USB TX16 control and
 * Slave telemetry wait for each other forever.
 */
router.get('/drones/active', (req, res) => {
  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }

  try {
    // Get all drones that have recent telemetry (for reference)
    const allDronesStmt = db.prepare(`
      SELECT drone_id, MAX(timestamp) as lastUpdate
      FROM telemetry
      WHERE ID IN (
        SELECT MAX(ID) FROM (
          SELECT ID, drone_id FROM telemetry ORDER BY ID DESC LIMIT 1000
        ) GROUP BY drone_id
      )
      GROUP BY drone_id
    `);
    const allDrones = allDronesStmt.all();
    
    // Build response: only the drone selected in Master's active file is active.
    const activeDrones = {};
    let currentlyActiveDroneId = null;
    try { currentlyActiveDroneId = fs.readFileSync(ACTIVE_FILE_PATH, 'utf8').trim() || null; }
    catch { /* no drone selected yet */ }

    const allowedSlaves = getUserSlaves(req.user.id);
    const lastUpdates = new Map(allDrones.map(row => [String(row.drone_id), row.lastUpdate]));
    const allowedIds = new Set(allowedSlaves.map(s => String(s.id)));
    allowedSlaves.forEach(slave => {
      const id = String(slave.id);
      activeDrones[id] = {
        active: id === String(currentlyActiveDroneId),
        lastUpdate: lastUpdates.get(id) || null
      };
    });

    res.json({
      success: true,
      activeDrones,
      currentlyActive: allowedIds.has(String(currentlyActiveDroneId)) ? currentlyActiveDroneId : null
    });

  } catch (error) {
    console.error('Query error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/telemetry
 * Get telemetry records newer than the specified ID
 * Query params:
 * - lastId: Return records newer than this ID
 * - limit: Max records to return (default 100)
 * - droneId: Filter by specific drone
 */
router.get('/telemetry', (req, res) => {
  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }

  try {
    const lastId = parseInt(req.query.lastId) || 0;
    const limit = parseInt(req.query.limit) || 100;
    const droneId = req.query.droneId || null;
    if (!droneId) return res.status(400).json({ error: 'droneId is required' });
    if (!userHasSlave(req.user.id, droneId)) return res.status(403).json({ error: 'Forbidden' });

    let rows;
    if (droneId !== null) {
      // Filter by drone ID
      if (lastId > 0) {
        const stmt = db.prepare(`
          SELECT ID, drone_id, timestamp, data 
          FROM telemetry 
          WHERE ID > ? AND drone_id = ?
          ORDER BY ID DESC 
          LIMIT ?
        `);
        rows = stmt.all(lastId, droneId, limit);
      } else {
        const stmt = db.prepare(`
          SELECT ID, drone_id, timestamp, data 
          FROM telemetry 
          WHERE drone_id = ?
          ORDER BY ID DESC 
          LIMIT ?
        `);
        rows = stmt.all(droneId, limit);
      }
    } else {
      // Fetch all drones (original behavior)
      if (lastId > 0) {
        const stmt = db.prepare(`
          SELECT ID, drone_id, timestamp, data 
          FROM telemetry 
          WHERE ID > ? 
          ORDER BY ID DESC 
          LIMIT ?
        `);
        rows = stmt.all(lastId, limit);
      } else {
        const stmt = db.prepare(`
          SELECT ID, drone_id, timestamp, data 
          FROM telemetry 
          ORDER BY ID DESC 
          LIMIT ?
        `);
        rows = stmt.all(limit);
      }
    }

    // Parse JSON data field and format records
    const records = rows.map(row => {
      let parsedData = {};
      try {
        parsedData = JSON.parse(row.data);
      } catch (e) {
        parsedData = { raw: row.data };
      }

      return {
        id: row.ID,
        droneId: row.drone_id,
        timestamp: row.timestamp,
        data: parsedData
      };
    });

    res.json({
      success: true,
      records,
      count: records.length,
      latestId: records.length > 0 ? records[0].id : lastId
    });

  } catch (error) {
    console.error('Query error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
