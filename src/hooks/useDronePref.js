/**
 * useDronePref
 *
 * React hook around the cookie-backed per-drone preference store. The initial
 * state is read synchronously in the useState initializer so the first render
 * already reflects the saved value (no flash / jump on mount). Subsequent
 * changes are written back to the cookie via an effect.
 *
 * If the droneId changes (e.g. user navigates between drones without
 * unmounting), the hook re-reads the value for the new drone.
 */
import { useEffect, useRef, useState } from 'react'
import { getDronePref, setDronePref } from '../utils/dronePrefs'

export function useDronePref(droneId, key, defaultValue) {
  const [value, setValue] = useState(() =>
    getDronePref(droneId, key, defaultValue)
  )
  const identityRef = useRef({ droneId, key })

  useEffect(() => {
    const prev = identityRef.current
    if (prev.droneId !== droneId || prev.key !== key) {
      identityRef.current = { droneId, key }
      setValue(getDronePref(droneId, key, defaultValue))
    }
  }, [droneId, key, defaultValue])

  useEffect(() => {
    if (!droneId) return
    const current = identityRef.current
    if (current.droneId === droneId && current.key === key) {
      setDronePref(droneId, key, value)
    }
  }, [droneId, key, value])

  return [value, setValue]
}

export default useDronePref
