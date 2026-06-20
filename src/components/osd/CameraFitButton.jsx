/**
 * Toggle main camera object-fit between cover and fill.
 * Preference is persisted per drone via useDronePref (cookie).
 */
import { useTranslation } from 'react-i18next'
import { useCameraObjectFit } from './CameraObjectFitContext'
import '../ShareInfoModal.css'

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
}

/**
 * Cover: L-brackets at top-right and bottom-left corners, pointing inward.
 */
function CoverFitIcon() {
  return (
    <svg {...iconProps}>
      <path d="M22 2H11" />
      <path d="M22 2V11" />
      <path d="M2 22H13" />
      <path d="M2 22V13" />
    </svg>
  )
}

/**
 * Fill: L-brackets with vertices near center, arms extend to top/right and bottom/left edges.
 * TR — vertical on left, horizontal on bottom (└ opening to top-right).
 * BL — horizontal on top, vertical on right (┐ opening to bottom-left).
 */
function FillFitIcon() {
  return (
    <svg {...iconProps}>
      <path d="M11 11V2" />
      <path d="M11 11H22" />
      <path d="M13 13H2" />
      <path d="M13 13V22" />
    </svg>
  )
}

export function CameraFitButton() {
  const { t } = useTranslation()
  const [objectFit, setObjectFit] = useCameraObjectFit()

  const isFill = objectFit === 'fill'
  const title = isFill
    ? t('cameraFit.switchToCover', 'Switch to cover (crop to fill screen)')
    : t('cameraFit.switchToFill', 'Switch to fill (stretch to screen)')

  const toggle = () => {
    setObjectFit((current) => (current === 'fill' ? 'cover' : 'fill'))
  }

  return (
    <button
      type="button"
      className={`share-btn share-btn-default camera-fit-btn${isFill ? ' camera-fit-btn--fill' : ''}`}
      onClick={toggle}
      title={title}
      aria-pressed={isFill}
      aria-label={title}
    >
      {isFill ? <FillFitIcon /> : <CoverFitIcon />}
    </button>
  )
}
