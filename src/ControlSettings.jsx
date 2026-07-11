import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FoxyLogo from './components/FoxyLogo'
import { SEND_INTERVAL_MS } from './hooks/useTx16Control'
import './ControlSettings.css'

const STORAGE_KEY = 'master-gamepad-mapping-v1'
const neutral = () => Array(16).fill(1500)
const defaultMap = () => Array.from({ length: 16 }, (_, channel) => ({
  channel,
  sourceType: channel < 2 ? 'axis' : 'none',
  sourceIndex: channel === 0 ? 2 : channel === 1 ? 0 : 0,
  min: -1,
  center: 0,
  max: 1,
  invert: false,
  buttons: [],
}))

function loadMap() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(value) && value.length === 16 ? value : defaultMap()
  } catch { return defaultMap() }
}

function axisToUs(raw, item) {
  const min = Number(item.min), center = Number(item.center), max = Number(item.max)
  let value
  if (raw >= center) value = 1500 + 500 * (raw - center) / Math.max(0.001, max - center)
  else value = 1500 - 500 * (center - raw) / Math.max(0.001, center - min)
  if (item.invert) value = 3000 - value
  return Math.round(Math.max(1000, Math.min(2000, value)))
}

function mappedChannels(gamepad, mapping) {
  const output = neutral()
  for (const item of mapping) {
    if (item.sourceType === 'axis') output[item.channel] = axisToUs(gamepad.axes[item.sourceIndex] || 0, item)
    if (item.sourceType === 'button2' || item.sourceType === 'button3') {
      const count = item.sourceType === 'button3' ? 3 : 2
      const active = (item.buttons || []).slice(0, count).findIndex(index => gamepad.buttons[index]?.pressed)
      const values = count === 3 ? [1000, 1500, 2000] : [1000, 2000]
      let value = active >= 0 ? values[active] : 1500
      if (item.invert) value = 3000 - value
      output[item.channel] = value
    }
  }
  return output
}

function keyboardChannels(keys) {
  const output = neutral()
  if (keys.has('KeyW') || keys.has('ArrowUp')) output[0] = 2000
  if (keys.has('KeyS') || keys.has('ArrowDown')) output[0] = 1000
  if (keys.has('KeyA') || keys.has('ArrowLeft')) output[1] = 1000
  if (keys.has('KeyD') || keys.has('ArrowRight')) output[1] = 2000
  return output
}

