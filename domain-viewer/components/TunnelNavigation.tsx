'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type TunnelShape = 'cylinder' | 'rectangle';

interface TunnelNavigationProps {
  tunnelShape?: TunnelShape;
  onToggleTunnelShape?: () => void;
}

export function TunnelNavigation({ tunnelShape, onToggleTunnelShape }: TunnelNavigationProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-transparent pointer-events-none">
        <div className="min-w-[160px]">
          <Link href="/" className="text-lg font-medium tracking-tight pointer-events-auto cursor-pointer flex items-center gap-2">
            <Image src="/images/LogoIcon.svg" alt="OpenWorld" width={36} height={36} className="dark:invert" />
            OpenWorld
          </Link>
        </div>
      </nav>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { label: 'How to Contribute', href: '/how-to-contribute' },
    { label: 'Claim Rewards', href: '#' },
    { label: 'Explore Dataset', href: '/8093f9bf-c374-4162-ab74-ab61949627f1' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-transparent pointer-events-none">
      {/* Logo - with min-width to balance with CTA */}
      <div className="min-w-[160px]">
        <Link href="/" className="text-lg font-medium tracking-tight pointer-events-auto cursor-pointer flex items-center gap-1 text-black dark:text-white w-fit">
          <Image src="/images/LogoIcon.svg" alt="OpenWorld" width={28} height={28} className="dark:invert" />
          OpenWorld
        </Link>
      </div>

      {/* Center Links & Toggle */}
      <div className="hidden md:flex items-center gap-4 bg-black/10 dark:bg-white/10 backdrop-blur-md pl-6 pr-2 py-2 rounded-full pointer-events-auto">
        <div className="flex items-center gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-black hover:text-gray-600 dark:text-white dark:hover:text-gray-300 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-black dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors"
          aria-label="Toggle theme"
        >
          {/* Sun icon (shown in dark mode) */}
          <svg className="hidden dark:block" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          {/* Moon icon (shown in light mode) */}
          <svg className="block dark:hidden" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>

      {/* CTA - with min-width to balance with logo */}
      <div className="pointer-events-auto min-w-[160px] flex justify-end">
        <button className="px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1 group bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors">
          Download Dataset <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>
    </nav>
  );
}
