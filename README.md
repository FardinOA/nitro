# Nitro

A scroll-driven landing page for **Nitro**, a fictional energy drink. You scroll through three scenes, and GSAP animates the can between them:

1. **Hero**: a giant `NITRO` wordmark with the can lying across it. Drag the can to spin it.
2. **About**: an editorial photo card and the "Since 2002 producing" tagline.
3. **Shop**: a five-flavour carousel. Drag it, or use the arrow keys, to bring a flavour to the front. The page accent colour follows the featured flavour.

The desktop layout follows the Figma frame (1920 × 1098) pixel for pixel. Phones and portrait tablets get their own layout: a poster-style hero with an auto-spinning can, and a swipeable coverflow carousel.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) and React 19
- [Tailwind CSS v4](https://tailwindcss.com)
- [GSAP 3](https://gsap.com) with ScrollTrigger, ScrollTo, Draggable, Inertia and CustomEase
- TypeScript

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script          | What it does                 |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the dev server         |
| `npm run build` | Build for production         |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

## How it works

```
src/
├── app/
│   ├── layout.tsx          # fonts (Outfit + local Sakana), metadata
│   ├── page.tsx            # renders <NitroExperience />
│   └── globals.css         # theme tokens, accent colour, background gradients
├── components/nitro/
│   ├── NitroExperience.tsx # stage, scroll timeline, intro, resize handling
│   ├── layout.ts           # per-scene poses for every element (wide + tall layouts)
│   ├── Can.tsx             # can artwork, shadows, flavour definitions
│   ├── labelRenderer.ts    # paints the label onto a canvas, wrapped round a cylinder
│   ├── roll.ts             # grab-to-roll / auto-spin for the hero can
│   ├── carousel.ts         # draggable flavour carousel with snapping and rebasing
│   └── Ui.tsx              # nav, mobile menu, CTAs, social links, product info
└── fonts/Sakana.ttf        # display face for the wordmark and headings
```

- **One stage, three poses.** Every element is absolutely positioned on a fixed-size stage, and that stage is scaled to fit the viewport. `layout.ts` gives each element a pose (x, y, scale, rotation, opacity) for each scene. One scrubbed GSAP timeline then moves everything between the poses, pinned by ScrollTrigger and snapping to each scene.
- **Two layouts.** Landscape screens (≥ 900px wide, aspect ≥ 1.2) use the Figma frame directly, letterboxed so it always fits. Portrait screens get the separate layout described above, rather than a shrunken copy of the desktop one.
- **Cylindrical label.** Each can's label is drawn onto a canvas column by column using an `asin` mapping, so the print bunches up toward the edges like it does on a real can. Spinning the can is just sliding the label sideways. The canvas resolution follows the can's on-screen size.
- **Centred wordmark.** The Sakana letters are slanted, so their visible ink isn't centred in the text box. The page measures the real glyph extent at runtime and shifts the text so the lettering sits on the stage's centre line.
- **Accessibility.** The site respects `prefers-reduced-motion`, has visible keyboard focus in the accent colour, and supports arrow keys in the carousel. An `aria-live` region announces the featured flavour.

## Design credit

The visual design and image assets come from the Figma Community file *3d Animation Energy Drink Website ⚡*. This repo is a front-end implementation of that design.