export function ControllerSettingsPanel() {
  const [params, setParams] = useSearchParams()
  const [profiles, setProfiles] = useState({})
  const [slaveId, setSlaveId] = useState(params.get('slave') || '')
  const [mode, setMode] = useState('gamepad')
  const [enabled, setEnabled] = useState(false)
  const [autoConnect, setAutoConnect] = useState(false)
  const [connection, setConnection] = useState('disconnected')
  const [gamepadName, setGamepadName] = useState('Не підключений')
  const [channels, setChannels] = useState(neutral)
  const [mapping, setMapping] = useState(loadMap)
  const [capture, setCapture] = useState(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [saveState, setSaveState] = useState('saved')
  const [calibrating, setCalibrating] = useState(false)
  const calibrationRef = useRef(null)
  const socketRef = useRef(null)
  const keysRef = useRef(new Set())
  const previousInputRef = useRef({ axes: [], buttons: [] })

  useEffect(() => {
    fetch('/api/auth/controller-settings').then(r => r.json()).then(data => {
      const serverConfig = data.success && Array.isArray(data.config?.mapping) ? data.config : null
      if (serverConfig) {
        setMapping(serverConfig.mapping)
        if (serverConfig.mode) setMode(serverConfig.mode)
        if (serverConfig.slaveId) setSlaveId(String(serverConfig.slaveId))
        if (serverConfig.autoConnect === true) { setAutoConnect(true); setEnabled(true) }
      }
      setConfigLoaded(true)
    }).catch(() => setConfigLoaded(true))
  }, [])

  useEffect(() => {
    if (!configLoaded) return undefined
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping))
    setSaveState('saving')
    const timer = setTimeout(() => {
      fetch('/api/auth/controller-settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { mapping, mode, slaveId, autoConnect } })
      }).then(r => { if (!r.ok) throw new Error(); setSaveState('saved') }).catch(() => setSaveState('error'))
    }, 500)
    return () => clearTimeout(timer)
  }, [mapping, mode, slaveId, autoConnect, configLoaded])
  useEffect(() => {
    fetch('/api/profiles').then(r => r.json()).then(data => {
      const own = data.success ? data.profiles || {} : {}
      setProfiles(own)
      if (!slaveId && Object.keys(own)[0]) setSlaveId(Object.keys(own)[0])
    }).catch(() => {})
  }, [])
  useEffect(() => { if (slaveId) setParams({ slave: slaveId }, { replace: true }) }, [slaveId, setParams])

  useEffect(() => {
    const timer = setInterval(() => {
      const gamepad = [...navigator.getGamepads()].find(Boolean)
      setGamepadName(gamepad?.id || 'Не підключений')
      if (!gamepad) return

      if (calibrating && calibrationRef.current) {
        gamepad.axes.forEach((value, index) => {
          calibrationRef.current.min[index] = Math.min(calibrationRef.current.min[index] ?? value, value)
          calibrationRef.current.max[index] = Math.max(calibrationRef.current.max[index] ?? value, value)
        })
      }

      if (capture) {
        const previous = previousInputRef.current
        const axisIndex = gamepad.axes.findIndex((value, index) => Math.abs(value - (previous.axes[index] || 0)) > 0.3)
        const buttonIndex = gamepad.buttons.findIndex((button, index) => button.pressed && !previous.buttons[index])
        if (capture.type === 'axis' && axisIndex >= 0) {
          setMapping(old => old.map((item, index) => index === capture.channel ? { ...item, sourceType: 'axis', sourceIndex: axisIndex } : item))
          setCapture(null)
        } else if (capture.type === 'buttons' && buttonIndex >= 0) {
          const required = capture.count
          setMapping(old => old.map((item, index) => index === capture.channel ? { ...item, buttons: [...(item.buttons || []).slice(0, capture.position), buttonIndex] } : item))
          if (capture.position + 1 >= required) setCapture(null)
          else setCapture({ ...capture, position: capture.position + 1 })
        }
      }
      previousInputRef.current = { axes: [...gamepad.axes], buttons: gamepad.buttons.map(button => button.pressed) }
    }, 50)
    return () => clearInterval(timer)
  }, [capture, calibrating])

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

  useEffect(() => {
    if (!enabled || !slaveId) { setConnection('disconnected'); return undefined }
    let stopped = false, reconnectTimer, socket
    const connect = () => {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${location.host}/control?slave=${encodeURIComponent(slaveId)}`)
      socketRef.current = socket; setConnection('connecting')
      socket.onmessage = event => { try { if (JSON.parse(event.data)?.type === 'ready') setConnection('connected') } catch { /* ignore */ } }
      socket.onerror = () => setConnection('error')
      socket.onclose = event => { socketRef.current = null; setConnection(event.code === 1006 ? 'busy' : 'disconnected'); if (!stopped) reconnectTimer = setTimeout(connect, 1200) }
    }
    connect()
    const sender = setInterval(() => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) return
      const gamepad = [...navigator.getGamepads()].find(Boolean)
      const next = mode === 'keyboard' ? keyboardChannels(keysRef.current) : gamepad ? mappedChannels(gamepad, mapping) : neutral()
      setChannels(next)
      socketRef.current.send(JSON.stringify({ type: 'channels', timestamp: Date.now(), channels: next }))
    }, SEND_INTERVAL_MS)
    return () => {
      stopped = true; clearTimeout(reconnectTimer); clearInterval(sender); keysRef.current.clear()
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'channels', timestamp: Date.now(), channels: neutral() }))
      socket?.close(1000, 'Control closed')
    }
  }, [enabled, slaveId, mode, mapping])

  const beginCalibration = () => {
    const gamepad = [...navigator.getGamepads()].find(Boolean)
    if (!gamepad) return
    calibrationRef.current = { min: [...gamepad.axes], max: [...gamepad.axes], center: [...gamepad.axes] }
    setCalibrating(true)
  }
  const finishCalibration = () => {
    const data = calibrationRef.current
    const gamepad = [...navigator.getGamepads()].find(Boolean)
    if (data && gamepad) data.center = [...gamepad.axes]
    if (data) setMapping(old => old.map(item => item.sourceType === 'axis' ? { ...item, min: data.min[item.sourceIndex] ?? -1, center: data.center[item.sourceIndex] ?? 0, max: data.max[item.sourceIndex] ?? 1 } : item))
    calibrationRef.current = null; setCalibrating(false)
  }
  const updateMap = (index, patch) => setMapping(old => old.map((item, i) => i === index ? { ...item, ...patch } : item))
  const startCapture = (index, item) => {
    const gamepad = [...navigator.getGamepads()].find(Boolean)
    if (gamepad) previousInputRef.current = { axes: [...gamepad.axes], buttons: gamepad.buttons.map(button => button.pressed) }
    if (item.sourceType === 'axis') setCapture({ channel: index, type: 'axis' })
    else if (item.sourceType === 'button2' || item.sourceType === 'button3') {
      updateMap(index, { buttons: [] })
      setCapture({ channel: index, type: 'buttons', count: item.sourceType === 'button3' ? 3 : 2, position: 0 })
    }
  }

  return <div className="control-settings-panel">
    <label>Дрон<select value={slaveId} onChange={event => { setEnabled(false); setSlaveId(event.target.value) }}><option value="">Оберіть дрон</option>{Object.entries(profiles).map(([id,p]) => <option key={id} value={id}>{p.name || `Drone ${id}`}</option>)}</select></label>
    <div className="control-mode-switch"><button className={mode === 'gamepad' ? 'active' : ''} onClick={() => { setEnabled(false); setMode('gamepad') }}>USB-пульт / Gamepad</button><button className={mode === 'keyboard' ? 'active' : ''} onClick={() => { setEnabled(false); setMode('keyboard') }}>Клавіатура</button></div>
    {mode === 'keyboard' ? <div className="keyboard-map"><span>W / ↑<small>Вперед CH1</small></span><span>A / ←<small>Ліворуч CH2</small></span><span>S / ↓<small>Назад CH1</small></span><span>D / →<small>Праворуч CH2</small></span></div> : <>
      <div className="gamepad-info"><b>Пристрій:</b> {gamepadName}</div>
      <div className="calibration-actions"><button onClick={calibrating ? finishCalibration : beginCalibration}>{calibrating ? 'Завершити калібрування' : 'Калібрувати всі осі'}</button><button onClick={() => setMapping(defaultMap())}>Скинути мапінг</button></div>
      {calibrating && <p className="calibration-note">Порухайте всі стіки та потенціометри до крайніх положень, потім відпустіть їх у центр і натисніть «Завершити».</p>}
      <div className="mapping-table"><div className="mapping-head">Канал</div><div className="mapping-head">Джерело</div><div className="mapping-head">Осі / кнопки позицій</div><div className="mapping-head">Інверсія</div><div className="mapping-head">Значення</div>{mapping.map((item,index) => <div className="mapping-row" key={index}>
        <b>CH{index + 1}</b>
        <select value={item.sourceType} onChange={e => updateMap(index,{sourceType:e.target.value,buttons:[]})}><option value="none">Не призначено</option><option value="axis">Вісь</option><option value="button2">Перемикач 2 позиції</option><option value="button3">Перемикач 3 позиції</option></select>
        <button className={capture?.channel === index ? 'capturing' : ''} disabled={item.sourceType === 'none'} onClick={() => capture?.channel === index ? setCapture(null) : startCapture(index,item)}>{capture?.channel === index ? (capture.type === 'axis' ? 'Порухайте віссю…' : `Натисніть позицію ${capture.position + 1}/${capture.count}…`) : item.sourceType === 'axis' ? `Axis ${item.sourceIndex}` : item.sourceType === 'button2' || item.sourceType === 'button3' ? ((item.buttons || []).map((button,i) => `${[1000,1500,2000][item.sourceType === 'button2' && i === 1 ? 2 : i]}: B${button}`).join(' · ') || 'Налаштувати позиції') : '—'}</button>
        <input type="checkbox" checked={item.invert} onChange={e => updateMap(index,{invert:e.target.checked})}/>
        <strong>{channels[index]}</strong>
      </div>)}</div>
    </>}
    <div className={`control-connection ${connection}`}>WebSocket: {connection}</div>
    <label className="autoconnect-option" style={{ display: 'flex', alignItems: 'center', gap: 9 }}><input type="checkbox" checked={autoConnect} onChange={event => setAutoConnect(event.target.checked)}/> Автопідключати WebSocket при відкритті налаштувань</label>
    <button className={`control-enable ${enabled ? 'stop' : ''}`} disabled={!slaveId} onClick={() => setEnabled(v => !v)}>{enabled ? 'ЗУПИНИТИ КЕРУВАННЯ' : 'УВІМКНУТИ КЕРУВАННЯ'}</button>
    <p className={`control-warning ${saveState}`}>Конфігурація: {saveState === 'saving' ? 'зберігається…' : saveState === 'error' ? 'помилка збереження' : 'збережена на сервері'}. Одним дроном може керувати лише одна вкладка.</p>
  </div>
}

export default function ControlSettings() {
  return <div className="control-settings-page"><header className="control-settings-header"><div><FoxyLogo size={32}/><h1>Налаштування пульта</h1></div><Link to="/settings">← Налаштування</Link></header><ControllerSettingsPanel/></div>
}
