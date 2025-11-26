"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { PADDOCK_TYPE_LABELS, getPaddockColor } from "@/lib/constants/dashboard"
import { useProfile } from "@/hooks/use-profile"

interface PaddockDetailsModalProps {
  defaultName: string
  area: number
  onConfirm: (details: { name: string; color: string; type: string; tree_species?: string | null }) => void
  onCancel: () => void
  onDelete?: () => void
  paddock?: {
    id: string
    name: string
    color: string
    type?: string
    tree_species?: string | null
  } | null
}

export function PaddockDetailsModal({
  defaultName,
  area,
  onConfirm,
  onCancel,
  onDelete,
  paddock,
}: PaddockDetailsModalProps) {
  const { profile } = useProfile()
  const [name, setName] = useState(paddock?.name || defaultName)
  const [type, setType] = useState(paddock?.type || "pasture")
  const [treeSpecies, setTreeSpecies] = useState(paddock?.tree_species || "")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (paddock) {
      setName(paddock.name)
      setType(paddock.type || "pasture")
      setTreeSpecies(paddock.tree_species || "")
    }
  }, [paddock])

  // Get color for type (from user preferences or defaults)
  const getColorForType = (paddockType: string) => {
    return getPaddockColor(paddockType, profile?.paddock_type_colors)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const color = getColorForType(type)
    onConfirm({ 
      name, 
      color, 
      type,
      tree_species: type === "agroforestry" ? (treeSpecies || null) : null
    })
  }

  const handleDelete = () => {
    setShowDeleteConfirm(false)
    onDelete?.()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">{paddock ? "Edit Paddock" : "Paddock Details"}</h2>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Area: {(area / 10000).toFixed(2)} hectares</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Paddock Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., North Field"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pasture">Pasture</SelectItem>
                    <SelectItem value="cropping">Cropping</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="native_bush">Native Bush</SelectItem>
                    <SelectItem value="wetland">Wetland</SelectItem>
                    <SelectItem value="agroforestry">Agroforestry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: getColorForType(type) }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Color: {getColorForType(type)} (customize in Settings)
                  </p>
                </div>
              </div>

              {type === "agroforestry" && (
                <div>
                  <Label htmlFor="tree_species">Tree Species (optional)</Label>
                  <Input
                    id="tree_species"
                    value={treeSpecies}
                    onChange={(e) => setTreeSpecies(e.target.value)}
                    placeholder="e.g., Oak, Pine, Eucalyptus, etc."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the tree species in this agroforestry paddock
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {paddock && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mr-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  {paddock ? "Update Paddock" : "Save Paddock"}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Paddock?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone. All livestock and grazing history
              associated with this paddock will remain but will no longer be linked to a paddock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Paddock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
