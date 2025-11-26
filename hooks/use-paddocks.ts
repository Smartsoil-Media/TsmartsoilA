"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Paddock {
  id: string
  user_id: string
  name: string
  geometry: any
  area: number
  color: string
  type: string
  tree_species?: string | null
  created_at: string
}

export function usePaddocks(userId: string | null) {
  const [paddocks, setPaddocks] = useState<Paddock[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPaddocks = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const { data, error } = await supabase.from("paddocks").select("*").eq("user_id", userId)

      if (error) {
        console.error("Error loading paddocks:", error)
        return
      }

      setPaddocks(data || [])
    } catch (error) {
      console.error("Error loading paddocks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaddocks()
  }, [userId])

  const createPaddock = async (paddockData: {
    name: string
    geometry: any
    area: number
    color: string
    type: string
    tree_species?: string | null
  }) => {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from("paddocks")
        .insert({
          user_id: userId,
          ...paddockData,
        })
        .select()
        .single()

      if (error) throw error

      setPaddocks((prev) => [...prev, data])
      return data
    } catch (error) {
      console.error("Error creating paddock:", error)
      return null
    }
  }

  const updatePaddock = async (id: string, updates: Partial<Paddock>) => {
    try {
      const { error } = await supabase.from("paddocks").update(updates).eq("id", id)

      if (error) throw error

      setPaddocks((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
      return true
    } catch (error) {
      console.error("Error updating paddock:", error)
      return false
    }
  }

  const deletePaddock = async (id: string) => {
    try {
      const { error } = await supabase.from("paddocks").delete().eq("id", id)

      if (error) throw error

      setPaddocks((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch (error) {
      console.error("Error deleting paddock:", error)
      return false
    }
  }

  return {
    paddocks,
    loading,
    fetchPaddocks,
    createPaddock,
    updatePaddock,
    deletePaddock,
  }
}
