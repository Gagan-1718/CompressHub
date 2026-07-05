'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Camera, RefreshCw, SwitchCamera } from 'lucide-react'

/**
 * Live camera capture modal. Uses getUserMedia so it works on both desktop
 * webcams and phone cameras (rear camera by default via facingMode). Snaps a
 * frame to a canvas and hands the parent a PNG File, which flows through the
 * exact same upload pipeline as a picked file.
 *
 * Requires a secure context (HTTPS or localhost) — browsers block camera
 * access otherwise.
 */
// Actionable guidance per failure type. The two common Windows causes are a
// browser permission block and the OS camera-privacy toggle.
const ERROR_INFO = {
  blocked: {
    title: 'Camera access is blocked',
    summary: 'Your browser or Windows is blocking the camera for this site.',
    steps: [
      'Click the camera / lock icon at the left of the address bar → set Camera to "Allow", then Retry.',
      'Windows: Settings → Privacy & security → Camera → turn on "Camera access" and "Let apps access your camera".',
      'Make sure "Let desktop apps access your camera" is also on (Chrome/Edge count as desktop apps).',
    ],
  },
  inuse: {
    title: 'Camera is in use',
    summary: 'Another app is holding the camera.',
    steps: [
      'Close any app using the webcam — Zoom, Teams, Meet, OBS, the Windows Camera app.',
      'Then click Retry.',
    ],
  },
  notfound: {
    title: 'No camera found',
    summary: 'The browser can’t see a camera on this device.',
    steps: [
      'Check the webcam isn’t disabled in Device Manager or covered by a privacy shutter.',
      'If you just plugged one in, reconnect it and Retry.',
    ],
  },
  unsupported: {
    title: 'Camera not supported here',
    summary: 'This browser/context can’t use the camera.',
    steps: [
      'Use Chrome, Edge, or Safari (not an in-app browser like Instagram/WhatsApp).',
      'The page must be on https:// or localhost.',
    ],
  },
  generic: {
    title: 'Could not start the camera',
    summary: 'Something stopped the camera from starting.',
    steps: [
      'Close other apps that might use the webcam, then Retry.',
      'If it persists, restart your browser.',
    ],
  },
}

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const epochRef = useRef(0) // invalidates stale/superseded getUserMedia calls
  // Rear camera on touch devices (phones); front webcam on desktop.
  const [facingMode, setFacingMode] = useState(
    () => (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 'environment' : 'user')
  )
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const startStream = useCallback(async (mode) => {
    const epoch = ++epochRef.current
    setReady(false)
    setError(null)
    stopStream()

    // Try progressively looser constraints: the preferred facing camera
    // (as `ideal`, so it degrades gracefully), then any camera at all. This
    // fixes desktops that have no rear ('environment') camera and drivers
    // that reject over-specific constraints.
    const attempts = [
      { video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: { facingMode: { ideal: mode } }, audio: false },
      { video: true, audio: false },
    ]

    let stream = null
    let lastErr = null
    for (const constraints of attempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        break
      } catch (err) {
        lastErr = err
        // Permission denial won't be fixed by looser constraints — stop early.
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') break
      }
    }

    // A newer start() or an unmount superseded this call — discard its result
    // so React StrictMode's double-invoke (dev) can't leave a dead feed.
    if (epoch !== epochRef.current) {
      if (stream) stream.getTracks().forEach((t) => t.stop())
      return
    }

    if (!stream) {
      const name = lastErr?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('blocked')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('notfound')
      } else if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
        setError('inuse')
      } else {
        setError('generic')
      }
      return
    }

    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      // Don't await/treat play() as fatal — the muted video autoplays, and
      // play() can reject spuriously (autoplay policy, re-render) even when
      // the feed is fine.
      videoRef.current.play().catch(() => {})
    }
    setReady(true)

    // Detect a second camera so we only show the flip button when useful
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1)
    } catch (_) {
      // enumerateDevices is best-effort; ignore failures
    }
  }, [stopStream])

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unsupported')
      return
    }
    startStream(facingMode)
    return () => {
      epochRef.current++ // invalidate any in-flight start
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || !ready) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const filename = `camera-${Date.now()}.png`
        onCapture(new File([blob], filename, { type: 'image/png' }))
        onClose()
      },
      'image/png'
    )
  }

  const flipCamera = () => {
    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close camera"
      >
        <X className="w-6 h-6" />
      </button>

      {error ? (
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <Camera className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white font-semibold mb-1">{ERROR_INFO[error]?.title || 'Camera unavailable'}</p>
          <p className="text-gray-400 text-sm mb-4">{ERROR_INFO[error]?.summary}</p>

          {ERROR_INFO[error]?.steps && (
            <ul className="text-left text-sm text-gray-300 space-y-1.5 mb-6 mx-auto max-w-sm">
              {ERROR_INFO[error].steps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => startStream(facingMode)}
              className="btn btn-primary px-5 py-2.5 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button onClick={onClose} className="btn btn-outline px-5 py-2.5">
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden bg-black ring-1 ring-white/15">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-white/60 animate-spin" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-8 mt-8">
            {hasMultipleCameras ? (
              <button
                onClick={flipCamera}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Switch camera"
              >
                <SwitchCamera className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-12" />
            )}

            <button
              onClick={handleCapture}
              disabled={!ready}
              className="w-18 h-18 p-1 rounded-full bg-white disabled:opacity-40 transition-transform active:scale-95"
              aria-label="Take photo"
            >
              <div className="w-16 h-16 rounded-full border-4 border-black/80 bg-white flex items-center justify-center">
                <Camera className="w-7 h-7 text-black" />
              </div>
            </button>

            <div className="w-12" />
          </div>

          <p className="text-gray-500 text-xs mt-6">
            Your photo is captured on-device and never leaves until you compress it.
          </p>
        </>
      )}
    </div>
  )
}
