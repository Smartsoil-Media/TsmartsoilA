"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Infrastructure } from "@/types/dashboard"
import { INFRASTRUCTURE_TYPE_ICONS, CONDITION_COLORS, SQUARE_METERS_TO_HECTARES } from "@/lib/constants/dashboard"

interface InfrastructureTabProps {
  infrastructure: Infrastructure[]
  onDrawInfrastructure?: () => void // Optional for backward compatibility
  onSelectInfrastructure: (item: Infrastructure) => void
  locationConfirmed?: boolean
}

export function InfrastructureTab({
  infrastructure,
  onDrawInfrastructure,
  onSelectInfrastructure,
  locationConfirmed = true,
}: InfrastructureTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Infrastructure</h2>
        <p className="text-sm text-muted-foreground">
          Use the pin tool on the map to add infrastructure
        </p>
      </div>

      {infrastructure.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 text-gray-400"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <p className="text-sm mb-2">No infrastructure added yet</p>
          <p className="text-xs text-gray-400">Use the pin tool on the map to add infrastructure</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {infrastructure.map((item) => (
            <Card
              key={item.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectInfrastructure(item)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{INFRASTRUCTURE_TYPE_ICONS[item.type] || INFRASTRUCTURE_TYPE_ICONS.other}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{item.type.replace("_", " ")}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${CONDITION_COLORS[item.condition] || CONDITION_COLORS.good}`}>
                  {item.condition.replace("_", " ")}
                </span>
              </div>
              {item.capacity && (
                <p className="text-sm text-gray-600 mb-2">Capacity: {item.capacity.toLocaleString()} L</p>
              )}
              {item.area && item.area > 0 && (
                <p className="text-sm text-gray-600 mb-2">Area: {(item.area / SQUARE_METERS_TO_HECTARES).toFixed(2)} ha</p>
              )}
              {item.notes && <p className="text-xs text-gray-500 line-clamp-2 mt-2">{item.notes}</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

