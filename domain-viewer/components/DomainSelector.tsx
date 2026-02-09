'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { DomainListItem } from '@/app/actions';

interface DomainSelectorProps {
  currentDomainId: string;
  currentDomainName?: string;
  onDomainChange?: (domainId: string) => void;
  isDomainLoading?: boolean;
}

export function DomainSelector({ currentDomainId, currentDomainName, onDomainChange, isDomainLoading = false }: DomainSelectorProps) {
  const [domains, setDomains] = useState<DomainListItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const loadingIndicatorRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    loadDomains();
  }, [currentDomainId]);

  // Animate loading indicator
  useEffect(() => {
    if (!mounted) return;

    // Use requestAnimationFrame to ensure DOM is ready
    const animateIndicator = () => {
      if (!loadingIndicatorRef.current) return;

      const wasLoading = prevLoadingRef.current;
      const isFirstMount = wasLoading === null;

      if (isDomainLoading && (isFirstMount || !wasLoading)) {
        // Animate in
        gsap.to(loadingIndicatorRef.current, {
          opacity: 1,
          width: 20,
          marginRight: 4,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      } else if (!isDomainLoading && wasLoading) {
        // Animate out
        gsap.to(loadingIndicatorRef.current, {
          opacity: 0,
          width: 0,
          marginRight: 0,
          scale: 0.8,
          duration: 0.25,
          ease: 'power2.inOut',
        });
      }

      prevLoadingRef.current = isDomainLoading;
    };

    requestAnimationFrame(animateIndicator);
  }, [isDomainLoading, mounted]);

  const loadDomains = async () => {
    setIsLoading(true);
    setError(null);

    // TODO: Replace with actual API call when endpoint is available
    // For now, use placeholder data for UI testing - all using the same real domain ID
    const testDomainId = '8093f9bf-c374-4162-ab74-ab61949627f1';
    const placeholderDomains: DomainListItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: testDomainId,
      name: i === 0 ? (currentDomainName || `Domain Space ${i + 1}`) : `Domain Space ${i + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 300));

    setDomains(placeholderDomains);
    setIsLoading(false);
  };

  // Find current domain index
  const currentIndex = domains.findIndex((d) => d.id === currentDomainId);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (domains.length === 0) return;
    const prevIndex = currentIndex <= 0 ? domains.length - 1 : currentIndex - 1;
    navigateToDomain(domains[prevIndex].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (domains.length === 0) return;
    const nextIndex = currentIndex >= domains.length - 1 ? 0 : currentIndex + 1;
    navigateToDomain(domains[nextIndex].id);
  };

  const navigateToDomain = (domainId: string) => {
    if (onDomainChange) {
      onDomainChange(domainId);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-arrow]')) return;
    toggleExpand();
  };

  const toggleExpand = useCallback(() => {
    if (!containerRef.current) return;

    if (!isExpanded) {
      setIsExpanded(true);

      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const tl = gsap.timeline();

        tl.to(containerRef.current, {
          width: 'min(400px, 90vw)',
          duration: 0.3,
          ease: 'power2.out',
        });

        tl.to(
          containerRef.current,
          {
            height: 'auto',
            duration: 0.4,
            ease: 'power3.out',
          },
          '-=0.1'
        );

        if (listRef.current) {
          tl.fromTo(
            listRef.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
            '-=0.2'
          );

          const items = listRef.current.querySelectorAll('[data-domain-item]');
          if (items.length > 0) {
            tl.fromTo(
              items,
              { opacity: 0, x: -10 },
              { opacity: 1, x: 0, stagger: 0.03, duration: 0.2, ease: 'power2.out' },
              '-=0.2'
            );
          }
        }
      });
    } else {
      const tl = gsap.timeline({
        onComplete: () => setIsExpanded(false),
      });

      if (listRef.current) {
        tl.to(listRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.2,
          ease: 'power2.in',
        });
      }

      tl.to(
        containerRef.current,
        {
          height: '48px',
          duration: 0.3,
          ease: 'power3.inOut',
        },
        listRef.current ? '-=0.1' : 0
      );

      tl.to(
        containerRef.current,
        {
          width: 'min(320px, 85vw)',
          duration: 0.25,
          ease: 'power2.inOut',
        },
        '-=0.2'
      );
    }
  }, [isExpanded]);

  const handleSelectDomain = (domainId: string) => {
    if (containerRef.current && listRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsExpanded(false);
          navigateToDomain(domainId);
        },
      });

      tl.to(listRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.15,
        ease: 'power2.in',
      });

      tl.to(containerRef.current, {
        height: '48px',
        width: 'min(320px, 85vw)',
        duration: 0.25,
        ease: 'power3.inOut',
      });
    } else {
      navigateToDomain(domainId);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isExpanded && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        toggleExpand();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, toggleExpand]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        toggleExpand();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded, toggleExpand]);

  if (!mounted) return null;

  const displayName = currentDomainName || (domains.find((d) => d.id === currentDomainId)?.name) || (isLoading ? 'Loading...' : 'Unknown Domain');

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-[24px] cursor-pointer overflow-hidden"
      style={{
        width: 'min(320px, 85vw)',
        height: '48px',
      }}
    >
      {/* Collapsed view - pill */}
      <div
        className={`flex items-center justify-between px-4 h-12 ${isExpanded ? 'border-b border-black/10 dark:border-white/10' : ''}`}
      >
        {/* Left arrow */}
        <button
          data-arrow
          onClick={handlePrevious}
          disabled={isLoading || domains.length === 0}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous domain"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black dark:text-white"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Domain name */}
        <div className="flex-1 text-center px-4 min-w-0">
          <div className="flex items-center justify-center">
            <div
              ref={loadingIndicatorRef}
              className="flex-shrink-0 overflow-hidden"
              style={{ opacity: 0, width: 0, marginRight: 0 }}
            >
              <div className="w-4 h-4 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
            </div>
            <span className="text-sm font-medium text-black dark:text-white truncate">
              {displayName}
            </span>
          </div>
          {error && (
            <span className="text-xs text-red-500 truncate block">
              {error}
            </span>
          )}
        </div>

        {/* Right arrow */}
        <button
          data-arrow
          onClick={handleNext}
          disabled={isLoading || domains.length === 0}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next domain"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black dark:text-white"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Expanded view - domain list */}
      {isExpanded && (
        <div ref={listRef} className="p-2 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="text-sm text-red-500 mb-2">{error}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadDomains();
                }}
                className="text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white underline"
              >
                Retry
              </button>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-4 text-sm text-black/60 dark:text-white/60">
              No domains available
            </div>
          ) : (
            <div className="space-y-1">
              {domains.map((domain, index) => (
                <button
                  key={`${domain.id}-${index}`}
                  data-domain-item
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDomain(domain.id);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    domain.id === currentDomainId
                      ? 'bg-black/10 dark:bg-white/20 text-black dark:text-white font-medium'
                      : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <div className="truncate">{domain.name}</div>
                  {domain.id === currentDomainId && (
                    <div className="text-xs text-black/50 dark:text-white/50 mt-0.5">Current</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
