/** FPV map display modes cycled by the MAP button in the bottom strip. */
export const FPV_MAP_MODES = ['hidden', 'blot', 'panel']

export function cycleFpvMapMode(current) {
  const idx = FPV_MAP_MODES.indexOf(current)
  const next = idx === -1 ? 0 : (idx + 1) % FPV_MAP_MODES.length
  return FPV_MAP_MODES[next]
}

export function isFpvMapVisible(mapMode) {
  return mapMode !== 'hidden'
}
