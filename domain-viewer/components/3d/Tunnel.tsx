'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ImageData, ImageMeshUserData } from '@/types/image';

// Configuration
const TUNNEL_RADIUS = 10;
const TUNNEL_WIDTH = 24;
const TUNNEL_HEIGHT = 16;
const SEGMENT_DEPTH = 6;
const NUM_SEGMENTS = 16;
const RADIAL_DIVISIONS = 12; // Number of panels around the circumference (cylinder)
const FLOOR_COLS = 6; // Rectangle grid columns
const WALL_ROWS = 4; // Rectangle grid rows
const COL_WIDTH = TUNNEL_WIDTH / FLOOR_COLS;
const ROW_HEIGHT = TUNNEL_HEIGHT / WALL_ROWS;
const FOG_NEAR = 10;
const FOG_FAR = 70;
const THEME_TRANSITION_DURATION = 0.5; // seconds

type TunnelShape = 'cylinder' | 'rectangle';

// Theme colors
const COLORS = {
  dark: {
    background: new THREE.Color('#050505'),
    gridLine: new THREE.Color('#555555'),
    gridOpacity: 0.4
  },
  light: {
    background: new THREE.Color('#ffffff'),
    gridLine: new THREE.Color('#b0b0b0'),
    gridOpacity: 0.5
  }
};

interface TunnelProps {
  imagesRef: React.RefObject<ImageData[]>;
  scrollY: number;
  shape?: TunnelShape;
}

interface SegmentData {
  zPos: number;
  key: number;
}

// Seeded random function for consistent image placement
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Image slot data for cylindrical placement
interface ImageSlot {
  angle: number;           // Center angle of the panel
  arcAngle: number;        // Angular width of the panel
  zPos: number;            // Z position (depth in segment)
  height: number;          // Height along Z axis
  imageData: ImageData;
}

// Generate image slots for a cylindrical segment
function generateImageSlots(segmentKey: number, images: ImageData[]): ImageSlot[] {
  const slots: ImageSlot[] = [];
  const d = SEGMENT_DEPTH;

  let seed = Math.abs(segmentKey) * 1000 + (segmentKey < 0 ? 500000 : 0);

  // Angular width per division
  const divisionAngle = (Math.PI * 2) / RADIAL_DIVISIONS;

  // Place images around the cylinder circumference
  for (let i = 0; i < RADIAL_DIVISIONS; i++) {
    // Random chance to place an image in this slot
    if (seededRandom(seed++) > 0.65) {
      const imageData = images[Math.floor(seededRandom(seed++) * images.length)];

      // Calculate center angle for this panel (offset by half division to center in grid cell)
      const angle = ((i + 0.5) / RADIAL_DIVISIONS) * Math.PI * 2;

      slots.push({
        angle,
        arcAngle: divisionAngle * 0.85, // Slightly smaller than full division for gaps
        zPos: -d / 2,
        height: d * 0.8,
        imageData
      });
    }
  }

  return slots;
}

