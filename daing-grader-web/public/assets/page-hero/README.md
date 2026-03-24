# Page hero background images

Put your full-width title page background images here.

## Where to save
- **Directory:** `daing-grader-web/public/assets/page-hero/`
- **Recommended size:** 1920×400 px (or 1920×300 for shorter)

## Filenames and where they're used

| Filename        | Used on                        | Code location                        |
|-----------------|--------------------------------|--------------------------------------|
| `grade.jpg`     | Grade Dried Fish page          | `src/pages/GradePage.tsx` ~157       |
| `history.jpg`   | Scan History page              | `src/pages/HistoryPage.tsx` ~75      |
| `publications.jpg` | Publications (Local/Foreign) | `src/pages/PublicationsPage.tsx` ~24 |
| `login.jpg`     | Sign in / Sign up page         | `src/pages/LoginPage.tsx` ~13        |

## How to use your image

1. Save your image file (e.g. `grade.jpg`) in this folder.
2. In the page component, the `PageTitleHero` already has `backgroundImage="/assets/page-hero/grade.jpg"`.
3. To change the image path, edit the `backgroundImage` prop, e.g.:
   ```tsx
   <PageTitleHero
     title="Grade Dried Fish"
     subtitle="..."
     backgroundImage="/assets/page-hero/grade.jpg"   // ← change this path
   />
   ```
4. Path format: `/assets/page-hero/yourfilename.jpg` (files in `public/` are served from `/`).
