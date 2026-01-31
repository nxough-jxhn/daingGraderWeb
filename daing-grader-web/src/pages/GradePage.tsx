import React, { useState, useRef } from 'react'
import { analyzeImage } from '../services/api'
import Button from '../components/ui/Button'
import { Upload, Camera, Image as ImageIcon, Loader2 } from 'lucide-react'

const ACCEPT = '.png,.jpg,.jpeg'
const MAX_FILE_MB = 10

export default function GradePage() {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const reset = () => {
    setFile(null)
    setResultUrl(null)
    setError(null)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    reset()
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_FILE_MB} MB`)
      return
    }
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['png', 'jpg', 'jpeg'].includes(ext || '')) {
      setError('Only PNG or JPG images are allowed')
      return
    }
    setFile(f)
  }

  const startCamera = async () => {
    reset()
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      setError('Could not access camera. Allow camera permission or use file upload.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const capturePhoto = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current
      if (!video || !video.videoWidth) {
        reject(new Error('Video not ready'))
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas error'))
        return
      }
      ctx.drawImage(video, 0, 0)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Capture failed'))),
        'image/jpeg',
        0.9
      )
    })
  }

  const submitFile = async (fileToSend: File) => {
    setLoading(true)
    setError(null)
    setResultUrl(null)
    try {
      const blob = await analyzeImage(fileToSend)
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) submitFile(file)
  }

  const handleCaptureSubmit = async () => {
    try {
      const blob = await capturePhoto()
      const f = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      await submitFile(f)
      stopCamera()
    } catch (err: any) {
      setError(err.message || 'Capture failed')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Grade Dried Fish</h1>
        <p className="text-slate-600 mt-1">
          Upload an image (PNG or JPG) or use your camera to take a picture. The system will analyze quality and detect mold.
        </p>
      </div>

      {/* Toggle: Upload vs Camera */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => { setMode('upload'); reset(); stopCamera(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          <Upload className="w-4 h-4" />
          Upload image
        </button>
        <button
          type="button"
          onClick={() => { setMode('camera'); reset(); setFile(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'camera' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          <Camera className="w-4 h-4" />
          Use camera
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {mode === 'upload' && (
        <div className="card max-w-xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload image</h2>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-600 mb-2 block">Choose PNG or JPG (max {MAX_FILE_MB} MB)</span>
              <input
                type="file"
                accept={ACCEPT}
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-medium"
              />
            </label>
            {file && (
              <p className="text-sm text-slate-500">
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <Button type="submit" disabled={!file || loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Analyzing…
                </>
              ) : (
                'Analyze image'
              )}
            </Button>
          </form>
        </div>
      )}

      {mode === 'camera' && (
        <div className="card max-w-xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Use camera</h2>
          <div className="space-y-4">
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!streamRef.current && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 text-white">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-70" />
                    <p className="text-sm">Camera is off</p>
                    <p className="text-xs mt-1">Click &quot;Start camera&quot; to begin</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={startCamera} disabled={!!streamRef.current}>
                Start camera
              </Button>
              <Button type="button" variant="outline" onClick={stopCamera} disabled={!streamRef.current}>
                Stop camera
              </Button>
              <Button
                type="button"
                onClick={handleCaptureSubmit}
                disabled={!streamRef.current || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Analyzing…
                  </>
                ) : (
                  'Capture & analyze'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {(resultUrl || loading) && (
        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Result</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin mr-2" />
              Analyzing image…
            </div>
          ) : resultUrl ? (
            <div className="space-y-2">
              <img src={resultUrl} alt="Analysis result" className="w-full rounded-lg border border-slate-200" />
              <p className="text-sm text-slate-500">Annotated image from the backend (mold detection / quality grading).</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
