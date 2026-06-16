/**
 * Resizable square minimap (MapPanel + drag resize), shared by ground / Volya / FPV OSDs.
 */
import { useTranslation } from 'react-i18next'
import { MapPanel } from './MapPanel'
import { useMapResize } from './useMapResize'

export function ResizableMapPanel({
  telemetry,
  droneId,
  onClose,
  className = '',
}) {
  const { t } = useTranslation()
  const mapResize = useMapResize({ droneId })

  return (
    <div className={`hud-minimap-container ${className}`.trim()}>
      <div
        ref={mapResize.wrapperRef}
        className={`map-panel-wrapper ${mapResize.className}`.trim()}
        style={mapResize.style}
      >
        <button
          type="button"
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
        {onClose && (
          <button
            type="button"
            className="map-close-btn"
            onClick={onClose}
            title={t('osd.hideMap', 'Hide map')}
            aria-label={t('osd.hideMap', 'Hide map')}
          >
            ×
          </button>
        )}
        <MapPanel
          pathHistory={telemetry.pathHistory}
          heading={telemetry.heading}
          lat={telemetry.latitude}
          lng={telemetry.longitude}
          altitude={telemetry.altitude}
        />
      </div>
    </div>
  )
}

export default ResizableMapPanel
