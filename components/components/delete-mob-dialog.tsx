"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle, X } from "lucide-react"

interface DeleteMobDialogProps {
  mobName: string
  onClose: () => void
  onDeleteWithData: () => void
  onDeleteAll: () => void
}

export function DeleteMobDialog({ mobName, onClose, onDeleteWithData, onDeleteAll }: DeleteMobDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Delete {mobName}?</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Choose how you want to delete this mob:</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={onDeleteWithData}
              className="w-full text-left p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="font-medium text-foreground">Archive mob, keep data</div>
              <div className="text-sm text-muted-foreground mt-1">
                Remove mob from active list but preserve all sales and purchase data for P&L tracking
              </div>
            </button>

            <button
              onClick={onDeleteAll}
              className="w-full text-left p-4 border-2 border-border rounded-lg hover:border-destructive hover:bg-destructive/5 transition-colors"
            >
              <div className="font-medium text-destructive">Delete mob and all data</div>
              <div className="text-sm text-muted-foreground mt-1">
                Permanently delete the mob and all associated records including sales, purchases, and animal data
              </div>
            </button>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="bg-transparent">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
