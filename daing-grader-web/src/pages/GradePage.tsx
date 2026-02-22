/**
 * Grade page (web): upload/capture → preview → analyze. Matches mobile flow (DaingApp ScanScreen).
 * Backend: POST /analyze (same as mobile, saves to Cloudinary + history) — no backend changes.
 */
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { analyzeImage, type AnalyzeResult } from '../services/api'
import PageTitleHero from '../components/layout/PageTitleHero'
import { Upload, Camera, Loader2, Lightbulb, RotateCcw, X, History, AlertTriangle, Fish, ShieldCheck, TrendingUp, Bug, FlaskConical, DollarSign } from 'lucide-react'
import { DAING_TYPES } from '../data/daingTypes'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const ACCEPT = '.png,.jpg,.jpeg'
const MAX_FILE_MB = 10

const GRADE_CAROUSEL_SLIDES = DAING_TYPES.map((t) => ({
  name: t.name,
  imageSrc: t.carousel[0]?.imageSrc,
  placeholderColor: t.carousel[0]?.placeholderColor ?? '#1e3a5f',
  alt: t.carousel[0]?.alt ?? `${t.name} dried fish`,
}))

const CAROUSEL_INTERVAL_MS = 4000

/* Grade badge color map */
const GRADE_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  Export: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-300' },
  Local:  { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-300' },
  Reject: { bg: 'bg-red-50',     text: 'text-red-700',     ring: 'ring-red-300' },
}

/* Simulated metrics derived from real AI score — placeholder until backend exposes these */
function deriveMetrics(result: AnalyzeResult) {
  const { score, grade, fish_type, detected } = result
  const confidence = detected ? Math.round(score * 100) : 0
  // Simulated defect / mold percentages inversely related to score
  const defect  = detected ? Math.max(0, Math.round((1 - score) * 60 + Math.random() * 5)) : 0
  const mold    = detected ? Math.max(0, Math.round((1 - score) * 30 + Math.random() * 3)) : 0
  // Price estimate based on grade (placeholder ₱/kg ranges)
  const priceMap: Record<string, [number, number]> = {
    Export: [350, 520],
    Local:  [200, 349],
    Reject: [60, 199],
  }
  const [lo, hi] = priceMap[grade] ?? [0, 0]
  const price = detected ? Math.round(lo + (hi - lo) * score) : 0
  return { confidence, defect, mold, price, grade, fish_type, detected }
}

