/**
 * Fuses Indicator Widget (Foxy)
 * Groups F1/F2 fuse switches in a failsafe-style HUD panel.
 */
import { useTranslation } from 'react-i18next'
import { FuseSwitch } from './FuseSwitch'

export function FusesIndicator({ f1 = false, f2 = false }) {
  const { t } = useTranslation()

  return (
    <div className="hud-fuses">
      <div className="fuses-header">{t('fuses.title')}</div>
      <div className="fuses-body">
        <FuseSwitch label="F1" armed={f1} />
        <FuseSwitch label="F2" armed={f2} />
      </div>
    </div>
  )
}