// Single clickable curved image panel in the tunnel
function TunnelImage({ slot }: { slot: ImageSlot }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const { imageData, angle, arcAngle, zPos, height } = slot;

  // Create curved geometry that follows the cylinder surface
  const geometry = useMemo(() => {
    const r = TUNNEL_RADIUS - 0.05; // Slightly inside the cylinder
    const segments = 8; // Smoothness of the curve

    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const startAngle = angle - arcAngle / 2;
    const halfHeight = height / 2;

    // Create vertices for the curved panel
    // UV mapping rotated 90° clockwise so images face viewer naturally
    // Images on right half of tunnel (cos(angle) > 0) need additional 180° rotation
    const isRightSide = Math.cos(angle) > 0;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const a = startAngle + t * arcAngle;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;

      if (isRightSide) {
        // Right side: additional 180° rotation
        // Bottom vertex: (1, t)
        vertices.push(x, y, zPos - halfHeight);
        uvs.push(1, t);

        // Top vertex: (0, t)
        vertices.push(x, y, zPos + halfHeight);
        uvs.push(0, t);
      } else {
        // Left side: original 90° rotation
        // Bottom vertex: (0, 1-t)
        vertices.push(x, y, zPos - halfHeight);
        uvs.push(0, 1 - t);

        // Top vertex: (1, 1-t)
        vertices.push(x, y, zPos + halfHeight);
        uvs.push(1, 1 - t);
      }
    }

    // Create triangles
    for (let i = 0; i < segments; i++) {
      const bl = i * 2;
      const br = (i + 1) * 2;
      const tl = i * 2 + 1;
      const tr = (i + 1) * 2 + 1;

      // Two triangles per quad (facing inward)
      indices.push(bl, tl, br);
      indices.push(br, tl, tr);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [angle, arcAngle, zPos, height]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      imageData.imageUrl,
      (loadedTexture) => {
        loadedTexture.minFilter = THREE.LinearFilter;
        textureRef.current = loadedTexture;
        if (meshRef.current) {
          (meshRef.current.material as THREE.MeshBasicMaterial).map = loadedTexture;
          (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
        }
      },
      undefined,
      (error) => console.warn('Failed to load texture:', imageData.imageUrl, error)
    );

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [imageData.imageUrl]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (imageData.linkUrl && imageData.linkUrl !== '#') {
      window.location.href = imageData.linkUrl;
    }
  };

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
      userData={{ imageId: imageData.id, linkUrl: imageData.linkUrl, metadata: imageData.metadata } as ImageMeshUserData}
    >
      <meshBasicMaterial transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ============ RECTANGULAR TUNNEL COMPONENTS ============

// Rectangular image slot data
interface RectImageSlot {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  imageData: ImageData;
}

// Generate image slots for a rectangular segment
function generateRectImageSlots(segmentKey: number, images: ImageData[]): RectImageSlot[] {
  const slots: RectImageSlot[] = [];
  const w = TUNNEL_WIDTH / 2;
  const h = TUNNEL_HEIGHT / 2;
  const d = SEGMENT_DEPTH;

  let seed = Math.abs(segmentKey) * 1000 + (segmentKey < 0 ? 500000 : 0);

  // Floor
  for (let i = 0; i < FLOOR_COLS; i++) {
    if (seededRandom(seed++) > 0.75) {
      const imageData = images[Math.floor(seededRandom(seed++) * images.length)];
      slots.push({
        position: [-w + i * COL_WIDTH + COL_WIDTH / 2, -h, -d / 2],
        rotation: [-Math.PI / 2, 0, 0],
        size: [COL_WIDTH, d],
        imageData
      });
    }
  }

  // Ceiling
  for (let i = 0; i < FLOOR_COLS; i++) {
    if (seededRandom(seed++) > 0.85) {
      const imageData = images[Math.floor(seededRandom(seed++) * images.length)];
      slots.push({
        position: [-w + i * COL_WIDTH + COL_WIDTH / 2, h, -d / 2],
        rotation: [Math.PI / 2, 0, 0],
        size: [COL_WIDTH, d],
        imageData
      });
    }
  }

  // Left Wall
  for (let i = 0; i < WALL_ROWS; i++) {
    if (seededRandom(seed++) > 0.70) {
      const imageData = images[Math.floor(seededRandom(seed++) * images.length)];
      slots.push({
        position: [-w, -h + i * ROW_HEIGHT + ROW_HEIGHT / 2, -d / 2],
        rotation: [0, Math.PI / 2, 0],
        size: [d, ROW_HEIGHT],
        imageData
      });
    }
  }

  // Right Wall
  for (let i = 0; i < WALL_ROWS; i++) {
    if (seededRandom(seed++) > 0.70) {
      const imageData = images[Math.floor(seededRandom(seed++) * images.length)];
      slots.push({
        position: [w, -h + i * ROW_HEIGHT + ROW_HEIGHT / 2, -d / 2],
        rotation: [0, -Math.PI / 2, 0],
        size: [d, ROW_HEIGHT],
        imageData
      });
    }
  }

  return slots;
}

// Single flat image for rectangular tunnel
function RectTunnelImage({ slot }: { slot: RectImageSlot }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const { imageData, position, rotation, size } = slot;
  const [width, height] = size;
  const cellMargin = 0.4;

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      imageData.imageUrl,
      (loadedTexture) => {
        loadedTexture.minFilter = THREE.LinearFilter;
        // Rotate texture 90° clockwise so images face viewer naturally
        loadedTexture.center.set(0.5, 0.5);
        loadedTexture.rotation = -Math.PI / 2;
        textureRef.current = loadedTexture;
        if (meshRef.current) {
          (meshRef.current.material as THREE.MeshBasicMaterial).map = loadedTexture;
          (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
        }
      },
      undefined,
      (error) => console.warn('Failed to load texture:', imageData.imageUrl, error)
    );

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [imageData.imageUrl]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (imageData.linkUrl && imageData.linkUrl !== '#') {
      window.location.href = imageData.linkUrl;
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
      userData={{ imageId: imageData.id, linkUrl: imageData.linkUrl, metadata: imageData.metadata } as ImageMeshUserData}
    >
      <planeGeometry args={[width - cellMargin, height - cellMargin]} />
      <meshBasicMaterial transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Rectangular grid lines
function RectSegmentGrid({ materialRef }: { materialRef: React.RefObject<THREE.LineBasicMaterial> }) {
  const w = TUNNEL_WIDTH / 2;
  const h = TUNNEL_HEIGHT / 2;
  const d = SEGMENT_DEPTH;

  const geometry = useMemo(() => {
    const vertices: number[] = [];

    // Longitudinal Lines (running along Z-axis)
    for (let i = 0; i <= FLOOR_COLS; i++) {
      const x = -w + i * COL_WIDTH;
      vertices.push(x, -h, 0, x, -h, -d); // Floor
      vertices.push(x, h, 0, x, h, -d);   // Ceiling
    }
    for (let i = 1; i < WALL_ROWS; i++) {
      const y = -h + i * ROW_HEIGHT;
      vertices.push(-w, y, 0, -w, y, -d); // Left wall
      vertices.push(w, y, 0, w, y, -d);   // Right wall
    }

    // Ring at z=0 (cross-section)
    vertices.push(-w, -h, 0, w, -h, 0);  // Bottom
    vertices.push(-w, h, 0, w, h, 0);    // Top
    vertices.push(-w, -h, 0, -w, h, 0);  // Left
    vertices.push(w, -h, 0, w, h, 0);    // Right

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, [w, h, d]);

  if (!materialRef.current) return null;

  return (
    <lineSegments geometry={geometry} material={materialRef.current} />
  );
}

// Rectangular tunnel segment
function RectTunnelSegment({ zPos, images, segmentKey, gridMaterialRef }: {
  zPos: number;
  images: ImageData[];
  segmentKey: number;
  gridMaterialRef: React.RefObject<THREE.LineBasicMaterial>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const imageSlots = useMemo(() => generateRectImageSlots(segmentKey, images), [segmentKey, images]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.z = zPos;
    }
  }, [zPos]);

  return (
    <group ref={groupRef} position={[0, 0, zPos]}>
      <RectSegmentGrid materialRef={gridMaterialRef} />
      {imageSlots.map((slot, idx) => (
        <RectTunnelImage
          key={`${segmentKey}-img-${idx}`}
          slot={slot}
        />
      ))}
    </group>
  );
}

// ============ CYLINDRICAL TUNNEL COMPONENTS ============

// Cylindrical grid lines for a single segment
function CylinderSegmentGrid({ materialRef }: { materialRef: React.RefObject<THREE.LineBasicMaterial> }) {
  const r = TUNNEL_RADIUS;
  const d = SEGMENT_DEPTH;
  const ringSegments = 32; // Smoothness of the circle

  const geometry = useMemo(() => {
    const vertices: number[] = [];

    // Longitudinal lines (running along Z-axis)
    for (let i = 0; i < RADIAL_DIVISIONS; i++) {
      const angle = (i / RADIAL_DIVISIONS) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      vertices.push(x, y, 0, x, y, -d);
    }

    // Ring at z=0 (circular cross-section)
    for (let i = 0; i < ringSegments; i++) {
      const angle1 = (i / ringSegments) * Math.PI * 2;
      const angle2 = ((i + 1) / ringSegments) * Math.PI * 2;

      const x1 = Math.cos(angle1) * r;
      const y1 = Math.sin(angle1) * r;
      const x2 = Math.cos(angle2) * r;
      const y2 = Math.sin(angle2) * r;

      vertices.push(x1, y1, 0, x2, y2, 0);
    }

    // Ring at z=-d (back of segment)
    for (let i = 0; i < ringSegments; i++) {
      const angle1 = (i / ringSegments) * Math.PI * 2;
      const angle2 = ((i + 1) / ringSegments) * Math.PI * 2;

      const x1 = Math.cos(angle1) * r;
      const y1 = Math.sin(angle1) * r;
      const x2 = Math.cos(angle2) * r;
      const y2 = Math.sin(angle2) * r;

      vertices.push(x1, y1, -d, x2, y2, -d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, [r, d]);

  if (!materialRef.current) return null;

  return (
    <lineSegments geometry={geometry} material={materialRef.current} />
  );
}

// Cylindrical tunnel segment
function CylinderTunnelSegment({ zPos, images, segmentKey, gridMaterialRef }: {
  zPos: number;
  images: ImageData[];
  segmentKey: number;
  gridMaterialRef: React.RefObject<THREE.LineBasicMaterial>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const imageSlots = useMemo(() => generateImageSlots(segmentKey, images), [segmentKey, images]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.z = zPos;
    }
  }, [zPos]);

  return (
    <group ref={groupRef} position={[0, 0, zPos]}>
      <CylinderSegmentGrid materialRef={gridMaterialRef} />
      {imageSlots.map((slot, idx) => (
        <TunnelImage
          key={`${segmentKey}-img-${idx}`}
          slot={slot}
        />
      ))}
    </group>
  );
}

// Helper to check if dark mode is active (reads directly from DOM)
function getIsDark(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

// Main Tunnel component
export function Tunnel({ imagesRef, scrollY, shape = 'cylinder' }: TunnelProps) {
  const { camera, scene } = useThree();

  // Track dark mode state directly from DOM for instant response
  const isDarkRef = useRef(getIsDark());

  // Initialize segments synchronously
  const halfSegments = Math.floor(NUM_SEGMENTS / 2);
  const segmentsRef = useRef<SegmentData[]>(
    Array.from({ length: NUM_SEGMENTS }, (_, i) => ({
      zPos: (halfSegments - i) * SEGMENT_DEPTH,
      key: i
    }))
  );
  const nextKeyRef = useRef(NUM_SEGMENTS);
  const targetZRef = useRef(0);

  // Theme transition state
  const themeTransition = useRef({
    startTime: 0,
    fromBg: new THREE.Color(isDarkRef.current ? '#050505' : '#ffffff'),
    toBg: new THREE.Color(isDarkRef.current ? '#050505' : '#ffffff'),
    fromGrid: new THREE.Color(isDarkRef.current ? '#555555' : '#b0b0b0'),
    toGrid: new THREE.Color(isDarkRef.current ? '#555555' : '#b0b0b0'),
    fromOpacity: isDarkRef.current ? 0.4 : 0.5,
    toOpacity: isDarkRef.current ? 0.4 : 0.5,
    progress: 1 // Start complete
  });

  // Shared material for all grid lines (allows smooth color transitions)
  const gridMaterialRef = useRef<THREE.LineBasicMaterial>(
    new THREE.LineBasicMaterial({
      color: isDarkRef.current ? COLORS.dark.gridLine : COLORS.light.gridLine,
      transparent: true,
      opacity: isDarkRef.current ? COLORS.dark.gridOpacity : COLORS.light.gridOpacity
    })
  );

  // Current colors for rendering
  const currentBgColor = useRef(new THREE.Color(isDarkRef.current ? '#050505' : '#ffffff'));

  // Force re-render mechanism
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate(n => n + 1), []);

  // Initialize scene
  useEffect(() => {
    scene.background = currentBgColor.current;
    scene.fog = new THREE.Fog(currentBgColor.current, FOG_NEAR, FOG_FAR);
  }, [scene]);

  // Watch for theme changes via MutationObserver (instant, no React state delay)
  useEffect(() => {
    const startThemeTransition = (newIsDark: boolean) => {
      const trans = themeTransition.current;
      const toColors = newIsDark ? COLORS.dark : COLORS.light;

      trans.fromBg.copy(currentBgColor.current);
      trans.toBg.copy(toColors.background);
      trans.fromGrid.copy(gridMaterialRef.current.color);
      trans.toGrid.copy(toColors.gridLine);
      trans.fromOpacity = gridMaterialRef.current.opacity;
      trans.toOpacity = toColors.gridOpacity;
      trans.startTime = performance.now();
      trans.progress = 0;

      isDarkRef.current = newIsDark;
    };

    // Watch for class changes on html element (instant response to theme toggle)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const newIsDark = document.documentElement.classList.contains('dark');
          if (newIsDark !== isDarkRef.current) {
            startThemeTransition(newIsDark);
          }
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Update target position when scrollY changes
  useEffect(() => {
    targetZRef.current = -scrollY * 0.05;
  }, [scrollY]);

  // Tailwind's ease-in-out curve: cubic-bezier(0.4, 0, 0.2, 1)
  const tailwindEaseInOut = (t: number): number => {
    const p1x = 0.4, p1y = 0;
    const p2x = 0.2, p2y = 1;

    let u = t;
    for (let i = 0; i < 8; i++) {
      const x = 3 * (1 - u) * (1 - u) * u * p1x + 3 * (1 - u) * u * u * p2x + u * u * u - t;
      const dx = 3 * (1 - u) * (1 - u) * p1x + 6 * (1 - u) * u * (p2x - p1x) + 3 * u * u * (1 - p2x);
      if (Math.abs(dx) < 1e-6) break;
      u = u - x / dx;
    }
    u = Math.max(0, Math.min(1, u));

    return 3 * (1 - u) * (1 - u) * u * p1y + 3 * (1 - u) * u * u * p2y + u * u * u;
  };

  // Animation frame - smooth camera movement, segment recycling, and theme transitions
  useFrame(() => {
    const trans = themeTransition.current;

    // Time-based theme color transitions
    if (trans.progress < 1) {
      const elapsed = (performance.now() - trans.startTime) / 1000;
      trans.progress = Math.min(elapsed / THEME_TRANSITION_DURATION, 1);
      const eased = tailwindEaseInOut(trans.progress);

      // Interpolate background color
      currentBgColor.current.copy(trans.fromBg).lerp(trans.toBg, eased);
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(currentBgColor.current);
      }
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.copy(currentBgColor.current);
      }

      // Interpolate grid color and opacity
      const gridColor = trans.fromGrid.clone().lerp(trans.toGrid, eased);
      const gridOpacity = trans.fromOpacity + (trans.toOpacity - trans.fromOpacity) * eased;

      gridMaterialRef.current.color.copy(gridColor);
      gridMaterialRef.current.opacity = gridOpacity;
    }

    // Smooth camera movement
    const currentZ = camera.position.z;
    const targetZ = targetZRef.current;
    const diff = targetZ - currentZ;

    if (Math.abs(diff) > 0.001) {
      camera.position.z += diff * 0.08;
    }

    const camZ = camera.position.z;
    const segments = segmentsRef.current;
    const totalLength = NUM_SEGMENTS * SEGMENT_DEPTH;
    const halfLength = totalLength / 2;

    let needsUpdate = false;

    // Find current min and max Z positions
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const seg of segments) {
      if (seg.zPos < minZ) minZ = seg.zPos;
      if (seg.zPos > maxZ) maxZ = seg.zPos;
    }

    // Recycle segments
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Segment is too far behind camera (user scrolling forward)
      if (segment.zPos > camZ + halfLength) {
        segment.zPos = minZ - SEGMENT_DEPTH;
        segment.key = nextKeyRef.current++;
        minZ = segment.zPos;
        needsUpdate = true;
      }
      // Segment is too far ahead of camera (user scrolling backward)
      else if (segment.zPos < camZ - halfLength) {
        segment.zPos = maxZ + SEGMENT_DEPTH;
        segment.key = nextKeyRef.current++;
        maxZ = segment.zPos;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      triggerUpdate();
    }
  });

  const images = imagesRef.current;
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <group>
      {segmentsRef.current.map((segment) => (
        shape === 'cylinder' ? (
          <CylinderTunnelSegment
            key={segment.key}
            zPos={segment.zPos}
            images={images}
            segmentKey={segment.key}
            gridMaterialRef={gridMaterialRef}
          />
        ) : (
          <RectTunnelSegment
            key={segment.key}
            zPos={segment.zPos}
            images={images}
            segmentKey={segment.key}
            gridMaterialRef={gridMaterialRef}
          />
        )
      ))}
    </group>
  );
}
