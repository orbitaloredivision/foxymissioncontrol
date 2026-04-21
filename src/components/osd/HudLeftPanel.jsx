/**
 * HUD Left Panel Component
 * Contains compass (optional), drone name with type icon, satellites, and quality switch.
 * Compass and satellites each have a hover-only close button; when closed,
 * they collapse to a small restore button styled like the minimap restore button.
 */
import { useTranslation } from 'react-i18next'
import { DRONE_TYPES } from '../../telemetrySchemas'
import { GroundDroneIcon, FpvDroneIcon, VolyaDroneIcon } from './DroneTypeIcons'
import { HudCompass } from './HudCompass'
import { SatelliteIndicator } from './SatelliteIndicator'
import { QualitySwitch } from './QualitySwitch'
import { useDronePref } from '../../hooks/useDronePref'

function CompassRestoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,4 9.5,13 12,11.5 14.5,13" fill="currentColor" stroke="none" />
      <polygon points="12,20 9.5,11 12,12.5 14.5,11" fill="currentColor" opacity="0.35" stroke="none" />
    </svg>
  )
}

function SatellitesRestoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function HudLeftPanel({
  heading,
  direction,
  droneName,
  droneType,
  satellites,
  hasHdStream,
  hdMode,
  onHdToggle,
  showCompass = true,
  extraContent = null,
  droneId = null
}) {
  const { t } = useTranslation()
  const [compassVisible, setCompassVisible] = useDronePref(droneId, 'compassVisible', true)
  const [satellitesVisible, setSatellitesVisible] = useDronePref(droneId, 'satellitesVisible', true)

  const droneTypeIcon =
    droneType === DRONE_TYPES.GENERIC_FPV ? (
      <FpvDroneIcon size={20} active={true} />
    ) : droneType === DRONE_TYPES.VOLYA ? (
      <VolyaDroneIcon size={20} active={true} />
    ) : (
      <GroundDroneIcon size={20} active={true} />
    )

  return (
    <div className="hud-left-panel">
      {showCompass ? (
        <>
          <div className="hud-compass-row">
            {compassVisible ? (
              <HudCompass
                heading={heading}
                direction={direction}
                onClose={() => setCompassVisible(false)}
              />
            ) : (
              <button
                type="button"
                className="hud-widget-restore-btn hud-compass-restore-btn"
                onClick={() => setCompassVisible(true)}
                title={t('osd.showCompass', 'Show compass')}
                aria-label={t('osd.showCompass', 'Show compass')}
              >
                <CompassRestoreIcon />
              </button>
            )}
            <span className="hud-drone-name">
              {droneTypeIcon}
              {droneName.toUpperCase()}
            </span>
          </div>
          {satellitesVisible ? (
            <SatelliteIndicator
              satellites={satellites}
              onClose={() => setSatellitesVisible(false)}
            />
          ) : (
            <button
              type="button"
              className="hud-widget-restore-btn hud-satellites-restore-btn"
              onClick={() => setSatellitesVisible(true)}
              title={t('osd.showSatellites', 'Show satellites')}
              aria-label={t('osd.showSatellites', 'Show satellites')}
            >
              <SatellitesRestoreIcon />
            </button>
          )}
          {hasHdStream && (
            <QualitySwitch isHd={hdMode} onToggle={onHdToggle} />
          )}
          {extraContent}
        </>
      ) : (
        <>
          {/* Flying OSD - no compass, no satellites (satellites in top bar), quality switch in place of satellites */}
          <div className="hud-info-row">
            {hasHdStream && (
              <QualitySwitch isHd={hdMode} onToggle={onHdToggle} />
            )}
            <span className="hud-drone-name">
              {droneTypeIcon}
              {droneName.toUpperCase()}
            </span>
          </div>
          {extraContent}
        </>
      )}
    </div>
  )
}
