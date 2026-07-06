/**
 * RearMirror
 *
 * Shared rear-view mirror column used by ground/Volya OSDs. Encapsulates the
 * fold button (retained but hidden), mirrored camera feed with heading tape
 * overlaid on top (htape-container + indicator only). Armed/self-destruct warning
 * overlays the camera when both fuses are active.
 *
 * The mirror is draggable with edge snapping; position is persisted per drone.
 */
import { useTranslation } from 'react-i18next'
import CameraFeed from '../CameraFeed'
import { HeadingTape } from './HeadingTape'
import { WarningBanner } from './WarningBanner'
import { useDronePref } from '../../hooks/useDronePref'
import { useDraggableMirror } from './useDraggableMirror'

export function RearMirror({
  rearCameraUrl,
  heading,
  showWarning = false,
  selfDestroy = false,
  droneId = null,
}) {
  const { t } = useTranslation()
  const [mirrorVisible, setMirrorVisible] = useDronePref(
    droneId,
    'mirrorVisible',
    true,
  )
  const {
    elementRef,
    dragging,
    beginDrag,
    style,
    hasPosition,
  } = useDraggableMirror({ droneId })

  const showBanner = showWarning || selfDestroy
  const warningVariant = selfDestroy ? 'selfDestroy' : 'armed'

  const columnClassName = [
    'mirror-column',
    hasPosition ? 'mirror-column--positioned' : '',
    dragging ? 'mirror-column--dragging' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={elementRef}
      className={columnClassName}
      style={style}
      onMouseDown={beginDrag}
    >
      {/* Retained for future fold UX — hidden via CSS */}
      <button
        type="button"
        className="mirror-fold-btn mirror-fold-btn--retired"
        onClick={() => setMirrorVisible((v) => !v)}
        tabIndex={-1}
        aria-hidden="true"
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
            {showBanner && (
              <div className="mirror-warning-overlay">
                <WarningBanner variant={warningVariant} />
              </div>
            )}
            <div className="mirror-heading-area">
              <HeadingTape heading={heading} variant="mirror" />
            </div>
            <span className="mirror-label">{t('osd.rear')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RearMirror
