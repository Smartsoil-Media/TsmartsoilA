"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Task, Paddock, Mob } from "@/types/dashboard"
import { PRIORITY_COLORS } from "@/lib/constants/dashboard"

interface TasksTabProps {
  tasks: Task[]
  paddocks: Paddock[]
  mobs: Mob[]
  teamMembers: any[]
  onAddTask: () => void
  onEditTask: (task: Task) => void
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void
  onDeleteTask: (taskId: string) => void
  locationConfirmed?: boolean
}

export function TasksTab({
  tasks,
  paddocks,
  mobs,
  teamMembers,
  onAddTask,
  onEditTask,
  onToggleTaskStatus,
  onDeleteTask,
  locationConfirmed = true,
}: TasksTabProps) {
  const todoTasks = tasks.filter((t) => t.status === "todo")
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  const TaskCard = ({ task }: { task: Task }) => {
    const priorityColors = PRIORITY_COLORS as Record<string, string>
    return (
      <Card key={task.id} className="p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.status === "completed"}
            onChange={() => onToggleTaskStatus(task.id, task.status)}
            className="mt-1 w-4 h-4 text-green-600 rounded"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className={`font-semibold ${task.status === "completed" ? "line-through text-gray-500" : "text-foreground"}`}>
                  {task.title}
                </h4>
                {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority] || priorityColors.low}`}>
                  {task.priority}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
              {task.assigned_to && (
                <span>
                  Assigned to:{" "}
                  {teamMembers.find((m) => m.member_user_id === task.assigned_to)?.profiles?.display_name ||
                    teamMembers.find((m) => m.member_user_id === task.assigned_to)?.profiles?.name ||
                    "Unknown"}
                </span>
              )}
              {task.related_paddock_id && (
                <span>Paddock: {paddocks.find((p) => p.id === task.related_paddock_id)?.name}</span>
              )}
              {task.related_mob_id && <span>Mob: {mobs.find((m) => m.id === task.related_mob_id)?.name}</span>}
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => onEditTask(task)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDeleteTask(task.id)} className="text-red-600 hover:text-red-700">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Task Management</h2>
        <Button 
          onClick={onAddTask} 
          disabled={!locationConfirmed}
          className={`${!locationConfirmed ? "opacity-50 cursor-not-allowed" : ""} bg-green-600 hover:bg-green-700`}
          title={!locationConfirmed ? "Complete setup to add tasks" : ""}
        >
          Add New Task
        </Button>
      </div>

      {tasks.length === 0 ? (
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
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <div>
              <h3 className="font-semibold text-foreground mb-1">No tasks yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first task to start managing farm activities</p>
              <Button 
                onClick={onAddTask} 
                disabled={!locationConfirmed}
                className={`${!locationConfirmed ? "opacity-50 cursor-not-allowed" : ""} bg-green-600 hover:bg-green-700`}
                title={!locationConfirmed ? "Complete setup to add tasks" : ""}
              >
                Create Your First Task
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {todoTasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                To Do ({todoTasks.length})
              </h3>
              <div className="space-y-2">
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {inProgressTasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                In Progress ({inProgressTasks.length})
              </h3>
              <div className="space-y-2">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                Completed ({completedTasks.length})
              </h3>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

