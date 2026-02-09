'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import gsap from 'gsap';
import { Tunnel } from './3d/Tunnel';
import { useImageData } from '@/hooks/useImageData';

export function TunnelHero() {
  useTheme(); // Keep hook for theme system to work
  const contentRef = useRef<HTMLDivElement>(null);
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

  // Text entrance animation
  useEffect(() => {
    if (!contentRef.current || !mounted || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.5 }
      );
    });

    return () => ctx.revert();
  }, [mounted, isLoading]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 w-full h-full bg-white dark:bg-[#050505]" />
    );
  }

  const isReady = mounted && !isLoading;

  return (
    <div
      className="fixed inset-0 w-full h-full bg-white dark:bg-[#050505]"
      style={{ opacity: isReady ? 1 : 0 }}
    >
      {/* Three.js Canvas */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={70} near={0.1} far={1000} />
          <Tunnel imagesRef={imagesRef} scrollY={scrollY} />
        </Canvas>
      </div>

      {/* Hero Content Overlay */}
      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div
          ref={contentRef}
          className="text-center flex flex-col items-center max-w-3xl px-6 pointer-events-none"
        >
          <h1 className="text-[5rem] md:text-[7rem] lg:text-[8rem] leading-[0.85] font-bold tracking-tighter mb-8 text-[#0F0F0F] dark:text-white">
            Clone yourself.
          </h1>

          <p className="text-lg md:text-xl font-normal max-w-lg leading-relaxed mb-10 text-[#6B6B6B] dark:text-gray-400">
            Build the digital version of you to scale your expertise and availability,{' '}
            <span className="text-[#E85D35] font-medium">infinitely</span>
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
