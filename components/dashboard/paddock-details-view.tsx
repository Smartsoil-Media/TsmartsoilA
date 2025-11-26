"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Plus } from "lucide-react"
import type { Paddock, Task } from "@/types/dashboard"
import { SQUARE_METERS_TO_HECTARES, PRIORITY_COLORS, PADDOCK_TYPE_LABELS } from "@/lib/constants/dashboard"
import type { GrazingStatus } from "@/hooks/use-grazing"

interface PaddockDetailsViewProps {
  paddock: Paddock
  tasks: Task[]
  onClose: () => void
  onEdit: () => void
  onAddTask: () => void
  onEditTask: (task: Task) => void
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void
  getGrazingStatus: (paddockId: string) => GrazingStatus
  calculateStockingRate: (paddockId: string, paddockArea: number) => number
  calculatePaddockDSE: (paddockId: string) => number
}

export function PaddockDetailsView({
  paddock,
  tasks,
  onClose,
  onEdit,
  onAddTask,
  onEditTask,
  onToggleTaskStatus,
  getGrazingStatus,
  calculateStockingRate,
  calculatePaddockDSE,
}: PaddockDetailsViewProps) {
  const grazingStatus = getGrazingStatus(paddock.id)
  const relatedTasks = tasks.filter((task) => {
    // Check both old format (related_paddock_id) and new format (related_paddock_ids array)
    return (
      task.related_paddock_id === paddock.id ||
      (task.related_paddock_ids && task.related_paddock_ids.includes(paddock.id))
    )
  })

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Paddock Details</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4 mr-1" />
          Close
        </Button>
      </div>

      <Card className="p-6 border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground">{paddock.name}</h3>
            {paddock.type && (
              <p className="text-sm text-gray-600 capitalize mt-1">
                {PADDOCK_TYPE_LABELS[paddock.type] || paddock.type}
                {paddock.type === "agroforestry" && paddock.tree_species && (
                  <span className="ml-2 text-xs text-muted-foreground">({paddock.tree_species})</span>
                )}
              </p>
            )}
          </div>
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: paddock.color || "#10b981" }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card/50 rounded-lg p-4 border border-border/50">
            <p className="text-sm text-gray-600 mb-1">Area</p>
            <p className="text-2xl font-semibold text-foreground">
              {(paddock.area / SQUARE_METERS_TO_HECTARES).toFixed(2)} ha
            </p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Type</p>
            <p className="text-lg font-semibold text-foreground">
              {paddock.type ? PADDOCK_TYPE_LABELS[paddock.type] || paddock.type : "Not specified"}
            </p>
          </div>
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Stocking Rate</p>
            <p className="text-2xl font-semibold text-primary">
              {calculateStockingRate(paddock.id, paddock.area).toFixed(1)} DSE/ha
            </p>
            <p className="text-xs text-muted-foreground mt-1">{calculatePaddockDSE(paddock.id).toFixed(0)} total DSE</p>
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/10">
          <p className="text-sm text-muted-foreground mb-1">Grazing Status</p>
          {grazingStatus.status === "grazing" ? (
            <>
              <p className="text-lg font-semibold text-primary">
                Currently Being Grazed ({grazingStatus.mobCount} {grazingStatus.mobCount === 1 ? "mob" : "mobs"})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {grazingStatus.days === 0
                  ? "Started today"
                  : `Grazing for ${grazingStatus.days} ${grazingStatus.days === 1 ? "day" : "days"}`}
              </p>
            </>
          ) : grazingStatus.status === "resting" ? (
            <>
              <p className="text-lg font-semibold text-green-700">Resting</p>
              <p className="text-xs text-muted-foreground mt-1">
                {grazingStatus.days} {grazingStatus.days === 1 ? "day" : "days"} since last grazed
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold text-gray-500">No grazing data</p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-foreground">Related Tasks</h4>
            <Button size="sm" onClick={onAddTask} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>
          {relatedTasks.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {relatedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20 transition-colors cursor-pointer hover:bg-primary/15"
                  onClick={() => onEditTask(task)}
                >
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    onChange={(e) => {
                      e.stopPropagation()
                      onToggleTaskStatus(task.id, task.status)
                    }}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className={`font-medium ${
                          task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks for this paddock yet</p>
          )}
        </div>

        <div className="border-t border-border/50 pt-4">
          <Button onClick={onEdit} className="w-full bg-green-600 hover:bg-green-700">
            Edit Paddock Details
          </Button>
        </div>
      </Card>
    </>
  )
}

