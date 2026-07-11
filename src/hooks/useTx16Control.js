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

export function useTx16Control(slaveId, enabled) {
  const [state, setState] = useState('disconnected')
  const [gamepadConnected, setGamepadConnected] = useState(false)
  const socketRef = useRef(null)

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
    if (!slaveId || !enabled) {
      setState('disconnected')
      return undefined
    }
    let stopped = false
    let timer
    let socket

    const connect = () => {
      const gamepad = [...navigator.getGamepads()].find(Boolean)
      if (!gamepad) {
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

    connect()
    const sender = setInterval(() => {
      const socket = socketRef.current
      const gamepad = [...navigator.getGamepads()].find(Boolean)
      if (!gamepad || socket?.readyState !== WebSocket.OPEN) return
      const channels = readChannels(gamepad)
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
  }, [slaveId, enabled])

  return { state, gamepadConnected }
}
