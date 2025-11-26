"use client"

import { Button } from "@/components/ui/button"
import { X, ArrowRight } from "lucide-react"
import type { Paddock, Mob } from "@/types/dashboard"
import type { GrazingStatus } from "@/hooks/use-grazing"

interface MovePaddockModalProps {
  isOpen: boolean
  mob: Mob
  paddocks: Paddock[]
  onClose: () => void
  onMove: (paddockId: string) => void
  getGrazingStatus: (paddockId: string) => GrazingStatus
  getPaddockName: (paddockId: string | null, paddocks: Paddock[]) => string
}

export function MovePaddockModal({
  isOpen,
  mob,
  paddocks,
  onClose,
  onMove,
  getGrazingStatus,
  getPaddockName,
}: MovePaddockModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Move {mob.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            Current location: <span className="font-medium text-foreground">{getPaddockName(mob.current_paddock_id, paddocks)}</span>
          </p>
          <p className="text-sm text-muted-foreground">Select new paddock:</p>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {paddocks
            .filter((p) => p.id !== mob.current_paddock_id)
            .sort((a, b) => {
              const typeOrder: Record<string, number> = {
                pasture: 1,
                cropping: 2,
                other: 3,
              }
              const aOrder = typeOrder[a.type?.toLowerCase() || "other"] || 99
              const bOrder = typeOrder[b.type?.toLowerCase() || "other"] || 99
              return aOrder - bOrder
            })
            .map((paddock) => {
              const grazingStatus = getGrazingStatus(paddock.id)
              let grazingInfo = "No grazing data"

              if (grazingStatus.status === "grazing") {
                grazingInfo =
                  grazingStatus.days === 0
                    ? "Currently being grazed"
                    : `Being grazed for ${grazingStatus.days} ${grazingStatus.days === 1 ? "day" : "days"}`
              } else if (grazingStatus.status === "resting") {
                grazingInfo = `Resting ${grazingStatus.days} ${grazingStatus.days === 1 ? "day" : "days"}`
              }

              return (
                <button
                  key={paddock.id}
                  onClick={() => onMove(paddock.id)}
                  className="w-full text-left p-4 border border-border rounded-lg hover:bg-accent hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{paddock.name}</p>
                      <p className="text-sm text-muted-foreground capitalize mt-0.5">{paddock.type || "Type not set"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{grazingInfo}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </button>
              )
            })}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

