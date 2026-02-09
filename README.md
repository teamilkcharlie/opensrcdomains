# OpenSrc Domains

Infinite scrolling 3D tunnel with clickable images, built with Next.js, React Three Fiber, and Tailwind CSS.

## Features

- Infinite scrolling 3D tunnel visualization
- Clickable images that link to external pages
- Dark/light mode support
- Domain viewer integration at `/[id]` routes

## Run Locally

**Prerequisites:** Node.js

```bash
cd domain-viewer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the tunnel.

## Environment Variables

Create a `.env.local` file in the `domain-viewer` directory:

```
NEXT_PUBLIC_API_BASE_URL=https://your-api-endpoint.com
```

## Project Structure

```
domain-viewer/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Tunnel home page
│   └── [id]/              # Domain viewer routes
├── components/
│   ├── 3d/Tunnel.tsx      # React Three Fiber tunnel
│   ├── TunnelHero.tsx     # Hero section with canvas
│   └── TunnelNavigation.tsx
├── hooks/
│   └── useImageData.ts    # Image fetching hook
├── types/
│   └── image.ts           # TypeScript interfaces
└── utils/
    └── fallbackImages.ts  # Fallback image data
```
