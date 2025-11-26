"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Check, Plus } from "lucide-react"

interface Mob {
  id: string
  name: string
  livestock_type: string
  size: number
}

interface LambEntry {
  tagNumber: string
  liveWeight: string
  notes: string
}

interface LambingWorksheetModalProps {
  mob: Mob
  onSave: (lambs: LambEntry[]) => void
  onCancel: () => void
}

export function LambingWorksheetModal({ mob, onSave, onCancel }: LambingWorksheetModalProps) {
  const [savedLambs, setSavedLambs] = useState<LambEntry[]>([])
  const [currentLamb, setCurrentLamb] = useState<LambEntry>({
    tagNumber: "",
    liveWeight: "",
    notes: "",
  })

  const handleAddLamb = () => {
    if (currentLamb.tagNumber || currentLamb.liveWeight) {
      setSavedLambs([...savedLambs, currentLamb])
      setCurrentLamb({ tagNumber: "", liveWeight: "", notes: "" })
    }
  }

  const handleSaveAll = () => {
    // Add current lamb if it has data
    const allLambs = currentLamb.tagNumber || currentLamb.liveWeight ? [...savedLambs, currentLamb] : savedLambs

    if (allLambs.length > 0) {
      onSave(allLambs)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lambing Worksheet - {mob.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add individual lamb details. You can add multiple lambs before saving.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Lamb Entry Form */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-4">New Lamb Entry</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tagNumber">Tag Number</Label>
                  <Input
                    id="tagNumber"
                    value={currentLamb.tagNumber}
                    onChange={(e) => setCurrentLamb({ ...currentLamb, tagNumber: e.target.value })}
                    placeholder="e.g., L001"
                  />
                </div>
                <div>
                  <Label htmlFor="liveWeight">Live Weight (kg)</Label>
                  <Input
                    id="liveWeight"
                    type="number"
                    step="0.1"
                    value={currentLamb.liveWeight}
                    onChange={(e) => setCurrentLamb({ ...currentLamb, liveWeight: e.target.value })}
                    placeholder="e.g., 4.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={currentLamb.notes}
                  onChange={(e) => setCurrentLamb({ ...currentLamb, notes: e.target.value })}
                  placeholder="Any observations about this lamb..."
                  rows={2}
                />
              </div>

              <Button
                type="button"
                onClick={handleAddLamb}
                variant="outline"
                className="w-full bg-transparent"
                disabled={!currentLamb.tagNumber && !currentLamb.liveWeight}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lamb & Continue
              </Button>
            </div>
          </Card>

          {/* Saved Lambs List */}
          {savedLambs.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Lambs Added ({savedLambs.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedLambs.map((lamb, index) => (
                  <Card key={index} className="p-3 bg-green-50 border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex gap-4 text-sm">
                          {lamb.tagNumber && <span className="font-medium">Tag: {lamb.tagNumber}</span>}
                          {lamb.liveWeight && (
                            <span className="text-muted-foreground">Weight: {lamb.liveWeight} kg</span>
                          )}
                        </div>
                        {lamb.notes && <p className="text-sm text-muted-foreground">{lamb.notes}</p>}
                      </div>
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Current mob size: {mob.size} head → New size:{" "}
              {mob.size + savedLambs.length + (currentLamb.tagNumber || currentLamb.liveWeight ? 1 : 0)} head
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAll}
              className="bg-green-600 hover:bg-green-700"
              disabled={savedLambs.length === 0 && !currentLamb.tagNumber && !currentLamb.liveWeight}
            >
              Save All Lambs ({savedLambs.length + (currentLamb.tagNumber || currentLamb.liveWeight ? 1 : 0)})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
