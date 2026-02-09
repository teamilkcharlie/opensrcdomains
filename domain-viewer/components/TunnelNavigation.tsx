'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function TunnelNavigation() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-transparent pointer-events-none">
        <Link href="/" className="text-lg font-medium tracking-tight pointer-events-auto cursor-pointer flex items-center gap-1">
          <span className="font-serif italic text-xl mr-1">⌘</span> OpenWorld
        </Link>
      </nav>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { label: 'How to contribute', href: '/how-to-contribute' },
    { label: 'Rewards', href: '#' },
    { label: 'Disclaimer', href: '#' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-transparent pointer-events-none">
      {/* Logo */}
      <Link href="/" className="text-lg font-medium tracking-tight pointer-events-auto cursor-pointer flex items-center gap-1 text-black dark:text-white">
        <span className="font-serif italic text-xl mr-1">⌘</span> OpenWorld
      </Link>

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

      {/* CTA */}
      <div className="pointer-events-auto">
        <button className="px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1 group bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors">
          Get the dataset <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>
    </nav>
  );
}
