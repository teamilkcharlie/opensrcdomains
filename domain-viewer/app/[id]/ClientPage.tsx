"use client";

import { fetchDomainInfo } from "@/app/actions";
import { DomainDetailsPanel } from "@/components/DomainDetailsPanel";
import { DomainSelector } from "@/components/DomainSelector";
import { TunnelNavigation } from "@/components/TunnelNavigation";
import { VisibilityControls } from "@/components/VisibilityControls";
import Viewer3D from "@/components/Viewer3D";
import PosemeshClientApi, { Portal } from "@/utils/posemeshClientApi";
import { useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import {
  portalsVisibleAtom,
  navMeshVisibleAtom,
  occlusionVisibleAtom,
  pointCloudVisibleAtom,
} from "@/store/visualizationStore";

export const maxDuration = 60;

interface DomainData {
  domainInfo: any;
  domainAccessToken: string;
  domainServerUrl: string;
}

/**
 * Main domain viewer page component that handles loading and displaying domain data.
 * This component manages the state for all domain-related data including point clouds,
 * portals, navigation meshes, and occlusion meshes.
 */
export default function DomainPage({ params, hideUI = false }: { params: { id: string }, hideUI?: boolean }) {
  const [currentDomainId, setCurrentDomainId] = useState(params.id);
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [pointCloudData, setPointCloudData] = useState<ArrayBuffer | null>(null);
  const [portals, setPortals] = useState<Portal[] | null>(null);
  const [navMeshData, setNavMeshData] = useState<ArrayBuffer | null>(null);
  const [occlusionMeshData, setOcclusionMeshData] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portalsVisible, setPortalsVisible] = useAtom(portalsVisibleAtom);
  const [navMeshVisible, setNavMeshVisible] = useAtom(navMeshVisibleAtom);
  const [occlusionVisible, setOcclusionVisible] = useAtom(occlusionVisibleAtom);
  const [pointCloudVisible, setPointCloudVisible] = useAtom(pointCloudVisibleAtom);
  const [alignmentMatrix, setAlignmentMatrix] = useState<number[] | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Detect if page is loaded in an iframe (e.g., Twitter embed)
    setIsInIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
    loadAllDomainData(currentDomainId);
  }, [currentDomainId]);

  // Sync with URL params
  useEffect(() => {
    if (params.id !== currentDomainId) {
      setCurrentDomainId(params.id);
    }
  }, [params.id]);

  /**
   * Loads all domain data for a given domain ID including:
   * - Domain information and access tokens
   * - Portal locations
   * - Navigation mesh
   * - Occlusion mesh
   * - Point cloud data
   *
   * @param domainId - The unique identifier for the domain to load
   */
  const loadAllDomainData = async (domainId: string) => {
    setIsLoading(true);
    // Clear previous data
    setDomainData(null);
    setPointCloudData(null);
    setPortals(null);
    setNavMeshData(null);
    setOcclusionMeshData(null);
    setAlignmentMatrix(null);

    try {
      const clientApi = new PosemeshClientApi();

      // First, get domain info
      const result = await fetchDomainInfo(
        domainId,
        clientApi.posemeshClientId
      );
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch domain info");
      }

      const data = result.data;
      setDomainData(data);

      // Get domain portals
      const portals = await clientApi.fetchDomainPortals(
        data.domainServerUrl,
        data.domainInfo.id,
        data.domainAccessToken
      );
      setPortals(portals);

      // Get domain all domain data info
      const domainData = await clientApi.fetchDomainData(
        data.domainServerUrl,
        data.domainInfo.id,
        data.domainAccessToken
      );

      // Load navigation mesh
      const navMeshItem = domainData.find(
        (item: any) => item.data_type === "obj" && item.name === "navmesh_v1"
      );
      if (navMeshItem) {
        const navMeshBuffer = await clientApi.downloadFile(
          data.domainServerUrl,
          data.domainInfo.id,
          navMeshItem.id,
          data.domainAccessToken
        );
        setNavMeshData(navMeshBuffer);
      } else {
        console.log(
          `[${new Date().toISOString()}] No navigation mesh data found for this domain`
        );
      }

      // Load occlusion mesh
      const occlusionMeshItem = domainData.find(
        (item: any) =>
          item.data_type === "obj" && item.name === "occlusionmesh_v1"
      );
      if (occlusionMeshItem) {
        const occlusionMeshBuffer = await clientApi.downloadFile(
          data.domainServerUrl,
          data.domainInfo.id,
          occlusionMeshItem.id,
          data.domainAccessToken
        );
        setOcclusionMeshData(occlusionMeshBuffer);
      } else {
        console.log(
          `[${new Date().toISOString()}] No occlusion mesh data found for this domain`
        );
      }

      // Load point cloud
      const domainMetadataItem = domainData.find(
        (item: any) => item.name === "domain_metadata"
      );
      if (domainMetadataItem) {
        const domainMetadata = await clientApi.downloadFile(
          data.domainServerUrl,
          data.domainInfo.id,
          domainMetadataItem.id,
          data.domainAccessToken
        );

        const metadata = JSON.parse(new TextDecoder().decode(domainMetadata));
        setAlignmentMatrix(metadata.canonicalRefinementAlignmentMatrix);
        if (metadata.canonicalRefinement) {
          const pointCloudItem = domainData.find(
            (item: any) =>
              item.data_type === "refined_pointcloud_ply" &&
              item.name === `refined_pointcloud_${metadata.canonicalRefinement}`
          );
          if (pointCloudItem) {
            const pointCloudBuffer = await clientApi.downloadFile(
              data.domainServerUrl,
              data.domainInfo.id,
              pointCloudItem.id,
              data.domainAccessToken
            );
            setPointCloudData(pointCloudBuffer);
          } else {
            console.log(
              `[${new Date().toISOString()}] No point cloud data found for this domain`
            );
          }
        }
      } else {
        console.log(
          `[${new Date().toISOString()}] No domain metadata found for this domain`
        );
      }
    } catch (error) {
      console.error("Error loading domain data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle domain change from selector
  const handleDomainChange = useCallback((newDomainId: string) => {
    if (newDomainId !== currentDomainId) {
      setCurrentDomainId(newDomainId);
      // Update URL without full page reload
      window.history.pushState({}, '', `/${newDomainId}`);
    }
  }, [currentDomainId]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white dark:bg-[#050505]">
      {!hideUI && !isInIframe && <TunnelNavigation />}
      <Viewer3D
        isEmbed={isInIframe}
      />

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
                  domainInfo={domainData?.domainInfo}
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
