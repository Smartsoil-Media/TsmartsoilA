"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface InfrastructureDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    type: string
    capacity?: number
    condition: string
    notes?: string
  }) => void
  infrastructure?: {
    id: string
    name: string
    type: string
    capacity?: number
    condition: string
    notes?: string
  } | null
}

export function InfrastructureDetailsModal({
  isOpen,
  onClose,
  onSave,
  infrastructure,
}: InfrastructureDetailsModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("shed")
  const [capacity, setCapacity] = useState("")
  const [condition, setCondition] = useState("good")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (infrastructure) {
      setName(infrastructure.name)
      setType(infrastructure.type)
      setCapacity(infrastructure.capacity?.toString() || "")
      setCondition(infrastructure.condition)
      setNotes(infrastructure.notes || "")
    } else {
      setName("")
      setType("shed")
      setCapacity("")
      setCondition("good")
      setNotes("")
    }
  }, [infrastructure, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      type,
      capacity: capacity ? Number.parseFloat(capacity) : undefined,
      condition,
      notes: notes || undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{infrastructure ? "Edit Infrastructure" : "Add Infrastructure Details"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Shed, North Dam"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shed">Shed</SelectItem>
                <SelectItem value="dam">Dam</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="water_tank">Water Tank</SelectItem>
                <SelectItem value="trough">Trough</SelectItem>
                <SelectItem value="fence">Fence</SelectItem>
                <SelectItem value="gate">Gate</SelectItem>
                <SelectItem value="pump">Pump</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="capacity">Capacity (optional)</Label>
            <Input
              id="capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="For water tanks/dams (liters)"
            />
          </div>

          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="needs_repair">Needs Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {infrastructure ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
