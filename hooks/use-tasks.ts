"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  related_paddock_id: string | null
  related_paddock_ids?: string[] // Array of paddock IDs from task_paddocks junction table
  related_mob_id: string | null
  assigned_to: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchTaskPaddocks = useCallback(async (taskId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from("task_paddocks")
        .select("paddock_id")
        .eq("task_id", taskId)

      if (error) throw error
      return data?.map((item) => item.paddock_id) || []
    } catch (error) {
      console.error("Error fetching task paddocks:", error)
      return []
    }
  }, [supabase])

  const saveTaskPaddocks = async (taskId: string, paddockIds: string[]): Promise<boolean> => {
    try {
      // Delete existing associations
      const { error: deleteError } = await supabase
        .from("task_paddocks")
        .delete()
        .eq("task_id", taskId)

      if (deleteError) throw deleteError

      // Insert new associations
      if (paddockIds.length > 0) {
        const insertData = paddockIds.map((paddockId) => ({
          task_id: taskId,
          paddock_id: paddockId,
        }))

        const { error: insertError } = await supabase
          .from("task_paddocks")
          .insert(insertData)

        if (insertError) throw insertError
      }

      return true
    } catch (error) {
      console.error("Error saving task paddocks:", error)
      return false
    }
  }

  const fetchTasks = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
        .order("due_date", { ascending: true, nullsFirst: false })

      if (error) throw error

      if (!data || data.length === 0) {
        setTasks([])
        return
      }

      // Fetch all paddock associations in one query
      const taskIds = data.map((task) => task.id)
      const { data: taskPaddocksData, error: taskPaddocksError } = await supabase
        .from("task_paddocks")
        .select("task_id, paddock_id")
        .in("task_id", taskIds)

      if (taskPaddocksError) {
        console.error("Error fetching task paddocks:", taskPaddocksError)
        // Continue with tasks without paddock associations
        setTasks(data)
        return
      }

      // Group paddock IDs by task ID
      const paddockIdsByTaskId = new Map<string, string[]>()
      taskPaddocksData?.forEach((tp) => {
        const existing = paddockIdsByTaskId.get(tp.task_id) || []
        paddockIdsByTaskId.set(tp.task_id, [...existing, tp.paddock_id])
      })

      // Add paddock IDs to each task
      const tasksWithPaddocks = data.map((task) => ({
        ...task,
        related_paddock_ids: paddockIdsByTaskId.get(task.id) || [],
      }))

      setTasks(tasksWithPaddocks)
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [userId])

  const createTask = async (taskData: {
    title: string
    description: string | null
    status: string
    priority: string
    due_date: string | null
    related_paddock_ids?: string[]
    related_paddock_id?: string | null
    related_mob_id: string | null
    assigned_to: string | null
  }) => {
    if (!userId) return null

    try {
      // Extract paddock IDs (support both old and new format for backward compatibility)
      const paddockIds = taskData.related_paddock_ids || (taskData.related_paddock_id ? [taskData.related_paddock_id] : [])
      
      // Remove paddock-related fields from task data before inserting
      const { related_paddock_ids, related_paddock_id, ...taskInsertData } = taskData

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          ...taskInsertData,
          completed_at: taskData.status === "completed" ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (error) throw error

      // Save paddock associations
      if (paddockIds.length > 0) {
        await saveTaskPaddocks(data.id, paddockIds)
      }

      // Add paddock IDs to the returned task
      const taskWithPaddocks = {
        ...data,
        related_paddock_ids: paddockIds,
      }

      setTasks((prev) => [...prev, taskWithPaddocks])
      return taskWithPaddocks
    } catch (error) {
      console.error("Error creating task:", error)
      return null
    }
  }

  const updateTask = async (id: string, updates: Partial<Task & { related_paddock_ids?: string[] }>) => {
    try {
      // Extract paddock IDs if provided
      const paddockIds = (updates as any).related_paddock_ids
      const { related_paddock_ids, ...taskUpdates } = updates

      const updateData = {
        ...taskUpdates,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("tasks").update(updateData).eq("id", id)

      if (error) throw error

      // Update paddock associations if provided
      if (paddockIds !== undefined) {
        await saveTaskPaddocks(id, paddockIds)
        // Fetch updated paddock associations
        const updatedPaddockIds = await fetchTaskPaddocks(id)
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, ...updateData, related_paddock_ids: updatedPaddockIds } : t
          )
        )
      } else {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updateData } : t)))
      }
      return true
    } catch (error) {
      console.error("Error updating task:", error)
      return false
    }
  }

  const toggleTaskStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "todo" : "completed"
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === "completed") {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    return updateTask(id, updateData)
  }

  const deleteTask = async (id: string) => {
    try {
      // Delete task_paddocks associations first (CASCADE should handle this, but being explicit)
      await supabase.from("task_paddocks").delete().eq("task_id", id)

      const { error } = await supabase.from("tasks").delete().eq("id", id)

      if (error) throw error

      setTasks((prev) => prev.filter((t) => t.id !== id))
      return true
    } catch (error) {
      console.error("Error deleting task:", error)
      return false
    }
  }

  return {
    tasks,
    loading,
    fetchTasks,
    fetchTaskPaddocks,
    createTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
  }
}
