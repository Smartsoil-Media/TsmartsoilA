"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Mob {
  id: string
  user_id: string
  name: string
  livestock_type: string
  size: number
  notes: string | null
  current_paddock_id: string | null
  created_at: string
}

export interface GrazingEvent {
  id: string
  user_id: string
  mob_id: string
  paddock_id: string
  moved_in_at: string
  moved_out_at: string | null
}

export function useMobs(userId: string | null) {
  const [mobs, setMobs] = useState<Mob[]>([])
  const [grazingEvents, setGrazingEvents] = useState<GrazingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMobs = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from("mobs")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active") // Only fetch active mobs

      if (error) throw error
      setMobs(data || [])
    } catch (error) {
      console.error("Error loading mobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrazingEvents = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase.from("grazing_events").select("*").eq("user_id", userId)

      if (error) throw error
      setGrazingEvents(data || [])
    } catch (error) {
      console.error("Error loading grazing events:", error)
    }
  }

  useEffect(() => {
    fetchMobs()
    fetchGrazingEvents()
  }, [userId])

  const createMob = async (mobData: {
    name: string
    livestock_type: string
    size: number
    notes: string | null
    paddock_id: string | null
  }) => {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from("mobs")
        .insert({
          user_id: userId,
          name: mobData.name,
          livestock_type: mobData.livestock_type,
          size: mobData.size,
          notes: mobData.notes,
          current_paddock_id: mobData.paddock_id,
        })
        .select()
        .single()

      if (error) throw error

      if (mobData.paddock_id) {
        await supabase.from("grazing_events").insert({
          user_id: userId,
          mob_id: data.id,
          paddock_id: mobData.paddock_id,
          moved_in_at: new Date().toISOString(),
        })
        await fetchGrazingEvents()
      }

      setMobs((prev) => [...prev, data])
      return data
    } catch (error) {
      console.error("Error creating mob:", error)
      return null
    }
  }

  const updateMob = async (id: string, updates: Partial<Mob>) => {
    try {
      const { error } = await supabase.from("mobs").update(updates).eq("id", id)

      if (error) throw error

      setMobs((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
      return true
    } catch (error) {
      console.error("Error updating mob:", error)
      return false
    }
  }

  const moveMob = async (mobId: string, oldPaddockId: string | null, newPaddockId: string | null) => {
    if (!userId) return false

    try {
      // Close old grazing event
      if (oldPaddockId) {
        await supabase
          .from("grazing_events")
          .update({ moved_out_at: new Date().toISOString() })
          .eq("mob_id", mobId)
          .is("moved_out_at", null)
      }

      // Create new grazing event
      if (newPaddockId) {
        await supabase.from("grazing_events").insert({
          user_id: userId,
          mob_id: mobId,
          paddock_id: newPaddockId,
          moved_in_at: new Date().toISOString(),
        })
      }

      await fetchGrazingEvents()
      return true
    } catch (error) {
      console.error("Error moving mob:", error)
      return false
    }
  }

  const getDaysInPaddock = (mobId: string) => {
    const currentEvent = grazingEvents.find((e) => e.mob_id === mobId && e.moved_out_at === null)
    if (!currentEvent) return null

    const movedInDate = new Date(currentEvent.moved_in_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - movedInDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return {
    mobs,
    grazingEvents,
    loading,
    fetchMobs,
    createMob,
    updateMob,
    moveMob,
    getDaysInPaddock,
  }
}
