import { useEffect, useRef, useState } from 'react'

export const SEND_INTERVAL_MS = 20

// EdgeTX Advanced USB joystick mapping measured on the user's TX16S.
// The left horizontal stick, SE and SG are intentionally not used.
const AXES = {
  leftVertical: 2,
  rightHorizontal: 0,
  rightVertical: 3,
  s1: 1,
  s2: 6,
}

const SWITCHES = {
  sf: [0, 1],
  sh: [2, 3],
  sa: [10, 11, 12],
  sb: [7, 8, 9],
  sc: [4, 5, 6],
  sd: [13, 14, 15],
}

const axisToUs = value => Math.round(1500 + Math.max(-1, Math.min(1, value || 0)) * 500)

function switchToUs(gamepad, buttonIndexes) {
  const activePositions = buttonIndexes
    .map((buttonIndex, position) => ({ position, pressed: gamepad.buttons[buttonIndex]?.pressed === true }))
    .filter(({ pressed }) => pressed)

  if (activePositions.length !== 1) return null
  if (buttonIndexes.length === 2) return activePositions[0].position === 0 ? 1000 : 2000
  return [1000, 1500, 2000][activePositions[0].position]
}

export function readChannels(gamepad) {
  if (gamepad.axes.length < 7 || gamepad.buttons.length < 16) return null

  const switchValues = Object.fromEntries(
    Object.entries(SWITCHES).map(([name, buttons]) => [name, switchToUs(gamepad, buttons)]),
  )
  if (Object.values(switchValues).some(value => value === null)) return null

  const channels = Array(16).fill(1500)
  // Slave expects motion on CH1/CH2.
  channels[0] = axisToUs(gamepad.axes[AXES.leftVertical])
  channels[1] = axisToUs(gamepad.axes[AXES.rightHorizontal])
  channels[2] = 1500
  channels[3] = axisToUs(gamepad.axes[AXES.rightVertical])
  channels[4] = axisToUs(gamepad.axes[AXES.s1])
  channels[5] = axisToUs(gamepad.axes[AXES.s2])
  channels[6] = switchValues.sf
  channels[7] = switchValues.sh
  channels[8] = switchValues.sa
  channels[9] = switchValues.sb
  channels[10] = switchValues.sc
  channels[11] = switchValues.sd
  return channels
}

function axisToMappedUs(raw, item) {
  const min = Number(item.min), center = Number(item.center), max = Number(item.max)
  let value = raw >= center
    ? 1500 + 500 * (raw - center) / Math.max(0.001, max - center)
    : 1500 - 500 * (center - raw) / Math.max(0.001, center - min)
  if (item.invert) value = 3000 - value
  return Math.round(Math.max(1000, Math.min(2000, value)))
}

function readMappedChannels(gamepad, mapping) {
  if (!Array.isArray(mapping) || mapping.length !== 16) return readChannels(gamepad)
  const channels = Array(16).fill(1500)
  mapping.forEach((item, index) => {
    const channel = Number.isInteger(item.channel) ? item.channel : index
    if (channel < 0 || channel > 15) return
    if (item.sourceType === 'axis') channels[channel] = axisToMappedUs(gamepad.axes[item.sourceIndex] || 0, item)
    if (item.sourceType === 'button2' || item.sourceType === 'button3') {
      const count = item.sourceType === 'button3' ? 3 : 2
      const active = (item.buttons || []).slice(0, count).findIndex(button => gamepad.buttons[button]?.pressed)
      const values = count === 3 ? [1000, 1500, 2000] : [1000, 2000]
      let value = active >= 0 ? values[active] : 1500
      if (item.invert) value = 3000 - value
      channels[channel] = value
    }
  })
  return channels
}

function readKeyboardChannels(keys) {
  const channels = Array(16).fill(1500)
  if (keys.has('KeyW') || keys.has('ArrowUp')) channels[0] = 2000
  if (keys.has('KeyS') || keys.has('ArrowDown')) channels[0] = 1000
  if (keys.has('KeyA') || keys.has('ArrowLeft')) channels[1] = 1000
  if (keys.has('KeyD') || keys.has('ArrowRight')) channels[1] = 2000
  return channels
}

