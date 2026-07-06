/**
 * Drag + snap positioning for the rear-view mirror widget.
 * Position is persisted per drone via dronePrefs (cookie).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getDronePref, setDronePref } from '../../utils/dronePrefs'

const SNAP_THRESHOLD = 16
const PANEL_GAP = 10
const VIEWPORT_MARGIN = 20
const TOP_INSET = 55
const BOTTOM_INSET = 70

const SNAP_SELECTORS = [
  '.hud-left-panel',
  '.hud-right-panel',
  '.hud-minimap-container',
  '.map-panel-wrapper',
  '.hud-fuse-bar',
]

function snapAxis(value, targets) {
  let best = value
  let bestDist = SNAP_THRESHOLD + 1
  for (const target of targets) {
    const dist = Math.abs(value - target)
    if (dist <= SNAP_THRESHOLD && dist < bestDist) {
      best = target
      bestDist = dist
    }
  }
  return best
}

function collectSnapTargets(mirrorEl, width, height) {
  const xTargets = new Set()
  const yTargets = new Set()

  xTargets.add(VIEWPORT_MARGIN)
  xTargets.add(window.innerWidth - width - VIEWPORT_MARGIN)
  yTargets.add(TOP_INSET)
  yTargets.add(window.innerHeight - height - BOTTOM_INSET)

  for (const selector of SNAP_SELECTORS) {
    document.querySelectorAll(selector).forEach((node) => {
      if (mirrorEl?.contains(node) || node.contains(mirrorEl)) return
      const rect = node.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return

      xTargets.add(rect.left)
      xTargets.add(rect.right - width)
      xTargets.add(rect.right + PANEL_GAP)
      xTargets.add(rect.left - width - PANEL_GAP)

      yTargets.add(rect.top)
      yTargets.add(rect.bottom - height)
      yTargets.add(rect.bottom + PANEL_GAP)
      yTargets.add(rect.top - height - PANEL_GAP)
    })
  }

  return { x: [...xTargets], y: [...yTargets] }
}

function clampPosition(x, y, width, height) {
  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN)
  const maxY = Math.max(TOP_INSET, window.innerHeight - height - BOTTOM_INSET)
  return {
    x: Math.round(Math.max(VIEWPORT_MARGIN, Math.min(maxX, x))),
    y: Math.round(Math.max(TOP_INSET, Math.min(maxY, y))),
  }
}

function snapPosition(position, mirrorEl) {
  if (!mirrorEl || !position) return position
  const { width, height } = mirrorEl.getBoundingClientRect()
  const { x: xTargets, y: yTargets } = collectSnapTargets(mirrorEl, width, height)
  const snapped = clampPosition(
    snapAxis(position.x, xTargets),
    snapAxis(position.y, yTargets),
    width,
    height,
  )
  return snapped
}

export function useDraggableMirror({ droneId, prefKey = 'mirrorPosition' } = {}) {
  const elementRef = useRef(null)
  const dragRef = useRef(null)
  const [position, setPosition] = useState(() => {
    const saved = getDronePref(droneId, prefKey, null)
    if (!saved || typeof saved !== 'object') return null
    const x = Number(saved.x)
    const y = Number(saved.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    return { x, y }
  })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!droneId || !position) return
    setDronePref(droneId, prefKey, position)
  }, [droneId, prefKey, position])

  const beginDrag = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()

    const el = elementRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const current = position ?? { x: rect.left, y: rect.top }

    dragRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: current.x,
      originY: current.y,
    }

    if (!position) {
      setPosition({ x: Math.round(rect.left), y: Math.round(rect.top) })
    }

    setDragging(true)
  }, [position])

  useEffect(() => {
    if (!dragging) return undefined

    const onMove = (e) => {
      const drag = dragRef.current
      const el = elementRef.current
      if (!drag || !el) return

      const { width, height } = el.getBoundingClientRect()
      const next = clampPosition(
        drag.originX + (e.clientX - drag.pointerX),
        drag.originY + (e.clientY - drag.pointerY),
        width,
        height,
      )
      setPosition(next)
    }

    const onUp = () => {
      setDragging(false)
      dragRef.current = null
      setPosition((prev) => snapPosition(prev, elementRef.current))
    }

    document.body.classList.add('mirror-drag-active')
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)

    return () => {
      document.body.classList.remove('mirror-drag-active')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  const style = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : undefined

  return {
    elementRef,
    position,
    dragging,
    beginDrag,
    style,
    hasPosition: position != null,
  }
}

export default useDraggableMirror
