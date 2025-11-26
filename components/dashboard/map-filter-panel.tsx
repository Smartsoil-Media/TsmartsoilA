"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { PADDOCK_TYPE_LABELS } from "@/lib/constants/dashboard"
import { Filter, X } from "lucide-react"

interface MapFilterPanelProps {
  showOnlyPaddocksWithTasks: boolean
  selectedPaddockTypes: string[]
  onShowOnlyPaddocksWithTasksChange: (value: boolean) => void
  onSelectedPaddockTypesChange: (types: string[]) => void
  onReset: () => void
}

const ALL_PADDOCK_TYPES = ["pasture", "cropping", "mixed", "native_bush", "wetland", "agroforestry", "other"]

export function MapFilterPanel({
  showOnlyPaddocksWithTasks,
  selectedPaddockTypes,
  onShowOnlyPaddocksWithTasksChange,
  onSelectedPaddockTypesChange,
  onReset,
}: MapFilterPanelProps) {
  const [localSelectedTypes, setLocalSelectedTypes] = useState<string[]>(selectedPaddockTypes)

  // Sync local state with props
  useEffect(() => {
    setLocalSelectedTypes(selectedPaddockTypes)
  }, [selectedPaddockTypes])

  const handleTypeToggle = (type: string, checked: boolean) => {
    if (checked) {
      const newTypes = [...localSelectedTypes, type]
      setLocalSelectedTypes(newTypes)
      onSelectedPaddockTypesChange(newTypes)
    } else {
      const newTypes = localSelectedTypes.filter((t) => t !== type)
      setLocalSelectedTypes(newTypes)
      onSelectedPaddockTypesChange(newTypes)
    }
  }

  const handleSelectAll = () => {
    setLocalSelectedTypes(ALL_PADDOCK_TYPES)
    onSelectedPaddockTypesChange(ALL_PADDOCK_TYPES)
  }

  const handleDeselectAll = () => {
    setLocalSelectedTypes([])
    onSelectedPaddockTypesChange([])
  }

  const hasActiveFilters = showOnlyPaddocksWithTasks || localSelectedTypes.length !== ALL_PADDOCK_TYPES.length

  return (
    <div className="w-80 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold text-sm">Map Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        {/* Paddocks with Tasks Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-only-tasks" className="text-sm font-medium cursor-pointer">
              Show only paddocks with tasks
            </Label>
            <p className="text-xs text-muted-foreground">
              Filter to show only paddocks that have associated tasks
            </p>
          </div>
          <Switch
            id="show-only-tasks"
            checked={showOnlyPaddocksWithTasks}
            onCheckedChange={onShowOnlyPaddocksWithTasksChange}
          />
        </div>

        <Separator />

        {/* Paddock Type Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Paddock Types</Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-6 text-xs px-2"
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="h-6 text-xs px-2"
              >
                None
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {ALL_PADDOCK_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={localSelectedTypes.includes(type)}
                  onCheckedChange={(checked) => handleTypeToggle(type, checked as boolean)}
                />
                <Label
                  htmlFor={`type-${type}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {PADDOCK_TYPE_LABELS[type]}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

