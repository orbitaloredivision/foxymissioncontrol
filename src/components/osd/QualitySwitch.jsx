/**
 * Camera quality widget — SD/HD toggle with stream stats.
 */
import { useTranslation } from 'react-i18next'

function formatCamPing(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Math.round(Number(value))} ms`
}

function formatMmtxLoad(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(1)} Mbps`
}

export function QualitySwitch({ isHd, onToggle, camPing, mmtxLoad }) {
  const { t } = useTranslation()

  return (
    <div className="hud-camera">
      <div className="camera-header">{t('cameraWidget.title')}</div>
      <div className="camera-body">
        <div
          className="quality-switch"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggle()
            }
          }}
        >
          <span className={`quality-option ${!isHd ? 'active' : ''}`}>SD</span>
          <div className={`quality-toggle ${isHd ? 'hd' : 'sd'}`}>
            <div className="quality-thumb" />
          </div>
          <span className={`quality-option ${isHd ? 'active' : ''}`}>HD</span>
        </div>
        <div className="camera-stats">
          <div className="camera-stat">
            <span className="camera-stat-label">{t('cameraWidget.ping')}</span>
            <span className="camera-stat-value">{formatCamPing(camPing)}</span>
          </div>
          <div className="camera-stat">
            <span className="camera-stat-label">{t('cameraWidget.mmtx')}</span>
            <span className="camera-stat-value">{formatMmtxLoad(mmtxLoad)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
