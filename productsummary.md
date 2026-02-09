# Product Summary: Delphi Clone

## Overview

This project is a **pixel-perfect recreation of the Delphi landing page** - a visually striking web experience featuring an infinitely scrolling 3D tunnel with dynamically placed images. The application is built as a modern React application with Three.js for 3D graphics rendering.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI framework |
| Three.js | 0.160.0 | 3D graphics rendering |
| GSAP | 3.14.2 | Animation library |
| Tailwind CSS | CDN | Utility-first styling |
| TypeScript | 5.8.2 | Type safety |
| Vite | 6.2.0 | Build tool & dev server |

---

## Project Structure

```
opensrcdomains/
├── index.html          # Entry point with Tailwind config
├── index.tsx           # React root renderer
├── App.tsx             # Main app component with theme state
├── components/
│   ├── Hero.tsx        # Core tunnel & hero section (main logic)
│   ├── Navigation.tsx  # Fixed header with nav links & theme toggle
│   ├── PerspectiveGrid.tsx  # Deprecated (returns null)
│   └── HowItWorks.tsx  # Deprecated (returns null)
├── package.json        # Dependencies & scripts
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── metadata.json       # Project metadata
```

---

## Core Features

### 1. Infinite 3D Tunnel

The centrepiece of the application is an **infinitely scrolling 3D tunnel** implemented in [Hero.tsx](components/Hero.tsx):

- **Tunnel Dimensions**: 24 units wide x 16 units tall
- **Segment System**: 14 segments of 6-unit depth each
- **Grid Structure**: 6 columns (floor/ceiling) x 4 rows (walls)
- **Bidirectional Scrolling**: Segments recycle in both forward and backward scroll directions

### 2. Dynamic Image Placement

Images from Unsplash are randomly placed on tunnel surfaces:

- **Surfaces**: Floor, ceiling, left wall, right wall
- **Placement Logic**: Non-adjacent placement (minimum 2 slots apart)
- **Density**: ~20% floor/walls, ~12% ceiling (sparser)
- **Loading**: Textures fade in with GSAP animation (0.85 opacity)

### 3. Theme System (Dark/Light Mode)

Full theme support with smooth transitions:

- **Light Mode**: White background (#ffffff), light grey grid lines (#b0b0b0)
- **Dark Mode**: Near-black background (#050505), medium grey grid lines (#555555)
- **Transition**: 700ms duration across all elements

### 4. Scroll-Driven Camera

- Camera Z-position controlled by scroll (multiplier: 0.05)
- Smooth interpolation (lerp factor: 0.1) for fluid movement
- Page height: 10000vh to enable extended scrolling

---

## Component Breakdown

### App.tsx
- Manages global dark mode state
- Configures GSAP settings (autoSleep, force3D)
- Renders Navigation, Hero, and footer

### Navigation.tsx
- Fixed header with transparent background
- Logo, nav links (Use Cases, Discover, About)
- Theme toggle button with sun/moon icons
- CTA button ("Get started now")

### Hero.tsx
- Three.js scene setup and management
- Tunnel segment generation and recycling
- Image loading and placement logic
- Scroll and resize event handling
- Hero content overlay with heading, description, and CTAs

---

## Animation Details

| Animation | Library | Details |
|-----------|---------|---------|
| Camera movement | Three.js | Lerp-based smooth scrolling |
| Image fade-in | GSAP | 1s duration, opacity 0 to 0.85 |
| Hero content entry | GSAP | Fade + scale + translate on mount |
| Theme transitions | CSS | 500-700ms duration-based |

---

## Configuration Constants

```typescript
// Tunnel Configuration (Hero.tsx)
TUNNEL_WIDTH = 24
TUNNEL_HEIGHT = 16
SEGMENT_DEPTH = 6
NUM_SEGMENTS = 14
FOG_DENSITY = 0.02

// Grid Configuration
FLOOR_COLS = 6
WALL_ROWS = 4
```

---

## Current State

- **Active Components**: App, Navigation, Hero
- **Deprecated Components**: PerspectiveGrid, HowItWorks (both return null)
- **Build Status**: Ready for development (`npm run dev`)
- **Port**: 3000 (configurable in vite.config.ts)

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## Notes for Future Development

1. **Performance**: Pixel ratio capped at 2.0 for performance
2. **Memory Management**: Segments dispose textures and geometries on recycle
3. **Responsiveness**: Camera aspect ratio updates on resize
4. **Fog**: Currently configured but density may need adjustment for visual effect
