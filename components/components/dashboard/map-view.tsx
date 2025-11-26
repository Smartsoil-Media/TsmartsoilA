"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MapPin, X, Check, Map, Filter } from "lucide-react"
import type { MapViewMode } from "@/types/dashboard"
import { MapFilterPanel } from "./map-filter-panel"

interface MapViewProps {
  mapContainer: React.RefObject<HTMLDivElement>
  mapReady: boolean
  styleLoaded: boolean
  mapViewMode: MapViewMode
  showPinPrompt?: boolean
  showPinConfirmation?: boolean
  showPaddockTutorial?: boolean
  farmName?: string
  onMapViewModeChange: (mode: MapViewMode) => void
  onMapHeightChange?: (heightPercent: number) => void
  onPinDrop?: (lat: number, lng: number) => void
  onPinConfirm?: (confirmed: boolean) => void
  onPaddockTutorialComplete?: () => void
  // Filter props
  showOnlyPaddocksWithTasks?: boolean
  selectedPaddockTypes?: string[]
  onShowOnlyPaddocksWithTasksChange?: (value: boolean) => void
  onSelectedPaddockTypesChange?: (types: string[]) => void
  onResetFilters?: () => void
}

export function MapView({
  mapContainer,
  mapReady,
  styleLoaded,
  mapViewMode,
  showPinPrompt = false,
  showPinConfirmation = false,
  showPaddockTutorial = false,
  farmName = "",
  onMapViewModeChange,
  onMapHeightChange,
  onPinDrop,
  onPinConfirm,
  onPaddockTutorialComplete,
  showOnlyPaddocksWithTasks = false,
  selectedPaddockTypes = [],
  onShowOnlyPaddocksWithTasksChange,
  onSelectedPaddockTypesChange,
  onResetFilters,
}: MapViewProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [mapHeight, setMapHeight] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number>(0)
  const dragStartHeight = useRef<number>(0)
  const onMapHeightChangeRef = useRef(onMapHeightChange)
  
  // Keep ref updated with latest callback
  useEffect(() => {
    onMapHeightChangeRef.current = onMapHeightChange
  }, [onMapHeightChange])

  // Get initial height based on mapViewMode
  const getHeightFromMode = useCallback((mode: MapViewMode): number => {
    switch (mode) {
      case "fullscreen":
        return 95
      case "collapsed":
        return 10
      case "default":
      default:
        return 45
    }
  }, [])

  // Initialize height from mode
  useEffect(() => {
    if (mapHeight === null) {
      const initialHeight = getHeightFromMode(mapViewMode)
      setMapHeight(initialHeight)
      onMapHeightChangeRef.current?.(initialHeight)
    }
  }, [mapViewMode, mapHeight, getHeightFromMode])

  // Reset custom height when mode changes externally (e.g., fullscreen button)
  const prevMapViewMode = useRef<MapViewMode>(mapViewMode)
  useEffect(() => {
    if (prevMapViewMode.current !== mapViewMode && !isDragging) {
      const modeHeight = getHeightFromMode(mapViewMode)
      setMapHeight(modeHeight)
      onMapHeightChangeRef.current?.(modeHeight)
      prevMapViewMode.current = mapViewMode
    }
  }, [mapViewMode, isDragging, getHeightFromMode])

  // Handle mouse down on the drag handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = mapHeight ?? getHeightFromMode(mapViewMode)
  }, [mapHeight, mapViewMode, getHeightFromMode])

  // Handle touch start for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragStartY.current = e.touches[0].clientY
    dragStartHeight.current = mapHeight ?? getHeightFromMode(mapViewMode)
  }, [mapHeight, mapViewMode, getHeightFromMode])

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return

    let rafId: number | null = null
    let pendingHeight: number | null = null
    let lastNotifiedHeight: number | null = null

    const updateHeight = () => {
      if (pendingHeight !== null) {
        // Only notify parent if height changed significantly (avoid unnecessary updates)
        if (lastNotifiedHeight === null || Math.abs(pendingHeight - lastNotifiedHeight) > 0.5) {
          onMapHeightChangeRef.current?.(pendingHeight)
          lastNotifiedHeight = pendingHeight
        }
        pendingHeight = null
      }
      rafId = null
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const parentElement = containerRef.current.parentElement
      if (!parentElement) return
      
      const parentRect = parentElement.getBoundingClientRect()
      const parentHeight = parentRect.height
      
      // Calculate new height based on where the mouse is relative to parent
      // The button's Y position determines where the content area starts (from bottom)
      // So we calculate the visible map height (from top to button)
      const mouseY = e.clientY - parentRect.top
      const visibleMapHeightPercent = (mouseY / parentHeight) * 100
      
      // Constrain between 5% and 95% (content area between 95% and 5%)
      const constrainedHeight = Math.max(5, Math.min(95, visibleMapHeightPercent))
      
      // Update local state immediately for smooth visual feedback
      setMapHeight(constrainedHeight)
      
      // Throttle parent updates using requestAnimationFrame
      pendingHeight = constrainedHeight
      if (rafId === null) {
        rafId = requestAnimationFrame(updateHeight)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return
      
      const parentElement = containerRef.current.parentElement
      if (!parentElement) return
      
      const parentRect = parentElement.getBoundingClientRect()
      const parentHeight = parentRect.height
      
      // Calculate new height based on where the touch is relative to parent
      const touchY = e.touches[0].clientY - parentRect.top
      const visibleMapHeightPercent = (touchY / parentHeight) * 100
      
      // Constrain between 5% and 95%
      const constrainedHeight = Math.max(5, Math.min(95, visibleMapHeightPercent))
      
      // Update local state immediately for smooth visual feedback
      setMapHeight(constrainedHeight)
      
      // Throttle parent updates using requestAnimationFrame
      pendingHeight = constrainedHeight
      if (rafId === null) {
        rafId = requestAnimationFrame(updateHeight)
      }
    }

    const handleMouseUp = () => {
      // Ensure final update is sent
      if (pendingHeight !== null) {
        onMapHeightChangeRef.current?.(pendingHeight)
        pendingHeight = null
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    const handleTouchEnd = () => {
      // Ensure final update is sent
      if (pendingHeight !== null) {
        onMapHeightChangeRef.current?.(pendingHeight)
        pendingHeight = null
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    // Set cursor on body during drag
    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging])

  // Determine current height to use
  const currentHeight = mapHeight ?? getHeightFromMode(mapViewMode)

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full transition-all duration-300"
      style={{ 
        transition: isDragging ? "none" : "height 0.3s ease"
      }}
    >
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
          <div className="text-lg text-muted-foreground font-medium">Loading map...</div>
        </div>
      )}

      {showPinPrompt && mapReady && (
        <Card className="absolute top-4 left-4 p-4 shadow-xl max-w-sm z-40 border-2 border-primary/50 bg-card/95 backdrop-blur-sm">
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1 text-foreground">Drop a Pin on Your Exact Location</h3>
                <p className="text-sm text-muted-foreground">
                  Click anywhere on the map to set your farm's center point
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {showPinConfirmation && mapReady && (
        <Card className="absolute top-4 left-4 p-4 shadow-xl max-w-sm z-40 border-2 border-primary/50 bg-card/95 backdrop-blur-sm">
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1 text-foreground">Does that look right?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Check the pin on the map to confirm your farm location
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onPinConfirm?.(true)}
                    className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                    size="sm"
                  >
                    <Check className="h-4 w-4" />
                    Yes
                  </Button>
                  <Button
                    onClick={() => onPinConfirm?.(false)}
                    variant="outline"
                    className="flex-1 gap-2"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                    No
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {showPaddockTutorial && mapReady && (
        <Card className="absolute top-4 left-4 p-3 shadow-xl max-w-xs z-40 border border-primary/30 bg-card/95 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Map className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-tight">
                  Drawing tools will be available here soon
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {mapReady && (
        <>
          {/* Filter Button */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                className="absolute top-4 right-20 bg-card/90 backdrop-blur-sm text-foreground hover:bg-card hover:text-primary border border-border/50 shadow-lg z-20 h-10 w-10"
                aria-label="Filter map layers"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <MapFilterPanel
                showOnlyPaddocksWithTasks={showOnlyPaddocksWithTasks}
                selectedPaddockTypes={selectedPaddockTypes}
                onShowOnlyPaddocksWithTasksChange={(value) => {
                  onShowOnlyPaddocksWithTasksChange?.(value)
                }}
                onSelectedPaddockTypesChange={(types) => {
                  onSelectedPaddockTypesChange?.(types)
                }}
                onReset={() => {
                  onResetFilters?.()
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Fullscreen Button */}
          <Button
            size="icon"
            onClick={() => onMapViewModeChange(mapViewMode === "fullscreen" ? "default" : "fullscreen")}
            className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm text-foreground hover:bg-card hover:text-primary border border-border/50 shadow-lg z-20 h-10 w-10"
            aria-label={mapViewMode === "fullscreen" ? "Exit fullscreen" : "Enter fullscreen"}
          >
          {mapViewMode === "fullscreen" ? (
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
            >
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          ) : (
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
            >
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
          )}
        </Button>
        </>
      )}

      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`absolute left-1/2 -translate-x-1/2 translate-y-1/2 bg-card/90 backdrop-blur-sm text-foreground hover:bg-card hover:text-primary shadow-lg z-30 h-8 w-16 rounded-full flex items-center justify-center border border-border/50 transition-all duration-200 ${
          isDragging ? "scale-110 cursor-grabbing" : "hover:scale-105 cursor-ns-resize"
        }`}
        aria-label="Resize map"
        style={{ 
          touchAction: "none",
          bottom: currentHeight !== null 
            ? `${100 - currentHeight}%` 
            : mapViewMode === "fullscreen" 
              ? "5%" 
              : mapViewMode === "collapsed" 
                ? "90%" 
                : "55%"
        }}
      >
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
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
  )
}

