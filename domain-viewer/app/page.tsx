'use client';

import { TunnelHero } from '@/components/TunnelHero';
import { TunnelNavigation } from '@/components/TunnelNavigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Home() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === 'dark' : true;

  return (
    <div className={`min-h-screen transition-colors duration-700 overflow-hidden ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-slate-900'}`}>
      <TunnelNavigation />
      <main>
        <TunnelHero />
      </main>

      {/* Footer */}
      <footer className={`fixed bottom-4 right-6 text-[10px] pointer-events-none z-50 transition-colors duration-500 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
        <p>&copy; {new Date().getFullYear()} OpenSrc Domains</p>
      </footer>
    </div>
  );
}
