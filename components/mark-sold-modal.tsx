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

interface MarkSoldModalProps {
  mob: Mob
  onSave: (quantity: number, pricePerHead: number | null, buyerName: string, notes: string) => void
  onCancel: () => void
}

export function MarkSoldModal({ mob, onSave, onCancel }: MarkSoldModalProps) {
  const [quantity, setQuantity] = useState<string>("1")
  const [pricePerHead, setPricePerHead] = useState<string>("")
  const [buyerName, setBuyerName] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number.parseInt(quantity)
    const price = pricePerHead ? Number.parseFloat(pricePerHead) : null
    if (qty > 0 && qty <= mob.size) {
      onSave(qty, price, buyerName, notes)
    }
  }

  const totalPrice = pricePerHead && quantity ? Number.parseFloat(pricePerHead) * Number.parseInt(quantity) : null

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark {mob.name} as Sold</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Number Sold</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={mob.size}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter number sold"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Current mob size: {mob.size} head → New size: {mob.size - Number.parseInt(quantity || "0")} head
            </p>
          </div>

          <div>
            <Label htmlFor="pricePerHead">Price per Head (Optional)</Label>
            <Input
              id="pricePerHead"
              type="number"
              step="0.01"
              min="0"
              value={pricePerHead}
              onChange={(e) => setPricePerHead(e.target.value)}
              placeholder="Enter price per head"
            />
            {totalPrice && <p className="text-sm text-green-600 mt-1 font-semibold">Total: ${totalPrice.toFixed(2)}</p>}
          </div>

          <div>
            <Label htmlFor="buyerName">Buyer Name (Optional)</Label>
            <Input
              id="buyerName"
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Enter buyer name"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the sale..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Mark as Sold
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
