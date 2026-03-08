/**
 * Grade page (web): upload/capture → preview → analyze. Matches mobile flow (DaingApp ScanScreen).
 * Backend: POST /analyze (same as mobile, saves to Cloudinary + history) — no backend changes.
 */
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { analyzeImage, type AnalyzeResult, type PerFishResult } from '../services/api'
import PageTitleHero from '../components/layout/PageTitleHero'
import { Upload, Camera, Loader2, Lightbulb, RotateCcw, X, History, AlertTriangle, Fish, ShieldCheck, TrendingUp, Palette, FlaskConical } from 'lucide-react'
import { DAING_TYPES } from '../data/daingTypes'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

import espadaDataset from '../../image-dataset/espada.jpeg'
import danggitDataset from '../../image-dataset/danggit.jpg'
import bukidDataset from '../../image-dataset/bukid.jpg'
import flyingDataset from '../../image-dataset/flying.jpg'
import bisugoDataset from '../../image-dataset/bisugo.jpg'

const ACCEPT = '.png,.jpg,.jpeg'
const MAX_FILE_MB = 10

const GRADE_IMAGE_MAP: Record<string, string> = {
  Espada: espadaDataset,
  Danggit: danggitDataset,
  'Dalagang Bukid': bukidDataset,
  'Flying Fish': flyingDataset,
  Bisugo: bisugoDataset,
}

