# RUSKAV Food Service Products — Website

Marketing and catalogue site for RUSKAV Food Service Products, built from the 2023
print catalogue. React 19 + TypeScript + Vite + Tailwind CSS v4.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## The scroll hero

The hero is a 300-frame product sequence scrubbed by scroll position, drawn to a
`<canvas>` (the technique Apple uses on product pages). See
`src/components/Hero.tsx`:

- Frames live in `public/Products Images/ezgif-frame-001.jpg` … `-300.jpg` —
  the original camera-resolution exports, served untouched. They are preloaded
  up front by `src/hooks/useFrameSequence.ts`, which drives the percentage on
  the loading screen (`src/components/Loader.tsx`).
- The section is `650vh` tall with a `sticky` viewport-height canvas inside it.
  Scroll progress through that section maps linearly to the frame index. Make
  it taller to slow the sequence down relative to scrolling, shorter to speed
  it up.
- Headline copy is defined in the `phases` array. Each phase has a
  `[fadeInStart, fullyIn, holdUntil, fadeOutBy]` range in scroll-progress units
  (0–1). To reword the hero, edit that array — nothing else needs to change.
- Progress, frame drawing and text opacity are all driven by one `requestAnimationFrame`
  throttled scroll listener rather than a library, so the phases stay exactly in
  sync with the frames.

## Catalogue content

All product data — categories, product codes, sizes, case packs, specifications,
colourways and certifications — lives in one file: `src/data/catalogue.ts`.
Section copy, contact details and the colour swatch hex values are there too.
Adding a product line means adding an object to a category's `groups` array; the
showcase sections, accordions, nav dropdown and footer links all read from it.

## Images

**Hero frames are served as-is.** `public/Products Images/` holds the original
1920×1080 JPEG exports (~7 MB for 300 frames) and nothing in the build touches
them — no resampling, no re-encoding. That is deliberate: on a 1.25× display a
1920-wide source cover-fits the canvas at scale ~1.00, so the frames land
essentially 1:1 and any intermediate resample would only cost quality.

The one thing that does matter in code is
`imageSmoothingQuality = "high"` on the canvas context (`Hero.tsx`), and it has
to be re-applied inside the resize handler — assigning `canvas.width`/`height`
resets all context state, silently included.

**When you replace the frames, bump `FRAMES_VERSION` in
`src/hooks/useFrameSequence.ts`.** Filenames are stable across art updates, so
without it browsers keep serving the old sequence from cache and the new art
silently never appears.

The Runway product renders are a different story — those were 79 MB of PNG, so
they are committed as optimised WebP under `public/gallery/`:

```bash
node scripts/optimize-images.mjs   # public/gallery → public/gallery-opt (1600px WebP q78)
```

`scripts/optimize-frames.mjs` is kept for the case where the 7 MB frame preload
becomes a problem (slow connections). It writes WebP copies to
`public/frames-opt`; using them means pointing `framePath` back at
`/frames/frame-XXX.webp` and accepting some loss.

## Structure

```
src/
  App.tsx                    section order for the whole page
  data/catalogue.ts          all product + company content
  hooks/useFrameSequence.ts  hero frame preloader
  components/
    Hero.tsx                 scroll-scrubbed canvas hero
    Header.tsx               sticky nav + mobile menu
    CategoryShowcase.tsx     alternating product sections (used 4x)
    ProductGroupCard.tsx     expandable spec + product-code tables
    Sustainability.tsx       bio-composite section
    Quality.tsx              certifications
    Contact.tsx              enquiry form (opens mailto:, no backend)
```

## Notes

- The enquiry form has no server. It composes a `mailto:` link to
  `info@shahputra.com` with the form contents. Wire it to a form service or API
  endpoint in `src/components/Contact.tsx` if you want submissions captured.
- Certification icons in `src/components/icons/Badges.tsx` are hand-drawn SVGs
  modelled on the symbols in the print catalogue, not the original artwork.
