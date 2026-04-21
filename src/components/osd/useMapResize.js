/**
 * useMapResize
 * Drag-based resize for the minimap panel. The right-bottom corner stays pinned
 * to its current viewport position; dragging the resize handle moves the
 * top-left corner and resizes the panel accordingly. Output is applied via
 * CSS custom properties (--map-panel-width / --map-body-height) on the wrapper.
 *
 * When `droneId` is provided, the chosen size is persisted per drone in a
 * cookie and read back synchronously on mount so the map renders at the saved
 * size before first paint (no flash / jump).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getDronePref, setDronePref } from '../../utils/dronePrefs'

export function useMapResize({
  droneId = null,
  prefKey = 'mapSize',
  minWidth = 380,
  minHeight = 150,
  maxWidthRatio = 0.6,
  maxHeightRatio = 0.6,
} = {}) {
  const wrapperRef = useRef(null)
  const [resizing, setResizing] = useState(false)

  // Lazy initializer: read the saved size from the cookie and clamp it to the
  // current viewport / min constraints so an unusual saved value can't produce
  // a broken layout (e.g. user resized viewport between sessions).
  const [size, setSize] = useState(() => {
    const saved = getDronePref(droneId, prefKey, null)
    if (!saved || typeof saved !== 'object') return null
    const width = Number(saved.width)
    const bodyHeight = Number(saved.bodyHeight)
    if (!Number.isFinite(width) || !Number.isFinite(bodyHeight)) return null
    if (typeof window === 'undefined') {
      return { width, bodyHeight }
    }
    const maxW = window.innerWidth * maxWidthRatio
    const maxH = window.innerHeight * maxHeightRatio
    return {
      width: Math.max(minWidth, Math.min(maxW, width)),
      // Max for body is approximated as `maxH` (we don't yet know the chrome
      // overhead at this point). When the user resizes again, exact overhead
      // is captured and the clamp is applied correctly.
      bodyHeight: Math.max(0, Math.min(maxH, bodyHeight)),
    }
  })
  const overheadRef = useRef({ w: 0, h: 0 })
  const anchorRef = useRef({ right: 0, bottom: 0 })

  // Persist any size change (including the initial restore is a no-op because
  // the value matches what's already stored).
  useEffect(() => {
    if (!droneId || !size) return
    setDronePref(droneId, prefKey, size)
  }, [droneId, prefKey, size])

  const beginResize = useCallback((e) => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const panel = wrapper.querySelector('.map-panel')
    const body = wrapper.querySelector('.map-body')
    if (!panel || !body) return
    e.preventDefault()
    const panelRect = panel.getBoundingClientRect()
    const bodyRect = body.getBoundingClientRect()
    overheadRef.current = {
      w: panelRect.width - bodyRect.width,
      h: panelRect.height - bodyRect.height,
    }
    anchorRef.current = {
      right: panelRect.right,
      bottom: panelRect.bottom,
    }
    setResizing(true)
  }, [])

  useEffect(() => {
    if (!resizing) return

    const onMove = (e) => {
      const targetW = anchorRef.current.right - e.clientX
      const targetH = anchorRef.current.bottom - e.clientY
      const maxW = window.innerWidth * maxWidthRatio
      const maxH = window.innerHeight * maxHeightRatio
      const clampedW = Math.max(minWidth, Math.min(maxW, targetW))
      const clampedH = Math.max(minHeight, Math.min(maxH, targetH))
      const bodyHeight = Math.max(0, clampedH - overheadRef.current.h)
      setSize({ width: clampedW, bodyHeight })
    }
    const onUp = () => setResizing(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing, minWidth, minHeight, maxWidthRatio, maxHeightRatio])

  const style = size
    ? {
        '--map-panel-width': `${size.width}px`,
        '--map-body-height': `${size.bodyHeight}px`,
      }
    : undefined

  const className = `${size ? 'sized' : ''} ${resizing ? 'resizing' : ''}`.trim()

  return { wrapperRef, beginResize, resizing, size, style, className }
}

export default useMapResize
