import { getDronePref } from '../../utils/dronePrefs'

/** FPV map display modes cycled by the MAP button in the bottom strip. */
export const FPV_MAP_MODES = ['hidden', 'blot', 'panel']

export function getInitialFpvMapMode(droneId) {
  if (!droneId) return 'blot'
  const saved = getDronePref(droneId, 'mapMode', null)
  if (saved && FPV_MAP_MODES.includes(saved)) return saved
  const legacyVisible = getDronePref(droneId, 'mapVisible', null)
  if (legacyVisible === false) return 'hidden'
  if (legacyVisible === true) return 'blot'
  return 'blot'
}

export function getInitialFpvOsdVisible(droneId) {
  if (!droneId) return true
  const saved = getDronePref(droneId, 'osdVisible', null)
  if (typeof saved === 'boolean') return saved
  return true
}

export function cycleFpvMapMode(current) {
  const idx = FPV_MAP_MODES.indexOf(current)
  const next = idx === -1 ? 0 : (idx + 1) % FPV_MAP_MODES.length
  return FPV_MAP_MODES[next]
}

export function isFpvMapVisible(mapMode) {
  return mapMode !== 'hidden'
}
