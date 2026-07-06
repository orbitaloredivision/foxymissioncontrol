#!/bin/bash
# Simulated Foxy drone telemetry for dashboard / OSD testing (Sim Foxy profile).
DRONE_ID=888000001
DB="${TELEMETRY_DB_PATH:-/home/orangepi/code/telemetry.db}"

echo $$ > "/tmp/sim-foxy-${DRONE_ID}.pid"
echo "sim-foxy telemetry started for drone $DRONE_ID (pid $$)"

while true; do
  TS=$(date +%s%3N)
  CAM_PING=$((12 + RANDOM % 28))
  MMTX_LOAD=$(awk -v r=$((RANDOM % 24)) 'BEGIN { printf "%.1f", 1.2 + r / 10 }')

  sqlite3 "$DB" "INSERT INTO telemetry (drone_id, active, timestamp, data) VALUES ($DRONE_ID, 0, $TS, '{\"type\":\"gps\",\"latitude\":50.4501,\"longitude\":30.5234,\"altitude\":120,\"heading\":90,\"groundspeed\":12,\"satellites\":11}');"
  sqlite3 "$DB" "INSERT INTO telemetry (drone_id, active, timestamp, data) VALUES ($DRONE_ID, 0, $TS, '{\"type\":\"batt\",\"batt_v\":24.2}');"
  sqlite3 "$DB" "INSERT INTO telemetry (drone_id, active, timestamp, data) VALUES ($DRONE_ID, 0, $TS, '{\"type\":\"state\",\"speed\":25.0,\"dist\":1500,\"power\":1,\"fs\":0,\"f1\":false,\"f2\":false,\"sd\":false,\"md\":0,\"md_str\":\"MANUAL\",\"cam_ping\":$CAM_PING,\"mmtx_load\":$MMTX_LOAD}');"
  sleep 1
done
