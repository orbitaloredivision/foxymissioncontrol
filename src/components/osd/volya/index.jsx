import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CameraFeed from '../../CameraFeed'
import VolyaGearIndicator from './VolyaGearIndicator'
import VolyaStatusIndicators from './VolyaStatusIndicators'
import VolyaAttitudeDial from './VolyaAttitudeDial'
import {
  HudTopBar,
  HudLeftPanel,
  Speedometer,
  Crosshair,
  ControlIcon,
  TelemetryStrip,
  MapPanel
} from '..'
import { useMapResize } from '../useMapResize'

export function VolyaMainCamera({ streamUrl }) {
  return (
    <div className="main-camera-bg">
      <CameraFeed streamUrl={streamUrl} />
    </div>
  )
}

export function VolyaHudTopBar({ telemetry, isActive, onShareClick }) {
  return (
    <HudTopBar
      telemetry={telemetry}
      isActive={isActive}
      onShareClick={onShareClick}
      showFailsafe={false}
      showFlightMode={false}
      showStatusMode={true}
    />
  )
}

export function VolyaHudLeftPanel({
  heading,
  direction,
  droneName,
  droneType,
  satellites,
  hasHdStream,
  hdMode,
  onHdToggle,
  pitch,
  roll,
  yaw,
  moving,
  reverse
}) {
  return (
    <HudLeftPanel
      heading={heading}
      direction={direction}
      droneName={droneName}
      droneType={droneType}
      satellites={satellites}
      hasHdStream={hasHdStream}
      hdMode={hdMode}
      onHdToggle={onHdToggle}
      showCompass={true}
      extraContent={
        <VolyaAttitudeDial
          pitch={pitch}
          roll={roll}
          yaw={yaw}
          moving={moving}
          reverse={reverse}
        />
      }
    />
  )
}

export function VolyaHudRightPanel({ speed, dist, arm, park, reverse, gear, moving, brakeAssist, mode }) {
  let mainGear
  if (park) mainGear = 'P'
  else if (reverse) mainGear = 'R'
  else if (arm) mainGear = 'D'
  else if (!brakeAssist) mainGear = 'N'
  else mainGear = 'P'
  const lowGear = mainGear === 'D' ? (gear ?? 1) : gear

  return (
    <div className="hud-right-panel">
      <Speedometer speed={speed} dist={dist} />
      <VolyaGearIndicator mainGear={mainGear} lowGear={lowGear} />
      <VolyaStatusIndicators moving={moving} brakeAssist={brakeAssist} mode={mode} />
    </div>
  )
}

export function VolyaCrosshair() {
  return <Crosshair />
}

export function VolyaActiveControl({ isActive, elrsConnected, onClick }) {
  return (
    <ControlIcon
      isActive={isActive}
      elrsConnected={elrsConnected}
      onClick={onClick}
    />
  )
}

export function VolyaMiniMap({ telemetry }) {
  const { t } = useTranslation()
  const [mapVisible, setMapVisible] = useState(true)
  const mapResize = useMapResize()

  return (
    <div className="hud-minimap-container volya-minimap">
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
  )
}

export function VolyaBottomStrip({ telemetry, droneType }) {
  return (
    <div className="hud-bottom-strip">
      <TelemetryStrip telemetry={telemetry} droneType={droneType} />
    </div>
  )
}
