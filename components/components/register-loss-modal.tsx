"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Mob {
  id: string
  name: string
  livestock_type: string
  size: number
}

interface RegisterLossModalProps {
  mob: Mob
  onSave: (quantity: number, lossReason: string, notes: string) => void
  onCancel: () => void
}

export function RegisterLossModal({ mob, onSave, onCancel }: RegisterLossModalProps) {
  const [quantity, setQuantity] = useState<string>("1")
  const [lossReason, setLossReason] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number.parseInt(quantity)
    if (qty > 0 && qty <= mob.size) {
      onSave(qty, lossReason, notes)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register Loss for {mob.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Number Lost</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={mob.size}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter number lost"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Current mob size: {mob.size} head → New size: {mob.size - Number.parseInt(quantity || "0")} head
            </p>
          </div>

          <div>
            <Label htmlFor="lossReason">Reason for Loss</Label>
            <Select value={lossReason} onValueChange={setLossReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disease">Disease</SelectItem>
                <SelectItem value="predator">Predator</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="weather">Weather Event</SelectItem>
                <SelectItem value="old_age">Old Age</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              Register Loss
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
