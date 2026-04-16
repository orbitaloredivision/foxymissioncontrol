/**
 * Volya Attitude Dial
 * Three stacked circles for Roll, Pitch, Yaw (yaw is still a placeholder).
 *
 * Demo mode: add `?demoRoll=1` to the URL to drive both roll and pitch with
 * independent smooth random walks between -15 and +15 degrees, and also cycle
 * the pitch movement arrows through forward / stopped / reverse / stopped.
 */
import { useEffect, useRef, useState } from 'react'
import { VolyaDroneIcon, VolyaDroneSideIcon, VolyaDroneTopIcon } from '../DroneTypeIcons'

function isDemoEnabled() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('demoRoll')
}

function useDemoValue(enabled, range = 15) {
  const [value, setValue] = useState(0)
  const targetRef = useRef(0)
  const currentRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    targetRef.current = (Math.random() * 2 - 1) * range

    const targetId = setInterval(() => {
      targetRef.current = (Math.random() * 2 - 1) * range
    }, 1800)

    let rafId
    const tick = () => {
      currentRef.current += (targetRef.current - currentRef.current) * 0.04
      setValue(currentRef.current)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      clearInterval(targetId)
      cancelAnimationFrame(rafId)
    }
  }, [enabled, range])

  return value
}

function useDemoMovement(enabled) {
  const [state, setState] = useState({ moving: false, reverse: false })

  useEffect(() => {
    if (!enabled) {
      setState({ moving: false, reverse: false })
      return
    }

    const phases = [
      { moving: true, reverse: false },
      { moving: false, reverse: false },
      { moving: true, reverse: true },
      { moving: false, reverse: false },
    ]
    let i = 0
    setState(phases[i])
    const id = setInterval(() => {
      i = (i + 1) % phases.length
      setState(phases[i])
    }, 2200)

    return () => clearInterval(id)
  }, [enabled])

  return state
}

function FrontArrow() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
      <path
        d="M 7.5 2 L 2 7 L 7.5 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RearArrow() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
      <path
        d="M 2.5 2 L 8 7 L 2.5 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UpArrow() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path
        d="M 2 7.5 L 7 2 L 12 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownArrow() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path
        d="M 2 2.5 L 7 8 L 12 2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const TICK_DEGREES = [-20, -10, 0, 10, 20]
const CIRCLE_SIZE = 108
const CIRCLE_RADIUS = CIRCLE_SIZE / 2
const TICK_INNER = CIRCLE_RADIUS + 1
const TICK_OUTER = CIRCLE_RADIUS + 6

function buildTick(angleDeg, key) {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = CIRCLE_RADIUS
  const cy = CIRCLE_RADIUS
  return {
    key,
    x1: cx + TICK_INNER * cos,
    y1: cy + TICK_INNER * sin,
    x2: cx + TICK_OUTER * cos,
    y2: cy + TICK_OUTER * sin,
  }
}

