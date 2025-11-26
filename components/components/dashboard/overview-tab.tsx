"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CloudRain, MoreVertical, Pencil, MapPin } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { LivestockPricesCard } from "@/components/livestock-prices-card"
import type { Profile, Paddock, Task, RainfallData, WeatherData, ActiveTab } from "@/types/dashboard"

interface OverviewTabProps {
  profile: Profile
  paddocks: Paddock[]
  tasks: Task[]
  rainfallData: RainfallData[]
  rainfallLoading: boolean
  weather: WeatherData | null
  weatherLoading: boolean
  weatherError: string | null
  onSetActiveTab: (tab: ActiveTab) => void
  onEditTask: (task: Task) => void
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void
  onShowAddTaskModal: () => void
  fetchTaskPaddocks?: (taskId: string) => Promise<string[]>
  onHighlightPaddocks?: (paddockIds: string[]) => void
}

export function OverviewTab({
  profile,
  paddocks,
  tasks,
  rainfallData,
  rainfallLoading,
  weather,
  weatherLoading,
  weatherError,
  onSetActiveTab,
  onEditTask,
  onToggleTaskStatus,
  onShowAddTaskModal,
  fetchTaskPaddocks,
  onHighlightPaddocks,
}: OverviewTabProps) {
  // Store task paddock mappings: taskId -> paddock names array
  const [taskPaddockNames, setTaskPaddockNames] = useState<Record<string, string[]>>({})
  // Track which dropdown menu is open (by task ID)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // Fetch paddock IDs for all tasks and map to names
  useEffect(() => {
    if (!fetchTaskPaddocks || tasks.length === 0) return

    const fetchAllTaskPaddocks = async () => {
      const mappings: Record<string, string[]> = {}

      await Promise.all(
        tasks.map(async (task) => {
          const paddockIds = await fetchTaskPaddocks(task.id)
          const paddockNames = paddockIds
            .map((id) => paddocks.find((p) => p.id === id)?.name)
            .filter((name): name is string => !!name)

          if (paddockNames.length > 0) {
            mappings[task.id] = paddockNames
          }
        })
      )

      setTaskPaddockNames(mappings)
    }

    fetchAllTaskPaddocks()
  }, [tasks, paddocks, fetchTaskPaddocks])

  // Calculate task statistics
  const activeTasks = tasks.filter((task) => task.status !== "completed")
  const urgentTasks = activeTasks.filter((task) => task.priority === "urgent" || task.priority === "high")
  const overdueTasks = activeTasks.filter((task) => {
    if (!task.due_date) return false
    const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilDue < 0
  })

  // Sort tasks: overdue first, then by priority, then by due date
  const sortedTasks = activeTasks.sort((a, b) => {
    const aDays = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999
    const bDays = b.due_date ? Math.ceil((new Date(b.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999

    // Overdue tasks first
    if (aDays < 0 && bDays >= 0) return -1
    if (aDays >= 0 && bDays < 0) return 1

    // Then by priority
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    const aPriority = priorityOrder[a.priority] ?? 4
    const bPriority = priorityOrder[b.priority] ?? 4
    if (aPriority !== bPriority) return aPriority - bPriority

    // Then by due date
    if (aDays !== bDays) return aDays - bDays

    return 0
  })

  return (
    <>
      <h2 className="text-xl font-semibold text-foreground mb-6">Farm Overview</h2>

      {/* SECTION 1: OPERATIONS - Most Important */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Active Tasks - Takes 2 columns on large screens */}
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Active Tasks
              {urgentTasks.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-destructive/20 text-destructive rounded-full">
                  {urgentTasks.length} urgent
                </span>
              )}
              {overdueTasks.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-full">
                  {overdueTasks.length} overdue
                </span>
              )}
            </h3>
            <button
              onClick={() => onSetActiveTab("tasks")}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {sortedTasks.slice(0, 6).map((task) => {
              const daysUntilDue = task.due_date
                ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null

              let dueDateText = "No due date"
              if (daysUntilDue !== null) {
                if (daysUntilDue < 0) {
                  dueDateText = `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? "s" : ""}`
                } else if (daysUntilDue === 0) {
                  dueDateText = "Due today"
                } else if (daysUntilDue === 1) {
                  dueDateText = "Due tomorrow"
                } else if (daysUntilDue <= 7) {
                  dueDateText = `Due in ${daysUntilDue} days`
                } else {
                  dueDateText = `Due ${new Date(task.due_date!).toLocaleDateString()}`
                }
              }

              const isOverdue = daysUntilDue !== null && daysUntilDue < 0
              const isUrgent = task.priority === "urgent" || task.priority === "high"
              const priorityColors: Record<string, string> = {
                low: "bg-muted text-muted-foreground",
                medium: "bg-primary/20 text-primary",
                high: "bg-orange-500/20 text-orange-500",
                urgent: "bg-destructive/20 text-destructive",
              }

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isOverdue
                    ? "bg-destructive/10 border border-destructive/30 hover:bg-destructive/15"
                    : isUrgent
                      ? "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                      : "bg-muted/50 hover:bg-muted"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={(e) => {
                      onToggleTaskStatus(task.id, task.status)
                    }}
                    className="w-4 h-4 text-primary rounded cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className={`font-medium truncate ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-medium ${isOverdue ? "text-destructive" : daysUntilDue === 0 ? "text-orange-500" : "text-muted-foreground"
                        }`}
                    >
                      {dueDateText}
                    </p>
                    {taskPaddockNames[task.id] && taskPaddockNames[task.id].length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Paddocks: {taskPaddockNames[task.id].join(", ")}
                      </p>
                    )}
                  </div>
                  <DropdownMenu open={openDropdownId === task.id} onOpenChange={(open) => setOpenDropdownId(open ? task.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // Close the dropdown
                          setOpenDropdownId(null)
                          // Highlight paddocks on map
                          if (onHighlightPaddocks && fetchTaskPaddocks) {
                            try {
                              const paddockIds = await fetchTaskPaddocks(task.id)
                              if (paddockIds.length > 0) {
                                onHighlightPaddocks(paddockIds)
                              }
                            } catch (error) {
                              console.error("Error fetching task paddocks:", error)
                            }
                          }
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Show paddocks
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // Close the dropdown
                          setOpenDropdownId(null)
                          onEditTask(task)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
            {activeTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">No active tasks</p>
                <button
                  onClick={() => {
                    onSetActiveTab("tasks")
                    onShowAddTaskModal()
                  }}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Create your first task →
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity - Takes 1 column */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            Recent Activity
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 p-2 bg-muted rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Paddock created</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Location updated</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted rounded">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Profile completed</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION 2: MONITORING - Sensor Readings */}
      <Card className="p-4 mb-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          Sensor Readings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <p className="text-sm text-muted-foreground mb-1">Soil Moisture</p>
            <p className="text-2xl font-bold text-foreground">45%</p>
            <p className="text-xs text-muted-foreground mt-1">Optimal range</p>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <p className="text-sm text-muted-foreground mb-1">Soil Temperature</p>
            <p className="text-2xl font-bold text-foreground">18°C</p>
            <p className="text-xs text-muted-foreground mt-1">Good for growth</p>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <p className="text-sm text-muted-foreground mb-1">pH Level</p>
            <p className="text-2xl font-bold text-foreground">6.5</p>
            <p className="text-xs text-muted-foreground mt-1">Slightly acidic</p>
          </div>
        </div>
      </Card>

      {/* SECTION 3: INFORMATION - Weather & Farm Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weather - Takes 2 columns */}
        <Card className="lg:col-span-2 p-4">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              Weather
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {/* Rainfall Data Section */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-primary" />
                Rainfall Data
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Last 3 months & 16-day forecast</p>
              {rainfallLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading rainfall data...</p>
                </div>
              ) : rainfallData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rainfallData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return `${date.getMonth() + 1}/${date.getDate()}`
                        }}
                        interval={30}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        label={{ value: "mm", angle: -90, position: "insideLeft", style: { fontSize: 10 } }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as RainfallData
                            const date = new Date(data.date)
                            return (
                              <div className="bg-card p-2 border border-border rounded shadow-sm">
                                <p className="text-xs font-medium text-foreground">
                                  {date.toLocaleDateString("en-AU", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                                <p className="text-xs text-primary">{data.rainfall.toFixed(1)} mm</p>
                                <p className="text-xs text-muted-foreground capitalize">{data.type}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rainfall"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        name="Rainfall (mm)"
                      />
                      <ReferenceLine
                        x={new Date().toISOString().split("T")[0]}
                        stroke="#16a34a"
                        strokeDasharray="3 3"
                        label={{ value: "Today", position: "top", fontSize: 10 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No rainfall data available</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Weather & Conditions Section */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Current Conditions</h4>
              {weatherLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm mt-2 text-muted-foreground">Loading weather...</p>
                </div>
              ) : weatherError ? (
                <div className="text-center py-4">
                  <p className="text-sm text-destructive">{weatherError}</p>
                </div>
              ) : weather ? (
                <div className="space-y-3">
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <p className="text-sm text-muted-foreground mb-1">Current Temperature</p>
                    <p className="text-2xl font-bold text-foreground">{weather.temperature}°C</p>
                    <p className="text-xs text-muted-foreground mt-1">{weather.weatherDescription}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted rounded p-2">
                      <p className="text-muted-foreground text-xs">Humidity</p>
                      <p className="font-semibold text-foreground">{weather.humidity}%</p>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <p className="text-muted-foreground text-xs">Wind</p>
                      <p className="font-semibold text-foreground">{weather.windSpeed} km/h</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No weather data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Farm Summary - Takes 1 column */}
        <Card className="p-4">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              Farm Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Total Paddocks</p>
              <p className="text-3xl font-bold text-foreground">{paddocks.length}</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Total Area</p>
              <p className="text-3xl font-bold text-foreground">
                {(paddocks.reduce((sum, p) => sum + p.area, 0) / 10000).toFixed(2)} ha
              </p>
            </div>
            <div className="pt-3 border-t border-border space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Farm Name</p>
                <p className="font-medium text-foreground">{profile.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium text-foreground">{profile.enterprise_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: MARKET DATA - Livestock Prices */}
      <div className="mb-6">
        <LivestockPricesCard />
      </div>
    </>
  )
}
