"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";

// Domain loader — populates Jotai atoms with domain data
import DomainLoader from "@/components/domain/DomainLoader";

// UI components
import { DomainDetailsPanel } from "@/components/DomainDetailsPanel";
import { DomainSelector } from "@/components/DomainSelector";
import { TunnelNavigation } from "@/components/TunnelNavigation";
import { VisibilityControls } from "@/components/VisibilityControls";
import Viewer3D from "@/components/Viewer3D";

// Jotai stores — read loaded data and visibility state
import {
  domainDataAtom,
  isLoadingAtom,
  isInIframeAtom,
} from "@/store/domainStore";
import {
  portalsVisibleAtom,
  navMeshVisibleAtom,
  occlusionVisibleAtom,
  pointCloudVisibleAtom,
} from "@/store/visualizationStore";

export const maxDuration = 60;

/**
 * Main domain viewer page component.
 *
 * Renders <DomainLoader> to populate Jotai atoms via React Query,
 * then reads atom values for the 3D viewer and UI controls.
 */
export default function DomainPage({
  params,
  hideUI = false,
}: {
  params: { id: string };
  hideUI?: boolean;
}) {
  const [currentDomainId, setCurrentDomainId] = useState(params.id);

  // Read state from Jotai atoms (populated by DomainLoader)
  const domainData = useAtomValue(domainDataAtom);
  const isLoading = useAtomValue(isLoadingAtom);
  const isInIframe = useAtomValue(isInIframeAtom);

  // Visibility toggles
  const [portalsVisible, setPortalsVisible] = useAtom(portalsVisibleAtom);
  const [navMeshVisible, setNavMeshVisible] = useAtom(navMeshVisibleAtom);
  const [occlusionVisible, setOcclusionVisible] = useAtom(occlusionVisibleAtom);
  const [pointCloudVisible, setPointCloudVisible] = useAtom(pointCloudVisibleAtom);

  // Sync with URL params
  useEffect(() => {
    if (params.id !== currentDomainId) {
      setCurrentDomainId(params.id);
    }
  }, [params.id]);

  // Handle domain change from selector
  const handleDomainChange = useCallback(
    (newDomainId: string) => {
      if (newDomainId !== currentDomainId) {
        setCurrentDomainId(newDomainId);
        window.history.pushState({}, "", `/${newDomainId}`);
      }
    },
    [currentDomainId]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white dark:bg-[#050505]">
      {/* DomainLoader fetches data via React Query and hydrates Jotai atoms */}
      <DomainLoader domainId={currentDomainId} />

      {!hideUI && !isInIframe && <TunnelNavigation />}

      <Viewer3D isEmbed={isInIframe} />

      {!hideUI && !isInIframe && (
        <>
          {/* Bottom bar with controls */}
          <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
            <div className="flex items-end justify-center gap-3 px-6">
              {/* Left side - Visibility Controls */}
              <div className="pointer-events-auto">
                <VisibilityControls
                  portalsVisible={portalsVisible}
                  navMeshVisible={navMeshVisible}
                  occlusionVisible={occlusionVisible}
                  pointCloudVisible={pointCloudVisible}
                  onTogglePortals={() => setPortalsVisible(!portalsVisible)}
                  onToggleNavMesh={() => setNavMeshVisible(!navMeshVisible)}
                  onToggleOcclusion={() => setOcclusionVisible(!occlusionVisible)}
                  onTogglePointCloud={() => setPointCloudVisible(!pointCloudVisible)}
                />
              </div>

              {/* Center - Domain Selector */}
              <div className="pointer-events-auto">
                <DomainSelector
                  currentDomainId={currentDomainId}
                  currentDomainName={domainData?.domainInfo?.name}
                  onDomainChange={handleDomainChange}
                  isDomainLoading={isLoading}
                />
              </div>

              {/* Right side - Domain Details */}
              <div className="pointer-events-auto">
                <DomainDetailsPanel
                  domainInfo={domainData?.domainInfo ?? null}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
