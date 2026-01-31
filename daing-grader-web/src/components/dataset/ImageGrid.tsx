import React, { useState } from 'react'
import { User } from 'lucide-react'

interface ImageItem {
  id: string
  filename: string
  url?: string
  hasAnnotations: boolean
  annotations?: Array<{ x: number; y: number; width: number; height: number }>
}

interface ImageGridProps {
  images: ImageItem[]
  showAnnotations: boolean
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  onImageClick?: (id: string) => void
}

export default function ImageGrid({ images, showAnnotations, selectedIds, onSelect, onImageClick }: ImageGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image) => {
        const isSelected = selectedIds.has(image.id)
        const isHovered = hoveredId === image.id

        return (
          <div
            key={image.id}
            className="group relative bg-white rounded-lg border border-slate-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-purple-300"
            onMouseEnter={() => setHoveredId(image.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onImageClick?.(image.id)}
          >
            {/* Checkbox overlay */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  onSelect(image.id, e.target.checked)
                }}
                className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            {/* Image container */}
            <div className="relative aspect-square bg-slate-100 overflow-hidden">
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-xs">600x400</div>
                  </div>
                </div>
              )}

              {/* Orange annotation overlay */}
              {showAnnotations && image.hasAnnotations && (
                <div className="absolute inset-2 border-2 border-orange-500 rounded pointer-events-none">
                  {image.annotations?.map((ann, idx) => (
                    <div
                      key={idx}
                      className="absolute border-2 border-orange-500 rounded"
                      style={{
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                        width: `${ann.width}%`,
                        height: `${ann.height}%`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Status icon (bottom-left) */}
              {image.hasAnnotations && (
                <div className="absolute bottom-2 left-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Hover overlay */}
              {isHovered && (
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
                    View Details
                  </div>
                </div>
              )}
            </div>

            {/* Filename */}
            <div className="p-2">
              <div className="text-xs text-slate-600 truncate font-mono">{image.filename}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
