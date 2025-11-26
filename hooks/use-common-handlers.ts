"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { MapboxMap } from "@/types/mapbox"

interface UseCommonHandlersProps {
  updateLocation: (latitude: number, longitude: number, address: string) => Promise<boolean>
  setShowLocationModal: (show: boolean) => void
  map?: React.MutableRefObject<MapboxMap | null>
}

export function useCommonHandlers({
  updateLocation,
  setShowLocationModal,
  map,
}: UseCommonHandlersProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLocationConfirm = async (latitude: number, longitude: number, address: string): Promise<boolean> => {
    const success = await updateLocation(latitude, longitude, address)
    if (success) {
      setShowLocationModal(false)
      if (map?.current) {
        // Offset center upward so location appears in top-middle of map
        // Decrease latitude (for southern hemisphere) to move point up
        map.current.flyTo({
          center: [longitude, latitude - 0.0025],
          zoom: 15,
          duration: 2000,
        })
      }
      toast.success("Location updated successfully")
      return true
    } else {
      toast.error("Failed to update location")
      return false
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    }
  }

  const handleSettings = () => {
    router.push("/dashboard/settings")
  }

  const handleCloseModal = (
    setShowModal: (show: boolean) => void,
    setEditingItem?: (item: any) => void
  ) => {
    setShowModal(false)
    if (setEditingItem) {
      setEditingItem(null)
    }
  }

  return {
    handleLocationConfirm,
    handleSignOut,
    handleSettings,
    handleCloseModal,
  }
}

