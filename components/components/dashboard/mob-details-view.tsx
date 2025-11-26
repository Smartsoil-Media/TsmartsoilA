"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { X, Plus, DollarSign, AlertTriangle, MoreVertical, ArrowRight, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Mob } from "@/types/dashboard"
import { getLivestockIcon, getOffspringName, getPaddockName } from "@/lib/utils/dashboard"
import type { Paddock } from "@/types/dashboard"

interface MobDetailsViewProps {
  mob: Mob
  paddocks: Paddock[]
  mobEvents: any[]
  mobAnimals: any[]
  loadingMobEvents: boolean
  loadingAnimals: boolean
  onClose: () => void
  onEdit: () => void
  onMovePaddock: () => void
  onAddLambs: () => void
  onAddSheep: () => void
  onLambing: () => void
  onMarkSold: () => void
  onRegisterLoss: () => void
  getDaysInPaddock: (mobId: string) => number | null
  calculateMobAnalytics: (mob: Mob) => {
    totalBirths: number
    totalSales: number
    totalLosses: number
    birthRate: number
    sizeOverTime: { date: string; size: number; event: string }[]
  }
  calculateAge: (birthDate: string | null, purchaseDate: string | null, ageAtPurchase: number | null) => string
}

export function MobDetailsView({
  mob,
  paddocks,
  mobEvents,
  mobAnimals,
  loadingMobEvents,
  loadingAnimals,
  onClose,
  onEdit,
  onMovePaddock,
  onAddLambs,
  onAddSheep,
  onLambing,
  onMarkSold,
  onRegisterLoss,
  getDaysInPaddock,
  calculateMobAnalytics,
  calculateAge,
}: MobDetailsViewProps) {
  const analytics = calculateMobAnalytics(mob)
  const daysInPaddock = getDaysInPaddock(mob.id)

  return (
    <>
      <div className="mb-4 p-4 bg-card rounded-lg shadow-sm border border-border/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-foreground">{mob.name}</h3>
            <p className="text-sm text-muted-foreground">
              {mob.livestock_type} • {mob.size} head
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mob Management</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <span>Edit Mob Details</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {mob.livestock_type === "sheep" && (
                  <>
                    <DropdownMenuItem onClick={onLambing}>
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Lambing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAddSheep}>
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Add Sheep</span>
                    </DropdownMenuItem>
                  </>
                )}
                {mob.livestock_type !== "sheep" && (
                  <DropdownMenuItem onClick={onAddLambs}>
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Add {getOffspringName(mob.livestock_type)}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onMarkSold}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Mark as Sold</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRegisterLoss}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Register Loss</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-6 border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-foreground">{mob.name}</h3>
            <p className="text-sm text-muted-foreground capitalize mt-1 font-medium">{mob.livestock_type}</p>
          </div>
          <div className="text-4xl">{getLivestockIcon(mob.livestock_type)}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Mob Size</p>
            <p className="text-2xl font-bold text-foreground">{mob.size} head</p>
          </div>
          <button
            onClick={onMovePaddock}
            className="bg-accent/50 rounded-lg p-4 text-left hover:bg-accent transition-all duration-200 group border border-border/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Current Location</p>
                <p className="text-lg font-bold text-foreground">{getPaddockName(mob.current_paddock_id, paddocks)}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Click to move paddock</p>
          </button>
        </div>

        {daysInPaddock !== null && (
          <div className="bg-primary/10 rounded-lg p-4 mb-6 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Time in Current Paddock</p>
            <p className="text-2xl font-semibold text-primary">{daysInPaddock} days</p>
          </div>
        )}

        {mob.notes && (
          <div className="border-t border-border/50 pt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Notes</p>
            <p className="text-foreground">{mob.notes}</p>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Mob Analytics</CardTitle>
          <CardDescription>Performance metrics and historical data</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMobEvents ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          ) : mobEvents.length > 0 ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Total Births</p>
                  <p className="text-2xl font-semibold text-primary">{analytics.totalBirths}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Birth Rate</p>
                  <p className="text-2xl font-semibold text-primary">{analytics.birthRate.toFixed(1)}%</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Total Sales</p>
                  <p className="text-2xl font-semibold text-primary">{analytics.totalSales}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Total Losses</p>
                  <p className="text-2xl font-semibold text-destructive">{analytics.totalLosses}</p>
                </div>
              </div>

              {/* Mob Size Over Time Chart */}
              <div className="border-t border-border/50 pt-4">
                <h4 className="text-sm font-bold text-foreground mb-4">Mob Size Over Time</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.sizeOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return `${date.getMonth() + 1}/${date.getDate()}`
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        label={{
                          value: "Head",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 10 },
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as any
                            const date = new Date(data.date)
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                                <p className="text-xs font-medium">
                                  {date.toLocaleDateString("en-AU", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                                <p className="text-xs text-primary font-semibold">{data.size} head</p>
                                <p className="text-xs text-muted-foreground capitalize">{data.event}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="size"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={{ fill: "#16a34a", r: 4 }}
                        name="Mob Size"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Individual Animals</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Detailed records for {mobAnimals.length} tracked {mob.livestock_type}
                    </p>
                  </div>
                </div>

                {loadingAnimals ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">Loading animals...</p>
                  </div>
                ) : mobAnimals.length > 0 ? (
                  <div className="overflow-x-auto border border-border/50 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tag #</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Weight (kg)</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mobAnimals.map((animal) => (
                          <TableRow key={animal.id}>
                            <TableCell className="font-medium">
                              {animal.tag_number || <span className="text-muted-foreground italic">No tag</span>}
                            </TableCell>
                            <TableCell>
                              {animal.birth_date ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  Born
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  Purchased
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {animal.birth_date
                                ? new Date(animal.birth_date).toLocaleDateString()
                                : animal.purchase_date
                                  ? new Date(animal.purchase_date).toLocaleDateString()
                                  : "Unknown"}
                            </TableCell>
                            <TableCell>{calculateAge(animal.birth_date, animal.purchase_date, animal.age_at_purchase)}</TableCell>
                            <TableCell>{animal.live_weight ? `${animal.live_weight} kg` : "-"}</TableCell>
                            <TableCell>{animal.notes || <span className="text-muted-foreground italic">No notes</span>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-border/50 rounded-lg bg-card/50">
                    <p className="text-sm text-muted-foreground mb-1">No individual animals tracked yet</p>
                    <p className="text-xs text-muted-foreground/70">Use the Lambing worksheet to add individual animal records</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-1">No events recorded yet</p>
              <p className="text-xs text-gray-400">Start tracking births, sales, and losses to see analytics</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

