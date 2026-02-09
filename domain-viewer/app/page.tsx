'use client';

import { TunnelHero } from '@/components/TunnelHero';
import { TunnelNavigation } from '@/components/TunnelNavigation';
import { useTheme } from 'next-themes';
import gsap from 'gsap';
import { useCallback, useEffect, useRef, useState } from 'react';

export type TunnelShape = 'cylinder' | 'rectangle';

export default function Home() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [tunnelShape, setTunnelShape] = useState<TunnelShape>('cylinder');
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContentReady = useCallback((ready: boolean) => {
    setContentReady(ready);
  }, []);

  // GSAP fade-in animation when content is ready
  useEffect(() => {
    if (mounted && contentReady && contentRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      gsap.fromTo(
        contentRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.7, ease: 'power2.out' }
      );
    }
  }, [mounted, contentReady]);

  const isDark = mounted ? theme === 'dark' : true;

  return (
    <div className={`min-h-screen overflow-hidden ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-slate-900'}`}>
      {/* Everything fades in together */}
      <div ref={contentRef} style={{ opacity: 0 }}>
        <TunnelNavigation tunnelShape={tunnelShape} onToggleTunnelShape={() => setTunnelShape(s => s === 'cylinder' ? 'rectangle' : 'cylinder')} />
        <main>
          <TunnelHero onReady={handleContentReady} tunnelShape={tunnelShape} />
        </main>

      </div>
    </div>
  );
}
