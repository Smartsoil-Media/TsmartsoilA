"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface TeamMember {
  id: string
  member_user_id: string
  role: string
  profiles: {
    id: string
    display_name: string | null
    name: string | null
  } | null
}

export function useTeamMembers(userId: string | null) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTeamMembers = async () => {
    if (!userId) return

    try {
      const { data: members, error: membersError } = await supabase
        .from("farm_members")
        .select("id, member_user_id, role")
        .eq("farm_owner_id", userId)

      if (membersError) throw membersError

      if (!members || members.length === 0) {
        setTeamMembers([])
        setLoading(false)
        return
      }

      const memberIds = members.map((m) => m.member_user_id)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, name")
        .in("id", memberIds)

      if (profilesError) throw profilesError

      const teamMembersWithProfiles = members.map((member) => {
        const profile = profiles?.find((p) => p.id === member.member_user_id)
        return {
          ...member,
          profiles: profile || null,
        }
      })

      setTeamMembers(teamMembersWithProfiles)
    } catch (error) {
      console.error("Error loading team members:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [userId])

  return {
    teamMembers,
    loading,
    fetchTeamMembers,
  }
}
