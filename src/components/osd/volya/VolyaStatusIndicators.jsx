/**
 * Volya Status Indicators
 * MOVE and ASSIST status lights for Volya HUD.
 */
import { useTranslation } from 'react-i18next'

function DriveIcon() {
  return (
    <svg viewBox="0 0 28 28" className="volya-status-icon" aria-hidden="true">
      {/* top axle */}
      <rect x="4" y="6" width="20" height="1.8" rx="0.9" className="volya-status-icon-part" />
      {/* bottom axle */}
      <rect x="4" y="20" width="20" height="1.8" rx="0.9" className="volya-status-icon-part" />

      {/* center shaft */}
      <rect x="13.1" y="7.2" width="1.8" height="13.8" rx="0.9" className="volya-status-icon-part" />

      {/* hubs */}
      <circle cx="14" cy="7" r="2.3" className="volya-status-icon-part" />
      <circle cx="14" cy="21" r="2.3" className="volya-status-icon-part" />

      {/* wheels */}
      <rect x="2" y="4" width="4.5" height="5.8" rx="1" className="volya-status-icon-part" />
      <rect x="21.5" y="4" width="4.5" height="5.8" rx="1" className="volya-status-icon-part" />
      <rect x="2" y="18" width="4.5" height="5.8" rx="1" className="volya-status-icon-part" />
      <rect x="21.5" y="18" width="4.5" height="5.8" rx="1" className="volya-status-icon-part" />
    </svg>
  )
}

export function VolyaStatusIndicators({ moving = false, brakeAssist = false, mode }) {
  const { t } = useTranslation()
  const modeDisplay = mode === undefined || mode === null || mode === '' ? '—' : mode
  const movingLabel = t('osd.moving')
  const assistLabel = t('osd.assist')
  const modeLabel = t('osd.mode')
  return (
    <div className="volya-status-indicator">
      <div className="volya-status-left">
        <DriveIcon />
      </div>

      <div className="volya-status-right">
        <div className="volya-status-row">
          <span className="volya-status-label">{movingLabel}</span>
          <span className={`volya-status-dot ${moving ? 'on' : 'off'}`} aria-label={`${movingLabel} ${moving ? 'on' : 'off'}`} />
        </div>

        <div className="volya-status-row">
          <span className="volya-status-label">{assistLabel}</span>
          <span className={`volya-status-dot ${brakeAssist ? 'on' : 'off'}`} aria-label={`${assistLabel} ${brakeAssist ? 'on' : 'off'}`} />
        </div>

        <div className="volya-status-row">
          <span className="volya-status-label">{modeLabel}</span>
          <span className="volya-status-value" aria-label={`${modeLabel} ${modeDisplay}`}>{modeDisplay}</span>
        </div>
      </div>
    </div>
  )
}

export default VolyaStatusIndicators
