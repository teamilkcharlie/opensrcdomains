'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface VisibilityControlsProps {
  portalsVisible: boolean;
  navMeshVisible: boolean;
  occlusionVisible: boolean;
  pointCloudVisible: boolean;
  onTogglePortals: () => void;
  onToggleNavMesh: () => void;
  onToggleOcclusion: () => void;
  onTogglePointCloud: () => void;
}

interface VisibilityOption {
  id: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
  color: string;
}

export function VisibilityControls({
  portalsVisible,
  navMeshVisible,
  occlusionVisible,
  pointCloudVisible,
  onTogglePortals,
  onToggleNavMesh,
  onToggleOcclusion,
  onTogglePointCloud,
}: VisibilityControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options: VisibilityOption[] = [
    { id: 'pointcloud', label: 'Point Cloud', visible: pointCloudVisible, onToggle: onTogglePointCloud, color: '#22c55e' },
    { id: 'portals', label: 'Portals', visible: portalsVisible, onToggle: onTogglePortals, color: '#3b82f6' },
    { id: 'navmesh', label: 'Nav Mesh', visible: navMeshVisible, onToggle: onToggleNavMesh, color: '#f59e0b' },
    { id: 'occlusion', label: 'Occlusion', visible: occlusionVisible, onToggle: onToggleOcclusion, color: '#ef4444' },
  ];

  const visibleCount = options.filter(o => o.visible).length;

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
          width: '200px',
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

          const items = listRef.current.querySelectorAll('[data-visibility-item]');
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

  if (!mounted) return null;

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
          <div className="relative">
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {visibleCount < 4 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                {visibleCount}
              </div>
            )}
          </div>
        ) : (
          <span ref={titleRef} className="text-sm font-medium text-black dark:text-white px-4 opacity-0">Visibility</span>
        )}
      </div>

      {/* Expanded view - visibility toggles */}
      {isExpanded && (
        <div ref={listRef} className="p-2">
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.id}
                data-visibility-item
                onClick={(e) => {
                  e.stopPropagation();
                  option.onToggle();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  option.visible
                    ? 'bg-black/10 dark:bg-white/20 text-black dark:text-white'
                    : 'text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: option.visible ? option.color : '#666' }}
                  />
                  <span>{option.label}</span>
                </div>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  option.visible
                    ? 'border-current bg-current'
                    : 'border-current'
                }`}>
                  {option.visible && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={option.visible ? '#fff' : 'currentColor'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