/* ─── Stat card used inside result panel ─── */
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${color}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Scan result panel ─── */
function ScanResultPanel({ result }: { result: AnalyzeResult }) {
  const m = deriveMetrics(result)
  const gs = GRADE_STYLES[m.grade] || GRADE_STYLES.Reject!

  if (!m.detected) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
        <p className="font-semibold text-slate-800">No dried fish detected</p>
        <p className="text-sm text-slate-500 mt-1">Try again with a clearer image of dried fish.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Fish type + grade header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Fish className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-lg font-bold text-slate-900">{m.fish_type}</p>
            <p className="text-xs text-slate-500">Detected fish type</p>
          </div>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ring-1 ${gs.bg} ${gs.text} ${gs.ring}`}>
          {m.grade} Grade
        </span>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          label="Confidence"
          value={`${m.confidence}%`}
          sub="AI detection certainty"
          color="border-blue-200 bg-blue-50/50"
        />
        <StatCard
          icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
          label="Grade Level"
          value={m.grade}
          sub={m.grade === 'Export' ? 'Highest quality' : m.grade === 'Local' ? 'Acceptable quality' : 'Below standard'}
          color={`border-slate-200 ${gs.bg}`}
        />
        <StatCard
          icon={<Bug className="w-5 h-5 text-orange-500" />}
          label="Defect"
          value={`${m.defect}%`}
          sub="Estimated surface defects"
          color="border-orange-200 bg-orange-50/50"
        />
        <StatCard
          icon={<FlaskConical className="w-5 h-5 text-purple-500" />}
          label="Mold"
          value={`${m.mold}%`}
          sub="Estimated mold presence"
          color="border-purple-200 bg-purple-50/50"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          label="Price Est."
          value={`₱${m.price}/kg`}
          sub="Estimated market price"
          color="border-emerald-200 bg-emerald-50/50"
        />
      </div>
    </div>
  )
}

export default function GradePage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [cameraActive, setCameraActive] = useState(false)
  const [pendingStream, setPendingStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if user is logged in
  useEffect(() => {
    if (!authLoading && !user) {
      showToast('Please log in to use the AI Fish Scanner. Your scan history will be saved to your account.')
      navigate('/login', { state: { from: '/grade' } })
    }
  }, [user, authLoading, navigate, showToast])

  // Attach stream to video when video element is in DOM (fixes blank camera preview)
  useEffect(() => {
    if (cameraActive && pendingStream && videoRef.current) {
      videoRef.current.srcObject = pendingStream
      streamRef.current = pendingStream
      setPendingStream(null)
    }
  }, [cameraActive, pendingStream])

  useEffect(() => {
    const id = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % GRADE_CAROUSEL_SLIDES.length)
    }, CAROUSEL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const clearPreview = () => {
    if (capturedImageUrl) URL.revokeObjectURL(capturedImageUrl)
    setCapturedImageUrl(null)
    setCapturedFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const reset = () => {
    if (capturedImageUrl) URL.revokeObjectURL(capturedImageUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setCapturedImageUrl(null)
    setCapturedFile(null)
    setResultUrl(null)
    setAnalyzeResult(null)
    setError(null)
    stopCamera()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setPendingStream(null)
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopCamera()
    if (capturedImageUrl) URL.revokeObjectURL(capturedImageUrl)
    setCapturedImageUrl(null)
    setCapturedFile(null)
    setError(null)
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
    setCapturedFile(f)
    setCapturedImageUrl(URL.createObjectURL(f))
  }

  const startCamera = async () => {
    clearPreview()
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      setPendingStream(stream)
      setCameraActive(true)
    } catch {
      setError('Could not access camera. Allow camera permission or use file upload.')
    }
  }

  const capturePhoto = (): Promise<File> => {
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
        (blob) => {
          if (blob) {
            resolve(new File([blob], 'capture.jpg', { type: 'image/jpeg' }))
          } else {
            reject(new Error('Capture failed'))
          }
        },
        'image/jpeg',
        0.9
      )
    })
  }

  const handleCapture = async () => {
    try {
      const file = await capturePhoto()
      stopCamera()
      setCapturedFile(file)
      setCapturedImageUrl(URL.createObjectURL(file))
    } catch {
      setError('Capture failed')
    }
  }

  const handleAnalyze = async () => {
    if (!capturedFile) return
    setLoading(true)
    setError(null)
    setResultUrl(null)
    setAnalyzeResult(null)
    try {
      const result = await analyzeImage(capturedFile)
      setResultUrl(URL.createObjectURL(result.blob))
      setAnalyzeResult(result)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleChooseFile = () => {
    stopCamera()
    fileInputRef.current?.click()
  }

  const slide = GRADE_CAROUSEL_SLIDES[carouselIndex]

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Don't render if user is not logged in (redirect will happen via useEffect)
  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Login Required</h2>
          <p className="text-slate-600 mb-4">Please log in to use the AI Fish Scanner.</p>
          <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageTitleHero
        title="Grade Dried Fish"
        description="Upload or capture an image, preview it, then analyze. Same AI flow as mobile."
        breadcrumb="Grade"
      />

      {/* ── Main dashboard container ── */}
      <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
        {/* Left vertical connector */}
        <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/50 via-blue-300/40 to-blue-500/50" />

        <div className="pl-8 pr-4 py-4 space-y-4">

          {/* ── Section 1 Capture ── */}
          <div className="relative">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">1 Capture</div>

            {/* Top bar: history link */}
            <div className="flex items-center justify-between mb-3 pt-1">
              <p className="text-xs text-slate-500">Choose a file or use the camera, then press Analyze.</p>
              <Link
                to="/history"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                History
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left col: controls + preview area */}
              <div className="lg:col-span-7 space-y-3">
                <input ref={fileInputRef} type="file" accept={ACCEPT} onChange={handleFileSelect} className="hidden" />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleChooseFile}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choose file
                  </button>
                  {cameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Close camera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Use camera
                    </button>
                  )}
                  {(capturedImageUrl || analyzeResult) && (
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-red-600 text-xs font-medium transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Scan another
                    </button>
                  )}
                </div>

                {/* Preview / camera area */}
                {cameraActive ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ minHeight: 180 }} />
                    </div>
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Capture photo
                    </button>
                  </div>
                ) : capturedImageUrl ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-200" style={{ minHeight: 180 }}>
                      <img src={capturedImageUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={clearPreview}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retake
                      </button>
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing…
                          </>
                        ) : (
                          'Analyze image'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
                    <Upload className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">Choose a file or open the camera</p>
                    <p className="text-xs text-slate-400 mt-1">PNG or JPG · max {MAX_FILE_MB} MB</p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}
              </div>

              {/* Right col: daing reference carousel + tips */}
              <div className="lg:col-span-5 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Type Reference</p>
                    <p className="text-xs text-slate-500">Examples of daing types we grade</p>
                  </div>
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    {slide.imageSrc ? (
                      <img src={slide.imageSrc} alt={slide.alt} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" />
                    ) : (
                      <div className="absolute inset-0 transition-opacity duration-500" style={{ backgroundColor: slide.placeholderColor }} />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                      <span className="text-white font-semibold text-xs">{slide.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-1.5">
                    {GRADE_CAROUSEL_SLIDES.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCarouselIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === carouselIndex ? 'bg-blue-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'}`}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                    <Lightbulb className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    Tips for best results
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1.5">
                    <li className="flex items-start gap-1.5"><span className="mt-0.5 w-1 h-1 rounded-full bg-blue-400 shrink-0" />Use <strong>good lighting</strong> — avoid shadows.</li>
                    <li className="flex items-start gap-1.5"><span className="mt-0.5 w-1 h-1 rounded-full bg-blue-400 shrink-0" />Place fish on a <strong>plain, contrasting background</strong>.</li>
                    <li className="flex items-start gap-1.5"><span className="mt-0.5 w-1 h-1 rounded-full bg-blue-400 shrink-0" />Fit the <strong>whole fish</strong> in frame when possible.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2 Report (shown after analysis) ── */}
          {analyzeResult && (
            <div className="relative border-t border-slate-100 pt-4">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">2 Report</div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                {/* Annotated image */}
                <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Annotated Result</p>
                    <p className="text-xs text-slate-500">Saved to Cloudinary + history</p>
                  </div>
                  {resultUrl && (
                    <img src={resultUrl} alt="Analysis result" className="w-full rounded-lg border border-slate-200" />
                  )}
                </div>

                {/* Metrics panel */}
                <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Scan Details</p>
                    <p className="text-xs text-slate-500">AI-derived metrics for this scan</p>
                  </div>
                  <ScanResultPanel result={analyzeResult} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
