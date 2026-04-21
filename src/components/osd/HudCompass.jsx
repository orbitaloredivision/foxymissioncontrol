/**
 * HUD Compass Component
 * Rotating compass with heading readout. Optional close button shown on hover
 * when `onClose` is provided (parent can hide/restore the widget).
 */
import { useTranslation } from 'react-i18next'

export function HudCompass({ heading, direction, onClose }) {
  const { t } = useTranslation()
  return (
    <div className="hud-compass">
      {onClose && (
        <button
          type="button"
          className="hud-widget-close-btn"
          onClick={onClose}
          title={t('osd.hideCompass', 'Hide compass')}
          aria-label={t('osd.hideCompass', 'Hide compass')}
        >
          ×
        </button>
      )}
      <div className="compass-outer">
        <div className="compass-ring" style={{ transform: `rotate(${-heading}deg)` }}>
          <span className="compass-n">{t('compass.n')}</span>
          <span className="compass-e">{t('compass.e')}</span>
          <span className="compass-s">{t('compass.s')}</span>
          <span className="compass-w">{t('compass.w')}</span>
        </div>
        <div className="compass-pointer">▲</div>
      </div>
      <div className="compass-readout">
        <span className="compass-deg">{heading.toFixed(0)}°</span>
        <span className="compass-dir">{direction}</span>
      </div>
    </div>
  )
}
