"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Plus, DollarSign, AlertTriangle, Activity, FileText, Edit } from "lucide-react"
import type { Mob } from "@/types/dashboard"

interface LivestockTabProps {
  mobs: Mob[]
  onShowAddMobModal: () => void
  onMobClick: (mob: Mob) => void
  onShowLambingWorksheet: (mob: Mob) => void
  onShowAddSheepModal: (mob: Mob) => void
  onShowMarkSoldModal: (mob: Mob) => void
  onShowRegisterLossModal: (mob: Mob) => void
  onShowTrackTreatmentModal: (mob: Mob) => void
  onShowLogObservationModal: (mob: Mob) => void
  getPaddockName: (paddockId: string | null) => string
  getDaysInPaddock: (mobId: string) => number | null
  getOffspringName: (livestockType: string) => string
  locationConfirmed?: boolean
}

export function LivestockTab({
  mobs,
  onShowAddMobModal,
  onMobClick,
  onShowLambingWorksheet,
  onShowAddSheepModal,
  onShowMarkSoldModal,
  onShowRegisterLossModal,
  onShowTrackTreatmentModal,
  onShowLogObservationModal,
  getPaddockName,
  getDaysInPaddock,
  getOffspringName,
  locationConfirmed = true,
}: LivestockTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Livestock Management</h2>
        <Button 
          onClick={onShowAddMobModal} 
          disabled={!locationConfirmed}
          className={`${!locationConfirmed ? "opacity-50 cursor-not-allowed" : ""} bg-green-600 hover:bg-green-700`}
          title={!locationConfirmed ? "Complete setup to add livestock" : ""}
        >
          Add New Mob
        </Button>
      </div>

      {mobs.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
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
              className="text-gray-400"
            >
              <path d="M2 17 17 2" />
              <path d="m2 14 8 8" />
              <path d="m5 11 8 8" />
              <path d="m8 8 8 8" />
              <path d="m11 5 8 8" />
              <path d="m14 2 8 8" />
              <path d="M7 22 22 7" />
            </svg>
            <div>
              <h3 className="font-semibold text-foreground mb-1">No livestock yet</h3>
              <p className="text-sm text-gray-500 mb-4">Add your first mob to start tracking livestock movements</p>
              <Button 
                onClick={onShowAddMobModal} 
                disabled={!locationConfirmed}
                className={`${!locationConfirmed ? "opacity-50 cursor-not-allowed" : ""} bg-green-600 hover:bg-green-700`}
                title={!locationConfirmed ? "Complete setup to add livestock" : ""}
              >
                Add Your First Mob
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mobs.map((mob) => {
            const daysInPaddock = getDaysInPaddock(mob.id)
            const offspringName = getOffspringName(mob.livestock_type)

            return (
              <Card key={mob.id} className="p-4 hover:shadow-lg transition-shadow relative">
                <div className="absolute top-3 right-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Mob Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowLambingWorksheet(mob)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4 text-green-600" />
                          <span>Lambing</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowAddSheepModal(mob)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4 text-green-600" />
                          <span>Add Sheep</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowMarkSoldModal(mob)
                          }}
                        >
                          <DollarSign className="mr-2 h-4 w-4 text-blue-600" />
                          <span>Mark as Sold</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowRegisterLossModal(mob)
                          }}
                        >
                          <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                          <span>Register Loss</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowTrackTreatmentModal(mob)
                          }}
                        >
                          <Activity className="mr-2 h-4 w-4 text-purple-600" />
                          <span>Track Treatment</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowLogObservationModal(mob)
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4 text-gray-600" />
                          <span>Log Observation</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onMobClick(mob)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4 text-gray-600" />
                        <span>Edit Details</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="cursor-pointer" onClick={() => onMobClick(mob)}>
                  <div className="flex items-start justify-between mb-3 pr-8">
                    <div>
                      <h3 className="font-semibold text-foreground">{mob.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{mob.livestock_type}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                      {mob.size} head
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-gray-600">Location</span>
                      <span className="font-medium text-foreground">{getPaddockName(mob.current_paddock_id)}</span>
                    </div>

                    {daysInPaddock !== null && (
                      <div className="flex items-center justify-between py-2 border-t border-gray-100">
                        <span className="text-gray-600">Days in paddock</span>
                        <span className="font-medium text-foreground">{daysInPaddock} days</span>
                      </div>
                    )}

                    {mob.notes && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-gray-600 text-xs">{mob.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
