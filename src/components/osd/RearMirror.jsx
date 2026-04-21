/**
 * RearMirror
 *
 * Shared rear-view mirror column used by ground/Volya OSDs. Encapsulates the
 * fold button, mirrored camera feed and the heading tape area below it (which
 * can optionally switch to a WarningBanner for Foxy-style F1+F2 armed state).
 *
 * Visibility of the mirror is persisted per drone in a cookie via useDronePref
 * so it loads at the correct state before first paint.
 */
import { useTranslation } from 'react-i18next'
import CameraFeed from '../CameraFeed'
import { HeadingTape } from './HeadingTape'
import { WarningBanner } from './WarningBanner'
import { useDronePref } from '../../hooks/useDronePref'

export function RearMirror({
  rearCameraUrl,
  heading,
  showWarning = false,
  droneId = null,
}) {
  const { t } = useTranslation()
  const [mirrorVisible, setMirrorVisible] = useDronePref(
    droneId,
    'mirrorVisible',
    true,
  )

  return (
    <div className="mirror-column">
      <button
        className="mirror-fold-btn"
        onClick={() => setMirrorVisible((v) => !v)}
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
        {showWarning ? (
          <WarningBanner />
        ) : (
          <HeadingTape heading={heading} />
        )}
      </div>
    </div>
  )
}

export default RearMirror
