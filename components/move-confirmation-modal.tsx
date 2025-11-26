"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, CheckCircle2 } from "lucide-react"

interface MoveConfirmationModalProps {
  isOpen: boolean
  mobName: string
  oldPaddockName: string
  newPaddockName: string
  daysInPaddock: number
  onClose: () => void
}

export function MoveConfirmationModal({
  isOpen,
  mobName,
  oldPaddockName,
  newPaddockName,
  daysInPaddock,
  onClose,
}: MoveConfirmationModalProps) {
  if (!isOpen) return null

  const daysText = daysInPaddock === 1 ? "1 day" : `${daysInPaddock} days`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Mob Moved</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-foreground">
              <span className="font-medium">{mobName}</span> moved from{" "}
              <span className="font-medium">{oldPaddockName}</span> to{" "}
              <span className="font-medium">{newPaddockName}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              They were in {oldPaddockName} for {daysText}.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              OK
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

