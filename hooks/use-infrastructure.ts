"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Infrastructure {
  id: string
  user_id: string
  name: string
  type: string
  geometry: any
  area: number
  capacity: string | null
  condition: string
  notes: string | null
  created_at: string
  updated_at: string
}

export function useInfrastructure(userId: string | null) {
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchInfrastructure = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase.from("infrastructure").select("*").eq("user_id", userId)

      if (error) throw error
      setInfrastructure(data || [])
    } catch (error) {
      console.error("Error loading infrastructure:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInfrastructure()
  }, [userId])

  const createInfrastructure = async (infrastructureData: {
    name: string
    type: string
    geometry: any
    area: number
    capacity: string | null
    condition: string
    notes: string | null
  }) => {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from("infrastructure")
        .insert({
          user_id: userId,
          ...infrastructureData,
        })
        .select()
        .single()

      if (error) throw error

      setInfrastructure((prev) => [...prev, data])
      return data
    } catch (error) {
      console.error("Error creating infrastructure:", error)
      return null
    }
  }

  const updateInfrastructure = async (id: string, updates: Partial<Infrastructure>) => {
    try {
      const { error } = await supabase
        .from("infrastructure")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      setInfrastructure((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
      return true
    } catch (error) {
      console.error("Error updating infrastructure:", error)
      return false
    }
  }

  const deleteInfrastructure = async (id: string) => {
    try {
      const { error } = await supabase.from("infrastructure").delete().eq("id", id)

      if (error) throw error

      setInfrastructure((prev) => prev.filter((i) => i.id !== id))
      return true
    } catch (error) {
      console.error("Error deleting infrastructure:", error)
      return false
    }
  }

  return {
    infrastructure,
    loading,
    fetchInfrastructure,
    createInfrastructure,
    updateInfrastructure,
    deleteInfrastructure,
  }
}
