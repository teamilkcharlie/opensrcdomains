'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface DomainInfo {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
}

interface DomainDetailsPanelProps {
  domainInfo: DomainInfo | null;
  isLoading?: boolean;
}

export function DomainDetailsPanel({ domainInfo, isLoading }: DomainDetailsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContainerClick = () => {
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
          width: '280px',
          duration: 0.3,
          ease: 'power2.out',
        });

        if (titleRef.current) {
          tl.fromTo(
            titleRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.2, ease: 'power2.out' },
            '-=0.1'
          );
        }

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

          const items = listRef.current.querySelectorAll('[data-detail-item]');
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
          width: '48px',
          duration: 0.25,
          ease: 'power2.inOut',
        },
        '-=0.2'
      );
    }
  }, [isExpanded]);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!mounted) return null;

  const details = domainInfo ? [
    { label: 'Domain ID', value: domainInfo.id, copyable: true },
    { label: 'Name', value: domainInfo.name },
    { label: 'Created', value: formatDate(domainInfo.createdAt) },
    { label: 'Updated', value: formatDate(domainInfo.updatedAt) },
  ] : [];

  return (
    <div
      ref={containerRef}
      onClick={!isExpanded ? handleContainerClick : undefined}
      className="bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-[24px] cursor-pointer overflow-hidden"
      style={{
        width: '48px',
        height: '48px',
      }}
    >
      {/* Collapsed view - icon button */}
      <div
        className={`flex items-center justify-center h-12 ${isExpanded ? 'border-b border-black/10 dark:border-white/10' : ''}`}
      >
        {!isExpanded ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black dark:text-white"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        ) : (
          <span ref={titleRef} className="text-sm font-medium text-black dark:text-white px-4 opacity-0">Domain Info</span>
        )}
      </div>

      {/* Expanded view - domain details */}
      {isExpanded && (
        <div ref={listRef} className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : !domainInfo ? (
            <div className="text-center py-4 text-sm text-black/60 dark:text-white/60">
              No domain info available
            </div>
          ) : (
            <div className="space-y-2">
              {details.map((detail, index) => (
                <div
                  key={detail.label}
                  data-detail-item
                  className="flex flex-col gap-0.5"
                >
                  <span className="text-xs text-black/50 dark:text-white/50">{detail.label}</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-black dark:text-white truncate flex-1">
                      {detail.value}
                    </span>
                    {detail.copyable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(detail.value);
                        }}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black/50 dark:text-white/50"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {index < details.length - 1 && (
                    <div className="border-b border-black/5 dark:border-white/5 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
