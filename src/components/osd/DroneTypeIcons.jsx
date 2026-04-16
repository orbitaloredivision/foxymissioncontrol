/**
 * Drone Type Icons
 * SVG icons for different drone types (Ground/FPV/UGV/Volya)
 */

// Ground Drone Icon (for type indicator) - wheels
export function GroundDroneIcon({ size = 24, active = false }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none"
      className={`drone-type-icon ground ${active ? 'active' : ''}`}
    >
      <rect x="8" y="28" width="48" height="20" rx="4" fill="currentColor" opacity="0.3"/>
      <rect x="8" y="28" width="48" height="20" rx="4" stroke="currentColor" strokeWidth="2"/>
      <rect x="4" y="44" width="12" height="8" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="48" y="44" width="12" height="8" rx="2" fill="currentColor" opacity="0.5"/>
      <circle cx="10" cy="52" r="6" fill="currentColor" opacity="0.7"/>
      <circle cx="54" cy="52" r="6" fill="currentColor" opacity="0.7"/>
      <rect x="24" y="20" width="16" height="12" rx="2" fill="currentColor" opacity="0.4"/>
      <circle cx="32" cy="26" r="4" fill="currentColor"/>
      <line x1="16" y1="36" x2="48" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// FPV Drone Icon (for type indicator)
export function FpvDroneIcon({ size = 24, active = false }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none"
      className={`drone-type-icon fpv ${active ? 'active' : ''}`}
    >
      <ellipse cx="32" cy="32" rx="8" ry="6" fill="currentColor" opacity="0.4"/>
      <ellipse cx="32" cy="32" rx="8" ry="6" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="28" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
      <line x1="40" y1="28" x2="52" y2="16" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="36" x2="12" y2="48" stroke="currentColor" strokeWidth="2"/>
      <line x1="40" y1="36" x2="52" y2="48" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="16" r="8" fill="currentColor" opacity="0.3"/>
      <circle cx="52" cy="16" r="8" fill="currentColor" opacity="0.3"/>
      <circle cx="12" cy="48" r="8" fill="currentColor" opacity="0.3"/>
      <circle cx="52" cy="48" r="8" fill="currentColor" opacity="0.3"/>
      <circle cx="12" cy="16" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="52" cy="16" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="48" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="52" cy="48" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="32" cy="30" r="3" fill="currentColor"/>
    </svg>
  )
}

