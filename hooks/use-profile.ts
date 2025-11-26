"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/dashboard"

export function useProfile() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [farmOwnerProfile, setFarmOwnerProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddressPrompt, setShowAddressPrompt] = useState(false)

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user is a team member first
      const { data: membership } = await supabase
        .from("farm_members")
        .select("farm_owner_id, role")
        .eq("member_user_id", user.id)
        .neq("role", "owner")
        .limit(1)
        .single()

      // Get current user's profile
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (membership) {
        // User is a team member - they should already have a profile from sign-up
        // If not, create a basic one
        if (error || !data) {
          const displayName = user.email?.split("@")[0] || "User"
          await supabase.from("profiles").upsert({
            id: user.id,
            name: displayName,
            display_name: displayName,
            farm_location: "",
            enterprise_type: "Livestock",
            animal_type: null,
            crop_type: null,
            bio: null,
          }, { onConflict: "id" })
          // Refetch after creation
          const { data: newProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
          setProfile(newProfile || null)
        } else {
          setProfile(data)
        }

        // Get farm owner's profile for display
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", membership.farm_owner_id)
          .single()

        if (ownerProfile) {
          setFarmOwnerProfile(ownerProfile)
        }
      } else {
        // User owns their own farm
        setFarmOwnerProfile(null)

        // If no profile exists, create a basic one (farm owners can set up later in dashboard)
        if (error || !data) {
          const displayName = user.email?.split("@")[0] || "User"
          await supabase.from("profiles").upsert({
            id: user.id,
            name: displayName,
            display_name: displayName,
            farm_location: "",
            enterprise_type: "Livestock",
            animal_type: null,
            crop_type: null,
            bio: null,
          }, { onConflict: "id" })
          // Refetch after creation
          const { data: newProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
          setProfile(newProfile || null)
        } else {
          setProfile(data)
          if (!data.location_confirmed) {
            setShowAddressPrompt(true)
          }
        }
      }

      // Accept any pending invitations for this user
      const { error: rpcError } = await supabase.rpc("accept_invitations_for_user")
      if (rpcError) {
        console.log("Could not accept invitations (function may not exist yet):", rpcError)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [router, supabase])

  const updateLocation = async (latitude: number, longitude: number, address: string): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return false

      const { error } = await supabase
        .from("profiles")
        .update({
          latitude,
          longitude,
          farm_location: address,
          location_confirmed: true,
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error updating location:", error)
        return false
      }

      setProfile((prev) =>
        prev
          ? {
            ...prev,
            latitude,
            longitude,
            farm_location: address,
            location_confirmed: true,
          }
          : null,
      )
      setShowAddressPrompt(false)
      return true
    } catch (error) {
      console.error("Error confirming location:", error)
      return false
    }
  }

  const dismissPrompt = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("profiles").update({ location_confirmed: true }).eq("id", user.id)

      setShowAddressPrompt(false)
      setProfile((prev) => (prev ? { ...prev, location_confirmed: true } : null))
    } catch (error) {
      console.error("Error dismissing prompt:", error)
    }
  }

  // For team members, use farm owner's profile for display
  // For farm owners, use their own profile
  const displayProfile = farmOwnerProfile || profile

  return {
    profile, // Current user's profile
    farmOwnerProfile, // Farm owner's profile (if user is a team member)
    displayProfile, // Profile to use for display (farm owner's for team members, own for owners)
    loading,
    showAddressPrompt,
    setShowAddressPrompt,
    updateLocation,
    dismissPrompt,
    refetch: fetchProfile,
  }
}

