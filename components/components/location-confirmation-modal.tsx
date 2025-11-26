"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

interface LocationConfirmationModalProps {
  currentAddress: string
  onConfirm: (latitude: number, longitude: number, address: string) => void
}

declare global {
  interface Window {
    MapboxGeocoder: any
  }
}

export function LocationConfirmationModal({ currentAddress, onConfirm }: LocationConfirmationModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number
    longitude: number
    address: string
  } | null>(null)
  const geocoderContainer = useRef<HTMLDivElement>(null)
  const [geocoderLoaded, setGeocoderLoaded] = useState(false)

  useEffect(() => {
    // Load Mapbox Geocoder CSS
    const link = document.createElement("link")
    link.href = "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    // Load Mapbox Geocoder JS
    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"
    script.onload = () => {
      setGeocoderLoaded(true)
    }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!geocoderLoaded || !geocoderContainer.current || !window.MapboxGeocoder) return

    if (!MAPBOX_TOKEN) {
      console.error("Mapbox access token is missing. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file")
      return
    }

    const geocoder = new window.MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      types: "address,place",
      placeholder: "Search for your farm address...",
      countries: "au", // Restrict to Australia
    })

    geocoder.addTo(geocoderContainer.current)

    geocoder.on("result", (e: any) => {
      const { center, place_name } = e.result
      setSelectedLocation({
        longitude: center[0],
        latitude: center[1],
        address: place_name,
      })
    })

    return () => {
      geocoder.clear()
    }
  }, [geocoderLoaded])

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.address)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Confirm Your Farm Location</h2>
          <p className="text-sm text-gray-600 mt-2">
            Search for your exact farm address to get the most accurate map view
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Current Address</Label>
            <Input value={currentAddress} disabled className="mt-1" />
          </div>

          <div>
            <Label>Search for Exact Location</Label>
            <div ref={geocoderContainer} className="mt-1" />
          </div>

          {selectedLocation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Selected Location:</p>
              <p className="text-sm text-gray-700 mt-1">{selectedLocation.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="flex-1 bg-green-700 hover:bg-green-800"
          >
            Confirm Location
          </Button>
        </div>
      </Card>
    </div>
  )
}