// UGV Icon (Unmanned Ground Vehicle) - tracks, smaller height
export function UgvDroneIcon({ size = 24, active = false }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none"
      className={`drone-type-icon ugv ${active ? 'active' : ''}`}
    >
      {/* Body - shorter than Foxy */}
      <rect x="12" y="30" width="40" height="14" rx="3" fill="currentColor" opacity="0.3"/>
      <rect x="12" y="30" width="40" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
      {/* Left track */}
      <rect x="4" y="36" width="8" height="20" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="4" y="36" width="8" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      {/* Right track */}
      <rect x="52" y="36" width="8" height="20" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="52" y="36" width="8" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      {/* Antenna section */}
      <rect x="26" y="22" width="12" height="10" rx="2" fill="currentColor" opacity="0.4"/>
      <circle cx="32" cy="27" r="3" fill="currentColor"/>
      <line x1="18" y1="34" x2="46" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// Volya Icon - tracked vehicle with arch frame
export function VolyaDroneIcon({ size = 24, active = false }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none"
      className={`drone-type-icon volya ${active ? 'active' : ''}`}
    >
      {/* Arch / upper frame */}
      <path d="M 12,34 L 12,14 Q 12,10 16,10 L 48,10 Q 52,10 52,14 L 52,34" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      {/* Parallel line below arch top, 40% width centered */}
      <line x1="24" y1="13" x2="40" y2="13" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      {/* Body - shifted down */}
      <rect x="12" y="34" width="40" height="14" rx="3" fill="currentColor" opacity="0.3"/>
      <rect x="12" y="34" width="40" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
      {/* Detail line on body */}
      <line x1="18" y1="38" x2="46" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Left track */}
      <rect x="4" y="40" width="8" height="20" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="4" y="40" width="8" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      {/* Right track */}
      <rect x="52" y="40" width="8" height="20" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="52" y="40" width="8" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

// Volya Top Icon - top-down view of tracked vehicle with rotor and track rails
export function VolyaDroneTopIcon({ size = 24, active = false }) {
  const leftTickYs = [14, 20, 26, 32, 38, 44, 50, 56]
  const rightTickYs = leftTickYs
  const grilleXs = [13, 17, 21, 25, 29, 33, 37, 41, 45, 49]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`drone-type-icon volya-top ${active ? 'active' : ''}`}
    >
      {/* Front bumper bar */}
      <rect x="16" y="1" width="32" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
      <rect x="16" y="1" width="32" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" />

      {/* Bumper support pegs */}
      <rect x="22" y="5" width="3" height="3" fill="currentColor" opacity="0.4" />
      <rect x="22" y="5" width="3" height="3" stroke="currentColor" strokeWidth="1" />
      <rect x="39" y="5" width="3" height="3" fill="currentColor" opacity="0.4" />
      <rect x="39" y="5" width="3" height="3" stroke="currentColor" strokeWidth="1" />

      {/* Main chassis body */}
      <rect x="9" y="8" width="46" height="54" rx="4" fill="currentColor" opacity="0.2" />
      <rect x="9" y="8" width="46" height="54" rx="4" stroke="currentColor" strokeWidth="2" />

      {/* Front grille hatching */}
      {grilleXs.map((x) => (
        <line key={`g${x}`} x1={x} y1="9" x2={x} y2="13" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      ))}
      <line x1="10" y1="14" x2="54" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.55" />

      {/* Left track rail */}
      <rect x="2" y="11" width="6" height="49" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="2" y="11" width="6" height="49" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      {leftTickYs.map((y) => (
        <line key={`lt${y}`} x1="2" y1={y} x2="8" y2={y} stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      ))}

      {/* Right track rail */}
      <rect x="56" y="11" width="6" height="49" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="56" y="11" width="6" height="49" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      {rightTickYs.map((y) => (
        <line key={`rt${y}`} x1="56" y1={y} x2="62" y2={y} stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      ))}

      {/* Rotor / propeller enclosure */}
      <rect x="15" y="18" width="34" height="26" rx="3" fill="currentColor" opacity="0.25" />
      <rect x="15" y="18" width="34" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />

      {/* Rotor blades - two crossing tapered ellipses */}
      <g fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
        <ellipse cx="32" cy="31" rx="11" ry="1.7" transform="rotate(-38 32 31)" />
        <ellipse cx="32" cy="31" rx="11" ry="1.7" transform="rotate(38 32 31)" />
      </g>

      {/* Rotor hub */}
      <circle cx="32" cy="31" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="32" cy="31" r="2" stroke="currentColor" strokeWidth="0.9" />

      {/* Rear section dividers */}
      <line x1="11" y1="47" x2="53" y2="47" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
      <line x1="11" y1="56" x2="53" y2="56" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />

      {/* Upper latch/handle */}
      <rect x="28" y="45.5" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.45" />
      <rect x="28" y="45.5" width="8" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" />

      {/* Lower latch/handle */}
      <rect x="28" y="54.5" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.45" />
      <rect x="28" y="54.5" width="8" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

// Volya Side Icon - right-side view of tracked vehicle with periscope mast (rear) and front bumper
export function VolyaDroneSideIcon({ size = 24, active = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`drone-type-icon volya-side ${active ? 'active' : ''}`}
    >
      {/* Periscope / camera head (rear) */}
      <rect x="11" y="4" width="8" height="6" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="11" y="4" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      {/* Mast / pole */}
      <rect x="13" y="10" width="4" height="24" fill="currentColor" opacity="0.4" />
      <rect x="13" y="10" width="4" height="24" stroke="currentColor" strokeWidth="1.5" />
      {/* Raised roof compartment (front half) */}
      <rect x="26" y="28" width="24" height="6" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="26" y="28" width="24" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      {/* Body slab */}
      <rect x="4" y="34" width="50" height="8" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="4" y="34" width="50" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
      {/* Track housing - capsule ends hug the wheels */}
      <rect x="2" y="42" width="54" height="18" rx="9" fill="currentColor" opacity="0.3" />
      <rect x="2" y="42" width="54" height="18" rx="9" stroke="currentColor" strokeWidth="2" />
      {/* Track midline between wheels */}
      <line x1="20" y1="51" x2="44" y2="51" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      {/* Left wheel (rear) */}
      <circle cx="12" cy="51" r="6" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="51" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="51" r="1.6" fill="currentColor" />
      {/* Right wheel (front) */}
      <circle cx="50" cy="51" r="6" fill="currentColor" opacity="0.5" />
      <circle cx="50" cy="51" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="51" r="1.6" fill="currentColor" />

      {/* Bumper support peg (front, connects body to bumper) */}
      <rect x="55" y="35.5" width="3" height="3" fill="currentColor" opacity="0.4" />
      <rect x="55" y="35.5" width="3" height="3" stroke="currentColor" strokeWidth="1" />
      {/* Front bumper bar - square (4x4) on the right (front) of the drone */}
      <rect x="58" y="35" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
      <rect x="58" y="35" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
