'use client';

import { TunnelNavigation } from '@/components/TunnelNavigation';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function HowToContributePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const sectionTitleRef = useRef<HTMLHeadingElement>(null);
  const requirementsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const rewardsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const intro = introRef.current;
    const sectionTitle = sectionTitleRef.current;
    const requirements = requirementsRef.current;
    const steps = stepsRef.current;
    const rewards = rewardsRef.current;
    const cta = ctaRef.current;

    if (!hero || !intro || !requirements || !steps || !rewards || !cta) return;

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

      // Intro paragraphs stagger
      const introPs = intro.querySelectorAll('p');
      if (introPs.length) {
        gsap.fromTo(
          introPs,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            delay: 0.4,
          }
        );
      }

      // Section title animation
      if (sectionTitle) {
        gsap.fromTo(
          sectionTitle,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.7 }
        );
      }

      // Requirements section
      const reqH3 = requirements.querySelector('h3');
      const reqLis = requirements.querySelectorAll('li');
      if (reqH3) {
        gsap.fromTo(
          reqH3,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', delay: 0.8 }
        );
      }
      if (reqLis.length) {
        gsap.fromTo(
          reqLis,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            delay: 0.9,
          }
        );
      }

      // Steps section with staggered entrance
      const stepsH3 = steps.querySelector('h3');
      const stepsLis = steps.querySelectorAll('li');
      if (stepsH3) {
        gsap.fromTo(
          stepsH3,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', delay: 1.1 }
        );
      }
      if (stepsLis.length) {
        gsap.fromTo(
          stepsLis,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power3.out',
            delay: 1.2,
          }
        );
      }

      // Rewards card with scale animation
      gsap.fromTo(
        rewards,
        { opacity: 0, scale: 0.95, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          delay: 1.6,
        }
      );

      // CTA buttons
      const ctaAs = cta.querySelectorAll('a');
      if (ctaAs.length) {
        gsap.fromTo(
          ctaAs,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            delay: 1.9,
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
            How to Contribute
          </h1>
          <div className="w-16 h-1 bg-black dark:bg-white rounded-full" />
        </div>

        {/* Introduction */}
        <div ref={introRef} className="space-y-6 text-lg leading-relaxed text-black/80 dark:text-white/80 mb-16">
          <p>
            Robots struggle to get deployed at scale because they don't understand the real world spaces we want them to work in. The real world web helps tremendously in that regard, but of course the Auki team is only a small subset of the robotics community working on this problem.
          </p>
          <p>
            One of the biggest bottlenecks holding back broader progress is the lack of high quality, diverse indoor environment data. Kitchens, offices, hotel rooms — these are all places where we expect robots to operate in, but what datasets exist are often proprietary or not captured in a way that's useful to robotics researchers.
          </p>
          <p>
            That's why we're launching a community initiative where you can earn <span className="font-semibold text-black dark:text-white">$AUKI</span> while helping us collectively build one of the world's largest and most diverse datasets of indoor environment scans. And we'll open-source all of it on Hugging Face for researchers, developers, and robotics labs worldwide.
          </p>
        </div>

        {/* How to participate section */}
        <section className="mb-16">
          <h2 ref={sectionTitleRef} className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
            How to participate
          </h2>

          {/* What you'll need */}
          <div ref={requirementsRef} className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
              What you'll need
            </h3>
            <ul className="space-y-3 text-black/80 dark:text-white/80">
              <li className="flex items-start gap-3 group/item">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2.5 flex-shrink-0 transition-transform duration-300 group-hover/item:scale-150" />
                <span>
                  An iPhone running iOS 16+ and our{' '}
                  <a
                    href="https://apps.apple.com/app/domain-management-tool/id6499270503"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    DMT app
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3 group/item">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2.5 flex-shrink-0 transition-transform duration-300 group-hover/item:scale-150" />
                <span>
                  A{' '}
                  <a
                    href="https://store.auki.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    portal kit from our store
                  </a>
                  {' '}or a printer to print your own portal QR codes
                </span>
              </li>
            </ul>
          </div>

          {/* What to do */}
          <div ref={stepsRef} className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
              What to do
            </h3>
            <ol className="space-y-6 text-black/80 dark:text-white/80">
              <li className="flex gap-4 group">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-black dark:text-white transition-colors duration-300 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  1
                </span>
                <div className="pt-1">
                  Choose an indoor location that you have permission to film in and is appropriate to open source.
                </div>
              </li>
              <li className="flex gap-4 group">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-black dark:text-white transition-colors duration-300 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  2
                </span>
                <div className="pt-1">
                  <p className="mb-3">
                    Follow{' '}
                    <a
                      href="https://www.auki.com/posemesh/domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      steps 1-4 of these instructions
                    </a>
                    {' '}on how to create a domain using the DMT app.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-sm transition-colors duration-300 hover:border-amber-300 dark:hover:border-amber-600">
                    <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Important</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      When selecting a domain server, use the Auki-hosted server:{' '}
                      <code className="bg-amber-100 dark:bg-amber-800/30 px-1.5 py-0.5 rounded text-xs font-mono break-all">
                        https://open-source-domains.aukiverse.com/
                      </code>
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-2">
                      Use the Capture flow for adding portals to your domain.
                    </p>
                  </div>
                </div>
              </li>
              <li className="flex gap-4 group">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-black dark:text-white transition-colors duration-300 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  3
                </span>
                <div className="pt-1">
                  After reconstruction is complete, you can view your domain here:{' '}
                  <Link
                    href="/example"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Domain Viewer
                  </Link>
                </div>
              </li>
              <li className="flex gap-4 group">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-black dark:text-white transition-colors duration-300 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  4
                </span>
                <div className="pt-1">
                  Fill out the form with some basic info including your domain details and EVM wallet address for receiving $AUKI.
                </div>
              </li>
            </ol>
          </div>

          {/* How much you'll earn */}
          <div ref={rewardsRef} className="relative bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 rounded-2xl p-6 md:p-8 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white relative z-10">
              How much you'll earn
            </h3>
            <p className="text-black/60 dark:text-white/60 italic relative z-10">
              Reward details coming soon...
            </p>
          </div>
        </section>

        {/* CTA */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8 border-t border-black/10 dark:border-white/10">
          <a
            href="https://apps.apple.com/app/domain-management-tool/id6499270503"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 group bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
          >
            Download DMT App
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
          <a
            href="https://store.auki.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 group border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Get Portal Kit
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        </div>
      </main>
    </div>
  );
}
