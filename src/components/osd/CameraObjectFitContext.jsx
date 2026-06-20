/**
 * Shared camera object-fit state for the active drone OSD.
 * Button and main camera must read the same hook instance — separate
 * useDronePref calls only sync via cookie on reload, not on click.
 */
import { createContext, useContext } from 'react'
import { useDronePref } from '../../hooks/useDronePref'

export const CAMERA_FIT_KEY = 'cameraObjectFit'

const CameraObjectFitContext = createContext(null)

export function CameraObjectFitProvider({ droneId, children }) {
  const state = useDronePref(droneId, CAMERA_FIT_KEY, 'cover')
  return (
    <CameraObjectFitContext.Provider value={state}>
      {children}
    </CameraObjectFitContext.Provider>
  )
}

export function useCameraObjectFit() {
  const state = useContext(CameraObjectFitContext)
  if (!state) {
    throw new Error('useCameraObjectFit must be used within CameraObjectFitProvider')
  }
  return state
}
