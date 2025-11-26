"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import type { Infrastructure } from "@/types/dashboard"
import { INFRASTRUCTURE_TYPE_ICONS, SQUARE_METERS_TO_HECTARES } from "@/lib/constants/dashboard"

interface InfrastructureDetailsViewProps {
  infrastructure: Infrastructure
  onClose: () => void
  onEdit: () => void
  onDelete: (id: string) => void
}

export function InfrastructureDetailsView({
  infrastructure,
  onClose,
  onEdit,
  onDelete,
}: InfrastructureDetailsViewProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Infrastructure Details</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4 mr-1" />
          Close
        </Button>
      </div>

      <Card className="p-6 border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-foreground">{infrastructure.name}</h3>
            <p className="text-sm text-gray-600 capitalize mt-1">{infrastructure.type.replace("_", " ")}</p>
          </div>
          <div className="text-4xl">
            {INFRASTRUCTURE_TYPE_ICONS[infrastructure.type] || INFRASTRUCTURE_TYPE_ICONS.other}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card/50 rounded-lg p-4 border border-border/50">
            <p className="text-sm text-gray-600 mb-1">Condition</p>
            <p
              className={`text-lg font-semibold capitalize ${
                infrastructure.condition === "good"
                  ? "text-green-700"
                  : infrastructure.condition === "fair"
                    ? "text-yellow-700"
                    : infrastructure.condition === "poor"
                      ? "text-orange-700"
                      : infrastructure.condition === "needs_repair"
                        ? "text-red-700"
                        : ""
              }`}
            >
              {infrastructure.condition.replace("_", " ")}
            </p>
          </div>
          {infrastructure.area && infrastructure.area > 0 && (
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <p className="text-sm text-gray-600 mb-1">Area</p>
              <p className="text-lg font-semibold text-foreground">
                {(infrastructure.area / SQUARE_METERS_TO_HECTARES).toFixed(2)} ha
              </p>
            </div>
          )}
        </div>

        {infrastructure.capacity && (
          <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/10">
            <p className="text-sm text-muted-foreground mb-1">Capacity</p>
            <p className="text-2xl font-semibold text-foreground">{infrastructure.capacity.toLocaleString()} L</p>
          </div>
        )}

        {infrastructure.notes && (
          <div className="border-t border-gray-200 pt-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Notes</p>
            <p className="text-foreground">{infrastructure.notes}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <Button onClick={onEdit} className="w-full bg-purple-600 hover:bg-purple-700">
            Edit Infrastructure Details
          </Button>
          <Button
            onClick={() => onDelete(infrastructure.id)}
            variant="outline"
            className="w-full text-red-600 border-red-600 hover:bg-red-50"
          >
            Delete Infrastructure
          </Button>
        </div>
      </Card>
    </>
  )
}

