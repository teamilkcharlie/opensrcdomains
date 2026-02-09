'use client';

import { TunnelNavigation } from '@/components/TunnelNavigation';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function DisclaimerPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const content = contentRef.current;

    if (!hero || !content) return;

    const ctx = gsap.context(() => {
      // Hero animation
      const heroH1 = hero.querySelector('h1');
      const heroDiv = hero.querySelector('div');

      if (heroH1 && heroDiv) {
        const heroTl = gsap.timeline();
        heroTl
          .fromTo(
            heroH1,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
          )
          .fromTo(
            heroDiv,
            { scaleX: 0, transformOrigin: 'left' },
            { scaleX: 1, duration: 0.6, ease: 'power2.out' },
            '-=0.3'
          );
      }

      // Content paragraphs stagger
      const contentPs = content.querySelectorAll('p');
      if (contentPs.length) {
        gsap.fromTo(
          contentPs,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.2,
            ease: 'power2.out',
            delay: 0.5,
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white relative">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-300"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="fixed inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Fade overlay at top and bottom */}
      <div className="fixed inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-white to-transparent dark:from-[#050505]" />
      <div className="fixed inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-t from-white to-transparent dark:from-[#050505]" />

      <TunnelNavigation />

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Hero section */}
        <div ref={heroRef} className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            A note on data collection
          </h1>
          <div className="w-16 h-1 bg-black dark:bg-white rounded-full" />
        </div>

        {/* Content */}
        <div ref={contentRef} className="space-y-8 text-lg leading-relaxed text-black/80 dark:text-white/80">
          <p>
            If you've been following Auki for a while, you'll know that we are not a data collection company. Everything we do stems from an urgent calling to provide an alternative to the future where centralized entities collect the world's private spatial data in exchange for providing positioning services to the robots and machines that will be ubiquitous in our lives.
          </p>
          <p>
            By default, you own your spatial data on the real world web. This specific community initiative is opt-in, transparent, and purposely designed for open research. By contributing, you choose to share your data with the knowledge that it will be open sourced.
          </p>
          <p>
            If we succeed in building this immense dataset, it'll help bridge the gap between robotics research and real world deployment. It'll also give a new meaning to one of our favorite phrases: <span className="font-semibold text-black dark:text-white">"collaborative spatial computing."</span>
          </p>
        </div>
      </main>
    </div>
  );
}
