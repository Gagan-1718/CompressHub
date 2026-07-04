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
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [facingMode, setFacingMode] = useState('environment') // rear on phones
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
    setReady(false)
    setError(null)
    stopStream()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setReady(true)

      // Detect a second camera so we only show the flip button when useful
      const devices = await navigator.mediaDevices.enumerateDevices()
      setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Could not start the camera. It may be in use by another app.')
      }
    }
  }, [stopStream])

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support camera access.')
      return
    }
    startStream(facingMode)
    return stopStream
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
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <Camera className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white font-semibold mb-2">Camera unavailable</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => startStream(facingMode)}
              className="btn btn-outline px-5 py-2.5 flex items-center gap-2"
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
