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

interface AddSheepModalProps {
  mob: Mob
  onSave: (data: {
    quantity: number
    age: string
    avgWeight: string
    condition: string
    pricePerHead: string
    notes: string
  }) => void
  onCancel: () => void
}

export function AddSheepModal({ mob, onSave, onCancel }: AddSheepModalProps) {
  const [quantity, setQuantity] = useState<string>("1")
  const [age, setAge] = useState<string>("")
  const [avgWeight, setAvgWeight] = useState<string>("")
  const [condition, setCondition] = useState<string>("")
  const [pricePerHead, setPricePerHead] = useState<string>("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number.parseInt(quantity)
    if (qty > 0) {
      onSave({
        quantity: qty,
        age,
        avgWeight,
        condition,
        pricePerHead,
        notes,
      })
    }
  }

  const totalCost =
    pricePerHead && quantity ? (Number.parseFloat(pricePerHead) * Number.parseInt(quantity)).toFixed(2) : "0.00"

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Sheep to {mob.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">Record purchased sheep details</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Number of Sheep</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter number of sheep"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 2 years" />
            </div>
            <div>
              <Label htmlFor="avgWeight">Avg Weight (kg)</Label>
              <Input
                id="avgWeight"
                type="number"
                step="0.1"
                value={avgWeight}
                onChange={(e) => setAvgWeight(e.target.value)}
                placeholder="e.g., 45.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="condition">Condition Score</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Poor</SelectItem>
                <SelectItem value="2">2 - Poor</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pricePerHead">Price Per Head ($)</Label>
            <Input
              id="pricePerHead"
              type="number"
              step="0.01"
              value={pricePerHead}
              onChange={(e) => setPricePerHead(e.target.value)}
              placeholder="e.g., 150.00"
            />
            {pricePerHead && quantity && <p className="text-sm text-muted-foreground mt-1">Total cost: ${totalCost}</p>}
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vendor, location, health notes..."
              rows={3}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Current mob size: {mob.size} head → New size: {mob.size + Number.parseInt(quantity || "0")} head
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Add Sheep
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