function AttitudeTicks({ orientation = 'horizontal' }) {
  const centers = orientation === 'vertical' ? [-90, 90] : [0, 180]
  const ticks = []
  centers.forEach((center) => {
    TICK_DEGREES.forEach((deg) => {
      ticks.push(buildTick(center + deg, `${center}_${deg}`))
    })
  })

  return (
    <svg
      className="volya-attitude-ticks"
      viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
      aria-hidden="true"
    >
      {ticks.map((t) => (
        <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}
    </svg>
  )
}

function AttitudeSlot({ children, ariaLabel, orientation = 'horizontal' }) {
  return (
    <div className="volya-attitude-slot" aria-label={ariaLabel}>
      {children}
      <AttitudeTicks orientation={orientation} />
    </div>
  )
}

function AxisCircle({
  value = 0,
  label = '',
  axisClass = '',
  Icon = VolyaDroneIcon,
  showFrontArrow = false,
  showRearArrow = false,
}) {
  const v = Number.isFinite(value) ? value : 0

  return (
    <div className={`volya-attitude-circle volya-roll-circle ${axisClass}`}>
      <div
        className="volya-roll-ground"
        style={{ transform: `rotate(${v}deg)` }}
        aria-hidden="true"
      />
      <div
        className="volya-roll-line"
        style={{ transform: `rotate(${v}deg)` }}
        aria-hidden="true"
      />
      <div
        className="volya-roll-icon"
        style={{ transform: `translate(-50%, 3px) rotate(${v}deg)` }}
      >
        <span
          className={`volya-movement-arrow front ${showFrontArrow ? 'visible' : ''}`}
          aria-hidden="true"
        >
          <FrontArrow />
        </span>
        <Icon size={51} active={true} />
        <span
          className={`volya-movement-arrow rear ${showRearArrow ? 'visible' : ''}`}
          aria-hidden="true"
        >
          <RearArrow />
        </span>
      </div>
      <div className="volya-roll-readout">
        <span className="volya-roll-value">{v.toFixed(1)}°</span>
        <span className="volya-roll-label">{label}</span>
      </div>
    </div>
  )
}

function YawCircle({
  value = 0,
  label = 'YAW',
  Icon = VolyaDroneTopIcon,
  showFrontArrow = false,
  showRearArrow = false,
}) {
  const v = Number.isFinite(value) ? value : 0

  return (
    <div className="volya-attitude-circle volya-yaw-circle">
      <div
        className="volya-yaw-line"
        style={{ transform: `rotate(${v}deg)` }}
        aria-hidden="true"
      />
      <div
        className="volya-yaw-icon"
        style={{ transform: `translate(-50%, -50%) rotate(${v}deg)` }}
      >
        <span
          className={`volya-movement-arrow up ${showFrontArrow ? 'visible' : ''}`}
          aria-hidden="true"
        >
          <UpArrow />
        </span>
        <Icon size={51} active={true} />
        <span
          className={`volya-movement-arrow down ${showRearArrow ? 'visible' : ''}`}
          aria-hidden="true"
        >
          <DownArrow />
        </span>
      </div>
      <span className="volya-yaw-value">{v.toFixed(0)}°</span>
      <span className="volya-yaw-label">{label}</span>
    </div>
  )
}

export default function VolyaAttitudeDial({
  pitch = 0,
  roll = 0,
  yaw = 0,
  moving = false,
  reverse = false,
}) {
  const demoEnabled = isDemoEnabled()
  const demoRoll = useDemoValue(demoEnabled)
  const demoPitch = useDemoValue(demoEnabled)
  const demoYaw = useDemoValue(demoEnabled, 90)
  const demoMovement = useDemoMovement(demoEnabled)

  const effectiveRoll = demoEnabled ? demoRoll : roll
  const effectivePitch = demoEnabled ? demoPitch : pitch
  const effectiveYaw = demoEnabled ? demoYaw : yaw
  const effectiveMoving = demoEnabled ? demoMovement.moving : Boolean(moving)
  const effectiveReverse = demoEnabled ? demoMovement.reverse : Boolean(reverse)

  const rollValue = Number.isFinite(effectiveRoll) ? effectiveRoll : 0
  const pitchValue = Number.isFinite(effectivePitch) ? effectivePitch : 0
  const yawValue = Number.isFinite(effectiveYaw) ? effectiveYaw : 0

  const showFront = effectiveMoving && !effectiveReverse
  const showRear = effectiveMoving && effectiveReverse

  return (
    <div className="volya-attitude-dial" aria-label="Volya attitude indicators">
      <AttitudeSlot ariaLabel={`Roll ${rollValue.toFixed(1)} degrees`}>
        <AxisCircle value={effectiveRoll} label="ROLL" axisClass="volya-axis-roll" />
      </AttitudeSlot>
      <AttitudeSlot ariaLabel={`Pitch ${pitchValue.toFixed(1)} degrees`}>
        <AxisCircle
          value={effectivePitch}
          label="PITCH"
          axisClass="volya-axis-pitch"
          Icon={VolyaDroneSideIcon}
          showFrontArrow={showRear}
          showRearArrow={showFront}
        />
      </AttitudeSlot>
      <AttitudeSlot ariaLabel={`Yaw ${yawValue.toFixed(0)} degrees`} orientation="vertical">
        <YawCircle
          value={effectiveYaw}
          label="YAW"
          showFrontArrow={showFront}
          showRearArrow={showRear}
        />
      </AttitudeSlot>
    </div>
  )
}
