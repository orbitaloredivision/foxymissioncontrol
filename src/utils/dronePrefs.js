/**
 * Per-drone UI preference storage.
 *
 * Persists widget visibility / collapsed flags in a cookie that is scoped
 * to a single drone id. All state is kept in one JSON blob per drone so we
 * can read it synchronously during a component's lazy useState initializer,
 * which lets the first render already reflect the saved state and avoids
 * layout jumps on the drone screen.
 *
 * Cookie name format: `drone_prefs_<droneId>`
 * Cookie value: `encodeURIComponent(JSON.stringify({ [key]: value, ... }))`
 */

const COOKIE_PREFIX = 'drone_prefs_'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year

function readCookie(name) {
  if (typeof document === 'undefined') return null
  const pair = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
  if (!pair) return null
  try {
    return decodeURIComponent(pair.slice(name.length + 1))
  } catch {
    return null
  }
}

function writeCookie(name, value) {
  if (typeof document === 'undefined') return
  try {
    const v = encodeURIComponent(value)
    document.cookie = `${name}=${v}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`
  } catch {
    // ignore
  }
}

function readBlob(droneId) {
  if (!droneId) return {}
  const raw = readCookie(`${COOKIE_PREFIX}${droneId}`)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeBlob(droneId, blob) {
  if (!droneId) return
  try {
    writeCookie(`${COOKIE_PREFIX}${droneId}`, JSON.stringify(blob))
  } catch {
    // ignore
  }
}

/**
 * Synchronously read a saved preference for a drone. Returns `defaultValue`
 * when the drone id is missing or the key has never been written.
 */
export function getDronePref(droneId, key, defaultValue) {
  if (!droneId) return defaultValue
  const blob = readBlob(droneId)
  if (Object.prototype.hasOwnProperty.call(blob, key)) {
    return blob[key]
  }
  return defaultValue
}

/**
 * Persist a single preference for a drone. Merges into the existing blob so
 * other keys remain untouched.
 */
export function setDronePref(droneId, key, value) {
  if (!droneId) return
  const blob = readBlob(droneId)
  blob[key] = value
  writeBlob(droneId, blob)
}
