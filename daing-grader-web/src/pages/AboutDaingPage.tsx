import React from 'react'

export default function AboutDaingPage(){
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold">About Daing</h2>
        <p className="text-sm text-muted mt-2">Daing (dried fish) is a traditional product. This page explains types and grading criteria.</p>
      </div>

      <div className="card">
        <h3 className="font-semibold">Grading Criteria</h3>
        <ul className="mt-3 list-disc list-inside text-sm text-muted">
          <li>Appearance (color, uniformity)</li>
          <li>Texture (dryness, softness)</li>
          <li>Odor (freshness)</li>
        </ul>
      </div>

      <div className="card">
        <h3 className="font-semibold">Types of Daing</h3>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          {['danggit','galunggong','espada','bangus','pusit'].map(t=> (
            <div key={t} className="p-3 bg-gray-50 rounded-lg text-center">{t}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
