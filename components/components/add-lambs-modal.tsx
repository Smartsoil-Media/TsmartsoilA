"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Mob {
  id: string
  name: string
  livestock_type: string
  size: number
}

interface AddLambsModalProps {
  mob: Mob
  onSave: (quantity: number, notes: string) => void
  onCancel: () => void
}

export function AddLambsModal({ mob, onSave, onCancel }: AddLambsModalProps) {
  const [quantity, setQuantity] = useState<string>("1")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number.parseInt(quantity)
    if (qty > 0) {
      onSave(qty, notes)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Lambs to {mob.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Number of Lambs Born</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter number of lambs"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Current mob size: {mob.size} head → New size: {mob.size + Number.parseInt(quantity || "0")} head
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the births..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Add Lambs
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
