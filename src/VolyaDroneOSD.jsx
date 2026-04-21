/**
 * Volya Drone OSD
 * FPV-inspired layout for Volya drones with speedometer-focused right panel.
 */
import {
  VolyaMainCamera,
  VolyaHudTopBar,
  VolyaHudLeftPanel,
  VolyaHudRightPanel,
  VolyaCrosshair,
  VolyaActiveControl,
  VolyaBottomStrip,
  VolyaMiniMap
} from './components/osd/volya'
import { RearMirror } from './components/osd'

export default function VolyaDroneOSD({
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
  return (
    <>
      <VolyaMainCamera streamUrl={mainCameraUrl} />

      <div className="hud-overlay volya-drone-osd">
        <VolyaHudTopBar
          telemetry={telemetry}
          isActive={isActive}
          onShareClick={onShareClick}
        />

        {/* Rear-view mirror + heading tape (shared with Foxy, no fuse switches for Volya) */}
        <div className="hud-mirror-section">
          <RearMirror
            rearCameraUrl={rearCameraUrl}
            heading={telemetry.heading}
            droneId={droneId}
          />
        </div>

        <VolyaHudLeftPanel
          heading={telemetry.heading}
          direction={directions[directionIndex]}
          droneName={droneName}
          droneType={droneType}
          satellites={telemetry.satellites}
          hasHdStream={hasHdStream}
          hdMode={hdMode}
          onHdToggle={onHdToggle}
          pitch={telemetry.pitch}
          roll={telemetry.roll}
          yaw={telemetry.yaw}
          moving={telemetry.moving}
          reverse={telemetry.reverse}
          droneId={droneId}
        />

        <VolyaHudRightPanel
          speed={telemetry.speed}
          dist={telemetry.dist}
          arm={telemetry.arm}
          park={telemetry.park}
          reverse={telemetry.reverse}
          gear={telemetry.gear}
          moving={telemetry.moving}
          brakeAssist={telemetry.brake_assist}
          mode={telemetry.mode}
        />

        <VolyaMiniMap telemetry={telemetry} droneId={droneId} />

        <VolyaCrosshair />

        <VolyaActiveControl
          isActive={isActive}
          elrsConnected={elrsConnected}
          onClick={onControlClick}
        />

        <VolyaBottomStrip telemetry={telemetry} droneType={droneType} droneId={droneId} />
      </div>
    </>
  )
}
