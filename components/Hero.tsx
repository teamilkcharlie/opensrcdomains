import React, { useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { useImageData } from '../hooks/useImageData';
import { ImageData, ImageMeshUserData } from '../types/image';

interface HeroProps {
  isDarkMode: boolean;
}

const Hero: React.FC<HeroProps> = ({ isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Store refs for cleanup and animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const segmentsRef = useRef<THREE.Group[]>([]);
  const scrollPosRef = useRef(0);

  // Raycasting refs for click detection
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Track if Three.js scene has been initialized
  const sceneInitializedRef = useRef(false);

  // Image data from API
  const { isLoading, error, imagesRef } = useImageData();

  // --- CONFIGURATION ---
  const TUNNEL_WIDTH = 24;
  const TUNNEL_HEIGHT = 16;
  const SEGMENT_DEPTH = 6;
  const NUM_SEGMENTS = 14;
  const FLOOR_COLS = 6;
  const WALL_ROWS = 4;
  const COL_WIDTH = TUNNEL_WIDTH / FLOOR_COLS;
  const ROW_HEIGHT = TUNNEL_HEIGHT / WALL_ROWS;

  // Helper: Populate images in a segment using API data
  const populateImages = useCallback((group: THREE.Group, w: number, h: number, d: number) => {
    const textureLoader = new THREE.TextureLoader();
    const cellMargin = 0.4;

    const addImg = (pos: THREE.Vector3, rot: THREE.Euler, wd: number, ht: number) => {
      // Get random image from API data
      const imageData: ImageData = imagesRef.current[Math.floor(Math.random() * imagesRef.current.length)];

      const geom = new THREE.PlaneGeometry(wd - cellMargin, ht - cellMargin);
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });

      textureLoader.load(imageData.imageUrl, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        mat.map = tex;
        mat.needsUpdate = true;
        gsap.to(mat, { opacity: 0.85, duration: 1 });
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.rotation.copy(rot);
      mesh.name = "slab_image";

      // Store image data for click handling
      mesh.userData = {
        imageId: imageData.id,
        linkUrl: imageData.linkUrl,
        metadata: imageData.metadata,
      } as ImageMeshUserData;

      group.add(mesh);
    };

    // Floor
    let lastFloorIdx = -999;
    for (let i = 0; i < FLOOR_COLS; i++) {
      if (i > lastFloorIdx + 1) {
        if (Math.random() > 0.80) {
          addImg(new THREE.Vector3(-w + i*COL_WIDTH + COL_WIDTH/2, -h, -d/2), new THREE.Euler(-Math.PI/2,0,0), COL_WIDTH, d);
          lastFloorIdx = i;
        }
      }
    }

    // Ceiling
    let lastCeilIdx = -999;
    for (let i = 0; i < FLOOR_COLS; i++) {
      if (i > lastCeilIdx + 1) {
        if (Math.random() > 0.88) {
          addImg(new THREE.Vector3(-w + i*COL_WIDTH + COL_WIDTH/2, h, -d/2), new THREE.Euler(Math.PI/2,0,0), COL_WIDTH, d);
          lastCeilIdx = i;
        }
      }
    }

    // Left Wall
    let lastLeftIdx = -999;
    for (let i = 0; i < WALL_ROWS; i++) {
      if (i > lastLeftIdx + 1) {
        if (Math.random() > 0.80) {
          addImg(new THREE.Vector3(-w, -h + i*ROW_HEIGHT + ROW_HEIGHT/2, -d/2), new THREE.Euler(0,Math.PI/2,0), d, ROW_HEIGHT);
          lastLeftIdx = i;
        }
      }
    }

    // Right Wall
    let lastRightIdx = -999;
    for (let i = 0; i < WALL_ROWS; i++) {
      if (i > lastRightIdx + 1) {
        if (Math.random() > 0.80) {
          addImg(new THREE.Vector3(w, -h + i*ROW_HEIGHT + ROW_HEIGHT/2, -d/2), new THREE.Euler(0,-Math.PI/2,0), d, ROW_HEIGHT);
          lastRightIdx = i;
        }
      }
    }
  }, [imagesRef, FLOOR_COLS, WALL_ROWS, COL_WIDTH, ROW_HEIGHT]);

  // Helper: Create a segment with grid lines and filled cells
  const createSegment = useCallback((zPos: number) => {
    const group = new THREE.Group();
    group.position.z = zPos;

    const w = TUNNEL_WIDTH / 2;
    const h = TUNNEL_HEIGHT / 2;
    const d = SEGMENT_DEPTH;

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xb0b0b0, transparent: true, opacity: 0.5 });
    const lineGeo = new THREE.BufferGeometry();
    const vertices: number[] = [];

    // Longitudinal Lines (Z-axis)
    for (let i = 0; i <= FLOOR_COLS; i++) {
      const x = -w + (i * COL_WIDTH);
      vertices.push(x, -h, 0, x, -h, -d);
      vertices.push(x, h, 0, x, h, -d);
    }
    for (let i = 1; i < WALL_ROWS; i++) {
      const y = -h + (i * ROW_HEIGHT);
      vertices.push(-w, y, 0, -w, y, -d);
      vertices.push(w, y, 0, w, y, -d);
    }

    // Latitudinal Lines (Ring at z=0)
    vertices.push(-w, -h, 0, w, -h, 0);
    vertices.push(-w, h, 0, w, h, 0);
    vertices.push(-w, -h, 0, -w, h, 0);
    vertices.push(w, -h, 0, w, h, 0);

    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMaterial);
    group.add(lines);

    populateImages(group, w, h, d);

    return group;
  }, [populateImages, FLOOR_COLS, WALL_ROWS, COL_WIDTH, ROW_HEIGHT]);

  // Click handler for image navigation
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Collect all image meshes from all segments
    const imageMeshes: THREE.Mesh[] = [];
    segmentsRef.current.forEach(segment => {
      segment.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === 'slab_image') {
          imageMeshes.push(child);
        }
      });
    });

    const intersects = raycasterRef.current.intersectObjects(imageMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const userData = clickedMesh.userData as ImageMeshUserData;

      if (userData.linkUrl && userData.linkUrl !== '#') {
        window.open(userData.linkUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, []);

  // Hover handler for cursor change
  const handleCanvasMouseMove = useCallback((event: MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const imageMeshes: THREE.Mesh[] = [];
    segmentsRef.current.forEach(segment => {
      segment.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === 'slab_image') {
          imageMeshes.push(child);
        }
      });
    });

    const intersects = raycasterRef.current.intersectObjects(imageMeshes);

    if (canvasRef.current) {
      canvasRef.current.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }
  }, []);

  // --- INITIAL SETUP ---
  useEffect(() => {
    // Wait for images to load and prevent re-initialization
    if (isLoading || sceneInitializedRef.current) return;
    if (!canvasRef.current || !containerRef.current) return;

    sceneInitializedRef.current = true;

    // THREE JS SETUP
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Generate segments
    const segments: THREE.Group[] = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const z = -i * SEGMENT_DEPTH;
      const segment = createSegment(z);
      scene.add(segment);
      segments.push(segment);
    }
    segmentsRef.current = segments;

    // Apply initial theme based on current isDarkMode state
    const bgHex = isDarkMode ? 0x050505 : 0xffffff;
    const lineHex = isDarkMode ? 0x555555 : 0xb0b0b0;
    const lineOp = isDarkMode ? 0.35 : 0.5;
    scene.background = new THREE.Color(bgHex);
    segments.forEach(segment => {
      segment.children.forEach(child => {
        if (child instanceof THREE.LineSegments) {
          const mat = child.material as THREE.LineBasicMaterial;
          mat.color.setHex(lineHex);
          mat.opacity = lineOp;
          mat.needsUpdate = true;
        }
      });
    });

    // Animation Loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;

      const targetZ = -scrollPosRef.current * 0.05;
      const currentZ = cameraRef.current.position.z;
      cameraRef.current.position.z += (targetZ - currentZ) * 0.1;

      const tunnelLength = NUM_SEGMENTS * SEGMENT_DEPTH;
      const camZ = cameraRef.current.position.z;

      segmentsRef.current.forEach((segment) => {
        // Moving Forward
        if (segment.position.z > camZ + SEGMENT_DEPTH) {
          let minZ = 0;
          segmentsRef.current.forEach(s => minZ = Math.min(minZ, s.position.z));
          segment.position.z = minZ - SEGMENT_DEPTH;

          // Re-populate with fresh images
          const toRemove: THREE.Object3D[] = [];
          segment.traverse((c) => { if (c.name === 'slab_image') toRemove.push(c); });
          toRemove.forEach(c => {
            segment.remove(c);
            if (c instanceof THREE.Mesh) {
              c.geometry.dispose();
              if (c.material.map) c.material.map.dispose();
              c.material.dispose();
            }
          });
          const w = TUNNEL_WIDTH / 2; const h = TUNNEL_HEIGHT / 2; const d = SEGMENT_DEPTH;
          populateImages(segment, w, h, d);
        }

        // Moving Backward
        if (segment.position.z < camZ - tunnelLength - SEGMENT_DEPTH) {
          let maxZ = -999999;
          segmentsRef.current.forEach(s => maxZ = Math.max(maxZ, s.position.z));
          segment.position.z = maxZ + SEGMENT_DEPTH;

          const toRemove: THREE.Object3D[] = [];
          segment.traverse((c) => { if (c.name === 'slab_image') toRemove.push(c); });
          toRemove.forEach(c => {
            segment.remove(c);
            if (c instanceof THREE.Mesh) {
              c.geometry.dispose();
              if (c.material.map) c.material.map.dispose();
              c.material.dispose();
            }
          });
          const w = TUNNEL_WIDTH / 2; const h = TUNNEL_HEIGHT / 2; const d = SEGMENT_DEPTH;
          populateImages(segment, w, h, d);
        }
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // Event listeners
    const onScroll = () => { scrollPosRef.current = window.scrollY; };
    window.addEventListener('scroll', onScroll);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Click and hover handlers
    const canvas = canvasRef.current;
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [isLoading, createSegment, populateImages, handleCanvasClick, handleCanvasMouseMove]);

  // --- THEME UPDATE EFFECT ---
  useEffect(() => {
    if (!sceneRef.current) return;

    const bgHex = isDarkMode ? 0x050505 : 0xffffff;
    const fogHex = isDarkMode ? 0x050505 : 0xffffff;
    const lineHex = isDarkMode ? 0x555555 : 0xb0b0b0;
    const lineOp = isDarkMode ? 0.35 : 0.5;

    sceneRef.current.background = new THREE.Color(bgHex);
    if (sceneRef.current.fog) {
      (sceneRef.current.fog as THREE.FogExp2).color.setHex(fogHex);
    }

    segmentsRef.current.forEach(segment => {
      segment.children.forEach(child => {
        if (child instanceof THREE.LineSegments) {
          const mat = child.material as THREE.LineBasicMaterial;
          mat.color.setHex(lineHex);
          mat.opacity = lineOp;
          mat.needsUpdate = true;
        }
      });
    });
  }, [isDarkMode]);

  // Text Entrance Animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out", delay: 0.5 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-[10000vh] transition-colors duration-700 ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}`}>
          <div className={`animate-pulse text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Loading...
          </div>
        </div>
      )}


      <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div ref={contentRef} className="text-center flex flex-col items-center max-w-3xl px-6 pointer-events-none mix-blend-multiply-normal">

          <h1 className={`text-[5rem] md:text-[7rem] lg:text-[8rem] leading-[0.85] font-bold tracking-tighter mb-8 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-dark'}`}>
            Clone yourself.
          </h1>

          <p className={`text-lg md:text-xl font-normal max-w-lg leading-relaxed mb-10 transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-muted'}`}>
            Build the digital version of you to scale your expertise and availability, <span className="text-accent font-medium">infinitely</span>
          </p>

          <div className="flex items-center gap-6 pointer-events-auto">
            <button className={`rounded-full px-8 py-3.5 text-sm font-medium hover:scale-105 transition-all duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-dark text-white'}`}>
              Try now
            </button>
            <button className={`text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 ${isDarkMode ? 'text-white' : 'text-dark'}`}>
              See examples <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
