'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ImageData, ImageMeshUserData } from '@/types/image';

// Configuration
const TUNNEL_WIDTH = 24;
const TUNNEL_HEIGHT = 16;
const SEGMENT_DEPTH = 6;
const NUM_SEGMENTS = 16;
const FLOOR_COLS = 6;
const WALL_ROWS = 4;
const COL_WIDTH = TUNNEL_WIDTH / FLOOR_COLS;
const ROW_HEIGHT = TUNNEL_HEIGHT / WALL_ROWS;
const FOG_NEAR = 10;
const FOG_FAR = 70;

interface TunnelProps {
  imagesRef: React.RefObject<ImageData[]>;
  scrollY: number;
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

// Generate image slots for a segment
function generateImageSlots(segmentKey: number, images: ImageData[]) {
  const slots: { position: [number, number, number]; rotation: [number, number, number]; size: [number, number]; imageData: ImageData }[] = [];
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

// Single clickable image in the tunnel
function TunnelImage({ imageData, position, rotation, size }: {
  imageData: ImageData;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const [width, height] = size;
  const cellMargin = 0.4;

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
      window.open(imageData.linkUrl, '_blank', 'noopener,noreferrer');
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

// Grid lines for a single segment
function SegmentGrid({ isDark }: { isDark: boolean }) {
  const lineColor = isDark ? '#555555' : '#b0b0b0';
  const lineOpacity = isDark ? 0.4 : 0.5;

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

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={lineColor} transparent opacity={lineOpacity} />
    </lineSegments>
  );
}

// Single tunnel segment
function TunnelSegment({ zPos, isDark, images, segmentKey }: {
  zPos: number;
  isDark: boolean;
  images: ImageData[];
  segmentKey: number;
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
      <SegmentGrid isDark={isDark} />
      {imageSlots.map((slot, idx) => (
        <TunnelImage
          key={`${segmentKey}-img-${idx}`}
          imageData={slot.imageData}
          position={slot.position}
          rotation={slot.rotation}
          size={slot.size}
        />
      ))}
    </group>
  );
}

// Main Tunnel component
export function Tunnel({ imagesRef, scrollY }: TunnelProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { camera, scene } = useThree();

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

  // Force re-render mechanism
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate(n => n + 1), []);

  // Setup fog and background
  useEffect(() => {
    const bgColor = isDark ? '#050505' : '#ffffff';
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(bgColor, FOG_NEAR, FOG_FAR);
  }, [scene, isDark]);

  // Update target position when scrollY changes
  useEffect(() => {
    targetZRef.current = -scrollY * 0.05;
  }, [scrollY]);

  // Animation frame - smooth camera movement and segment recycling
  useFrame(() => {
    // Smooth camera movement using GSAP-style easing
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
        <TunnelSegment
          key={segment.key}
          zPos={segment.zPos}
          isDark={isDark}
          images={images}
          segmentKey={segment.key}
        />
      ))}
    </group>
  );
}
