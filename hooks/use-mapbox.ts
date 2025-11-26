"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { toast } from "sonner"
import type { MapboxMap } from "@/types/mapbox"
import type { Profile, Paddock, Mob, Infrastructure, DrawingMode, MapViewMode, Task } from "@/types/dashboard"
import { calculateCentroid, getLivestockIcon } from "@/lib/utils/dashboard"
import { getPaddockColor } from "@/lib/constants/dashboard"

interface UseMapboxProps {
  mapContainer: React.RefObject<HTMLDivElement>
  profile: Profile | null
  paddocks: Paddock[]
  mobs: Mob[]
  infrastructure: Infrastructure[]
  selectedPaddock: Paddock | null
  selectedMob: Mob | null
  selectedInfrastructure: Infrastructure | null
  infrastructurePinMode?: boolean
  mapViewMode?: MapViewMode
  highlightedPaddockIds?: string[]
  showPinPrompt?: boolean
  pinLocation?: { lat: number; lng: number } | null
  onPaddockClick: (paddock: Paddock) => void
  onMobClick: (mob: Mob) => void
  onInfrastructureClick: (infrastructure: Infrastructure) => void
  onPinDrop?: (lat: number, lng: number) => void
  onInfrastructurePinDrop?: (lat: number, lng: number) => void
  activeTab?: string
  showPaddockNames?: boolean
  showOnlyPaddocksWithTasks?: boolean
  selectedPaddockTypes?: string[]
  tasks?: Task[]
  fetchTaskPaddocks?: (taskId: string) => Promise<string[]>
}

interface UseMapboxReturn {
  map: React.MutableRefObject<MapboxMap | null>
  mapReady: boolean
  styleLoaded: boolean
  mapboxLoaded: boolean
}