export function useTx16Control(slaveId, enabled) {
  const [state, setState] = useState('disconnected')
  const [gamepadConnected, setGamepadConnected] = useState(false)
  const socketRef = useRef(null)
  const keysRef = useRef(new Set())
  const [controllerConfig, setControllerConfig] = useState({ mapping: null, mode: 'gamepad', autoConnect: false, slaveId: null })

  useEffect(() => {
    let mounted = true
    const load = () => fetch('/api/auth/controller-settings')
      .then(response => response.json())
      .then(data => { if (mounted && data.config) setControllerConfig({ mapping: Array.isArray(data.config.mapping) ? data.config.mapping : null, mode: data.config.mode || 'gamepad', autoConnect: data.config.autoConnect === true, slaveId: data.config.slaveId ? String(data.config.slaveId) : null }) })
      .catch(() => {})
    load()
    addEventListener('focus', load)
    return () => { mounted = false; removeEventListener('focus', load) }
  }, [])

  useEffect(() => {
    const update = (event, down) => {
      if (!['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)) return
      event.preventDefault()
      down ? keysRef.current.add(event.code) : keysRef.current.delete(event.code)
    }
    const down = event => update(event, true), up = event => update(event, false), clear = () => keysRef.current.clear()
    addEventListener('keydown', down); addEventListener('keyup', up); addEventListener('blur', clear)
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('blur', clear) }
  }, [])

  const effectiveEnabled = enabled || (controllerConfig.autoConnect && controllerConfig.slaveId === String(slaveId))

  useEffect(() => {
    const update = () => setGamepadConnected([...navigator.getGamepads()].some(Boolean))
    update()
    const timer = setInterval(update, 500)
    addEventListener('gamepadconnected', update)
    addEventListener('gamepaddisconnected', update)
    return () => {
      clearInterval(timer)
      removeEventListener('gamepadconnected', update)
      removeEventListener('gamepaddisconnected', update)
    }
  }, [])

  useEffect(() => {
    if (!slaveId || !effectiveEnabled) {
      setState('disconnected')
      return undefined
    }
    let stopped = false
    let timer
    let socket

    const connect = () => {
      const gamepad = [...navigator.getGamepads()].find(Boolean)
      if (controllerConfig.mode !== 'keyboard' && !gamepad) {
        setState('no-gamepad')
        timer = setTimeout(connect, 500)
        return
      }

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${location.host}/control?slave=${encodeURIComponent(slaveId)}`)
      socketRef.current = socket
      setState('connecting')
      socket.onmessage = event => {
        try { if (JSON.parse(event.data)?.type === 'ready') setState('connected') } catch { /* ignore */ }
      }
      socket.onerror = () => setState('error')
      socket.onclose = () => {
        socketRef.current = null
        if (!stopped) {
          setState('disconnected')
          timer = setTimeout(connect, 1000)
        }
      }
    }

    // Give the previous route/socket a moment to release its exclusive lease.
    timer = setTimeout(connect, 150)
    const sender = setInterval(() => {
      const socket = socketRef.current
      const gamepad = [...navigator.getGamepads()].find(Boolean)
      if (socket?.readyState !== WebSocket.OPEN) return
      if (controllerConfig.mode !== 'keyboard' && !gamepad) return
      const channels = controllerConfig.mode === 'keyboard'
        ? readKeyboardChannels(keysRef.current)
        : readMappedChannels(gamepad, controllerConfig.mapping)
      if (!channels) {
        setState('invalid-gamepad-state')
        return
      }
      socket.send(JSON.stringify({ type: 'channels', timestamp: Date.now(), channels }))
    }, SEND_INTERVAL_MS)

    return () => {
      stopped = true
      clearTimeout(timer)
      clearInterval(sender)
      socket?.close(1000, 'Page closed')
    }
  }, [slaveId, effectiveEnabled, controllerConfig])

  return { state, gamepadConnected, controlConnected: state === 'connected' }
}
