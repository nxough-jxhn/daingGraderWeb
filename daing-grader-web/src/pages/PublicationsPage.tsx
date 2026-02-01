import React from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, FileText } from 'lucide-react'
import PageTitleHero from '../components/layout/PageTitleHero'
import { getPublicationsByType, type Publication } from '../data/publications'

interface Props {
  type: 'local' | 'foreign'
}

export default function PublicationsPage({ type }: Props) {
  const items = getPublicationsByType(type)
  const title = type === 'local' ? 'Local Publications' : 'Foreign Publications'
  const subtitle =
    type === 'local'
      ? 'Research, studies, and literature from Philippine institutions and local sources.'
      : 'Research, studies, and literature from international sources.'

  return (
    <div className="space-y-6">
      <PageTitleHero
        title={title}
        subtitle={subtitle}
        backgroundImage="/assets/page-hero/publications.jpg"
      />

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-card">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p>No publications listed yet.</p>
          </div>
        ) : (
          items.map((pub) => (
            <PublicationCard key={pub.id} publication={pub} />
          ))
        )}
      </div>
    </div>
  )
}

function PublicationCard({ publication }: { publication: Publication }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card transition-all duration-200 hover:shadow-lg hover:border-slate-300">
      <h3 className="font-semibold text-slate-900 mb-1">{publication.title}</h3>
      {publication.authors && (
        <p className="text-sm text-slate-600 mb-1">{publication.authors}</p>
      )}
      <p className="text-sm text-slate-500 mb-2">
        {publication.publication}
        {publication.year && ` (${publication.year})`}
        {publication.volume && `, ${publication.volume}`}
        {publication.pages && `, pp. ${publication.pages}`}
      </p>
      <p className="text-sm text-slate-600 mb-3">{publication.reference}</p>
      <a
        href={publication.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ExternalLink className="w-4 h-4 shrink-0" />
        View original source
      </a>
    </div>
  )
}
