/**
 * Warning Banner Component
 * Displayed when both fuses are armed or self-destruct (sd) is active.
 */
import { useTranslation } from 'react-i18next'

export function WarningBanner({ variant = 'armed' }) {
  const { t } = useTranslation()
  const isSelfDestroy = variant === 'selfDestroy'
  const subtextKey = isSelfDestroy ? 'osd.selfDestroy' : 'osd.armed'

  return (
    <div className="warning-banner">
      <div className="warning-chevrons left">
        <span>◀</span>
        <span>◀</span>
        <span>◀</span>
      </div>
      <div className="warning-center">
        <div className="warning-frame">
          <span className="warning-icon">⚠</span>
          <span className="warning-text">{t('osd.warning')}</span>
          <span className="warning-icon">⚠</span>
        </div>
        <div className={`warning-subtext${isSelfDestroy ? ' warning-subtext--self-destroy' : ''}`}>
          {t(subtextKey)}
        </div>
      </div>
      <div className="warning-chevrons right">
        <span>▶</span>
        <span>▶</span>
        <span>▶</span>
      </div>
    </div>
  )
}
