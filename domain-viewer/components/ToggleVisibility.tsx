"use client"

import { ChevronDown, Cloud, QrCode, Map, Box } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ToggleVisibilityProps {
  onTogglePortals: () => void
  portalsVisible: boolean
  onToggleNavMesh: () => void
  navMeshVisible: boolean
  onToggleOcclusion: () => void
  occlusionVisible: boolean
  onTogglePointCloud: () => void
  pointCloudVisible: boolean
}

export function ToggleVisibility({ 
  onTogglePortals, 
  portalsVisible, 
  onToggleNavMesh, 
  navMeshVisible,
  onToggleOcclusion,
  occlusionVisible,
  onTogglePointCloud,
  pointCloudVisible
}: ToggleVisibilityProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 z-10">
        <h2 className="text-black dark:text-white text-base sm:text-xl font-medium">Toggle Visibility</h2>
        <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-black dark:text-white transition-transform ${isOpen ? "" : "rotate-180"}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-2">
          {[
            { icon: QrCode, label: "Toggle Portals", visible: portalsVisible, onClick: onTogglePortals },
            { icon: Map, label: "Toggle Navigation Mesh", visible: navMeshVisible, onClick: onToggleNavMesh },
            { icon: Box, label: "Toggle Occlusion", visible: occlusionVisible, onClick: onToggleOcclusion },
            { icon: Cloud, label: "Toggle Point Cloud", visible: pointCloudVisible, onClick: onTogglePointCloud }
          ].map(({ icon: Icon, label, visible, onClick }) => (
            <button
              key={label}
              className={cn(
                "flex h-8 sm:h-10 w-full items-center justify-center rounded-lg sm:w-10",
                visible
                  ? "bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  : "bg-black/5 text-black dark:bg-white/10 dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
              )}
              aria-label={label}
              onClick={onClick}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

