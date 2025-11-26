"use client"

import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { calculateArea } from "@/lib/utils/dashboard"
import { usePaddocks } from "@/hooks/use-paddocks"
import type { Paddock, GeoJSONFeature, DrawingMode } from "@/types/dashboard"
import type { MapboxDraw } from "@/types/mapbox"

interface PendingFeature {
  feature: GeoJSONFeature
  area: number
}

interface UsePaddockHandlersProps {
  userId: string | null
  paddocks: Paddock[]
  setPaddocks: React.Dispatch<React.SetStateAction<Paddock[]>>
  draw: React.MutableRefObject<MapboxDraw | null>
  pendingFeature: PendingFeature | null
  setPendingFeature: (feature: PendingFeature | null) => void
  setShowPaddockModal: (show: boolean) => void
  editingPaddock: Paddock | null
  setEditingPaddock: (paddock: Paddock | null) => void
  isDrawing: boolean
  setIsDrawing: (drawing: boolean) => void
  drawingMode: DrawingMode
  setDrawingMode: (mode: DrawingMode) => void
  setDrawingPanelOpen?: (open: boolean) => void
  refetchPaddocks?: () => Promise<void>
}

export function usePaddockHandlers({
  userId,
  paddocks,
  setPaddocks,
  draw,
  pendingFeature,
  setPendingFeature,
  setShowPaddockModal,
  editingPaddock,
  setEditingPaddock,
  isDrawing,
  setIsDrawing,
  drawingMode,
  setDrawingMode,
  setDrawingPanelOpen,
  refetchPaddocks,
}: UsePaddockHandlersProps) {
  const supabase = createClient()
  const { createPaddock, updatePaddock, deletePaddock } = usePaddocks(userId)

  const handleDrawCreate = async (e: any) => {
    const feature = e.features[0]
    const area = window.mapboxgl ? calculateArea(feature.geometry.coordinates[0]) : 0

    setPendingFeature({ feature, area })
    setShowPaddockModal(true)
  }

  const handleDrawUpdate = async (e: any) => {
    try {
      const feature = e.features[0]
      const paddock = paddocks.find((p) => p.geometry.id === feature.id)
      if (!paddock) return

      const area = calculateArea(feature.geometry.coordinates[0])

      const success = await updatePaddock(paddock.id, {
        geometry: feature,
        area,
      })

      if (success) {
        setPaddocks((prev) => prev.map((p) => (p.id === paddock.id ? { ...p, geometry: feature, area } : p)))
        toast.success("Paddock updated successfully")
      } else {
        toast.error("Failed to update paddock")
      }
    } catch (error) {
      console.error("Error updating paddock:", error)
      toast.error("An error occurred while updating the paddock")
    }
  }

  const handleDrawDelete = async (e: any) => {
    try {
      const feature = e.features[0]
      const paddock = paddocks.find((p) => p.geometry.id === feature.id)
      if (!paddock) return

      const success = await deletePaddock(paddock.id)

      if (success) {
        setPaddocks((prev) => prev.filter((p) => p.id !== paddock.id))
        toast.success("Paddock deleted successfully")
      } else {
        toast.error("Failed to delete paddock")
      }
    } catch (error) {
      console.error("Error deleting paddock:", error)
      toast.error("An error occurred while deleting the paddock")
    }
  }

  const handlePaddockDetailsConfirm = async (details: { name: string; color: string; type: string; tree_species?: string | null }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      if (editingPaddock) {
        // Update existing paddock
        const success = await updatePaddock(editingPaddock.id, {
          name: details.name,
          color: details.color,
          type: details.type,
          tree_species: details.tree_species || null,
        })

        if (success) {
          toast.success("Paddock updated successfully")
        } else {
          toast.error("Failed to update paddock")
        }
      } else if (pendingFeature) {
        // Create new paddock
        const newPaddock = await createPaddock({
          name: details.name,
          geometry: pendingFeature.feature,
          area: pendingFeature.area,
          color: details.color,
          type: details.type,
          tree_species: details.tree_species || null,
        })

        if (newPaddock) {
          toast.success("Paddock created successfully")
          setPendingFeature(null)
          // Reset drawing state after successful creation
          setIsDrawing(false)
          setDrawingMode(null)
          // Close drawing panel so layers will render
          if (setDrawingPanelOpen) {
            setDrawingPanelOpen(false)
          }
          // Refetch paddocks to ensure the map updates with the new paddock
          if (refetchPaddocks) {
            await refetchPaddocks()
          }
        } else {
          toast.error("Failed to create paddock")
        }
      }

      setShowPaddockModal(false)
      setEditingPaddock(null)
    } catch (error) {
      console.error("Error saving paddock:", error)
      toast.error("An error occurred while saving the paddock")
    }
  }

  const handlePaddockDetailsCancel = () => {
    if (draw.current && pendingFeature) {
      draw.current.delete(pendingFeature.feature.id as string)
    }
    setShowPaddockModal(false)
    setEditingPaddock(null)
    setPendingFeature(null)
  }

  const handleDeletePaddock = async () => {
    if (!editingPaddock) return

    if (!confirm("Are you sure you want to delete this paddock?")) return

    try {
      const success = await deletePaddock(editingPaddock.id)

      if (success) {
        toast.success("Paddock deleted successfully")
        setShowPaddockModal(false)
        setEditingPaddock(null)
      } else {
        toast.error("Failed to delete paddock")
      }
    } catch (error) {
      console.error("Error deleting paddock:", error)
      toast.error("An error occurred while deleting the paddock")
    }
  }

  const handleEditPaddock = () => {
    if (!editingPaddock) return
    setShowPaddockModal(true)
  }

  const togglePaddockDrawing = () => {
    if (isDrawing && drawingMode === "paddock") {
      setIsDrawing(false)
      setDrawingMode(null)
    } else {
      setIsDrawing(true)
      setDrawingMode("paddock")
    }
  }

  return {
    handleDrawCreate,
    handleDrawUpdate,
    handleDrawDelete,
    handlePaddockDetailsConfirm,
    handlePaddockDetailsCancel,
    handleDeletePaddock,
    handleEditPaddock,
    togglePaddockDrawing,
  }
}

