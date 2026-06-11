/**
 * Fetches the installed app version from the backend health endpoint.
 * The server reads package.json at runtime, so this always reflects the
 * deployed build — not a hardcoded frontend string.
 */
import { useEffect, useState } from 'react'
import config from '../config'

const API_BASE_URL = config.apiUrl

export function formatAppVersion(version) {
  if (!version) return null
  return version.startsWith('v') ? version : `v${version}`
}

export function useAppVersion() {
  const [version, setVersion] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.version) {
          setVersion(data.version)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return {
    version,
    versionLabel: formatAppVersion(version),
  }
}
