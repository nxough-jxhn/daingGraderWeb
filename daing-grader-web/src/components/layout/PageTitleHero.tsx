import React from 'react'

/**
 * Full-width page title hero banner matching the admin dashboard style.
 *
 * WHERE TO PUT BACKGROUND IMAGES:
 *   Directory:  public/assets/page-hero/
 *   Default image: /assets/page-hero/login.jpg
 *
 * Props:
 *   - title: main heading
 *   - description: subtitle text below the heading
 *   - breadcrumb: page name shown in breadcrumb trail, e.g. "Community Forum"
 *   - backgroundImage: optional override (defaults to /assets/page-hero/login.jpg)
 */
interface PageTitleHeroProps {
  title: string
  description?: string
  /** Page name shown in "Pages / <breadcrumb>" trail */
  breadcrumb?: string
  /** e.g. /assets/page-hero/publications.jpg — defaults to /assets/page-hero/login.jpg */
  backgroundImage?: string
}

export default function PageTitleHero({
  title,
  description,
  breadcrumb,
  backgroundImage = '/assets/page-hero/login.jpg',
}: PageTitleHeroProps) {
  return (
    <div className="-mt-6 mb-6 relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden border-y border-slate-300 shadow-sidebar-subtle h-64">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 bg-center bg-cover scale-110 blur-sm"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/32" />

      {/* Content layer */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between">
        {/* Breadcrumb — top */}
        <div className="w-full max-w-[1400px] mx-auto px-6 pt-6 self-start">
          <div
            className="text-sm text-white/75 font-medium"
            style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}
          >
            <span>Pages</span>
            {breadcrumb && (
              <>
                <span className="mx-2">/</span>
                <span>{breadcrumb}</span>
              </>
            )}
          </div>
        </div>

        {/* Glass card — left-aligned, bottom */}
        <div className="w-full px-6 pb-6">
          <div className="w-full md:w-1/2 bg-slate-900/65 backdrop-blur-sm rounded-lg px-8 py-6 shadow-xl border border-white/10">
            <h1
              className="text-4xl font-bold text-white"
              style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.55), 0 0 1px rgba(0,0,0,0.8)' }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="text-white/90 mt-2 text-lg"
                style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.5)' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Brand + Date — bottom-left */}
        <div
          className="w-full max-w-[1400px] mx-auto px-6 pb-6 flex items-end gap-4 text-white/80 font-medium"
          style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}
        >
          <span>DaingGrader</span>
          <span>
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
