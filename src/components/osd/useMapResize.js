/**
 * useMapResize
 * Drag-based resize for the minimap panel. The right-bottom corner stays pinned
 * to its current viewport position; dragging the resize handle moves the
 * top-left corner and resizes the panel accordingly. Output is applied via
 * CSS custom properties (--map-panel-width / --map-body-height) on the wrapper.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export function useMapResize({
  minWidth = 380,
  minHeight = 150,
  maxWidthRatio = 0.6,
  maxHeightRatio = 0.6,
} = {}) {
  const wrapperRef = useRef(null)
  const [resizing, setResizing] = useState(false)
  const [size, setSize] = useState(null)
  const overheadRef = useRef({ w: 0, h: 0 })
  const anchorRef = useRef({ right: 0, bottom: 0 })

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
      setSize({ width: clampedW, height: clampedH })
    }
    const onUp = () => setResizing(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing, minWidth, minHeight, maxWidthRatio, maxHeightRatio])

  const overhead = overheadRef.current
  const style = size
    ? {
        '--map-panel-width': `${size.width}px`,
        '--map-body-height': `${Math.max(0, size.height - overhead.h)}px`,
      }
    : undefined

  const className = `${size ? 'sized' : ''} ${resizing ? 'resizing' : ''}`.trim()

  return { wrapperRef, beginResize, resizing, size, style, className }
}

export default useMapResize