const GRADE_CAROUSEL_SLIDES = DAING_TYPES.map((t) => ({
  name: t.name,
  imageSrc: GRADE_IMAGE_MAP[t.name] || t.carousel[0]?.imageSrc,
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

/* Severity color map for mold badges */
const MOLD_SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  None:     { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Low:      { bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  Moderate: { bg: 'bg-orange-100',  text: 'text-orange-700' },
  Severe:   { bg: 'bg-red-100',     text: 'text-red-700' },
}

/* ─── Stat card used inside result panel ─── */
function StatCard({ icon, label, value, sub, note, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; note?: string; color: string }) {
  return (
    <div className={`flex items-start gap-4 rounded-xl border p-4 ${color}`}>
      <div className="mt-1 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-slate-900 leading-tight whitespace-nowrap">{value}</p>
        </div>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        {note && <p className="text-[11px] text-slate-400 mt-1.5 leading-snug italic">{note}</p>}
      </div>
    </div>
  )
}

/* ─── Full per-fish detail section with KPI cards ─── */
function FishDetailSection({ fish, isOnly }: { fish: PerFishResult; isOnly: boolean }) {
  const gradeStyle = GRADE_STYLES[fish.color_grade] || GRADE_STYLES.Reject
  const moldStyle = MOLD_SEVERITY_STYLES[fish.mold_severity] || MOLD_SEVERITY_STYLES.None
  const confPercent = Math.round(fish.confidence * 100)

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Fish header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-sm">
            #{fish.fish_index}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{fish.fish_type}</p>
            {!isOnly && <p className="text-[11px] text-slate-500">Fish #{fish.fish_index} of detected</p>}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ${gradeStyle.bg} ${gradeStyle.text} ${gradeStyle.ring}`}>
          {fish.color_grade} Grade
        </span>
      </div>
      {/* KPI cards — one per row */}
      <div className="p-4 flex flex-col gap-3">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          label="Confidence"
          value={`${confPercent}%`}
          sub="AI detection certainty"
          note={confPercent >= 85 ? 'High confidence — the AI is very sure this is a dried fish.' : confPercent >= 70 ? 'Moderate confidence — detection is likely correct but image clarity may affect accuracy.' : 'Low confidence — consider retaking with a clearer, well-lit photo.'}
          color="border-blue-200 bg-blue-50/50"
        />
        <StatCard
          icon={<Palette className="w-5 h-5 text-orange-500" />}
          label="Color Score"
          value={`${Math.round(fish.color_score)}%`}
          sub={`Grade: ${fish.color_grade}`}
          note={fish.color_score >= 80 ? 'Excellent color consistency — uniform appearance across the fish surface.' : fish.color_score >= 60 ? 'Acceptable color — some variation detected but within local market standards.' : 'Poor color consistency — significant discoloration or uneven drying observed.'}
          color="border-orange-200 bg-orange-50/50"
        />
        <StatCard
          icon={<FlaskConical className="w-5 h-5 text-purple-500" />}
          label="Mold Severity"
          value={fish.mold_severity}
          sub={`Coverage: ${fish.mold_coverage_percent}%`}
          note={fish.mold_severity === 'None' ? 'No mold patches detected — the fish surface appears clean.' : fish.mold_severity === 'Low' ? 'Minor mold traces found — small patches that may not affect overall quality.' : fish.mold_severity === 'Moderate' ? 'Noticeable mold growth — the fish should be inspected before sale or consumption.' : 'Heavy mold contamination — this fish is likely unsafe and should be rejected.'}
          color="border-purple-200 bg-purple-50/50"
        />
        <StatCard
          icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
          label="Mold Status"
          value={fish.mold_detected ? 'Detected' : 'Clean'}
          sub={fish.mold_detected ? `${fish.mold_coverage_percent}% affected` : 'No mold found'}
          note={fish.mold_detected ? `Mold covers ${fish.mold_coverage_percent}% of the fish surface. Higher coverage lowers the overall grade.` : 'The AI found no visible mold patches on this fish — good to go.'}
          color={fish.mold_detected
            ? `border-red-200 ${moldStyle.bg}`
            : 'border-emerald-200 bg-emerald-50/50'
          }
        />
      </div>
    </div>
  )
}

/* ─── Scan result panel ─── */
function ScanResultPanel({ result }: { result: AnalyzeResult }) {
  const perFish = result.per_fish || []
  const detected = result.detected
  const [activeFish, setActiveFish] = useState(1)

  if (!detected) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
        <p className="font-semibold text-slate-800">No dried fish detected</p>
        <p className="text-sm text-slate-500 mt-1">Try again with a clearer image of dried fish.</p>
      </div>
    )
  }

  // Overall summary line
  const overallGrade = result.grade
  const gs = GRADE_STYLES[overallGrade] || GRADE_STYLES.Reject
  const overallMold = result.mold_analysis?.overall_severity ?? 'None'
  const moldStyle = MOLD_SEVERITY_STYLES[overallMold] || MOLD_SEVERITY_STYLES.None
  const selectedFish = perFish.find((f) => f.fish_index === activeFish) || perFish[0]

  return (
    <div className="space-y-4">
      {/* Overall summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-1">
        <div className="flex items-center gap-3">
          <Fish className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-lg font-bold text-slate-900">{result.fish_type}</p>
            <p className="text-xs text-slate-500">{perFish.length} fish detected · Overall mold: <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${moldStyle.bg} ${moldStyle.text}`}>{overallMold}</span></p>
          </div>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ring-1 ${gs.bg} ${gs.text} ${gs.ring}`}>
          {overallGrade} Grade
        </span>
      </div>

      {/* Fish selector tabs — only shown when multiple fish */}
      {perFish.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {perFish.map((f) => {
            const isActive = f.fish_index === activeFish
            return (
              <button
                key={f.fish_index}
                type="button"
                onClick={() => setActiveFish(f.fish_index)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Fish className="w-4 h-4" />
                Fish #{f.fish_index}
              </button>
            )
          })}
        </div>
      )}

      {/* Show only the selected fish's detail section */}
      {selectedFish && (
        <FishDetailSection fish={selectedFish} isOnly={perFish.length === 1} />
      )}
    </div>
  )
}

export default function GradePage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
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
    setCapturedImageUrl(null)
    setCapturedFile(null)
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
    setAnalyzeResult(null)
    try {
      const result = await analyzeImage(capturedFile)
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
                  {analyzeResult && (
                    <img
                      src={analyzeResult.result_image || `data:image/jpeg;base64,${analyzeResult.result_image_b64}`}
                      alt="Analysis result"
                      className="w-full rounded-lg border border-slate-200"
                    />
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
