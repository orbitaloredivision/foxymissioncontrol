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
      showFlightMode={true}
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

export function VolyaHudRightPanel({ speed, dist, arm, park, reverse, gear, moving, brakeAssist }) {
  const mainGear = park ? 'P' : reverse ? 'R' : arm ? 'D' : 'P'
  const lowGear = mainGear === 'D' ? (gear ?? 1) : gear

  return (
    <div className="hud-right-panel">
      <Speedometer speed={speed} dist={dist} />
      <VolyaGearIndicator mainGear={mainGear} lowGear={lowGear} />
      <VolyaStatusIndicators moving={moving} brakeAssist={brakeAssist} />
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

  return (
    <div className="hud-minimap-container volya-minimap">
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
  )
}

export function VolyaBottomStrip({ telemetry, droneType }) {
  return (
    <div className="hud-bottom-strip">
      <TelemetryStrip telemetry={telemetry} droneType={droneType} />
    </div>
  )
}