export function useMapbox({
  mapContainer,
  profile,
  paddocks,
  mobs,
  infrastructure,
  selectedPaddock,
  selectedMob,
  selectedInfrastructure,
  infrastructurePinMode = false,
  mapViewMode = "default",
  highlightedPaddockIds = [],
  showPinPrompt = false,
  pinLocation = null,
  onPaddockClick,
  onMobClick,
  onInfrastructureClick,
  onPinDrop,
  onInfrastructurePinDrop,
  activeTab,
  showPaddockNames = true,
  showOnlyPaddocksWithTasks = false,
  selectedPaddockTypes = [],
  tasks = [],
  fetchTaskPaddocks,
}: UseMapboxProps): UseMapboxReturn {
  const map = useRef<MapboxMap | null>(null)
  const livestockMarkers = useRef<Map<string, any>>(new Map())
  const markerElements = useRef<Map<string, { element: HTMLElement; paddockArea: number }>>(new Map())
  const pinMarker = useRef<any>(null)
  const paddockHandlers = useRef<Map<string, { click: (e: any) => void; touchend: (e: any) => void; mouseenter: () => void; mouseleave: () => void }>>(new Map())
  const previousActiveTab = useRef<string | undefined>(activeTab)

  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const [reinitTrigger, setReinitTrigger] = useState(0)

  // Simplified style loading detection - use Mapbox's built-in events
  // This is more reliable than polling and follows Mapbox best practices
  useEffect(() => {
    if (!map.current || !mapReady) return

    // Check if already loaded
    if (map.current.isStyleLoaded()) {
      setStyleLoaded(true)
      return
    }

    // Listen for style.load event (fires when style is fully loaded)
    const handleStyleLoad = () => {
      setStyleLoaded(true)
    }

    // Also listen for style.loading event to detect reloads
    const handleStyleLoading = () => {
      setStyleLoaded(false)
    }

    map.current.on("style.load", handleStyleLoad)
    map.current.on("style.loading", handleStyleLoading)

    // Fallback: Check immediately in case style is already loaded
    if (map.current.isStyleLoaded()) {
      setStyleLoaded(true)
    }

    return () => {
      map.current?.off("style.load", handleStyleLoad)
      map.current?.off("style.loading", handleStyleLoading)
    }
  }, [mapReady]) // Only depend on mapReady, not styleLoaded

  // Mapbox library loading
  useEffect(() => {
    if (typeof window !== "undefined" && !window.mapboxgl) {
      const link = document.createElement("link")
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
      link.rel = "stylesheet"
      document.head.appendChild(link)

      const script = document.createElement("script")
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"
      script.onload = () => {
        setMapboxLoaded(true)
      }
      script.onerror = () => {
        toast.error("Failed to load map. Please refresh the page.")
      }
      document.head.appendChild(script)
    } else if (window.mapboxgl) {
      setMapboxLoaded(true)
    }
  }, [])

  // Handle edit tab transitions - clean up when switching TO edit, trigger re-init when switching FROM edit
  useEffect(() => {
    const prevTab = previousActiveTab.current
    const currentTab = activeTab

    // Clean up when switching TO edit tab
    if (currentTab === "edit" && prevTab !== "edit" && map.current) {
      try {
        map.current.remove()
      } catch (e) {
        // Map might already be removed
      }
      map.current = null
      setMapReady(false)
      setStyleLoaded(false)
    }

    // When switching FROM edit tab, trigger re-initialization by updating state
    if (currentTab !== "edit" && prevTab === "edit") {
      if (map.current) {
        try {
          map.current.remove()
        } catch (e) {
          // Map might already be removed
        }
        map.current = null
      }
      setMapReady(false)
      setStyleLoaded(false)
      // Trigger re-initialization by incrementing trigger
      setReinitTrigger(prev => prev + 1)
    }

    previousActiveTab.current = currentTab
  }, [activeTab])

  // Map initialization - only runs when needed, not on every tab change
  useEffect(() => {
    // Don't initialize if we're on edit tab
    if (activeTab === "edit") {
      return
    }

    // If map already exists, don't re-initialize (map stays persistent across main tabs)
    if (map.current) {
      return
    }

    if (!mapContainer.current || !mapboxLoaded || !window.mapboxgl || !profile) {
      return
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      toast.error("Mapbox token is missing. Please check your environment variables.")
      return
    }

    window.mapboxgl.accessToken = mapboxToken

    // For confirmed locations, offset center upward so location appears in top-middle of map
    let center: [number, number] = profile?.latitude && profile?.longitude 
      ? [profile.longitude, profile.latitude] 
      : [115.3464, -33.6506]
    
    if (profile?.location_confirmed && profile?.latitude && profile?.longitude) {
      // Offset latitude upward (decrease for southern hemisphere) to position in top-middle
      center = [profile.longitude, profile.latitude - 0.0025]
    }

    try {
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center,
        zoom: profile?.location_confirmed ? 15 : 12,
        attributionControl: false,
      }) as MapboxMap

      // Handle map click for pin dropping
      const handleMapClick = (e: any) => {
        const { lng, lat } = e.lngLat

        // Infrastructure pin mode takes priority
        if (infrastructurePinMode && onInfrastructurePinDrop) {
          onInfrastructurePinDrop(lat, lng)
          return
        }

        // Location pin prompt
        if (showPinPrompt && onPinDrop && !infrastructurePinMode) {
          onPinDrop(lat, lng)
        }
      }

      map.current.on("click", handleMapClick)

      map.current.on("load", () => {
        setMapReady(true)
        // Style loading detection is handled by the polling effect
        setTimeout(() => {
          if (map.current) {
            map.current.resize()
          }
        }, 100)
      })

      const handleResize = () => {
        if (map.current) {
          map.current.resize()
        }
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        if (map.current) {
          map.current.off("click", handleMapClick)
          map.current.remove()
          map.current = null
        }
      }
    } catch (error) {
      // Error initializing map
    }

    return () => {
      // Cleanup on unmount
      if (map.current) {
        try {
          map.current.remove()
        } catch (e) {
          // Map might already be removed
        }
        map.current = null
        setMapReady(false)
        setStyleLoaded(false)
      }
    }
  }, [mapboxLoaded, profile, mapContainer, showPinPrompt, onPinDrop, infrastructurePinMode, onInfrastructurePinDrop, reinitTrigger])

  // Update map interactions when showPinPrompt or infrastructurePinMode changes - allow scrolling/zooming but disable dragging to allow pin drop
  useEffect(() => {
    if (!map.current || !mapReady) return

    try {
      const mapInstance = map.current as any // Type assertion for Mapbox interaction methods
      if (showPinPrompt || infrastructurePinMode) {
        // Disable dragging to prevent interference with clicking, but allow scrolling/zooming for navigation
        if (mapInstance.dragPan) mapInstance.dragPan.disable()
        if (mapInstance.dragRotate) mapInstance.dragRotate.disable()
        // Keep scrolling and zooming enabled so users can navigate to find the right location
        if (mapInstance.scrollZoom) mapInstance.scrollZoom.enable()
        if (mapInstance.boxZoom) mapInstance.boxZoom.enable()
        if (mapInstance.doubleClickZoom) mapInstance.doubleClickZoom.enable()
        if (mapInstance.keyboard) mapInstance.keyboard.disable()
      } else {
        // Re-enable all interactions
        if (mapInstance.dragPan) mapInstance.dragPan.enable()
        if (mapInstance.dragRotate) mapInstance.dragRotate.enable()
        if (mapInstance.scrollZoom) mapInstance.scrollZoom.enable()
        if (mapInstance.boxZoom) mapInstance.boxZoom.enable()
        if (mapInstance.doubleClickZoom) mapInstance.doubleClickZoom.enable()
        if (mapInstance.keyboard) mapInstance.keyboard.enable()
      }
    } catch (error) {
      // Silently handle if methods don't exist
    }
  }, [showPinPrompt, infrastructurePinMode, mapReady])

  // Map resize on view mode change
  useEffect(() => {
    if (!map.current || !mapReady) return

    const timer = setTimeout(() => {
      map.current?.resize()
    }, 350)

    return () => clearTimeout(timer)
  }, [mapViewMode, mapReady])


  // Helper function to calculate icon size based on zoom and paddock area
  const calculateIconSize = useCallback((zoom: number, paddockArea: number): number => {
    // Base size at zoom level 16
    const baseSize = 24
    // Minimum size
    const minSize = 16
    // Maximum size (so icons don't get too big)
    const maxSize = 48

    // Calculate size based on zoom (icons get smaller as you zoom out)
    // At zoom 10, size is ~60% of base, at zoom 20, size is ~150% of base
    const zoomFactor = Math.pow(2, (zoom - 16) * 0.3)

    // Calculate size based on paddock area (smaller paddocks = smaller icons)
    // Convert area from square meters to hectares for calculation
    const areaHectares = paddockArea / 10000
    // Scale factor: 1 hectare = 1.0, 10 hectares = 1.2, 100 hectares = 1.5
    const areaFactor = Math.min(1.5, 1.0 + (Math.log10(Math.max(0.1, areaHectares)) * 0.15))

    // Combine factors
    let size = baseSize * zoomFactor * areaFactor

    // Clamp to min/max
    return Math.max(minSize, Math.min(maxSize, size))
  }, [])

  // Update marker icon sizes based on zoom
  const updateMarkerSizes = useCallback(() => {
    if (!map.current) return

    const zoom = map.current.getZoom()
    markerElements.current.forEach(({ element, paddockArea }) => {
      const iconDiv = element.querySelector("div") as HTMLElement
      if (iconDiv) {
        const size = calculateIconSize(zoom, paddockArea)
        iconDiv.style.fontSize = `${size}px`
      }
    })
  }, [calculateIconSize])

  // Livestock markers rendering
  useEffect(() => {
    if (!map.current || !mapReady || paddocks.length === 0 || mobs.length === 0) {
      livestockMarkers.current.forEach((marker) => marker.remove())
      livestockMarkers.current.clear()
      markerElements.current.clear()
      return
    }

    const paddockMobMap = new Map<string, Mob[]>()
    mobs.forEach((mob) => {
      if (mob.current_paddock_id) {
        if (!paddockMobMap.has(mob.current_paddock_id)) {
          paddockMobMap.set(mob.current_paddock_id, [])
        }
        paddockMobMap.get(mob.current_paddock_id)!.push(mob)
      }
    })

    // Remove markers for paddocks that no longer have mobs
    livestockMarkers.current.forEach((marker, paddockId) => {
      if (!paddockMobMap.has(paddockId)) {
        marker.remove()
        livestockMarkers.current.delete(paddockId)
        markerElements.current.delete(paddockId)
      }
    })

    // Create or update markers
    paddockMobMap.forEach((mobsInPaddock, paddockId) => {
      const paddock = paddocks.find((p) => p.id === paddockId)
      if (!paddock || !paddock.geometry.geometry) return

      const coordinates = paddock.geometry.geometry.coordinates[0] as number[][]
      const centroid = calculateCentroid(coordinates)

      const mob = mobsInPaddock[0]
      const livestockType = mob.livestock_type
      const icon = getLivestockIcon(livestockType)

      if (livestockMarkers.current.has(paddockId)) {
        const marker = livestockMarkers.current.get(paddockId)
        marker.setLngLat(centroid)
        // Update stored area in case it changed
        const stored = markerElements.current.get(paddockId)
        if (stored) {
          stored.paddockArea = paddock.area
        }
      } else {
        const el = document.createElement("div")
        el.className = "livestock-marker"

        // Calculate initial size
        const initialZoom = map.current?.getZoom() || 16
        const initialSize = calculateIconSize(initialZoom, paddock.area)

        el.innerHTML = `
          <div style="
            font-size: ${initialSize}px;
            text-align: center;
            cursor: pointer;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            transition: transform 0.2s, font-size 0.3s;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            ${icon}
          </div>
        `

        el.addEventListener("click", (e) => {
          e.stopPropagation()
          onMobClick(mob)
        })

        el.addEventListener("touchend", (e) => {
          e.stopPropagation()
          e.preventDefault()
          onMobClick(mob)
        })

        const marker = new window.mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(centroid)
          .addTo(map.current!)

        livestockMarkers.current.set(paddockId, marker)
        markerElements.current.set(paddockId, { element: el, paddockArea: paddock.area })
      }
    })

    // Update sizes after creating/updating markers
    updateMarkerSizes()
  }, [mobs, paddocks, mapReady, onMobClick, calculateIconSize, updateMarkerSizes])

  // Listen to zoom changes to update marker sizes
  useEffect(() => {
    if (!map.current || !mapReady) return

    const handleZoom = () => {
      updateMarkerSizes()
    }

    map.current.on("zoom", handleZoom)
    map.current.on("zoomend", handleZoom)

    return () => {
      map.current?.off("zoom", handleZoom)
      map.current?.off("zoomend", handleZoom)
    }
  }, [mapReady, updateMarkerSizes])

  // Helper function to get infrastructure icon
  const getInfrastructureIcon = useCallback((type: string): string => {
    const icons: Record<string, string> = {
      shed: "🏚️",
      dam: "💧",
      house: "🏠",
      water_tank: "🚰",
      trough: "🪣",
      fence: "🚧",
      gate: "🚪",
      pump: "⚙️",
      other: "📍",
    }
    return icons[type] || icons.other
  }, [])

  // Infrastructure rendering as point markers
  const infrastructureMarkers = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    if (!map.current || !mapReady) return

    // Clean up existing markers
    infrastructureMarkers.current.forEach((marker) => marker.remove())
    infrastructureMarkers.current.clear()

    if (infrastructure.length === 0) return

    // Create markers for each infrastructure item
    infrastructure.forEach((item) => {
      // Extract coordinates from geometry (support both Point and Polygon for backward compatibility)
      let coordinates: [number, number] = [0, 0]

      if (item.geometry.type === "Point") {
        coordinates = item.geometry.coordinates as [number, number]
      } else if (item.geometry.type === "Polygon" && item.geometry.coordinates?.[0]?.[0]) {
        // For backward compatibility with existing polygon infrastructure, use centroid
        const coords = item.geometry.coordinates[0] as number[][]
        const centroid = calculateCentroid(coords)
        coordinates = centroid
      } else if ((item.geometry as any).type === "Feature" && (item.geometry as any).geometry?.type === "Point") {
        coordinates = (item.geometry as any).geometry.coordinates as [number, number]
      } else {
        // Skip if we can't extract coordinates
        return
      }

      const el = document.createElement("div")
      el.className = "infrastructure-marker"
      const icon = getInfrastructureIcon(item.type)

      el.innerHTML = `
        <div style="
          font-size: 32px;
          text-align: center;
          cursor: pointer;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
          ${icon}
        </div>
      `

      el.addEventListener("click", (e) => {
        e.stopPropagation()
        onInfrastructureClick(item)
      })

      el.addEventListener("touchend", (e) => {
        e.stopPropagation()
        e.preventDefault()
        onInfrastructureClick(item)
      })

      const marker = new window.mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(coordinates)
        .addTo(map.current!)

      infrastructureMarkers.current.set(item.id, marker)
    })

    return () => {
      infrastructureMarkers.current.forEach((marker) => marker.remove())
      infrastructureMarkers.current.clear()
    }
  }, [infrastructure, mapReady, onInfrastructureClick, getInfrastructureIcon])

  // Paddock rendering - layers are created and always kept visible
  // When style reloads, layers are removed by Mapbox, so we recreate them
  useEffect(() => {
    if (!map.current || !mapReady || !styleLoaded) {
      return
    }

    // Filter paddocks based on filter settings
    const filterPaddocks = async () => {
      let filtered = [...paddocks]

      // Filter by type
      if (selectedPaddockTypes.length > 0 && selectedPaddockTypes.length < 7) {
        filtered = filtered.filter((p) => {
          const paddockType = p.type || "other"
          return selectedPaddockTypes.includes(paddockType)
        })
      }

      // Filter by tasks (async)
      if (showOnlyPaddocksWithTasks) {
        if (fetchTaskPaddocks && tasks && Array.isArray(tasks) && tasks.length > 0) {
          const paddocksWithTasksSet = new Set<string>()
          try {
            await Promise.all(
              tasks.map(async (task) => {
                try {
                  const paddockIds = await fetchTaskPaddocks(task.id)
                  if (paddockIds && paddockIds.length > 0) {
                    paddockIds.forEach((id) => paddocksWithTasksSet.add(id))
                  }
                } catch (error) {
                  console.error(`Error fetching paddocks for task ${task.id}:`, error)
                }
              })
            )
            // Only filter if we found some paddocks with tasks
            if (paddocksWithTasksSet.size > 0) {
              filtered = filtered.filter((p) => paddocksWithTasksSet.has(p.id))
            } else {
              // If no paddocks have tasks, show nothing
              filtered = []
            }
          } catch (error) {
            console.error("Error filtering paddocks by tasks:", error)
          }
        } else {
          // If no tasks or fetchTaskPaddocks not available, show nothing
          filtered = []
        }
      }

      return filtered
    }

    filterPaddocks().then((filteredPaddocks) => {
      if (!map.current || !mapReady || !styleLoaded) return
      
      // Helper function to render paddocks
      const renderPaddocks = (paddocksToRender: Paddock[]) => {
        if (!map.current || !mapReady || !styleLoaded) {
          return
        }

        // Handle empty paddocks case - hide all existing layers
        if (!paddocksToRender || paddocksToRender.length === 0) {
          // Find and hide all existing paddock layers (they might be from previous state)
          let index = 0
          while (true) {
            const layerId = `paddock-fill-${index}`
            if (!map.current?.getLayer(layerId)) break

            try {
              map.current.setLayoutProperty(layerId, "visibility", "none")
              map.current.setLayoutProperty(`paddock-line-${index}`, "visibility", "none")
              map.current.setLayoutProperty(`paddock-label-${index}`, "visibility", "none")
            } catch (error) {
              // Layer might not exist, continue
            }
            index++
          }
          return
        }

    // Helper function to create label source data
    const createLabelSource = (paddock: Paddock) => {
      const geometry = paddock.geometry as any
      let centroid: [number, number] = [0, 0]
      let coordinates: number[][] = []

      if (geometry.type === "Polygon" && geometry.coordinates?.[0]?.length > 0) {
        coordinates = geometry.coordinates[0]
        centroid = calculateCentroid(coordinates)
      } else if (geometry.type === "Feature" && geometry.geometry?.type === "Polygon") {
        coordinates = geometry.geometry.coordinates[0]
        centroid = calculateCentroid(coordinates)
      }

      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: centroid,
        },
        properties: {
          name: paddock.name,
        },
      }
    }

    // First, hide all existing paddock layers that aren't in the filtered list
    const filteredPaddockIds = new Set(paddocksToRender.map((p) => p.id))
    paddocks.forEach((paddock, originalIndex) => {
      if (!filteredPaddockIds.has(paddock.id)) {
        // Hide this paddock's layers
        const layerId = `paddock-fill-${originalIndex}`
        const lineLayerId = `paddock-line-${originalIndex}`
        const labelLayerId = `paddock-label-${originalIndex}`

        try {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(layerId, "visibility", "none")
          }
          if (map.current?.getLayer(lineLayerId)) {
            map.current.setLayoutProperty(lineLayerId, "visibility", "none")
          }
          if (map.current?.getLayer(labelLayerId)) {
            map.current.setLayoutProperty(labelLayerId, "visibility", "none")
          }
        } catch (error) {
          // Error hiding layer
        }
        return // Skip rendering this paddock
      }
    })

        // Step 1: Ensure all sources and layers exist (create if needed) for filtered paddocks
        paddocksToRender.forEach((paddock) => {
          // Find the original index of this paddock
          const originalIndex = paddocks.findIndex((p) => p.id === paddock.id)
          if (originalIndex === -1) return

          const index = originalIndex
      const sourceId = `paddock-${index}`
      const layerId = `paddock-fill-${index}`
      const lineLayerId = `paddock-line-${index}`
      const labelLayerId = `paddock-label-${index}`
      const labelSourceId = `paddock-label-source-${index}`

      // Create or update source
      if (!map.current?.getSource(sourceId)) {
        try {
          map.current.addSource(sourceId, {
            type: "geojson",
            data: paddock.geometry as any,
          })
        } catch (error) {
          return
        }
      } else {
        // Update source data if paddock changed
        try {
          const source = map.current.getSource(sourceId) as any
          if (source && source.setData) {
            source.setData(paddock.geometry as any)
          }
        } catch (error) {
          // Error updating source
        }
      }

      // Create or update label source
      const labelFeature = createLabelSource(paddock)
      if (!map.current?.getSource(labelSourceId)) {
        try {
          map.current.addSource(labelSourceId, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [labelFeature],
            } as any,
          })
        } catch (error) {
          return
        }
      } else {
        // Update label source data
        try {
          const source = map.current.getSource(labelSourceId) as any
          if (source && source.setData) {
            source.setData({
              type: "FeatureCollection",
              features: [labelFeature],
            } as any)
          }
        } catch (error) {
          // Error updating label source
        }
      }

      const isHighlighted = highlightedPaddockIds.includes(paddock.id)
      const isSelected = selectedPaddock?.id === paddock.id

      // Get color for this paddock type (use user's custom colors if available)
      const paddockType = paddock.type || "other"
      const paddockColor = getPaddockColor(paddockType, profile?.paddock_type_colors)

      // Create fill layer if it doesn't exist
      if (!map.current?.getLayer(layerId)) {
        try {
          map.current.addLayer({
            id: layerId,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": paddockColor,
              "fill-opacity": isHighlighted ? 0.7 : isSelected ? 0.5 : 0.3,
            },
          })

          // Add event handlers
          const handlePaddockClick = (e: any) => {
            e.preventDefault?.()
            onPaddockClick(paddock)
          }

          const handleMouseEnter = () => {
            if (map.current) {
              const canvas = (map.current as any).getCanvas()
              if (canvas) canvas.style.cursor = "pointer"
            }
          }

          const handleMouseLeave = () => {
            if (map.current) {
              const canvas = (map.current as any).getCanvas()
              if (canvas) canvas.style.cursor = ""
            }
          }

          paddockHandlers.current.set(layerId, {
            click: handlePaddockClick,
            touchend: handlePaddockClick,
            mouseenter: handleMouseEnter,
            mouseleave: handleMouseLeave,
          })

          // Remove old handlers if they exist (in case of style reload)
          const oldHandlers = paddockHandlers.current.get(layerId)
          if (oldHandlers) {
            try {
              map.current.off("click", layerId, oldHandlers.click)
              map.current.off("touchend", layerId, oldHandlers.touchend)
              map.current.off("mouseenter", layerId, oldHandlers.mouseenter)
              map.current.off("mouseleave", layerId, oldHandlers.mouseleave)
            } catch (error) {
              // Handlers might not exist, continue
            }
          }

          map.current.on("click", layerId, handlePaddockClick)
          map.current.on("touchend", layerId, handlePaddockClick)
          map.current.on("mouseenter", layerId, handleMouseEnter)
          map.current.on("mouseleave", layerId, handleMouseLeave)
        } catch (error) {
          // Error creating fill layer
        }
      } else {
        // Update existing layer properties
        map.current.setPaintProperty(layerId, "fill-color", paddockColor)
        map.current.setPaintProperty(layerId, "fill-opacity", isHighlighted ? 0.7 : isSelected ? 0.5 : 0.3)
      }

      // Create line layer if it doesn't exist
      if (!map.current?.getLayer(lineLayerId)) {
        try {
          map.current.addLayer({
            id: lineLayerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": paddockColor,
              "line-width": isHighlighted ? 4 : isSelected ? 3 : 2,
            },
          })
        } catch (error) {
          // Error creating line layer
        }
      } else {
        // Update existing layer properties
        map.current.setPaintProperty(lineLayerId, "line-color", paddockColor)
        map.current.setPaintProperty(lineLayerId, "line-width", isHighlighted ? 4 : isSelected ? 3 : 2)
      }

      // Create label layer if it doesn't exist
      if (!map.current?.getLayer(labelLayerId)) {
        try {
          map.current.addLayer({
            id: labelLayerId,
            type: "symbol",
            source: labelSourceId,
            layout: {
              "text-field": ["get", "name"],
              "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
              "text-size": 14,
              "text-anchor": "center",
              "text-allow-overlap": false,
              "text-ignore-placement": false,
              "text-optional": true,
            },
            paint: {
              "text-color": "#1f2937",
              "text-halo-color": "#ffffff",
              "text-halo-width": 2,
              "text-halo-blur": 1,
            },
          })
        } catch (error) {
          // Error creating label layer
        }
      }
        })

        // Step 2: Ensure filtered layers are visible
        // Label visibility is controlled by showPaddockNames setting
        paddocksToRender.forEach((paddock) => {
          const originalIndex = paddocks.findIndex((p) => p.id === paddock.id)
          if (originalIndex === -1) return

          const index = originalIndex
          const layerId = `paddock-fill-${index}`
          const lineLayerId = `paddock-line-${index}`
          const labelLayerId = `paddock-label-${index}`

          try {
            if (map.current?.getLayer(layerId)) {
              map.current.setLayoutProperty(layerId, "visibility", "visible")
            }
            if (map.current?.getLayer(lineLayerId)) {
              map.current.setLayoutProperty(lineLayerId, "visibility", "visible")
            }
            if (map.current?.getLayer(labelLayerId)) {
              map.current.setLayoutProperty(labelLayerId, "visibility", showPaddockNames ? "visible" : "none")
            }
          } catch (error) {
            // Error setting visibility
          }
        })
      }

      renderPaddocks(filteredPaddocks)
    })
  }, [paddocks, mapReady, styleLoaded, selectedPaddock, highlightedPaddockIds, onPaddockClick, infrastructurePinMode, showPaddockNames, showOnlyPaddocksWithTasks, selectedPaddockTypes, tasks, fetchTaskPaddocks])

  // Update paddock highlight when highlightedPaddockIds or selectedPaddock changes
  // This only updates paint properties, layers should already exist
  // Also update colors when profile changes (to reflect custom type colors)
  useEffect(() => {
    if (!map.current || !mapReady || !styleLoaded) return

    paddocks.forEach((paddock, index) => {
      const layerId = `paddock-fill-${index}`
      const lineLayerId = `paddock-line-${index}`

      if (map.current?.getLayer(layerId) && map.current?.getLayer(lineLayerId)) {
        const isHighlighted = highlightedPaddockIds.includes(paddock.id)
        const isSelected = selectedPaddock?.id === paddock.id

        // Get color for this paddock type (use user's custom colors if available)
        const paddockType = paddock.type || "other"
        const paddockColor = getPaddockColor(paddockType, profile?.paddock_type_colors)

        // Update fill color and opacity
        map.current.setPaintProperty(layerId, "fill-color", paddockColor)
        map.current.setPaintProperty(layerId, "fill-opacity", isHighlighted ? 0.7 : isSelected ? 0.5 : 0.3)

        // Update line color and width
        map.current.setPaintProperty(lineLayerId, "line-color", paddockColor)
        map.current.setPaintProperty(lineLayerId, "line-width", isHighlighted ? 4 : isSelected ? 3 : 2)
      }
    })
  }, [highlightedPaddockIds, paddocks, mapReady, styleLoaded, selectedPaddock, profile?.paddock_type_colors])

  // Render pin marker when pinLocation is set
  useEffect(() => {
    if (!map.current || !mapReady || !pinLocation) {
      // Remove marker if pinLocation is cleared
      if (pinMarker.current) {
        pinMarker.current.remove()
        pinMarker.current = null
      }
      return
    }

    // Create or update pin marker
    if (!pinMarker.current) {
      const el = document.createElement("div")
      el.className = "pin-marker"
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: #10b981;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `

      pinMarker.current = new (window as any).mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([pinLocation.lng, pinLocation.lat])
        .addTo(map.current)
    } else {
      pinMarker.current.setLngLat([pinLocation.lng, pinLocation.lat])
    }
  }, [pinLocation, mapReady])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      livestockMarkers.current.forEach((marker) => marker.remove())
      livestockMarkers.current.clear()
      infrastructureMarkers.current.forEach((marker) => marker.remove())
      infrastructureMarkers.current.clear()
      if (pinMarker.current) {
        pinMarker.current.remove()
        pinMarker.current = null
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return {
    map,
    mapReady,
    styleLoaded,
    mapboxLoaded,
  }
}

