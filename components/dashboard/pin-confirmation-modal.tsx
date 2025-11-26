"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Check, X } from "lucide-react"

interface PinConfirmationModalProps {
  onConfirm: (confirmed: boolean) => void
}

export function PinConfirmationModal({ onConfirm }: PinConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-4 left-4 pointer-events-auto">
        <Card className="w-full max-w-sm shadow-xl border bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">Does that look right?</CardTitle>
                <CardDescription className="text-sm">
                  Check the pin on the map to confirm your farm location
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={() => onConfirm(true)}
                className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                size="sm"
              >
                <Check className="h-4 w-4" />
                Yes
              </Button>
              <Button
                onClick={() => onConfirm(false)}
                variant="outline"
                className="flex-1 gap-2"
                size="sm"
              >
                <X className="h-4 w-4" />
                No
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

