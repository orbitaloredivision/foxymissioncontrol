/**
 * Ground Drone OSD (Foxy / UGV)
 * Full OSD layout for ground vehicles with speedometer, etc.
 * For Foxy: includes fuse switches, rear mirror, armed warning.
 * For UGV: fuse switches, rear mirror, and armed styling are hidden.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DRONE_TYPES } from './telemetrySchemas'
import CameraFeed from './components/CameraFeed'
import {
  HudTopBar,
  HudLeftPanel,
  FuseSwitch,
  Speedometer,
  PowerIndicator,
  MapPanel,
  HeadingTape,
  WarningBanner,
  TelemetryStrip,
  ControlIcon,
  Crosshair
} from './components/osd'

/**
 * Ground Drone OSD Component
 * Main OSD layout for Foxy ground vehicles
 */
export default function GroundDroneOSD({
  telemetry,
  droneName,
  droneType,
  isActive,
  elrsConnected,
  hdMode,
  onHdToggle,
  mainCameraUrl,
  rearCameraUrl,
  hasHdStream,
  onShareClick,
  onControlClick,
  directions,
  directionIndex
}) {
  const { t } = useTranslation()
  const isUgv = droneType === DRONE_TYPES.UGV || droneType === DRONE_TYPES.VOLYA
  const [mapVisible, setMapVisible] = useState(true)
  const [mirrorVisible, setMirrorVisible] = useState(true)
  
  return (
    <>
      {/* Full-screen Front Camera Background */}
      <div className="main-camera-bg">
        <CameraFeed streamUrl={mainCameraUrl} />
      </div>

      {/* HUD Overlay - ugv modifier hides mirror section and repositions heading tape */}
      <div className={`hud-overlay ${isUgv ? 'hud-overlay--ugv' : ''}`}>
        {/* Top Bar */}
        <HudTopBar
          telemetry={telemetry}
          isActive={isActive}
          onShareClick={onShareClick}
          showFailsafe={true}
        />

        {/* Fuse Switches, Mirror & Heading Tape - hidden for UGV */}
        {!isUgv && (
          <div className="hud-mirror-section">
            <FuseSwitch label="F1" armed={telemetry.f1} />
            <div className="mirror-column">
              <button
                className="mirror-fold-btn"
                onClick={() => setMirrorVisible(v => !v)}
              >
                {mirrorVisible ? (
                  <svg viewBox="0 0 24 10" width="28" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4,9 12,3 20,9" />
                    <polyline points="4,6 12,0 20,6" opacity="0.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 10" width="28" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4,1 12,7 20,1" />
                    <polyline points="4,4 12,10 20,4" opacity="0.5" />
                  </svg>
                )}
              </button>
              {mirrorVisible && (
                <div className="rear-mirror">
                  <div className="mirror-frame">
                    <CameraFeed streamUrl={rearCameraUrl} variant="mirror" />
                    <span className="mirror-label">{t('osd.rear')}</span>
                  </div>
                </div>
              )}
              <div className="mirror-heading-area">
                {(telemetry.f1 && telemetry.f2) ? (
                  <WarningBanner />
                ) : (
                  <HeadingTape heading={telemetry.heading} />
                )}
              </div>
            </div>
            <FuseSwitch label="F2" armed={telemetry.f2} />
          </div>
        )}

        {/* UGV: heading tape rendered separately (no mirror section) */}
        {isUgv && (
          <div className="hud-heading-tape">
            <HeadingTape heading={telemetry.heading} />
          </div>
        )}

        {/* Left Panel - Compass & Drone Name & Satellites & Quality */}
        <HudLeftPanel
          heading={telemetry.heading}
          direction={directions[directionIndex]}
          droneName={droneName}
          droneType={droneType}
          satellites={telemetry.satellites}
          hasHdStream={hasHdStream}
          hdMode={hdMode}
          onHdToggle={onHdToggle}
        />

        {/* Right Panel - Speedometer & Power */}
        <div className="hud-right-panel">
          <Speedometer speed={telemetry.speed} dist={telemetry.dist} />
          <PowerIndicator power={telemetry.power} />
        </div>

        {/* Map with integrated Altimeter */}
        <div className="hud-minimap-container">
          {mapVisible ? (
            <div className="map-panel-wrapper">
              <button
                className="map-close-btn"
                onClick={() => setMapVisible(false)}
                title={t('osd.hideMap', 'Hide map')}
              >
                ×
              </button>
              <MapPanel 
                pathHistory={telemetry.pathHistory} 
                heading={telemetry.heading}
                lat={telemetry.latitude}
                lng={telemetry.longitude}
                altitude={telemetry.altitude}
              />
            </div>
          ) : (
            <button
              className="map-restore-btn"
              onClick={() => setMapVisible(true)}
              title={t('osd.showMap', 'Show map')}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>
          )}
        </div>

        {/* Center Crosshair */}
        <Crosshair />

        {/* Control Icon */}
        <ControlIcon
          isActive={isActive}
          elrsConnected={elrsConnected}
          onClick={onControlClick}
        />

        {/* Bottom Telemetry Strip */}
        <div className="hud-bottom-strip">
          <TelemetryStrip telemetry={telemetry} droneType={droneType} />
        </div>
      </div>
    </>
  )
}
