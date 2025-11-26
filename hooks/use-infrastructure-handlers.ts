"use client"

import { toast } from "sonner"
import { useInfrastructure } from "@/hooks/use-infrastructure"
import type { Infrastructure, DrawingMode } from "@/types/dashboard"
import type { MapboxDraw } from "@/types/mapbox"

interface UseInfrastructureHandlersProps {
  userId: string | null
  setInfrastructure: React.Dispatch<React.SetStateAction<Infrastructure[]>>
  draw: React.MutableRefObject<MapboxDraw | null>
  pendingInfrastructureGeometry: any
  setPendingInfrastructureGeometry: (geometry: any) => void
  setShowInfrastructureModal: (show: boolean) => void
  editingInfrastructure: Infrastructure | null
  setEditingInfrastructure: (infrastructure: Infrastructure | null) => void
  setDrawingPanelOpen: (open: boolean) => void
  loadInfrastructure: () => Promise<void>
  isDrawing: boolean
  setIsDrawing: (drawing: boolean) => void
  drawingMode: DrawingMode
  setDrawingMode: (mode: DrawingMode) => void
}

export function useInfrastructureHandlers({
  userId,
  setInfrastructure,
  draw,
  pendingInfrastructureGeometry,
  setPendingInfrastructureGeometry,
  setShowInfrastructureModal,
  editingInfrastructure,
  setEditingInfrastructure,
  setDrawingPanelOpen,
  loadInfrastructure,
  isDrawing,
  setIsDrawing,
  drawingMode,
  setDrawingMode,
}: UseInfrastructureHandlersProps) {
  const { createInfrastructure, updateInfrastructure, deleteInfrastructure } = useInfrastructure(userId)

  const handleInfrastructureCreate = (geometry: any) => {
    // This is now called with a Point geometry directly from pin drop
    setPendingInfrastructureGeometry(geometry)
    setShowInfrastructureModal(true)
  }

  const handleSaveInfrastructure = async (data: {
    name: string
    type: string
    capacity?: number
    condition: string
    notes?: string
  }) => {
    try {
      if (editingInfrastructure) {
        // Update existing infrastructure
        const success = await updateInfrastructure(editingInfrastructure.id, {
          name: data.name,
          type: data.type,
          capacity: data.capacity?.toString() || null,
          condition: data.condition,
          notes: data.notes || null,
        })

        if (success) {
          toast.success("Infrastructure updated successfully")
        } else {
          toast.error("Failed to update infrastructure")
        }
      } else {
        // Create new infrastructure
        // For Point geometry, area is 0 (or undefined)
        const area =
          pendingInfrastructureGeometry.type === "Polygon"
            ? window.turf?.area(pendingInfrastructureGeometry) || 0
            : undefined

        const newInfrastructure = await createInfrastructure({
          name: data.name,
          type: data.type,
          geometry: pendingInfrastructureGeometry,
          area,
          capacity: data.capacity?.toString() || null,
          condition: data.condition,
          notes: data.notes || null,
        })

        if (newInfrastructure) {
          toast.success("Infrastructure created successfully")
        } else {
          toast.error("Failed to create infrastructure")
        }
      }

      await loadInfrastructure()
      setShowInfrastructureModal(false)
      setEditingInfrastructure(null)
      setPendingInfrastructureGeometry(null)
      // Infrastructure pin mode will be closed by the modal's onClose handler
    } catch (error) {
      console.error("Error saving infrastructure:", error)
      toast.error("An error occurred while saving the infrastructure")
    }
  }

  const handleDeleteInfrastructure = async (id: string) => {
    if (!confirm("Are you sure you want to delete this infrastructure?")) return

    try {
      const success = await deleteInfrastructure(id)

      if (success) {
        toast.success("Infrastructure deleted successfully")
        await loadInfrastructure()
      } else {
        toast.error("Failed to delete infrastructure")
      }
    } catch (error) {
      console.error("Error deleting infrastructure:", error)
      toast.error("An error occurred while deleting the infrastructure")
    }
  }

  // Infrastructure drawing is now handled via pin mode, so this function is deprecated
  // Keeping for backward compatibility but it's no longer used
  const toggleInfrastructureDrawing = () => {
    // No-op - infrastructure is now handled via pin mode
  }

  const deleteSelected = () => {
    if (!draw.current) return
    const selected = draw.current.getSelected()
    if (selected.features.length > 0) {
      draw.current.delete(selected.features[0].id)
    }
  }

  return {
    handleInfrastructureCreate,
    handleSaveInfrastructure,
    handleDeleteInfrastructure,
    toggleInfrastructureDrawing,
    deleteSelected,
  }
}

