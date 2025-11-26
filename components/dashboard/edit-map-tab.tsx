"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Profile, Paddock } from "@/types/dashboard"
import type { MapboxMap, MapboxDraw } from "@/types/mapbox"
import { toast } from "sonner"
import { calculateArea, calculateCentroid, calculateDistance } from "@/lib/utils/dashboard"

interface EditMapTabProps {
  profile: Profile | null
  paddocks: Paddock[]
  infrastructure: any[]
  onPaddockUpdate: (paddockId: string, updates: { geometry: any; area: number }) => Promise<void>
  onPaddockDelete: (paddockId: string) => Promise<void>
  onPaddockCreate: (feature: any, area: number) => void
  onInfrastructurePinDrop?: (lat: number, lng: number) => void
}

export function EditMapTab({
  profile,
  paddocks,
  infrastructure,
  onPaddockUpdate,
  onPaddockDelete,
  onPaddockCreate,
  onInfrastructurePinDrop,
}: EditMapTabProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<MapboxMap | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  const infrastructureMarkers = useRef<Map<string, any>>(new Map())
  const [mapReady, setMapReady] = useState(false)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [drawLoaded, setDrawLoaded] = useState(false)
  const [infrastructurePinMode, setInfrastructurePinMode] = useState(false)
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [measuringMode, setMeasuringMode] = useState(false)
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([])
  const [showMeasurementPanel, setShowMeasurementPanel] = useState(false)
  const measurementMarkers = useRef<Map<string, any>>(new Map())
  const measurementLine = useRef<any>(null)

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

  // Load Mapbox library
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

  // Load Mapbox Draw library
  useEffect(() => {
    if (typeof window !== "undefined" && !window.MapboxDraw && mapboxLoaded) {
      const drawCss = document.createElement("link")
      drawCss.href = "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css"
      drawCss.rel = "stylesheet"
      document.head.appendChild(drawCss)

      const drawScript = document.createElement("script")
      drawScript.src = "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.js"
      drawScript.onload = () => {
        setDrawLoaded(true)
      }
      drawScript.onerror = () => {
        toast.error("Failed to load map drawing tools. Please refresh the page.")
      }
      document.head.appendChild(drawScript)
    } else if (window.MapboxDraw) {
      setDrawLoaded(true)
    }
  }, [mapboxLoaded])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxLoaded || !window.mapboxgl || !profile || !drawLoaded) return

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

      draw.current = new window.MapboxDraw({
        displayControlsDefault: false,
        controls: {
          point: false,
          line_string: false,
          polygon: false,
          trash: false,
        },
        defaultMode: "simple_select",
        styles: [
          {
            id: "gl-draw-polygon-fill",
            type: "fill",
            paint: {
              "fill-color": "#10b981",
              "fill-opacity": 0.3,
            },
          },
          {
            id: "gl-draw-polygon-stroke-active",
            type: "line",
            paint: {
              "line-color": "#10b981",
              "line-width": 2,
            },
          },
          {
            id: "gl-draw-line",
            type: "line",
            paint: {
              "line-color": "#10b981",
              "line-width": 2,
            },
          },
          {
            id: "gl-draw-polygon-and-line-vertex-active",
            type: "circle",
            paint: {
              "circle-radius": 5,
              "circle-color": "#10b981",
            },
          },
        ],
      }) as MapboxDraw

      map.current.addControl(draw.current)

      // Handle map click for infrastructure pin dropping
      // We'll set up the click handler in a separate effect that updates when infrastructurePinMode changes

      map.current.on("load", () => {
        setMapReady(true)
        // Resize map after load
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
          map.current.remove()
          map.current = null
        }
      }
    } catch (error) {
      // Error initializing map
    }
  }, [mapboxLoaded, profile, drawLoaded])

  // Handle map click for infrastructure pin dropping and update interactions when infrastructurePinMode changes
  useEffect(() => {
    if (!map.current || !mapReady) return

    const handleMapClick = (e: any) => {
      const { lng, lat } = e.lngLat
      
      // Infrastructure pin mode takes priority
      if (infrastructurePinMode && onInfrastructurePinDrop) {
        onInfrastructurePinDrop(lat, lng)
        return
      }
      
      // Measuring mode
      if (measuringMode) {
        setMeasurementPoints((prev) => [...prev, [lng, lat]])
        setShowMeasurementPanel(true)
        return
      }
    }

    // Remove any existing click handler first
    map.current.off("click")
    map.current.on("click", handleMapClick)

    try {
      const mapInstance = map.current as any
      if (infrastructurePinMode || measuringMode) {
        // Disable dragging to prevent interference with clicking
        if (mapInstance.dragPan) mapInstance.dragPan.disable()
        if (mapInstance.dragRotate) mapInstance.dragRotate.disable()
        // Keep scrolling and zooming enabled
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

    return () => {
      map.current?.off("click", handleMapClick)
    }
  }, [infrastructurePinMode, measuringMode, mapReady, onInfrastructurePinDrop])

  // Handle drawing mode changes
  useEffect(() => {
    if (!draw.current || !mapReady) return

    if (isDrawingPolygon) {
      draw.current.changeMode("draw_polygon")
    } else {
      draw.current.changeMode("simple_select")
    }
  }, [isDrawingPolygon, mapReady])

  // Handle keyboard shortcuts for measuring mode (Command+Z / Ctrl+Z to undo last point)
  useEffect(() => {
    if (!measuringMode || measurementPoints.length === 0) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "z" &&
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey
      ) {
        event.preventDefault()
        setMeasurementPoints((prev) => prev.slice(0, -1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [measuringMode, measurementPoints.length])

  // Add existing paddocks to draw control when map is ready
  useEffect(() => {
    if (!map.current || !draw.current || !mapReady) return

    // Clear existing features
    draw.current.deleteAll()

    // Add all paddocks to draw control
    paddocks.forEach((paddock) => {
      if (paddock.geometry) {
        try {
          const feature = {
            type: "Feature" as const,
            id: paddock.id,
            properties: {
              name: paddock.name,
              color: paddock.color,
            },
            geometry: paddock.geometry.type === "Feature"
              ? (paddock.geometry as any).geometry
              : paddock.geometry,
          }
          draw.current!.add(feature as any)
        } catch (error) {
          // Error adding paddock to draw control
        }
      }
    })
  }, [paddocks, mapReady])

  // Handle draw events
  useEffect(() => {
    if (!map.current || !draw.current || !mapReady) return

    const handleCreate = async (e: any) => {
      const feature = e.features[0]
      if (!feature) return

      const area = window.mapboxgl ? calculateArea(feature.geometry.coordinates[0]) : 0
      onPaddockCreate(feature, area)
    }

    const handleUpdate = async (e: any) => {
      const feature = e.features[0]
      if (!feature) return

      const paddock = paddocks.find((p) => p.id === feature.id)
      if (!paddock) return

      const area = window.mapboxgl ? calculateArea(feature.geometry.coordinates[0]) : 0
      await onPaddockUpdate(paddock.id, {
        geometry: feature,
        area,
      })
    }

    const handleDelete = async (e: any) => {
      const featureIds = e.features.map((f: any) => f.id)
      for (const id of featureIds) {
        await onPaddockDelete(id)
      }
    }

    map.current.on("draw.create", handleCreate)
    map.current.on("draw.update", handleUpdate)
    map.current.on("draw.delete", handleDelete)

    return () => {
      map.current?.off("draw.create", handleCreate)
      map.current?.off("draw.update", handleUpdate)
      map.current?.off("draw.delete", handleDelete)
    }
  }, [mapReady, paddocks, onPaddockCreate, onPaddockUpdate, onPaddockDelete])

  // Render infrastructure markers
  useEffect(() => {
    if (!map.current || !mapReady || !window.mapboxgl) return

    // Clean up existing markers
    infrastructureMarkers.current.forEach((marker) => marker.remove())
    infrastructureMarkers.current.clear()

    if (!infrastructure || infrastructure.length === 0) return

    // Create markers for each infrastructure item
    infrastructure.forEach((item) => {
      // Extract coordinates from geometry (support both Point and Polygon for backward compatibility)
      let coordinates: [number, number] = [0, 0]

      if (item.geometry.type === "Point") {
        coordinates = item.geometry.coordinates as [number, number]
      } else if (item.geometry.type === "Polygon" && item.geometry.coordinates?.[0]?.[0]) {
        // For backward compatibility with existing polygon infrastructure, use centroid
        const coords = item.geometry.coordinates[0] as number[][]
        coordinates = calculateCentroid(coords)
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
        // Could add click handler here if needed
      })

      el.addEventListener("touchend", (e) => {
        e.stopPropagation()
        e.preventDefault()
        // Could add touch handler here if needed
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
  }, [infrastructure, mapReady, getInfrastructureIcon])

  // Render measurement markers and line
  useEffect(() => {
    if (!map.current || !mapReady || !window.mapboxgl || !measuringMode) {
      // Clean up when not in measuring mode
      measurementMarkers.current.forEach((marker) => marker.remove())
      measurementMarkers.current.clear()
      if (measurementLine.current) {
        if (map.current?.getLayer("measurement-line")) {
          map.current.removeLayer("measurement-line")
        }
        if (map.current?.getSource("measurement-line")) {
          map.current.removeSource("measurement-line")
        }
        measurementLine.current = null
      }
      return
    }

    // Clean up existing markers
    measurementMarkers.current.forEach((marker) => marker.remove())
    measurementMarkers.current.clear()

    // Create markers for each measurement point
    measurementPoints.forEach((point, index) => {
      const el = document.createElement("div")
      el.className = "measurement-marker"
      el.style.cursor = "pointer"
      el.innerHTML = `
        <div style="
          width: 12px;
          height: 12px;
          background-color: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `

      el.addEventListener("click", (e) => {
        e.stopPropagation()
        setShowMeasurementPanel(true)
      })

      const marker = new window.mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(point)
        .addTo(map.current!)

      measurementMarkers.current.set(`point-${index}`, marker)
    })

    // Draw line between points
    if (measurementPoints.length > 1) {
      // Remove existing line if it exists
      if (measurementLine.current) {
        if (map.current.getLayer("measurement-line")) {
          map.current.removeLayer("measurement-line")
        }
        if (map.current.getSource("measurement-line")) {
          map.current.removeSource("measurement-line")
        }
      }

      // Add line source
      if (!map.current.getSource("measurement-line")) {
        map.current.addSource("measurement-line", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: measurementPoints,
            },
          },
        })
      } else {
        const source = map.current.getSource("measurement-line") as any
        source.setData({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: measurementPoints,
          },
        })
      }

      // Add line layer
      if (!map.current.getLayer("measurement-line")) {
        map.current.addLayer({
          id: "measurement-line",
          type: "line",
          source: "measurement-line",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10b981",
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        })
      }
      
      // Make line clickable to show panel (remove existing handlers first to avoid duplicates)
      map.current.off("click", "measurement-line")
      map.current.off("mouseenter", "measurement-line")
      map.current.off("mouseleave", "measurement-line")
      
      map.current.on("click", "measurement-line", (e: any) => {
        e.originalEvent?.stopPropagation()
        setShowMeasurementPanel(true)
      })
      
      // Change cursor on hover
      map.current.on("mouseenter", "measurement-line", () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "pointer"
        }
      })
      
      map.current.on("mouseleave", "measurement-line", () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = ""
        }
      })

      // Add distance labels
      for (let i = 0; i < measurementPoints.length - 1; i++) {
        const point1 = measurementPoints[i]
        const point2 = measurementPoints[i + 1]
        const distance = calculateDistance(point1, point2)
        const midPoint: [number, number] = [
          (point1[0] + point2[0]) / 2,
          (point1[1] + point2[1]) / 2,
        ]

        // Format distance
        let distanceText = ""
        if (distance < 1000) {
          distanceText = `${Math.round(distance)}m`
        } else {
          distanceText = `${(distance / 1000).toFixed(2)}km`
        }

        const labelEl = document.createElement("div")
        labelEl.className = "measurement-label"
        labelEl.style.cursor = "pointer"
        labelEl.innerHTML = `
          <div style="
            background-color: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${distanceText}</div>
        `

        labelEl.addEventListener("click", (e) => {
          e.stopPropagation()
          setShowMeasurementPanel(true)
        })

        const labelMarker = new window.mapboxgl.Marker({ element: labelEl, anchor: "center" })
          .setLngLat(midPoint)
          .addTo(map.current!)

        measurementMarkers.current.set(`label-${i}`, labelMarker)
      }
    }

    return () => {
      measurementMarkers.current.forEach((marker) => marker.remove())
      measurementMarkers.current.clear()
      if (map.current) {
        // Remove event listeners
        map.current.off("click", "measurement-line")
        map.current.off("mouseenter", "measurement-line")
        map.current.off("mouseleave", "measurement-line")
        
        if (map.current.getLayer("measurement-line")) {
          map.current.removeLayer("measurement-line")
        }
        if (map.current.getSource("measurement-line")) {
          map.current.removeSource("measurement-line")
        }
        measurementLine.current = null
      }
    }
  }, [measurementPoints, measuringMode, mapReady])

  return (
    <>
      <style jsx global>{`
        /* Hide Mapbox Draw's default controls */
        .mapbox-gl-draw_ctrl-group {
          display: none !important;
        }
      `}</style>
      <div className="h-full w-full relative">
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
            <div className="text-lg text-muted-foreground font-medium">Loading map...</div>
          </div>
        )}
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        {mapReady && (
        <>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border shadow-lg z-20 h-10 w-10 flex items-center justify-center rounded text-foreground hover:bg-card hover:text-primary border-border/50"
            aria-label="Show help"
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
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>
          
          {showHelp && (
            <div className="absolute top-14 left-4 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-lg z-10 max-w-sm">
              <h3 className="font-semibold text-lg mb-2">Edit Map</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Draw new paddocks, edit existing ones, or add infrastructure pins.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Click to start drawing paddocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Click existing paddock to edit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Delete button removes selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Use pin tool to add infrastructure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Use measure tool to measure distances</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setIsDrawingPolygon(!isDrawingPolygon)
              setInfrastructurePinMode(false)
              setMeasuringMode(false)
              setMeasurementPoints([])
              setShowMeasurementPanel(false)
            }}
            className={`absolute top-4 right-4 bg-card/90 backdrop-blur-sm border shadow-lg z-20 h-10 w-10 flex items-center justify-center rounded ${
              isDrawingPolygon
                ? "text-primary hover:bg-primary/10 border-primary"
                : "text-foreground hover:bg-card hover:text-primary border-border/50"
            }`}
            aria-label={isDrawingPolygon ? "Exit drawing mode" : "Draw polygon"}
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
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
          
          <button
            onClick={() => {
              setInfrastructurePinMode(!infrastructurePinMode)
              setIsDrawingPolygon(false)
              setMeasuringMode(false)
              setMeasurementPoints([])
              setShowMeasurementPanel(false)
            }}
            className={`absolute top-[59px] right-4 bg-card/90 backdrop-blur-sm border shadow-lg z-20 h-10 w-10 flex items-center justify-center rounded ${
              infrastructurePinMode
                ? "text-purple-600 hover:bg-purple-50 border-purple-600"
                : "text-foreground hover:bg-card hover:text-purple-600 border-border/50"
            }`}
            aria-label={infrastructurePinMode ? "Exit infrastructure pin mode" : "Add infrastructure pin"}
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
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </button>
          
          <button
            onClick={() => {
              if (measuringMode) {
                // Exiting measuring mode - clear measurements
                setMeasurementPoints([])
                setShowMeasurementPanel(false)
              } else {
                // Entering measuring mode - show panel
                setShowMeasurementPanel(true)
              }
              setMeasuringMode(!measuringMode)
              setInfrastructurePinMode(false)
              setIsDrawingPolygon(false)
            }}
            className={`absolute top-[102px] right-4 bg-card/90 backdrop-blur-sm border shadow-lg z-20 h-10 w-10 flex items-center justify-center rounded ${
              measuringMode
                ? "text-primary hover:bg-primary/10 border-primary"
                : "text-foreground hover:bg-card hover:text-primary border-border/50"
            }`}
            aria-label={measuringMode ? "Exit measuring mode" : "Measure distance"}
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
              <path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0L2.7 17.7c-1-1-1-2.5 0-3.4L15.3 1.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z" />
              <path d="m7.5 10.5 2 2" />
              <path d="m10.5 7.5 2 2" />
              <path d="m13.5 4.5 2 2" />
              <path d="m4.5 13.5 2 2" />
            </svg>
          </button>
          
          <button
            onClick={() => {
              if (draw.current) {
                draw.current.trash()
              }
            }}
            className="absolute top-[145px] right-4 bg-card/90 backdrop-blur-sm border shadow-lg z-20 h-10 w-10 flex items-center justify-center rounded text-foreground hover:bg-card hover:text-destructive border-border/50"
            aria-label="Delete selected"
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
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </>
      )}
      
      {/* Measurement Panel */}
      {measuringMode && showMeasurementPanel && (
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-card/95 backdrop-blur-sm border-t border-border/50 shadow-lg z-30 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Measurements</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowMeasurementPanel(false)
                  }}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-2"
                  aria-label="Close panel"
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
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                  Close
                </button>
                <button
                  onClick={() => {
                    setMeasurementPoints([])
                  }}
                  className="text-destructive hover:text-destructive/80 text-sm font-medium flex items-center gap-2"
                  aria-label="Clear measurements"
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
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Clear
              </button>
              </div>
            </div>
            
            {measurementPoints.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Click on the map to add measurement points
              </div>
            ) : (
              <div className="space-y-3">
                {/* Segment distances */}
                {measurementPoints.length > 1 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Segment Distances</div>
                    {measurementPoints.map((_, index) => {
                      if (index === measurementPoints.length - 1) return null
                      const point1 = measurementPoints[index]
                      const point2 = measurementPoints[index + 1]
                      const distance = calculateDistance(point1, point2)
                      
                      let distanceText = ""
                      if (distance < 1000) {
                        distanceText = `${Math.round(distance)}m`
                      } else {
                        distanceText = `${(distance / 1000).toFixed(2)}km`
                      }
                      
                      const pointLabel1 = String.fromCharCode(65 + index) // A, B, C, etc.
                      const pointLabel2 = String.fromCharCode(65 + index + 1)
                      
                      return (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-background/50 rounded border border-border/50">
                          <span className="text-sm font-medium">
                            {pointLabel1} - {pointLabel2}
                          </span>
                          <span className="text-sm font-semibold text-primary">{distanceText}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Total distance */}
                {measurementPoints.length > 1 && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between py-2 px-3 bg-primary/10 rounded border border-primary/20">
                      <span className="text-sm font-semibold">Total Distance</span>
                      <span className="text-sm font-bold text-primary">
                        {(() => {
                          let totalDistance = 0
                          for (let i = 0; i < measurementPoints.length - 1; i++) {
                            totalDistance += calculateDistance(measurementPoints[i], measurementPoints[i + 1])
                          }
                          if (totalDistance < 1000) {
                            return `${Math.round(totalDistance)}m`
                          } else {
                            return `${(totalDistance / 1000).toFixed(2)}km`
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Point count info */}
                <div className="text-xs text-muted-foreground pt-2">
                  {measurementPoints.length} point{measurementPoints.length !== 1 ? 's' : ''} placed
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

