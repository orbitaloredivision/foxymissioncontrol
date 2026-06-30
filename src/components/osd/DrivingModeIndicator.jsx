/**
 * Driving Mode Indicator Widget
 * Displays current driving mode from telemetry.dm (ground drones).
 */
import { useTranslation } from 'react-i18next'

export function getDrivingMode(dm) {
  if (dm === null || dm === undefined || dm === '') return 'unknown'
  const normalized = String(dm).trim().toUpperCase()
  if (normalized === 'STOP') return 'stop'
  if (normalized === 'PONI') return 'poni'
  if (normalized === 'EKO') return 'eko'
  return 'unknown'
}

export function DrivingModeIndicator({ dm = '' }) {
  const { t } = useTranslation()
  const mode = getDrivingMode(dm)

  return (
    <div className="hud-driving-mode">
      <div className="driving-mode-header">{t('drivingMode.title')}</div>
      <div className={`driving-mode-status driving-mode-status--${mode}`}>
        <span className="driving-mode-value">{t(`drivingMode.${mode}`)}</span>
      </div>
    </div>
  )
}
