'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
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

// Smoothness settings
const RING_SEGMENTS = 64; // Smoothness of circular grid lines
const IMAGE_CURVE_SEGMENTS = 24; // Smoothness of curved image panels
const CORNER_RADIUS = 0.15; // Rounded corner radius for images
const CORNER_SEGMENTS = 6; // Segments per corner for smoothness
const OUTLINE_OFFSET = 0.2; // Gap between image and outline

type TunnelShape = 'cylinder' | 'rectangle';

// Theme colors
const COLORS = {
  dark: {
    background: new THREE.Color('#050505'),
    gridLine: new THREE.Color('#555555'),
    gridOpacity: 0.8
  },
  light: {
    background: new THREE.Color('#ffffff'),
    gridLine: new THREE.Color('#b0b0b0'),
    gridOpacity: 0.8
  }
};

interface TunnelProps {
  imagesRef: React.RefObject<ImageData[]>;
  scrollY: number;
  shape?: TunnelShape;
  router: ReturnType<typeof useRouter>;
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

// Helper to generate rounded rectangle outline for curved surface
function generateCurvedRoundedRect(
  centerAngle: number,
  arcWidth: number,
  zCenter: number,
  zHeight: number,
  radius: number,
  cornerRadius: number,
  cornerSegs: number,
  edgeSegs: number
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const halfArc = arcWidth / 2;
  const halfZ = zHeight / 2;

  // Convert corner radius to angular units for the arc dimension
  const cornerArcAngle = cornerRadius / radius;
  const cornerZHeight = cornerRadius;

  // Clamp corner radius to not exceed half of either dimension
  const maxCornerArc = Math.min(halfArc * 0.4, cornerArcAngle);
  const maxCornerZ = Math.min(halfZ * 0.4, cornerZHeight);

  const startAngle = centerAngle - halfArc;
  const endAngle = centerAngle + halfArc;
  const bottomZ = zCenter - halfZ;
  const topZ = zCenter + halfZ;

  // Bottom-left corner
  for (let i = 0; i <= cornerSegs; i++) {
    const t = i / cornerSegs;
    const cornerAngle = Math.PI + (Math.PI / 2) * t; // 180° to 270°
    const a = startAngle + maxCornerArc + Math.cos(cornerAngle) * maxCornerArc;
    const z = bottomZ + maxCornerZ + Math.sin(cornerAngle) * maxCornerZ;
    points.push([Math.cos(a) * radius, Math.sin(a) * radius, z]);
  }

  // Bottom edge
  for (let i = 1; i < edgeSegs; i++) {
    const t = i / edgeSegs;
    const a = startAngle + maxCornerArc + t * (arcWidth - 2 * maxCornerArc);
    points.push([Math.cos(a) * radius, Math.sin(a) * radius, bottomZ]);
  }

  // Bottom-right corner
  for (let i = 0; i <= cornerSegs; i++) {
    const t = i / cornerSegs;
    const cornerAngle = (3 * Math.PI / 2) + (Math.PI / 2) * t; // 270° to 360°
    const a = endAngle - maxCornerArc + Math.cos(cornerAngle) * maxCornerArc;
    const z = bottomZ + maxCornerZ + Math.sin(cornerAngle) * maxCornerZ;
    points.push([Math.cos(a) * radius, Math.sin(a) * radius, z]);
  }

  // Right edge
  for (let i = 1; i < cornerSegs; i++) {
    const t = i / cornerSegs;
    const z = bottomZ + maxCornerZ + t * (zHeight - 2 * maxCornerZ);
    points.push([Math.cos(endAngle) * radius, Math.sin(endAngle) * radius, z]);
  }

  // Top-right corner
  for (let i = 0; i <= cornerSegs; i++) {
    const t = i / cornerSegs;
    const cornerAngle = (Math.PI / 2) * t; // 0° to 90°
    const a = endAngle - maxCornerArc + Math.cos(cornerAngle) * maxCornerArc;
    const z = topZ - maxCornerZ + Math.sin(cornerAngle) * maxCornerZ;
    points.push([Math.cos(a) * radius, Math.sin(a) * radius, z]);
  }

  // Top edge (reverse direction)
  for (let i = 1; i < edgeSegs; i++) {
    const t = i / edgeSegs;
    const a = endAngle - maxCornerArc - t * (arcWidth - 2 * maxCornerArc);
    points.push([Math.cos(a) * radius, Math.sin(a) * radius, topZ]);
  }

  // Top-left corner
  for (let i = 0; i <= cornerSegs; i++) {
    const t = i / cornerSegs;
    const cornerAngle = (Math.PI / 2) + (Math.PI / 2) * t; // 90° to 180°
    const a = startAngle + maxCornerArc + Math.cos(cornerAngle) * maxCornerArc;
    const z = topZ - maxCornerZ + Math.sin(cornerAngle) * maxCornerZ;
    points.push([Math.cos(a) * radius, Math.sin(a) * radius, z]);
  }

  // Left edge (back to start)
  for (let i = 1; i < cornerSegs; i++) {
    const t = i / cornerSegs;
    const z = topZ - maxCornerZ - t * (zHeight - 2 * maxCornerZ);
    points.push([Math.cos(startAngle) * radius, Math.sin(startAngle) * radius, z]);
  }

  // Close the loop
  points.push(points[0]);

  return points;
}

// Hover animation offset (how far inward the image moves)
const HOVER_OFFSET = 0.3;

// Single clickable curved image panel in the tunnel
function TunnelImage({ slot, router }: { slot: ImageSlot; router: ReturnType<typeof useRouter> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [outlineOpacity, setOutlineOpacity] = useState(0);
  const { imageData, angle, arcAngle, zPos, height } = slot;

  // Calculate the inward direction (toward center of cylinder)
  const inwardX = -Math.cos(angle) * HOVER_OFFSET;
  const inwardY = -Math.sin(angle) * HOVER_OFFSET;

  // Create curved geometry with rounded corners
  const geometry = useMemo(() => {
    const r = TUNNEL_RADIUS - 0.05; // Slightly inside the cylinder
    const segments = IMAGE_CURVE_SEGMENTS;
    const cornerR = CORNER_RADIUS;

    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const startAngle = angle - arcAngle / 2;
    const halfHeight = height / 2;
    const isRightSide = Math.cos(angle) > 0;

    // Corner radius in angular units
    const cornerArc = Math.min(cornerR / r, arcAngle * 0.2);
    const cornerZ = Math.min(cornerR, halfHeight * 0.4);

    // Generate rows of vertices from bottom to top
    const rows: { z: number; startA: number; endA: number }[] = [];

    // Bottom corners region
    for (let i = 0; i <= CORNER_SEGMENTS; i++) {
      const t = i / CORNER_SEGMENTS;
      const cornerProgress = Math.sin(t * Math.PI / 2); // Ease in
      const z = -halfHeight + cornerZ * (1 - Math.cos(t * Math.PI / 2));
      const inset = cornerArc * (1 - cornerProgress);
      rows.push({ z: zPos + z, startA: startAngle + inset, endA: startAngle + arcAngle - inset });
    }

    // Middle region
    const midRows = Math.max(2, Math.floor(segments / 4));
    for (let i = 1; i < midRows; i++) {
      const t = i / midRows;
      const z = -halfHeight + cornerZ + t * (height - 2 * cornerZ);
      rows.push({ z: zPos + z, startA: startAngle, endA: startAngle + arcAngle });
    }

    // Top corners region
    for (let i = 0; i <= CORNER_SEGMENTS; i++) {
      const t = i / CORNER_SEGMENTS;
      const cornerProgress = Math.cos(t * Math.PI / 2); // Ease out
      const z = halfHeight - cornerZ * (1 - Math.sin(t * Math.PI / 2));
      const inset = cornerArc * (1 - cornerProgress);
      rows.push({ z: zPos + z, startA: startAngle + inset, endA: startAngle + arcAngle - inset });
    }

    // Create vertices for each row
    const fullArcStart = startAngle;
    const bottomZ = zPos - halfHeight;

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const rowArcWidth = row.endA - row.startA;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const a = row.startA + t * rowArcWidth;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;

        vertices.push(x, y, row.z);

        // UV mapping based on actual position in the full rectangle
        // U is based on angular position relative to full arc width
        const uBase = (a - fullArcStart) / arcAngle;
        // V is based on actual z position relative to total height
        const vBase = (row.z - bottomZ) / height;

        if (isRightSide) {
          uvs.push(1 - vBase, uBase);
        } else {
          uvs.push(vBase, 1 - uBase);
        }
      }
    }

    // Create triangles
    const vertsPerRow = segments + 1;
    for (let rowIdx = 0; rowIdx < rows.length - 1; rowIdx++) {
      for (let i = 0; i < segments; i++) {
        const bl = rowIdx * vertsPerRow + i;
        const br = rowIdx * vertsPerRow + i + 1;
        const tl = (rowIdx + 1) * vertsPerRow + i;
        const tr = (rowIdx + 1) * vertsPerRow + i + 1;

        indices.push(bl, tl, br);
        indices.push(br, tl, tr);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [angle, arcAngle, zPos, height]);

  // Create outline points with offset and rounded corners
  const outlinePoints = useMemo(() => {
    const r = TUNNEL_RADIUS - 0.05 + OUTLINE_OFFSET; // Offset from image surface
    return generateCurvedRoundedRect(
      angle,
      arcAngle,
      zPos,
      height,
      r,
      CORNER_RADIUS,
      CORNER_SEGMENTS,
      IMAGE_CURVE_SEGMENTS
    );
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

  // GSAP animation for hover effects (outline + position)
  useEffect(() => {
    const opacityTarget = { value: outlineOpacity };
    gsap.to(opacityTarget, {
      value: isHovered ? 1 : 0,
      duration: 0.25,
      ease: 'power2.out',
      onUpdate: () => setOutlineOpacity(opacityTarget.value),
    });

    // Animate position inward on hover
    if (groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: isHovered ? inwardX : 0,
        y: isHovered ? inwardY : 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [isHovered, inwardX, inwardY]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (imageData.linkUrl && imageData.linkUrl !== '#') {
      // Reset cursor before navigating
      document.body.style.cursor = 'default';
      setIsHovered(false);
      router.push(imageData.linkUrl);
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setIsHovered(true);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
    setIsHovered(false);
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        userData={{ imageId: imageData.id, linkUrl: imageData.linkUrl, metadata: imageData.metadata } as ImageMeshUserData}
      >
        <meshBasicMaterial transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* White outline on hover */}
      {outlineOpacity > 0 && (
        <Line
          points={outlinePoints}
          color="#ffffff"
          lineWidth={3}
          transparent
          opacity={outlineOpacity}
        />
      )}
    </group>
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

// Helper to generate rounded rectangle outline points
function generateRoundedRectOutline(
  width: number,
  height: number,
  cornerRadius: number,
  cornerSegs: number,
  zOffset: number
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const hw = width / 2;
  const hh = height / 2;
  const cr = Math.min(cornerRadius, hw * 0.4, hh * 0.4);

  // Bottom-left corner
  for (let i = 0; i <= cornerSegs; i++) {
    const t = i / cornerSegs;
    const angle = Math.PI + (Math.PI / 2) * t;
    points.push([
      -hw + cr + Math.cos(angle) * cr,
      -hh + cr + Math.sin(angle) * cr,
      zOffset
    ]);
  }

  // Bottom-right corner
  for (let i = 0; i <= cornerSegs; i++) {
    const t = i / cornerSegs;
    const angle = (3 * Math.PI / 2) + (Math.PI / 2) * t;
    points.push([
      hw - cr + Math.cos(angle) * cr,
      -hh + cr + Math.sin(angle) * cr,
      zOffset
    ]);
  }

  // Top-right corner
  for (let i = 0; i <= cornerSegs; i++) {
    const t = i / cornerSegs;
    const angle = (Math.PI / 2) * t;
    points.push([
      hw - cr + Math.cos(angle) * cr,
      hh - cr + Math.sin(angle) * cr,
      zOffset
    ]);
  }

  // Top-left corner
  for (let i = 0; i <= cornerSegs; i++) {
    const t = i / cornerSegs;
    const angle = (Math.PI / 2) + (Math.PI / 2) * t;
    points.push([
      -hw + cr + Math.cos(angle) * cr,
      hh - cr + Math.sin(angle) * cr,
      zOffset
    ]);
  }

  // Close the loop
  points.push(points[0]);

  return points;
}

// Helper to create rounded rectangle geometry
function createRoundedRectGeometry(
  width: number,
  height: number,
  cornerRadius: number,
  cornerSegs: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const cr = Math.min(cornerRadius, hw * 0.4, hh * 0.4);

  shape.moveTo(-hw + cr, -hh);
  shape.lineTo(hw - cr, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  shape.lineTo(hw, hh - cr);
  shape.quadraticCurveTo(hw, hh, hw - cr, hh);
  shape.lineTo(-hw + cr, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  shape.lineTo(-hw, -hh + cr);
  shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);

  const geo = new THREE.ShapeGeometry(shape, cornerSegs);
  return geo;
}

// Single flat image for rectangular tunnel
function RectTunnelImage({ slot, router }: { slot: RectImageSlot; router: ReturnType<typeof useRouter> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerGroupRef = useRef<THREE.Group>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [outlineOpacity, setOutlineOpacity] = useState(0);
  const { imageData, position, rotation, size } = slot;
  const [width, height] = size;
  const cellMargin = 0.4;
  const actualWidth = width - cellMargin;
  const actualHeight = height - cellMargin;

  // Create rounded rectangle geometry
  const geometry = useMemo(() => {
    return createRoundedRectGeometry(actualWidth, actualHeight, CORNER_RADIUS, CORNER_SEGMENTS);
  }, [actualWidth, actualHeight]);

  // Create outline points with rounded corners and offset
  const outlinePoints = useMemo((): [number, number, number][] => {
    return generateRoundedRectOutline(
      actualWidth + OUTLINE_OFFSET * 2,
      actualHeight + OUTLINE_OFFSET * 2,
      CORNER_RADIUS + OUTLINE_OFFSET * 0.5,
      CORNER_SEGMENTS,
      0.01
    );
  }, [actualWidth, actualHeight]);

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

  // GSAP animation for hover effects (outline + position)
  useEffect(() => {
    const opacityTarget = { value: outlineOpacity };
    gsap.to(opacityTarget, {
      value: isHovered ? 1 : 0,
      duration: 0.25,
      ease: 'power2.out',
      onUpdate: () => setOutlineOpacity(opacityTarget.value),
    });

    // Animate position toward viewer on hover (z moves "up" from the wall surface)
    if (innerGroupRef.current) {
      gsap.to(innerGroupRef.current.position, {
        z: isHovered ? HOVER_OFFSET : 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [isHovered]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (imageData.linkUrl && imageData.linkUrl !== '#') {
      // Reset cursor before navigating
      document.body.style.cursor = 'default';
      setIsHovered(false);
      router.push(imageData.linkUrl);
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setIsHovered(true);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
    setIsHovered(false);
  };

  return (
    <group position={position} rotation={rotation}>
      <group ref={innerGroupRef}>
        <mesh
          ref={meshRef}
          geometry={geometry}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          userData={{ imageId: imageData.id, linkUrl: imageData.linkUrl, metadata: imageData.metadata } as ImageMeshUserData}
        >
          <meshBasicMaterial transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>

        {/* White outline on hover */}
        {outlineOpacity > 0 && (
          <Line
            points={outlinePoints}
            color="#ffffff"
            lineWidth={3}
            transparent
            opacity={outlineOpacity}
          />
        )}
      </group>
    </group>
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
function RectTunnelSegment({ zPos, images, segmentKey, gridMaterialRef, router }: {
  zPos: number;
  images: ImageData[];
  segmentKey: number;
  gridMaterialRef: React.RefObject<THREE.LineBasicMaterial>;
  router: ReturnType<typeof useRouter>;
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
          router={router}
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

  const geometry = useMemo(() => {
    const vertices: number[] = [];

    // Longitudinal lines (running along Z-axis)
    for (let i = 0; i < RADIAL_DIVISIONS; i++) {
      const angle = (i / RADIAL_DIVISIONS) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      vertices.push(x, y, 0, x, y, -d);
    }

    // Ring at z=0 (circular cross-section) - using RING_SEGMENTS for smoothness
    for (let i = 0; i < RING_SEGMENTS; i++) {
      const angle1 = (i / RING_SEGMENTS) * Math.PI * 2;
      const angle2 = ((i + 1) / RING_SEGMENTS) * Math.PI * 2;

      const x1 = Math.cos(angle1) * r;
      const y1 = Math.sin(angle1) * r;
      const x2 = Math.cos(angle2) * r;
      const y2 = Math.sin(angle2) * r;

      vertices.push(x1, y1, 0, x2, y2, 0);
    }

    // Ring at z=-d (back of segment)
    for (let i = 0; i < RING_SEGMENTS; i++) {
      const angle1 = (i / RING_SEGMENTS) * Math.PI * 2;
      const angle2 = ((i + 1) / RING_SEGMENTS) * Math.PI * 2;

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
function CylinderTunnelSegment({ zPos, images, segmentKey, gridMaterialRef, router }: {
  zPos: number;
  images: ImageData[];
  segmentKey: number;
  gridMaterialRef: React.RefObject<THREE.LineBasicMaterial>;
  router: ReturnType<typeof useRouter>;
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
          router={router}
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
export function Tunnel({ imagesRef, scrollY, shape = 'cylinder', router }: TunnelProps) {
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
            router={router}
          />
        ) : (
          <RectTunnelSegment
            key={segment.key}
            zPos={segment.zPos}
            images={images}
            segmentKey={segment.key}
            gridMaterialRef={gridMaterialRef}
            router={router}
          />
        )
      ))}
    </group>
  );
}
