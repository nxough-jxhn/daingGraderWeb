import React from 'react'
import HeroCarousel from '../components/home/HeroCarousel'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Carousel: full width, no card/borders. Wrapper breaks out of container for full bleed. */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <HeroCarousel />
      </div>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold">About DaingGrader</h3>
          <p className="text-sm text-muted mt-2">An educational UI demonstrating fish grading workflows and dataset management.</p>
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
            <div className="p-3 bg-gray-50 rounded-lg">Images<br/><strong>1,234</strong></div>
            <div className="p-3 bg-gray-50 rounded-lg">Classes<br/><strong>5</strong></div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Call to Action</h3>
        <p className="text-sm text-muted mt-2">Use this prototype to refine the visual language before connecting to the backend.</p>
      </section>
    </div>
  )
}
