import React, { useState } from 'react'
import { Search, Image as ImageIcon, LayoutGrid, List } from 'lucide-react'

interface DatasetFiltersProps {
  onSearchChange?: (query: string) => void
  onFilterChange?: (filters: FilterState) => void
  showAnnotations: boolean
  onToggleAnnotations: () => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  selectedCount: number
}

interface FilterState {
  filename: string
  split: string
  classes: string
  tags: string
  sortBy: string
}

export default function DatasetFilters({
  onSearchChange,
  onFilterChange,
  showAnnotations,
  onToggleAnnotations,
  viewMode,
  onViewModeChange,
  selectedCount,
}: DatasetFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    filename: '',
    split: '',
    classes: '',
    tags: '',
    sortBy: 'newest',
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearchChange?.(value)
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search images"
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filter by filename"
          value={filters.filename}
          onChange={(e) => handleFilterChange('filename', e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
        />
        <select
          value={filters.split}
          onChange={(e) => handleFilterChange('split', e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white"
        >
          <option value="">Split</option>
          <option value="train">Train</option>
          <option value="val">Validation</option>
          <option value="test">Test</option>
        </select>
        <select
          value={filters.classes}
          onChange={(e) => handleFilterChange('classes', e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white"
        >
          <option value="">Classes</option>
          <option value="danggit">Danggit</option>
          <option value="tuyo">Tuyo</option>
          <option value="daing">Daing</option>
        </select>
        <select
          value={filters.tags}
          onChange={(e) => handleFilterChange('tags', e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white"
        >
          <option value="">Tags</option>
          <option value="fresh">Fresh</option>
          <option value="dried">Dried</option>
          <option value="graded">Graded</option>
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white"
        >
          <option value="newest">Sort By Newest</option>
          <option value="oldest">Sort By Oldest</option>
          <option value="name">Sort By Name</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm">
          <ImageIcon className="w-4 h-4" />
          Search by Image
        </button>
      </div>

      {/* Selection and view controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedCount > 0}
              onChange={(e) => {
                // Dispatch custom event for parent to handle
                const event = new CustomEvent('selectAll', { detail: e.target.checked })
                window.dispatchEvent(event)
              }}
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-600">{selectedCount} images selected</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={showAnnotations}
                onChange={onToggleAnnotations}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                  showAnnotations ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                    showAnnotations ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </div>
            </div>
            <span className="text-sm text-slate-600">Show annotations</span>
          </label>
        </div>
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
