import React from 'react'
import { Link } from 'react-router-dom'
import HeroCarousel from '../components/home/HeroCarousel'
import { datasetImages } from '../data/datasetImages'
import { publications } from '../data/publications'
import { ExternalLink } from 'lucide-react'

const FEATURED_DATASET_COUNT = 5
const FEATURED_PUBLICATIONS_COUNT = 5

export default function HomePage() {
  const featuredImages = datasetImages.slice(0, FEATURED_DATASET_COUNT)
  const featuredPubs = publications.slice(0, FEATURED_PUBLICATIONS_COUNT)

  return (
    <div className="space-y-10">
      {/* Carousel: full width, no card/borders */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <HeroCarousel />
      </div>

      {/* Featured Dataset - showcase ~5 images */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 border-b-2 border-primary pb-2 w-fit">
          Featured Dataset
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {featuredImages.map((img) => (
            <Link
              key={img.id}
              to={`/dataset/${img.id}`}
              className="group block rounded-lg border border-slate-200 overflow-hidden bg-slate-100 hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="aspect-square flex items-center justify-center bg-slate-200">
                {img.url ? (
                  <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 text-xs text-center px-2">Image</span>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-slate-600 truncate font-mono" title={img.filename}>
                  {img.filename}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          <Link to="/dataset" className="text-primary font-medium hover:underline">
            View all dataset →
          </Link>
        </p>
      </section>

      {/* Featured Publications - Top News style list */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 border-b-2 border-primary pb-2 w-fit">
          Featured Publications
        </h2>
        <div className="space-y-0 divide-y divide-slate-200">
          {featuredPubs.map((pub) => (
            <div key={pub.id} className="py-4 first:pt-0">
              <h3 className="font-semibold text-slate-900 text-base">{pub.title}</h3>
              {pub.authors && (
                <p className="text-sm text-slate-600 mt-0.5">{pub.authors}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                {pub.publication}
                {pub.year && ` (${pub.year})`}
              </p>
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-2 hover:underline"
              >
                Read more →
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          <Link to="/publications/local" className="text-primary font-medium hover:underline">
            Local publications
          </Link>
          {' · '}
          <Link to="/publications/foreign" className="text-primary font-medium hover:underline">
            Foreign publications
          </Link>
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold">About DaingGrader</h3>
          <p className="text-sm text-muted mt-2">
            An educational UI demonstrating fish grading workflows and dataset management.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Key Features</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>• Clean, Monday.com-inspired layout</li>
            <li>• Dataset gallery & filtering</li>
            <li>• Cloud-ready API integration</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Quick Stats</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              Images<br /><strong>{datasetImages.length}</strong>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">Classes<br /><strong>5</strong></div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Call to Action</h3>
        <p className="text-sm text-muted mt-2">
          Use this prototype to refine the visual language before connecting to the backend.
        </p>
      </section>
    </div>
  )
}
