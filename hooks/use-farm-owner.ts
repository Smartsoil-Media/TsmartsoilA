"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Hook to determine the effective farm owner ID for the current user.
 * If the user is a team member, returns the farm_owner_id.
 * If the user owns their own farm, returns their own user ID.
 */
export function useFarmOwner(userId: string | null) {
  const [farmOwnerId, setFarmOwnerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function determineFarmOwner() {
      if (!userId) {
        setFarmOwnerId(null)
        setLoading(false)
        return
      }

      try {
        // Check if user is a team member (not an owner)
        const { data: membership, error } = await supabase
          .from("farm_members")
          .select("farm_owner_id, role")
          .eq("member_user_id", userId)
          .neq("role", "owner")
          .limit(1)
          .single()

        if (error || !membership) {
          // User is not a team member, they own their own farm
          setFarmOwnerId(userId)
        } else {
          // User is a team member, use the farm owner's ID
          setFarmOwnerId(membership.farm_owner_id)
        }
      } catch (err) {
        console.error("Error determining farm owner:", err)
        // Default to user's own ID on error
        setFarmOwnerId(userId)
      } finally {
        setLoading(false)
      }
    }

    determineFarmOwner()
  }, [userId, supabase])

  return { farmOwnerId, loading }
}

