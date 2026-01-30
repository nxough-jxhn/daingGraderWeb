// Publications / references used in the study - Local and Foreign.
// Add your research/studies/literature here. Format similar to Google Scholar.

export interface Publication {
  id: string
  title: string
  authors?: string
  publication: string // journal name, conference, or source
  year?: string
  volume?: string
  pages?: string
  reference: string // full citation or abstract
  url: string // link to original source
  type: 'local' | 'foreign'
}

export const publications: Publication[] = [
  // --- LOCAL (Philippine / local institutions) ---
  {
    id: 'loc-1',
    type: 'local',
    title: 'Quality grading of dried fish (daing) using image-based features',
    authors: 'Santos, J., Reyes, M., Cruz, A.',
    publication: 'Philippine Journal of Fisheries',
    year: '2023',
    volume: '15',
    pages: '12-28',
    reference: 'Santos J., Reyes M., Cruz A. (2023). Quality grading of dried fish (daing) using image-based features. Philippine Journal of Fisheries, 15, 12-28.',
    url: 'https://example.com/local-ref-1',
  },
  {
    id: 'loc-2',
    type: 'local',
    title: 'Standards and classification of Philippine dried fish products',
    authors: 'Bureau of Fisheries and Aquatic Resources',
    publication: 'BFAR Technical Report',
    year: '2022',
    reference: 'Bureau of Fisheries and Aquatic Resources. (2022). Standards and classification of Philippine dried fish products. BFAR Technical Report.',
    url: 'https://example.com/local-ref-2',
  },
  // --- FOREIGN ---
  {
    id: 'for-1',
    type: 'foreign',
    title: 'Computer vision for food quality assessment: A survey',
    authors: 'Smith, L., Jones, K., Brown, P.',
    publication: 'Journal of Food Engineering',
    year: '2024',
    volume: '120',
    pages: '45-67',
    reference: 'Smith L., Jones K., Brown P. (2024). Computer vision for food quality assessment: A survey. Journal of Food Engineering, 120, 45-67.',
    url: 'https://example.com/foreign-ref-1',
  },
  {
    id: 'for-2',
    type: 'foreign',
    title: 'Deep learning for image-based classification in aquaculture',
    authors: 'Chen, Y., Wang, X., Zhang, H.',
    publication: 'Aquaculture Research',
    year: '2023',
    volume: '54',
    pages: '1234-1248',
    reference: 'Chen Y., Wang X., Zhang H. (2023). Deep learning for image-based classification in aquaculture. Aquaculture Research, 54, 1234-1248.',
    url: 'https://example.com/foreign-ref-2',
  },
]

export function getPublicationsByType(type: 'local' | 'foreign'): Publication[] {
  return publications.filter((p) => p.type === type)
}
