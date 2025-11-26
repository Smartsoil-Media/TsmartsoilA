"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Map, ArrowRight } from "lucide-react"

interface PaddockDrawingTutorialProps {
  farmName: string
  onComplete: () => void
  drawingButtonRef?: React.RefObject<HTMLButtonElement>
}

export function PaddockDrawingTutorial({ farmName, onComplete, drawingButtonRef }: PaddockDrawingTutorialProps) {
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Flash the drawing button if ref is provided
    if (drawingButtonRef?.current) {
      const button = drawingButtonRef.current
      let isHighlighted = false

      flashIntervalRef.current = setInterval(() => {
        if (isHighlighted) {
          button.style.boxShadow = "none"
          button.style.transform = "scale(1)"
        } else {
          button.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.4)"
          button.style.transform = "scale(1.05)"
        }
        isHighlighted = !isHighlighted
      }, 600)
    }

    return () => {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current)
      }
      // Reset button styles
      if (drawingButtonRef?.current) {
        drawingButtonRef.current.style.boxShadow = ""
        drawingButtonRef.current.style.transform = ""
      }
    }
  }, [drawingButtonRef])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-4 left-4 pointer-events-auto max-w-md">
        <Card className="w-full shadow-xl border bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Map className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  Let's start drawing in some paddocks for {farmName}
                </CardTitle>
                <CardDescription className="text-sm">
                  Use the drawing tool to outline your paddocks on the map
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs mt-0.5">
                  1
                </div>
                <p className="text-xs">Click the <strong className="text-foreground">"Draw Paddock"</strong> button (it's flashing to help you find it)</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs mt-0.5">
                  2
                </div>
                <p className="text-xs">Click on the map to start drawing your paddock boundary</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs mt-0.5">
                  3
                </div>
                <p className="text-xs">Click multiple points to create the shape, then double-click to finish</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs mt-0.5">
                  4
                </div>
                <p className="text-xs">Give your paddock a name and save it</p>
              </div>
            </div>
            <Button
              onClick={onComplete}
              className="w-full bg-primary hover:bg-primary/90 gap-2"
              size="sm"
            >
              Got it, let's draw!
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

