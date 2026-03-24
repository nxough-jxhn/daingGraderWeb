# DaingGrader Web – Complete Image Guide

All images use `object-cover` or `object-contain`, so **any size you provide will be cropped/fitted to the display**. Suggested sizes are for best quality; smaller or larger files will still work.

---

## Table: Where to Save & Code to Use

| # | Purpose | Save path (in `public/`) | Code file & line | Code to add / path to use | Display size (fixed in code) |
|---|---------|--------------------------|------------------|---------------------------|------------------------------|
| **PAGE HERO BACKGROUNDS** |
| 1 | Grade page hero bg | `assets/page-hero/grade.jpg` | `src/pages/GradePage.tsx` ~186 | `backgroundImage="/assets/page-hero/grade.jpg"` | Full width, min 180px height |
| 2 | History page hero bg | `assets/page-hero/history.jpg` | `src/pages/HistoryPage.tsx` ~61 | `backgroundImage="/assets/page-hero/history.jpg"` | Full width, min 180px height |
| 3 | Publications hero bg | `assets/page-hero/publications.jpg` | `src/pages/PublicationsPage.tsx` ~24 | `backgroundImage="/assets/page-hero/publications.jpg"` | Full width, min 180px height |
| 4 | Login page hero bg | `assets/page-hero/login.jpg` | `src/pages/LoginPage.tsx` ~13 | `backgroundImage="/assets/page-hero/login.jpg"` | Full width, min 180px height |
| **HOME PAGE CAROUSEL** |
| 5 | Home carousel slide 1 | `assets/carousel/slide1.jpg` | `src/components/home/HeroCarousel.tsx` ~30 | `imageSrc: '/assets/carousel/slide1.jpg'` | 1920×600 (aspect 1920/600) |
| 6 | Home carousel slide 2 | `assets/carousel/slide2.jpg` | `src/components/home/HeroCarousel.tsx` ~37 | `imageSrc: '/assets/carousel/slide2.jpg'` | 1920×600 |
| 7 | Home carousel slide 3 | `assets/carousel/slide3.jpg` | `src/components/home/HeroCarousel.tsx` ~43 | `imageSrc: '/assets/carousel/slide3.jpg'` | 1920×600 |
| 8 | Home carousel slide 4 | `assets/carousel/slide4.jpg` | `src/components/home/HeroCarousel.tsx` ~49 | `imageSrc: '/assets/carousel/slide4.jpg'` | 1920×600 |
| **ABOUT DAING – DAING TYPE CAROUSELS** (5 types × 3 slides = 15 images) |
| 9–11 | Espada carousel | `assets/daing/espada/slide1.jpg` etc. | `src/data/daingTypes.ts` ~23 | See daingTypes section below | 16:6 aspect, min 240px |
| 12–14 | Danggit carousel | `assets/daing/danggit/slide1.jpg` etc. | `src/data/daingTypes.ts` ~36 | Same pattern | 16:6 aspect |
| 15–17 | Dalagang Bukid carousel | `assets/daing/dalagang-bukid/slide1.jpg` | `src/data/daingTypes.ts` ~49 | Same pattern | 16:6 aspect |
| 18–20 | Flying Fish carousel | `assets/daing/flying-fish/slide1.jpg` | `src/data/daingTypes.ts` ~62 | Same pattern | 16:6 aspect |
| 21–23 | Bisugo carousel | `assets/daing/bisugo/slide1.jpg` | `src/data/daingTypes.ts` ~75 | Same pattern | 16:6 aspect |
| **GRADE PAGE – EXAMPLE CAROUSEL** (uses first slide of each daing type) |
| 24 | Grade page example | Uses daing type carousels | `src/pages/GradePage.tsx` via `DAING_TYPES` | Same as About Daing | 4:3 aspect |
| **ABOUT US – TEAM MEMBERS** |
| 25 | Member 1 photo | `assets/team/member1.jpg` | `src/data/team.ts` ~60 | `image: '/assets/team/member1.jpg'` | 144×144 (circular) |
| 26 | Member 2 photo | `assets/team/member2.jpg` | `src/data/team.ts` ~75 | `image: '/assets/team/member2.jpg'` | 144×144 (circular) |
| 27 | Member 3 photo | `assets/team/member3.jpg` | `src/data/team.ts` ~90 | `image: '/assets/team/member3.jpg'` | 144×144 (circular) |
| 28 | TUP logo (About Us) | `assets/logos/tup-t-logo.png` | `src/data/team.ts` ~104 | `logo: '/assets/logos/tup-t-logo.png'` | h-24 (96px) |
| **LOGIN PAGE – “WHY JOIN?” CARD** |
| 29 | Why join illustration | `assets/login/why-join.jpg` | `src/pages/LoginPage.tsx` ~35 | See Login section below | 384×288 (or 800×600) |
| **FEATURED DATASET (HOME)** & **DATASET PAGE** |
| 30+ | Dataset images | `assets/dataset/img-1.jpg` … `img-50.jpg` | `src/data/datasetImages.ts` | Add `url` to each object | Square aspect (e.g. 400×400) |

