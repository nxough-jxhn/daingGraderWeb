// About Daing: 5 fish types. Each has a slug, display name, carousel images, and info sections.
// Carousel images: put files in public/assets/daing/<slug>/ e.g. public/assets/daing/espada/slide1.jpg
// Then set imageSrc: '/assets/daing/espada/slide1.jpg' (at least 3 per type).

export interface DaingSection {
  title: string
  content: string
}

export interface DaingType {
  slug: string
  name: string
  /** At least 3 image URLs or placeholder colors for carousel */
  carousel: Array<{ imageSrc?: string; placeholderColor: string; alt?: string }>
  sections: DaingSection[]
}

export const DAING_TYPES: DaingType[] = [
  {
    slug: 'espada',
    name: 'Espada',
    carousel: [
      { placeholderColor: '#1e3a5f', alt: 'Espada dried fish' },
      { placeholderColor: '#2a4a75', alt: 'Espada product' },
      { placeholderColor: '#3b82f6', alt: 'Espada grading' },
    ],
    sections: [
      { title: 'About Espada', content: 'Espada (beltfish, Trichiurus lepturus) is a long, silver fish commonly dried in the Philippines. Dried espada is valued for its firm texture and is used in many local dishes. Quality grading considers color uniformity, dryness, and absence of mold.' },
      { title: 'Grading criteria', content: 'Export-grade espada should have consistent silver-brown color, no visible mold or discoloration, and proper dryness. Local grade may allow minor color variation. Reject grade includes visible mold, off-odor, or excessive moisture.' },
      { title: 'Uses and storage', content: 'Dried espada is typically fried or cooked with vinegar and garlic. Store in a cool, dry place to prevent mold growth and moisture absorption.' },
    ],
  },
  {
    slug: 'danggit',
    name: 'Danggit',
    carousel: [
      { placeholderColor: '#0f766e', alt: 'Danggit dried fish' },
      { placeholderColor: '#14b8a6', alt: 'Danggit product' },
      { placeholderColor: '#2dd4bf', alt: 'Danggit grading' },
    ],
    sections: [
      { title: 'About Danggit', content: 'Danggit (rabbitfish, Siganidae) is one of the most popular dried fish varieties in the Philippines. It is known for its distinct flavor and is often eaten for breakfast with garlic rice. Sun-drying is the traditional preservation method.' },
      { title: 'Quality indicators', content: 'Good danggit has golden-brown color, intact spines, and no signs of mold. Color consistency and surface texture are key for the DaingGrader system\'s automated assessment. Moisture content affects shelf life and quality grade.' },
      { title: 'Safety and handling', content: 'Improper drying or storage can lead to mold growth and mycotoxin risk. The DaingGrader system helps detect early mold and color changes that may not be obvious to the naked eye.' },
    ],
  },
  {
    slug: 'dalagang-bukid',
    name: 'Dalagang Bukid',
    carousel: [
      { placeholderColor: '#be185d', alt: 'Dalagang Bukid dried fish' },
      { placeholderColor: '#db2777', alt: 'Dalagang Bukid product' },
      { placeholderColor: '#ec4899', alt: 'Dalagang Bukid grading' },
    ],
    sections: [
      { title: 'About Dalagang Bukid', content: 'Dalagang bukid (yellowtail fusilier, Caesio cuning) is a reef fish often dried and sold in local markets. The name means "country maiden" in Filipino. Dried dalagang bukid is smaller and is graded for color and uniformity.' },
      { title: 'Grading criteria', content: 'Export and local grades depend on color consistency, absence of mold, and proper drying. Surface texture analysis in DaingGrader helps identify defects and discoloration that affect commercial value.' },
      { title: 'Market use', content: 'Commonly consumed as a cheap source of protein. Quality control through automated grading supports both vendor pricing and consumer safety.' },
    ],
  },
  {
    slug: 'flying-fish',
    name: 'Flying Fish',
    carousel: [
      { placeholderColor: '#4f46e5', alt: 'Flying fish dried' },
      { placeholderColor: '#6366f1', alt: 'Flying fish product' },
      { placeholderColor: '#818cf8', alt: 'Flying fish grading' },
    ],
    sections: [
      { title: 'About Flying Fish', content: 'Flying fish (Exocoetidae) are dried in some coastal areas of the Philippines. They are recognizable by their wing-like fins. Dried flying fish are assessed for mold, color shift, and physical defects like broken fins or body damage.' },
      { title: 'Quality assessment', content: 'DaingGrader applies mold detection, color consistency analysis, and defect pattern analysis to classify dried flying fish into Export, Local, or Reject grades. Early mold detection is critical for food safety.' },
      { title: 'Storage and handling', content: 'Store in dry, well-ventilated conditions. Automated grading helps vendors and regulators ensure products meet safety standards before sale.' },
    ],
  },
  {
    slug: 'bisugo',
    name: 'Bisugo',
    carousel: [
      { placeholderColor: '#b45309', alt: 'Bisugo dried fish' },
      { placeholderColor: '#d97706', alt: 'Bisugo product' },
      { placeholderColor: '#f59e0b', alt: 'Bisugo grading' },
    ],
    sections: [
      { title: 'About Bisugo', content: 'Bisugo (threadfin bream, Nemipteridae) is a common dried fish in Philippine markets. It has a distinctive shape and is graded for color, texture, and absence of mold. Quality varies with drying and storage practices.' },
      { title: 'Grading criteria', content: 'Export-grade bisugo shows uniform color and no mold. Local grade may have minor variation. Reject grade includes visible mold, off-odor, or significant discoloration. DaingGrader supports objective, repeatable grading.' },
      { title: 'Use in the study', content: 'Bisugo is one of the five species used in the DaingGrader dataset for training the mold detection and quality classification model. Results help small-scale vendors and consumers assess product safety.' },
    ],
  },
]

export function getDaingTypeBySlug(slug: string): DaingType | undefined {
  return DAING_TYPES.find((t) => t.slug === slug)
}
