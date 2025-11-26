"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Paddock {
  id: string
  name: string
}

interface Mob {
  id: string
  name: string
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  related_paddock_id: string | null
  related_mob_id: string | null
  assigned_to: string | null
}

interface TeamMember {
  id: string
  member_user_id: string
  profiles: {
    display_name: string | null
    name: string | null
  }
}

interface AddTaskModalProps {
  onClose: () => void
  onSave: (taskData: {
    title: string
    description: string
    status: string
    priority: string
    due_date: string | null
    related_paddock_ids: string[]
    related_mob_id: string | null
    assigned_to: string | null
  }) => void
  paddocks: Paddock[]
  mobs: Mob[]
  task?: Task | null
  teamMembers?: TeamMember[] // Added teamMembers prop
  taskPaddockIds?: string[] // IDs of paddocks already associated with this task
}

export function AddTaskModal({ onClose, onSave, paddocks, mobs, task, teamMembers = [], taskPaddockIds = [] }: AddTaskModalProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [status, setStatus] = useState(task?.status || "todo")
  const [priority, setPriority] = useState(task?.priority || "medium")
  const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.split("T")[0] : "")
  const [selectedPaddockIds, setSelectedPaddockIds] = useState<string[]>(taskPaddockIds)
  const [paddockSelectValue, setPaddockSelectValue] = useState("none")
  const [relatedMobId, setRelatedMobId] = useState(task?.related_mob_id || "none")
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || "none") // Added assignedTo state

  const handlePaddockAdd = (paddockId: string) => {
    if (paddockId !== "none" && !selectedPaddockIds.includes(paddockId)) {
      setSelectedPaddockIds((prev) => [...prev, paddockId])
      setPaddockSelectValue("none") // Reset dropdown
    }
  }

  const handlePaddockRemove = (paddockId: string) => {
    setSelectedPaddockIds((prev) => prev.filter((id) => id !== paddockId))
  }

  // Get available paddocks (not already selected)
  const availablePaddocks = paddocks.filter((p) => !selectedPaddockIds.includes(p.id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSave({
      title,
      description,
      status,
      priority,
      due_date: dueDate || null,
      related_paddock_ids: selectedPaddockIds,
      related_mob_id: relatedMobId === "none" ? null : relatedMobId,
      assigned_to: assignedTo === "none" ? null : assignedTo, // Include assigned_to in save data
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{task ? "Edit Task" : "Add New Task"}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Check irrigation system"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this task..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            {teamMembers.length > 0 && (
              <div>
                <Label htmlFor="assigned_to">Assign To (Optional)</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="assigned_to">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.member_user_id} value={member.member_user_id}>
                        {member.profiles?.display_name || member.profiles?.name || "Unknown User"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="related_paddock">Related Paddocks (Optional)</Label>
              <Select value={paddockSelectValue} onValueChange={handlePaddockAdd}>
                <SelectTrigger id="related_paddock" className="mt-2">
                  <SelectValue placeholder="Select a paddock to add" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a paddock...</SelectItem>
                  {availablePaddocks.map((paddock) => (
                    <SelectItem key={paddock.id} value={paddock.id}>
                      {paddock.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPaddockIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPaddockIds.map((paddockId) => {
                    const paddock = paddocks.find((p) => p.id === paddockId)
                    if (!paddock) return null
                    return (
                      <Badge
                        key={paddockId}
                        variant="secondary"
                        className="flex items-center gap-1.5 px-2 py-1 text-sm"
                      >
                        <span>{paddock.name}</span>
                        <button
                          type="button"
                          onClick={() => handlePaddockRemove(paddockId)}
                          className="ml-1 rounded-full hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          aria-label={`Remove ${paddock.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="related_mob">Related Mob (Optional)</Label>
              <Select value={relatedMobId} onValueChange={setRelatedMobId}>
                <SelectTrigger id="related_mob">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {mobs.map((mob) => (
                    <SelectItem key={mob.id} value={mob.id}>
                      {mob.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                {task ? "Update Task" : "Add Task"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
