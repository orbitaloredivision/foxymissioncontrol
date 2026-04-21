/**
 * Ground Drone OSD (Foxy / UGV)
 * Full OSD layout for ground vehicles with speedometer, etc.
 * For Foxy: includes fuse switches, rear mirror, armed warning.
 * For UGV: fuse switches, rear mirror, and armed styling are hidden.
 */
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
  TelemetryStrip,
  ControlIcon,
  Crosshair,
  RearMirror
} from './components/osd'
import { useMapResize } from './components/osd/useMapResize'
import { useDronePref } from './hooks/useDronePref'

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
  directionIndex,
  droneId
}) {
  const { t } = useTranslation()
  const isUgv = droneType === DRONE_TYPES.UGV || droneType === DRONE_TYPES.VOLYA
  const [mapVisible, setMapVisible] = useDronePref(droneId, 'mapVisible', true)
  const mapResize = useMapResize({ droneId })
  
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
            <RearMirror
              rearCameraUrl={rearCameraUrl}
              heading={telemetry.heading}
              showWarning={telemetry.f1 && telemetry.f2}
              droneId={droneId}
            />
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
          droneId={droneId}
        />

        {/* Right Panel - Speedometer & Power */}
        <div className="hud-right-panel">
          <Speedometer speed={telemetry.speed} dist={telemetry.dist} />
          <PowerIndicator power={telemetry.power} />
        </div>

        {/* Map with integrated Altimeter */}
        <div className="hud-minimap-container">
          {mapVisible ? (
            <div
              ref={mapResize.wrapperRef}
              className={`map-panel-wrapper ${mapResize.className}`.trim()}
              style={mapResize.style}
            >
              <button
                className="map-resize-btn"
                onMouseDown={mapResize.beginResize}
                title={t('osd.resizeMap', 'Drag to resize map')}
                aria-label={t('osd.resizeMap', 'Drag to resize map')}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,7 3,3 7,3" />
                  <polyline points="13,9 13,13 9,13" />
                  <line x1="3" y1="3" x2="7" y2="7" />
                  <line x1="13" y1="13" x2="9" y2="9" />
                </svg>
              </button>
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
          <TelemetryStrip telemetry={telemetry} droneType={droneType} droneId={droneId} />
        </div>
      </div>
    </>
  )
}
