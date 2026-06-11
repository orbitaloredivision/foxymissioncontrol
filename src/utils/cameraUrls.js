/**
 * Resolve front-camera WebRTC URLs from a drone profile.
 *
 * Profiles may have SD only, HD only, or both. Callers should not assume
 * frontCameraUrl is always populated when HD is configured separately.
 */

const DEFAULT_FRONT_WHEP = '/webrtc/cam1/whep'

export function resolveFrontCameraUrls(profile) {
  const sd = profile?.frontCameraUrl?.trim() || null
  const hd = profile?.frontCameraUrlHd?.trim() || null
  return {
    frontCameraUrlSd: sd,
    frontCameraUrlHd: hd,
    hasSdStream: !!sd,
    hasHdStream: !!hd,
  }
}

/** Main camera on the single-drone OSD (respects HD/SD toggle). */
export function getMainCameraUrl(profile, hdMode = true) {
  const { frontCameraUrlSd, frontCameraUrlHd, hasHdStream } =
    resolveFrontCameraUrls(profile)

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
