'use client';

import { TunnelNavigation } from '@/components/TunnelNavigation';
import Link from 'next/link';

export default function HowToContributePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white">
      <TunnelNavigation />

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Hero section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            How to Contribute
          </h1>
          <div className="w-16 h-1 bg-black dark:bg-white rounded-full" />
        </div>

        {/* Introduction */}
        <div className="space-y-6 text-lg leading-relaxed text-black/80 dark:text-white/80 mb-16">
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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
            How to participate
          </h2>

          {/* What you'll need */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
              What you'll need
            </h3>
            <ul className="space-y-3 text-black/80 dark:text-white/80">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2.5 flex-shrink-0" />
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
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2.5 flex-shrink-0" />
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
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
              What to do
            </h3>
            <ol className="space-y-6 text-black/80 dark:text-white/80">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-black dark:text-white">
                  1
                </span>
                <div className="pt-1">
                  Choose an indoor location that you have permission to film in and is appropriate to open source.
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-black dark:text-white">
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
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-sm">
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
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-black dark:text-white">
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
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-black dark:text-white">
                  4
                </span>
                <div className="pt-1">
                  Fill out the form with some basic info including your domain details and EVM wallet address for receiving $AUKI.
                </div>
              </li>
            </ol>
          </div>

          {/* How much you'll earn */}
          <div className="bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 rounded-2xl p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
              How much you'll earn
            </h3>
            <p className="text-black/60 dark:text-white/60 italic">
              Reward details coming soon...
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8 border-t border-black/10 dark:border-white/10">
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
