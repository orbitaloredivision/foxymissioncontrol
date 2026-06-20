/**
 * Full-screen main camera wrapper. Applies per-drone object-fit preference
 * saved in cookies (same key as CameraFitButton).
 */
import CameraFeed from '../CameraFeed'
import { useCameraObjectFit } from './CameraObjectFitContext'

export function MainCameraBackground({ streamUrl }) {
  const [objectFit] = useCameraObjectFit()
  const fitClass = objectFit === 'fill' ? 'main-camera-bg--fill' : ''

  return (
    <div className={`main-camera-bg${fitClass ? ` ${fitClass}` : ''}`}>
      <CameraFeed streamUrl={streamUrl} />
    </div>
  )
}
