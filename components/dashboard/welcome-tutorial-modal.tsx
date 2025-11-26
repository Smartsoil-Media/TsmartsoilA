"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Sparkles, MapPin, ArrowRight } from "lucide-react"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

interface WelcomeTutorialModalProps {
  onComplete: (latitude: number, longitude: number, address: string) => void
}

declare global {
  interface Window {
    MapboxGeocoder: any
  }
}

export function WelcomeTutorialModal({ onComplete }: WelcomeTutorialModalProps) {
  const [step, setStep] = useState(1)
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number
    longitude: number
    address: string
  } | null>(null)
  const geocoderContainer = useRef<HTMLDivElement>(null)
  const [geocoderLoaded, setGeocoderLoaded] = useState(false)

  // Load Mapbox Geocoder
  useEffect(() => {
    if (step !== 2) return

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

    return () => {
      // Cleanup on unmount
      const existingLink = document.querySelector('link[href*="mapbox-gl-geocoder"]')
      if (existingLink) {
        existingLink.remove()
      }
    }
  }, [step])

  // Initialize geocoder when step 2 is active
  useEffect(() => {
    if (step !== 2 || !geocoderLoaded || !geocoderContainer.current || !window.MapboxGeocoder) return

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
    
    // Ensure the geocoder input takes full width and is centered (with a small delay to ensure it's rendered)
    setTimeout(() => {
      if (geocoderContainer.current) {
        const geocoderInput = geocoderContainer.current.querySelector('input')
        const geocoderContainerEl = geocoderContainer.current.querySelector('.mapboxgl-ctrl-geocoder')
        const geocoderWrapper = geocoderContainer.current.querySelector('.mapboxgl-ctrl')
        
        if (geocoderInput) {
          geocoderInput.style.width = '100%'
        }
        if (geocoderContainerEl) {
          geocoderContainerEl.style.width = '100%'
          geocoderContainerEl.style.margin = '0 auto'
          geocoderContainerEl.style.maxWidth = '100%'
          geocoderContainerEl.style.display = 'block'
        }
        if (geocoderWrapper) {
          geocoderWrapper.style.width = '100%'
          geocoderWrapper.style.margin = '0 auto'
        }
        // Center the container itself
        geocoderContainer.current.style.display = 'flex'
        geocoderContainer.current.style.justifyContent = 'center'
        geocoderContainer.current.style.width = '100%'
      }
    }, 100)

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
  }, [step, geocoderLoaded])

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
    }
  }

  const handleComplete = () => {
    if (selectedLocation) {
      onComplete(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.address)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-xl border">
        <CardHeader className="text-center pb-3">
          {step === 1 ? (
            <>
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold text-foreground mb-1">Welcome to SmartSoil</CardTitle>
              <CardDescription className="text-sm">
                Your intelligent farm management platform
              </CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold text-foreground mb-1">Locate Your Farm</CardTitle>
              <CardDescription className="text-sm">
                Find your precise farm location
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <div className="text-center space-y-2 py-4">
              <p className="text-sm text-muted-foreground">
                We'll help you set up your farm management system step by step.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full flex flex-col items-center">
                <Label className="text-sm font-medium mb-1.5 block text-center">Search for your farm address</Label>
                <div ref={geocoderContainer} className="w-full flex justify-center" />
              </div>

              {selectedLocation && (
                <div className="p-3 bg-green-50/50 border border-green-200/50 rounded-md">
                  <p className="text-xs font-medium text-green-700 mb-1">Selected Location</p>
                  <p className="text-sm text-foreground font-medium">{selectedLocation.address}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {step === 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-primary hover:bg-primary/90 gap-2"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!selectedLocation}
                className="flex-1 bg-primary hover:bg-primary/90 gap-2"
              >
                Complete Setup
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {step === 2 && (
            <div className="flex justify-center pt-1">
              <div className="flex gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full transition-colors ${step === 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`h-1.5 w-1.5 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-muted"}`} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

