/**
 * Volya Gear Indicator
 * Visual automatic-style selector for P/R/D and low gears 3/2/1.
 */
export function VolyaGearIndicator({ mainGear = 'P', lowGear = null }) {
  const mainSlots = ['P', 'R', 'N', 'D']
  const selectableMainSlots = ['P', 'R', 'D']
  const lowSlots = ['1', '2', '3']

  const normalizedMain = selectableMainSlots.includes(mainGear) ? mainGear : 'P'
  const normalizedLow = lowSlots.includes(String(lowGear)) ? String(lowGear) : null
  const knobTopByGear = {
    P: 8,
    R: 48,
    D: 128
  }
  const knobTop = knobTopByGear[normalizedMain] ?? knobTopByGear.P

  return (
    <div className="volya-gear-indicator" aria-label="Volya transmission selector">
      <div className="volya-gear-layout">
        <div className="volya-gear-rail" aria-hidden="true">
          <div
            className="volya-gear-knob"
            style={{ top: `${knobTop}px` }}
            aria-hidden="true"
          >
            <span className="volya-gear-arrow">▶</span>
          </div>
        </div>

        <div className="volya-gear-main">
          {mainSlots.map((slot) => (
            <div
              key={slot}
              className={`volya-gear-slot ${normalizedMain === slot ? 'active' : ''} ${slot === 'N' ? 'disabled' : ''}`}
            >
              <span className="volya-gear-symbol">{slot}</span>
            </div>
          ))}
        </div>

        <div className="volya-gear-low">
          {lowSlots.map((slot) => (
            <div
              key={slot}
              className={`volya-gear-low-slot ${normalizedLow === slot ? 'active' : ''}`}
            >
              {slot}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VolyaGearIndicator
