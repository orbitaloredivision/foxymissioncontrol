/**
 * Volya Status Indicators
 * MOVE and ASSIST status lights for Volya HUD.
 */

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

export function VolyaStatusIndicators({ moving = false, brakeAssist = false }) {
  return (
    <div className="volya-status-indicator">
      <div className="volya-status-left">
        <DriveIcon />
      </div>

      <div className="volya-status-right">
        <div className="volya-status-row">
          <span className="volya-status-label">MOVING</span>
          <span className={`volya-status-dot ${moving ? 'on' : 'off'}`} aria-label={`MOVING ${moving ? 'on' : 'off'}`} />
        </div>

        <div className="volya-status-row">
          <span className="volya-status-label">ASSIST</span>
          <span className={`volya-status-dot ${brakeAssist ? 'on' : 'off'}`} aria-label={`ASSIST ${brakeAssist ? 'on' : 'off'}`} />
        </div>
      </div>
    </div>
  )
}

export default VolyaStatusIndicators
