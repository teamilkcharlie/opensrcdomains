'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Tunnel } from './3d/Tunnel';
import { useImageData } from '@/hooks/useImageData';

interface TunnelHeroProps {
  onReady?: (ready: boolean) => void;
}

export function TunnelHero({ onReady }: TunnelHeroProps) {
  useTheme(); // Keep hook for theme system to work
  const scrollYRef = useRef(0);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  const { isLoading, imagesRef } = useImageData();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Wheel-based scrolling (allows negative values for infinite bidirectional scroll)
  useEffect(() => {
    if (!mounted) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollYRef.current += e.deltaY;
      setScrollY(scrollYRef.current);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [mounted]);

  // Notify parent when ready
  const isReady = mounted && !isLoading;
  useEffect(() => {
    onReady?.(isReady);
  }, [isReady, onReady]);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-white dark:bg-[#050505]">
      {/* Three.js Canvas */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={70} near={0.1} far={1000} />
          <Tunnel imagesRef={imagesRef} scrollY={scrollY} />
        </Canvas>
      </div>

      {/* Hero Content Overlay */}
      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="text-center flex flex-col items-center px-6 pointer-events-none">
          <h1 className="text-[5rem] md:text-[7rem] lg:text-[8rem] leading-[0.85] font-bold tracking-tighter mb-8 text-[#0F0F0F] dark:text-white">
            Map the World.
          </h1>

          <p className="text-lg md:text-xl font-normal max-w-2xl leading-relaxed mb-10 text-[#6B6B6B] dark:text-gray-400">
            Turn your indoor spaces into high-quality training data for robots. Join our community to map environments and get rewarded in{' '}
            <span className="text-[#E85D35] font-medium">$AUKI</span>. Your data, open-sourced for the benefit of all.
          </p>

          <div className="flex items-center gap-6 pointer-events-auto">
            <button className="rounded-full px-8 py-3.5 text-sm font-medium hover:scale-105 transition-transform bg-[#0F0F0F] text-white dark:bg-white dark:text-black">
              Contribute
            </button>
            <Link
              href="/example"
              className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 text-[#0F0F0F] dark:text-white"
            >
              See examples <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
