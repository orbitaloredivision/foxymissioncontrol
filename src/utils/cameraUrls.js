/**
 * Resolve front-camera WebRTC URLs from a drone profile.
 *
 * Profiles may have SD only, HD only, or both. Callers should not assume
 * frontCameraUrl is always populated when HD is configured separately.
 */

const DEFAULT_FRONT_WHEP = '/webrtc/cam1/whep'
const DEFAULT_FRONT_HD_WHEP = '/webrtc/cam1_hd/whep'

function inferHdFromSdUrl(sdUrl) {
  if (!sdUrl || sdUrl.includes('_hd/')) return null
  const match = sdUrl.match(/^(\/webrtc\/cam[^/]+)(\/whep)$/)
  return match ? `${match[1]}_hd${match[2]}` : null
}

function readSdUrl(profile) {
  return profile?.frontCameraUrl?.trim() || profile?.frontCamera?.webrtcUrl?.trim() || null
}

function readHdUrl(profile) {
  return (
    profile?.frontCameraUrlHd?.trim()
    || profile?.frontCameraHd?.webrtcUrl?.trim()
    || profile?.frontCamera?.webrtcUrlHd?.trim()
    || null
  )
}

export function resolveFrontCameraUrls(profile, options = {}) {
  const { inferHdFromSd = false, useDefaultPair = false } = options

  let sd = readSdUrl(profile)
  let hd = readHdUrl(profile)

  if (inferHdFromSd && sd && !hd) {
    hd = inferHdFromSdUrl(sd)
  }

  if (useDefaultPair && !sd && !hd) {
    sd = DEFAULT_FRONT_WHEP
    hd = DEFAULT_FRONT_HD_WHEP
  }

  return {
    frontCameraUrlSd: sd,
    frontCameraUrlHd: hd,
    hasSdStream: !!sd,
    hasHdStream: !!hd,
  }
}

/** Main camera on the single-drone OSD (respects HD/SD toggle). */
export function getMainCameraUrl(profile, hdMode = true, options) {
  const { frontCameraUrlSd, frontCameraUrlHd, hasHdStream } =
    resolveFrontCameraUrls(profile, options)

  if (hdMode && hasHdStream) return frontCameraUrlHd
  if (frontCameraUrlSd) return frontCameraUrlSd
  if (frontCameraUrlHd) return frontCameraUrlHd
  return DEFAULT_FRONT_WHEP
}

/** Dashboard card preview — best available stream (HD preferred when set). */
export function getPreviewCameraUrl(profile) {
  const { frontCameraUrlSd, frontCameraUrlHd } = resolveFrontCameraUrls(profile)
  return frontCameraUrlHd || frontCameraUrlSd || DEFAULT_FRONT_WHEP
}
