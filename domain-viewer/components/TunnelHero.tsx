'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import gsap from 'gsap';
import { Tunnel } from './3d/Tunnel';
import { useImageData } from '@/hooks/useImageData';

type TunnelShape = 'cylinder' | 'rectangle';

interface TunnelHeroProps {
  onReady?: (ready: boolean) => void;
  tunnelShape?: TunnelShape;
}

const ROTATING_WORDS = ['World', 'Space', 'Room', 'Home', 'Future'];

export function TunnelHero({ onReady, tunnelShape = 'cylinder' }: TunnelHeroProps) {
  useTheme(); // Keep hook for theme system to work
  const router = useRouter(); // Must be called outside Canvas for Next.js context
  const scrollYRef = useRef(0);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  const headerRef = useRef<HTMLHeadingElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const wordIndexRef = useRef(0);

  const { isLoading, imagesRef } = useImageData();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // GSAP entrance animation
  useEffect(() => {
    if (!mounted || !headerRef.current) return;

    const tl = gsap.timeline({ delay: 0.3 });

    // Animate header
    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: 60, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }
    );

    // Animate paragraph
    if (paragraphRef.current) {
      tl.fromTo(
        paragraphRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        '-=0.6'
      );
    }

    // Animate buttons
    if (buttonsRef.current) {
      tl.fromTo(
        buttonsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.5'
      );
    }

    return () => {
      tl.kill();
    };
  }, [mounted]);

  // Typewriter word cycling animation
  useEffect(() => {
    if (!mounted || !wordRef.current) return;

    const DELETE_SPEED = 60; // ms per character delete
    const TYPE_SPEED = 100; // ms per character type
    const FADE_DURATION = 0.05; // seconds for fade animation
    const PAUSE_BEFORE_DELETE = 2500; // pause before starting to delete
    const PAUSE_AFTER_DELETE = 300; // pause after delete before typing

    let timeoutId: NodeJS.Timeout;
    let isAnimating = false;

    const deleteWord = (onComplete: () => void) => {
      if (!wordRef.current) {
        onComplete();
        return;
      }

      const spans = wordRef.current.querySelectorAll('span');
      if (spans.length === 0) {
        // Fallback for plain text (initial state)
        const text = wordRef.current.textContent || '';
        if (text.length === 0) {
          onComplete();
          return;
        }
        wordRef.current.textContent = text.slice(0, -1);
        timeoutId = setTimeout(() => deleteWord(onComplete), DELETE_SPEED);
        return;
      }

      const lastSpan = spans[spans.length - 1];
      gsap.to(lastSpan, {
        opacity: 0,
        duration: FADE_DURATION,
        ease: 'power2.out',
        onComplete: () => {
          lastSpan.remove();
          if (wordRef.current && wordRef.current.querySelectorAll('span').length > 0) {
            timeoutId = setTimeout(() => deleteWord(onComplete), DELETE_SPEED);
          } else {
            onComplete();
          }
        },
      });
    };

    const typeWord = (targetWord: string, currentIndex: number, onComplete: () => void) => {
      if (!wordRef.current || currentIndex > targetWord.length) {
        onComplete();
        return;
      }

      if (currentIndex === 1) {
        // Clear any existing content when starting
        wordRef.current.innerHTML = '';
      }

      // Create a new span for the character
      const char = targetWord[currentIndex - 1];
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      wordRef.current.appendChild(span);

      // Fade in the character
      gsap.to(span, {
        opacity: 1,
        duration: FADE_DURATION,
        ease: 'power2.out',
      });

      timeoutId = setTimeout(() => {
        typeWord(targetWord, currentIndex + 1, onComplete);
      }, TYPE_SPEED);
    };

    const cycleWord = () => {
      if (!wordRef.current || isAnimating) return;
      isAnimating = true;

      // Delete current word
      deleteWord(() => {
        // Move to next word
        wordIndexRef.current = (wordIndexRef.current + 1) % ROTATING_WORDS.length;
        const nextWord = ROTATING_WORDS[wordIndexRef.current];

        // Pause then type new word
        timeoutId = setTimeout(() => {
          typeWord(nextWord, 1, () => {
            isAnimating = false;
          });
        }, PAUSE_AFTER_DELETE);
      });
    };

    // Start cycling after initial entrance animation
    const interval = setInterval(cycleWord, PAUSE_BEFORE_DELETE + 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [mounted]);

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
          <Tunnel imagesRef={imagesRef} scrollY={scrollY} shape={tunnelShape} router={router} />
        </Canvas>
      </div>

      {/* Hero Content Overlay */}
      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="text-center flex flex-col items-center px-6 pointer-events-none">
          <h1
            ref={headerRef}
            className="text-[5rem] md:text-[7rem] lg:text-[8rem] leading-[0.85] font-bold tracking-tighter mb-8 text-[#0F0F0F] dark:text-white opacity-0"
          >
            Map the <span ref={wordRef} className="inline-block" >World</span><span className="animate-[blink_1.2s_ease-in-out_infinite] font-bold">.</span>
          </h1>

          <p
            ref={paragraphRef}
            className="text-lg md:text-xl font-normal max-w-2xl leading-relaxed mb-10 text-[#6B6B6B] dark:text-gray-400 opacity-0"
          >
            Turn your spaces into high-quality training data for robots. Join our community to map environments and get rewarded in{' '}
            <span className="text-[#E85D35] font-medium">$AUKI</span>. Your data, open-sourced for the benefit of all.
          </p>

          <div ref={buttonsRef} className="flex items-center gap-6 pointer-events-auto opacity-0">
            <Link
              href="/how-to-contribute"
              className="rounded-full px-8 py-3.5 text-sm font-medium hover:scale-105 transition-transform bg-[#0F0F0F] text-white dark:bg-white dark:text-black"
            >
              Contribute
            </Link>
            <Link
              href="/example"
              className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 text-[#0F0F0F] dark:text-white"
            >
              Explore <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
