/**
 * Flying Drone OSD (Generic FPV)
 * OSD layout for FPV quadcopters
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CameraFeed from './components/CameraFeed'
import {
  HudTopBar,
  HudLeftPanel,
  FlyingTelemetryStrip,
  MapBlot,
  ResizableMapPanel,
  ControlIcon,
  AirspeedTape,
  AltitudeTape,
  ArtificialHorizon,
  SlipSkidIndicator,
  HeadingCompassArc,
  cycleFpvMapMode,
  isFpvMapVisible,
} from './components/osd'
import { useDronePref } from './hooks/useDronePref'
import { getDronePref } from './utils/dronePrefs'

/**
 * Flying Drone OSD Component
 * OSD layout for FPV drones - uses shared components
 */
export default function FlyingDroneOSD({
  telemetry,
  droneName,
  droneType,
  isActive,
  elrsConnected,
  hdMode,
  onHdToggle,
  mainCameraUrl,
  hasHdStream,
  onShareClick,
  onControlClick,
  directions,
  directionIndex,
  tlogState,
  droneId
}) {
  const { t } = useTranslation()

  const [mapMode, setMapMode] = useDronePref(droneId, 'mapMode', 'blot')
  const [osdVisible, setOsdVisible] = useState(true)

  // Migrate legacy boolean mapVisible cookie to mapMode.
  useEffect(() => {
    if (!droneId) return
    const savedMode = getDronePref(droneId, 'mapMode', null)
    if (savedMode !== null) return
    const legacyVisible = getDronePref(droneId, 'mapVisible', null)
    if (legacyVisible !== null) {
      setMapMode(legacyVisible ? 'blot' : 'hidden')
    }
  }, [droneId, setMapMode])

  const cycleMapMode = () => setMapMode((current) => cycleFpvMapMode(current))

  const mapModeTitle = {
    hidden: t('osd.mapModeHidden', 'Map off — click for masked map'),
    blot: t('osd.mapModeBlot', 'Masked map — click for square map'),
    panel: t('osd.mapModePanel', 'Square map — click to hide map'),
  }[mapMode] || ''

  return (
    <>
      {/* Full-screen Front Camera Background */}
      <div className="main-camera-bg">
        <CameraFeed streamUrl={mainCameraUrl} />
      </div>
      
      {/* Artificial Horizon Overlay - covers camera view, toggles with OSD */}
      <div className={`flying-osd-elements ${osdVisible ? '' : 'hidden'}`}>
        <ArtificialHorizon 
          pitch={telemetry.pitch || 0} 
          roll={telemetry.roll || 0} 
        />
      </div>

      {/* HUD Overlay - FPV specific */}
      <div className="hud-overlay flying-drone-osd">
        {/* Top Bar - shared component, no failsafe for FPV, show flight mode instead */}
        <HudTopBar
          telemetry={telemetry}
          isActive={isActive}
          onShareClick={onShareClick}
          showFailsafe={false}
          showFlightMode={true}
          showStatusMode={false}
        />
        
        {/* Left Panel - Drone Name & Satellites & Quality (no compass for FPV) */}
        <HudLeftPanel
          heading={telemetry.heading}
          direction={directions[directionIndex]}
          droneName={droneName}
          droneType={droneType}
          satellites={telemetry.satellites}
          hasHdStream={hasHdStream}
          hdMode={hdMode}
          onHdToggle={onHdToggle}
          showCompass={false}
          droneId={droneId}
        />
        
        {/* OSD elements - can be toggled off */}
        <div className={`flying-osd-elements ${osdVisible ? '' : 'hidden'}`}>
          {/* Airspeed Tape - Garmin G1000 style (left side) */}
          <AirspeedTape speed={telemetry.groundspeed || 0} unit="KM/H" />
          
          {/* Altitude Tape - Garmin G1000 style (right side) */}
          <AltitudeTape altitude={telemetry.altitude || 0} unit="M" />
          
          {/* Slip-Skid Indicator (Turn Coordinator) - bottom arc with yaw ball */}
          <SlipSkidIndicator yaw={telemetry.yaw || 0} />
          
          {/* Heading Compass Arc - bottom of screen */}
          <HeadingCompassArc heading={telemetry.heading || 0} />
          
          {/* Control Icon */}
          <ControlIcon
            isActive={isActive}
            elrsConnected={elrsConnected}
            onClick={onControlClick}
          />
        </div>
        
        {/* Masked organic map (MapBlot) */}
        <div className={`map-blot-wrapper ${mapMode === 'blot' ? 'visible' : 'hidden'}`}>
          <MapBlot 
            pathHistory={telemetry.pathHistory} 
            heading={telemetry.heading}
            lat={telemetry.latitude}
            lng={telemetry.longitude}
          />
        </div>

        {/* Square resizable map (same as Volya / Foxy ground) */}
        {mapMode === 'panel' && (
          <ResizableMapPanel
            telemetry={telemetry}
            droneId={droneId}
            onClose={() => setMapMode('hidden')}
            className="fpv-minimap"
          />
        )}
        
        {/* Bottom Telemetry Strip - FPV version with integrated telemetry log */}
        <div className="hud-bottom-strip">
          <FlyingTelemetryStrip 
            telemetry={telemetry} 
            droneType={droneType} 
            droneId={droneId}
            tlogState={tlogState}
            mapMode={mapMode}
            mapVisible={isFpvMapVisible(mapMode)}
            osdVisible={osdVisible}
            onMapCycle={cycleMapMode}
            mapModeTitle={mapModeTitle}
            onOsdToggle={() => setOsdVisible(!osdVisible)}
          />
        </div>
      </div>
    </>
  )
}
