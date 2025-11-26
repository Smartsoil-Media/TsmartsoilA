"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DeleteMobDialog } from "@/components/delete-mob-dialog" // Assuming DeleteMobDialog is imported from a valid path

interface Paddock {
  id: string
  name: string
}

interface Mob {
  id: string
  name: string
  livestock_type: string
  size: number
  notes: string | null
  current_paddock_id: string | null
}

interface AddMobModalProps {
  onClose: () => void
  onSave: (mobData: {
    name: string
    livestock_type: string
    size: number
    notes: string
    paddock_id: string | null
    age?: string
    avgWeight?: string
    condition?: string
    pricePerHead?: string
  }) => void
  onDelete?: (hardDelete?: boolean) => void
  paddocks: Paddock[]
  mob?: Mob | null
  onDeleteWithData?: () => void
  onDeleteAll?: () => void
}

export function AddMobModal({ onClose, onSave, paddocks, mob, onDelete }: AddMobModalProps) {
  const [name, setName] = useState(mob?.name || "")
  const [livestockType, setLivestockType] = useState(mob?.livestock_type || "")
  const [size, setSize] = useState(mob?.size?.toString() || "")
  const [notes, setNotes] = useState(mob?.notes || "")
  const [paddockId, setPaddockId] = useState<string | null>(mob?.current_paddock_id || null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Purchase details fields (only shown when creating new mob and livestock type is selected)
  const [age, setAge] = useState<string>("")
  const [avgWeight, setAvgWeight] = useState<string>("")
  const [condition, setCondition] = useState<string>("")
  const [pricePerHead, setPricePerHead] = useState<string>("")

  // Get livestock type label for dynamic field names
  const getLivestockLabel = (type: string) => {
    const labels: Record<string, string> = {
      cattle: "Cattle",
      sheep: "Sheep",
      goats: "Goats",
      horses: "Horses",
      pigs: "Pigs",
      chickens: "Chickens",
      other: "Animals",
    }
    return labels[type] || "Animals"
  }

  const showPurchaseDetails = !mob && livestockType !== "" // Only show for new mobs when type is selected

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !livestockType || !size) return

    onSave({
      name,
      livestock_type: livestockType,
      size: Number.parseInt(size),
      notes,
      paddock_id: paddockId,
      ...(showPurchaseDetails && {
        age,
        avgWeight,
        condition,
        pricePerHead,
      }),
    })
  }

  const totalCost =
    pricePerHead && size ? (Number.parseFloat(pricePerHead) * Number.parseInt(size || "0")).toFixed(2) : "0.00"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{mob ? "Edit Mob" : "Add New Mob"}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Mob Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mob 1, Heifers Group A"
              required
            />
          </div>

          <div>
            <Label htmlFor="livestock_type">Livestock Type</Label>
            <Select value={livestockType} onValueChange={setLivestockType}>
              <SelectTrigger>
                <SelectValue placeholder="Select livestock type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cattle">Cattle</SelectItem>
                <SelectItem value="sheep">Sheep</SelectItem>
                <SelectItem value="goats">Goats</SelectItem>
                <SelectItem value="horses">Horses</SelectItem>
                <SelectItem value="pigs">Pigs</SelectItem>
                <SelectItem value="chickens">Chickens</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="size">
              {livestockType ? `Number of ${getLivestockLabel(livestockType)}` : "Number of Animals"}
            </Label>
            <Input
              id="size"
              type="number"
              min="1"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g., 50"
              required
            />
          </div>

          {/* Purchase Details - Only show when creating new mob and livestock type is selected */}
          {showPurchaseDetails && (
            <>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground mb-3">Record Purchase Details (Optional)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g., 2 years"
                  />
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
                {pricePerHead && size && (
                  <p className="text-sm text-muted-foreground mt-1">Total cost: ${totalCost}</p>
                )}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="paddock">Paddock (Optional)</Label>
            <Select
              value={paddockId || "none"}
              onValueChange={(value) => setPaddockId(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select paddock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not in paddock</SelectItem>
                {paddocks.map((paddock) => (
                  <SelectItem key={paddock.id} value={paddock.id}>
                    {paddock.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            {mob && onDelete && (
              <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)} className="mr-auto">
                Delete Mob
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              {mob ? "Save Changes" : "Add Mob"}
            </Button>
          </div>
        </form>
        </div>
      </Card>

      {showDeleteDialog && mob && (
        <DeleteMobDialog
          mobName={mob.name}
          onClose={() => setShowDeleteDialog(false)}
          onDeleteWithData={() => {
            setShowDeleteDialog(false)
            onDelete?.()
          }}
          onDeleteAll={() => {
            setShowDeleteDialog(false)
            if (onDelete) {
              ;(onDelete as any)(true)
            }
          }}
        />
      )}
    </div>
  )
}
