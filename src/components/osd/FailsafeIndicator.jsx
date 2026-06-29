/**
 * Failsafe Indicator Widget
 * Displays FAIL / SAFE state from telemetry.fs and timer vt (ground drones).
 */
import { useTranslation } from 'react-i18next'

export function getFailsafeMode(fs) {
  const value = Number(fs)
  if (value === 1) return 'backward'
  if (value === 2) return 'forward'
  if (value === 3) return 'stop'
  return 'unknown'
}

export function getVtLabel(vt) {
  if (vt === null || vt === undefined || vt === '') return null
  const value = Number(vt)
  if (Number.isNaN(value)) return null
  if (value === 0) return '5M'
  if (value === 1) return '10M'
  if (value === 2) return '20M'
  if (value === 3) return '30M'
  if (value === 4) return 'RUN'
  return null
}

export function FailsafeIndicator({ fs = 0, vt }) {
  const { t } = useTranslation()
  const mode = getFailsafeMode(fs)
  const mappedVt = getVtLabel(vt)
  const vtLabel = mappedVt ?? t('failsafe.na')

  return (
    <div className="hud-failsafe">
      <div className="failsafe-header">{t('failsafe.title')}</div>
      <div className={`failsafe-status failsafe-status--${mode}`}>
        <span className="failsafe-value">{t(`failsafe.${mode}`)}</span>
        <hr className="failsafe-divider" aria-hidden="true" />
        <span className={`failsafe-vt-value${mappedVt === null ? ' failsafe-vt-value--na' : ''}`}>
          {vtLabel}
        </span>
      </div>
    </div>
  )
}
