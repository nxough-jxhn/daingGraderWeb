import React from 'react'

export default function AboutUsPage(){
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold">About Us</h2>
        <p className="text-sm text-muted mt-2">DaingGrader is an academic project focused on fish quality grading and dataset curation.</p>
      </div>

      <div className="card">
        <h3 className="font-semibold">Team</h3>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Alice','Bob','Carol','Dan'].map((n)=> (
            <div key={n} className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <div className="font-medium">{n}</div>
              <div className="text-xs text-muted">Researcher</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