---

## Suggested Download/Export Sizes

| Image type | Suggested size | Notes |
|------------|----------------|-------|
| Page hero backgrounds | **1920×400** or 1920×300 | Wide banner, low opacity overlay |
| Home carousel | **1920×600** | Matches 1920/600 aspect ratio |
| Daing type carousels | **1200×450** or 1600×600 | 16:6 aspect |
| Team member photos | **400×400** (square) | Displayed circular at 144×144 |
| Login “Why join” | **800×600** or 400×300 | Card image |
| Dataset images | **600×600** (square) | Grid thumbnails |

---

## Code Snippets

### Page hero (already in place)
```tsx
backgroundImage="/assets/page-hero/grade.jpg"
```

### Home carousel – `src/components/home/HeroCarousel.tsx`
```tsx
{
  title: 'Daing',
  description: '...',
  placeholderColor: '#dc2626',
  imageSrc: '/assets/carousel/slide1.jpg',  // ← add this line
},
{
  title: 'Fish Grading',
  ...
  imageSrc: '/assets/carousel/slide2.jpg',  // ← add
},
// ... slide3.jpg, slide4.jpg
```

### Daing types – `src/data/daingTypes.ts`
For each type, add `imageSrc` to each carousel item:
```tsx
// Espada
carousel: [
  { imageSrc: '/assets/daing/espada/slide1.jpg', placeholderColor: '#1e3a5f', alt: 'Espada dried fish' },
  { imageSrc: '/assets/daing/espada/slide2.jpg', placeholderColor: '#2a4a75', alt: 'Espada product' },
  { imageSrc: '/assets/daing/espada/slide3.jpg', placeholderColor: '#3b82f6', alt: 'Espada grading' },
],
// Danggit
carousel: [
  { imageSrc: '/assets/daing/danggit/slide1.jpg', ... },
  { imageSrc: '/assets/daing/danggit/slide2.jpg', ... },
  { imageSrc: '/assets/daing/danggit/slide3.jpg', ... },
],
// Dalagang Bukid: assets/daing/dalagang-bukid/slide1.jpg, slide2.jpg, slide3.jpg
// Flying Fish:  assets/daing/flying-fish/slide1.jpg, slide2.jpg, slide3.jpg
// Bisugo:       assets/daing/bisugo/slide1.jpg, slide2.jpg, slide3.jpg
```

### Team members – `src/data/team.ts` (already set)
```tsx
image: '/assets/team/member1.jpg',
image: '/assets/team/member2.jpg',
image: '/assets/team/member3.jpg',
```

### Login “Why join” image – `src/pages/LoginPage.tsx`
Replace the placeholder div with:
```tsx
<img
  src="/assets/login/why-join.jpg"
  alt="Why join DaingGrader"
  className="w-full h-72 object-cover rounded-md"
/>
```

### Dataset images – `src/data/datasetImages.ts`
Add `url` to each image object, e.g.:
```ts
url: `/assets/dataset/img-${i + 1}.jpg`,
```
And create files: `public/assets/dataset/img-1.jpg` … `img-50.jpg`

---

## Folder structure to create

```
public/
├── assets/
│   ├── carousel/
│   │   ├── slide1.jpg
│   │   ├── slide2.jpg
│   │   ├── slide3.jpg
│   │   └── slide4.jpg
│   ├── daing/
│   │   ├── espada/
│   │   │   ├── slide1.jpg
│   │   │   ├── slide2.jpg
│   │   │   └── slide3.jpg
│   │   ├── danggit/
│   │   │   ├── slide1.jpg, slide2.jpg, slide3.jpg
│   │   ├── dalagang-bukid/
│   │   │   └── slide1.jpg, slide2.jpg, slide3.jpg
│   │   ├── flying-fish/
│   │   │   └── slide1.jpg, slide2.jpg, slide3.jpg
│   │   └── bisugo/
│   │       └── slide1.jpg, slide2.jpg, slide3.jpg
│   ├── dataset/
│   │   ├── img-1.jpg
│   │   ├── img-2.jpg
│   │   └── ... (img-50.jpg for featured/demo)
│   ├── login/
│   │   └── why-join.jpg
│   ├── logos/          ← you already have these
│   │   ├── tup-t-logo.png
│   │   └── dainggrader-logo.png
│   ├── page-hero/
│   │   ├── grade.jpg
│   │   ├── history.jpg
│   │   ├── publications.jpg
│   │   └── login.jpg
│   └── team/
│       ├── member1.jpg
│       ├── member2.jpg
│       └── member3.jpg
```

---

## Fixed sizes in code (images auto-adjust)

All relevant components already use:
- `object-cover` or `object-contain` – images scale to fill/fit the container
- `aspect-ratio` / `aspect-square` – containers have fixed proportions
- `w-full h-full` – images fill their container

So **any image size you provide will be displayed correctly**. The suggested sizes above are for best visual quality and file size balance.
