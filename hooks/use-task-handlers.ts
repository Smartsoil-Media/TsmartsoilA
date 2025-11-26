"use client"

import { toast } from "sonner"
import type { Task } from "@/types/dashboard"

interface UseTaskHandlersProps {
  editingTask: Task | null
  setEditingTask: (task: Task | null) => void
  setShowAddTaskModal: (show: boolean) => void
  createTask: (taskData: {
    title: string
    description: string | null
    status: string
    priority: string
    due_date: string | null
    related_paddock_ids?: string[]
    related_paddock_id?: string | null
    related_mob_id: string | null
    assigned_to: string | null
  }) => Promise<Task | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>
  toggleTaskStatus: (id: string, currentStatus: string) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
}

export function useTaskHandlers({
  editingTask,
  setEditingTask,
  setShowAddTaskModal,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
}: UseTaskHandlersProps) {

  const handleSaveTask = async (taskData: {
    title: string
    description: string
    status: string
    priority: string
    due_date: string | null
    related_paddock_ids: string[]
    related_mob_id: string | null
    assigned_to: string | null
  }) => {
    try {
      if (editingTask) {
        const updateData: Partial<Task & { related_paddock_ids?: string[] }> = {
          title: taskData.title,
          description: taskData.description || null,
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.due_date,
          related_paddock_ids: taskData.related_paddock_ids,
          related_mob_id: taskData.related_mob_id,
          assigned_to: taskData.assigned_to,
          updated_at: new Date().toISOString(),
        }

        if (taskData.status === "completed" && editingTask.status !== "completed") {
          updateData.completed_at = new Date().toISOString()
        } else if (taskData.status !== "completed") {
          updateData.completed_at = null
        }

        const success = await updateTask(editingTask.id, updateData)
        if (success) {
          toast.success("Task updated successfully")
        } else {
          toast.error("Failed to update task")
        }
      } else {
        const task = await createTask({
          title: taskData.title,
          description: taskData.description || null,
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.due_date,
          related_paddock_ids: taskData.related_paddock_ids,
          related_mob_id: taskData.related_mob_id,
          assigned_to: taskData.assigned_to,
        })

        if (task) {
          toast.success("Task created successfully")
        } else {
          toast.error("Failed to create task")
        }
      }

      setShowAddTaskModal(false)
      setEditingTask(null)
    } catch (error) {
      console.error("Error saving task:", error)
      toast.error("An error occurred while saving the task")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const success = await deleteTask(taskId)
      if (success) {
        toast.success("Task deleted successfully")
      } else {
        toast.error("Failed to delete task")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("An error occurred while deleting the task")
    }
  }

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const success = await toggleTaskStatus(taskId, currentStatus)
      if (success) {
        const newStatus = currentStatus === "completed" ? "todo" : "completed"
        toast.success(`Task marked as ${newStatus}`)
      } else {
        toast.error("Failed to update task status")
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      toast.error("An error occurred while updating the task status")
    }
  }

  return {
    handleSaveTask,
    handleDeleteTask,
    handleToggleTaskStatus,
  }
}

