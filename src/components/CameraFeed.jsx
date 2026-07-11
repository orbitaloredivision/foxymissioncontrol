import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './CameraFeed.css'

// Camera Feed Component - WebRTC player with auto-reconnect via WHEP
function CameraFeed({ streamUrl, variant = "main" }) {
  const { t } = useTranslation()
  const videoRef = useRef(null)
  const pcRef = useRef(null)
  const sessionUrlRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const connectionTimeoutRef = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [hasFrames, setHasFrames] = useState(false) // Track if video actually has visible frames
  const [retryKey, setRetryKey] = useState(0)
  const [hlsFallbackUrl, setHlsFallbackUrl] = useState(null)

  useEffect(() => {
    const match = streamUrl?.match(/^\/webrtc\/([^/]+)\/whep(?:\?.*)?$/)
    const isPublicFunnel = window.location.hostname.endsWith('.ts.net')

    // Funnel proxies HTTPS signaling, but it cannot proxy the UDP media path
    // used by WebRTC. Use same-origin HLS immediately on the public hostname;
    // keep the existing low-latency WebRTC behavior on LAN/local addresses.
    setHlsFallbackUrl(
      isPublicFunnel && match
        ? `/hls/${match[1]}/?controls=false&muted=true&autoplay=true&playsInline=true`
        : null
    )
  }, [streamUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!streamUrl || hlsFallbackUrl) return
    if (!video) return

    let isMounted = true
    let receivedFrames = false

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    // Cleanup previous connection
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    setStatus('connecting')
    setHasFrames(false)

    // Listen for actual video frames
    const handlePlaying = () => {
      // Video is actually playing with frames
      if (isMounted && video.videoWidth > 0 && video.videoHeight > 0) {
        receivedFrames = true
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current)
        setHasFrames(true)
      }
    }
    
    const handleLoadedData = () => {
      // Video has data loaded
      if (isMounted && video.videoWidth > 0) {
        receivedFrames = true
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current)
        setHasFrames(true)
      }
    }

    video.addEventListener('playing', handlePlaying)
    video.addEventListener('loadeddata', handleLoadedData)

    const scheduleRetry = (delay = 3000) => {
      retryTimeoutRef.current = setTimeout(() => {
        if (isMounted) setRetryKey(prev => prev + 1)
      }, delay)
    }

    const switchToHls = () => {
      const match = streamUrl.match(/^\/webrtc\/([^/]+)\/whep(?:\?.*)?$/)
      if (!match || !isMounted) return false
      setStatus('connecting')
      setHlsFallbackUrl(`/hls/${match[1]}/?controls=false&muted=true&autoplay=true&playsInline=true`)
      return true
    }

    // Extract ice-ufrag / ice-pwd from an SDP for trickle PATCH fragments.
    const readIceCreds = (sdp) => ({
      ufrag: (sdp.match(/a=ice-ufrag:(\S+)/) || [])[1] || '',
      pwd: (sdp.match(/a=ice-pwd:(\S+)/) || [])[1] || '',
    })

    const startWebRTC = async () => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        })
        pcRef.current = pc

        pc.ontrack = (event) => {
          if (isMounted) {
            video.srcObject = event.streams[0]
            setStatus('playing')
            // Don't set hasFrames here - wait for actual frames via event listeners
          }
        }

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            if (isMounted) {
              setStatus('reconnecting')
              if (!switchToHls()) scheduleRetry(2000)
            }
          }
        }

        // Add transceivers for receiving video/audio
        pc.addTransceiver('video', { direction: 'recvonly' })
        pc.addTransceiver('audio', { direction: 'recvonly' })

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        const localCreds = readIceCreds(offer.sdp)

        // POST the offer immediately (do not wait for ICE gathering). MediaMTX
        // is ice-lite and needs our candidates delivered via trickle PATCH to
        // the session URL from the Location header. Waiting for gathering and
        // posting a single non-trickle offer fails to form a candidate pair.
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription.sdp
        })

        if (!response.ok) throw new Error('WHEP request failed')

        // Resolve the session resource URL for trickle ICE / teardown.
        const location = response.headers.get('Location') || ''
        let sessionUrl = null
        if (location) {
          try {
            sessionUrl = new URL(location, streamUrl).href
          } catch {
            sessionUrl = location
          }
        }
        sessionUrlRef.current = sessionUrl

        const answerSdp = await response.text()
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

        // WHEP signaling can succeed while ICE media remains unreachable from
        // the public Internet. Fall back to same-origin HTTPS HLS in that case.
        connectionTimeoutRef.current = setTimeout(() => {
          if (!receivedFrames) switchToHls()
        }, 6000)

        // Trickle our ICE candidates to MediaMTX as they are discovered.
        pc.onicecandidate = (event) => {
          if (!event.candidate || !sessionUrl) return
          const frag =
            `a=ice-ufrag:${localCreds.ufrag}\r\n` +
            `a=ice-pwd:${localCreds.pwd}\r\n` +
            `m=video 9 UDP/TLS/RTP/SAVPF 0\r\n` +
            `a=mid:${event.candidate.sdpMid ?? '0'}\r\n` +
            `a=${event.candidate.candidate}\r\n`
          fetch(sessionUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/trickle-ice-sdpfrag' },
            body: frag
          }).catch(() => {})
        }

      } catch (error) {
        console.error('WebRTC error:', error)
        if (isMounted) {
          setStatus('error')
          if (!switchToHls()) scheduleRetry(3000)
        }
      }
    }

    startWebRTC()

    return () => {
      isMounted = false
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('loadeddata', handleLoadedData)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current)
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
      // Release the MediaMTX WHEP reader session so it doesn't linger.
      if (sessionUrlRef.current) {
        fetch(sessionUrlRef.current, { method: 'DELETE' }).catch(() => {})
        sessionUrlRef.current = null
      }
    }
  }, [streamUrl, retryKey, hlsFallbackUrl])

  // Show noise overlay until we have actual video frames
  const showNoise = !hasFrames

  return (
    <div className={`camera-feed camera-${variant}`}>
      {hlsFallbackUrl ? (
        <iframe
          className="camera-video"
          src={hlsFallbackUrl}
          title="HLS camera stream"
          frameBorder="0"
          scrolling="no"
          allow="autoplay; fullscreen"
          onLoad={() => { setStatus('playing'); setHasFrames(true) }}
        />
      ) : (
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          muted
          playsInline
        />
      )}
      {showNoise && (
        <div className="camera-status-overlay">
          <div className="tv-noise"></div>
          <div className="tv-noise-scanlines"></div>
          <div className="status-content">
            {status === 'connecting' && <span className="status-text">◌ {t('camera.connecting')}</span>}
            {status === 'reconnecting' && <span className="status-text">↻ {t('camera.reconnecting')}</span>}
            {status === 'playing' && <span className="status-text">◌ {t('camera.connecting')}</span>}
            {status === 'error' && <span className="status-text error">✕ {t('camera.noSignal')}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default CameraFeed
