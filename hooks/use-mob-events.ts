"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Mob, MobEvent } from "@/types/dashboard"

interface MobAnalytics {
  totalBirths: number
  totalSales: number
  totalLosses: number
  birthRate: number
  sizeOverTime: { date: string; size: number; event: string }[]
}

export function useMobEvents(mobId: string | null) {
  const [mobEvents, setMobEvents] = useState<MobEvent[]>([])
  const [loadingMobEvents, setLoadingMobEvents] = useState(false)
  const [mobAnimals, setMobAnimals] = useState<any[]>([])
  const [loadingAnimals, setLoadingAnimals] = useState(false)

  const loadMobEvents = async (id: string) => {
    setLoadingMobEvents(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("mob_events")
        .select("*")
        .eq("mob_id", id)
        .order("event_date", { ascending: true })

      if (error) {
        console.error("[v0] Error loading mob events:", error)
        throw error
      }

      setMobEvents(data || [])
    } catch (error: any) {
      console.error("[v0] Error loading mob events:", error.message)
      setMobEvents([])
    } finally {
      setLoadingMobEvents(false)
    }
  }

  const fetchMobAnimals = async (id: string) => {
    setLoadingAnimals(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("mob_id", id)
        .order("birth_date", { ascending: true })

      if (error) {
        console.error("[v0] Error loading animals:", error)
        throw error
      }

      setMobAnimals(data || [])
    } catch (error: any) {
      console.error("[v0] Error loading animals:", error.message)
      setMobAnimals([])
    } finally {
      setLoadingAnimals(false)
    }
  }

  useEffect(() => {
    if (mobId) {
      loadMobEvents(mobId)
      fetchMobAnimals(mobId)
    } else {
      setMobEvents([])
      setMobAnimals([])
    }
  }, [mobId])

  const calculateAge = (birthDate: string | null, purchaseDate: string | null, ageAtPurchase: number | null) => {
    // For purchased animals, use the age at purchase plus time since purchase
    if (purchaseDate && ageAtPurchase !== null) {
      const purchase = new Date(purchaseDate)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - purchase.getTime())
      const yearsSincePurchase = diffTime / (1000 * 60 * 60 * 24 * 365)
      const currentAge = ageAtPurchase + yearsSincePurchase

      const years = Math.floor(currentAge)
      const months = Math.floor((currentAge % 1) * 12)

      if (years === 0) return `${months} months`
      return months > 0 ? `${years}y ${months}m` : `${years} years`
    }

    // For born animals, calculate from birth date
    if (birthDate) {
      const birth = new Date(birthDate)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - birth.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 30) return `${diffDays} days`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`

      const years = Math.floor(diffDays / 365)
      const months = Math.floor((diffDays % 365) / 30)
      return months > 0 ? `${years}y ${months}m` : `${years} years`
    }

    return "Unknown"
  }

  const calculateMobAnalytics = (mob: Mob | null): MobAnalytics => {
    if (!mob || mobEvents.length === 0) {
      return {
        totalBirths: 0,
        totalSales: 0,
        totalLosses: 0,
        birthRate: 0,
        sizeOverTime: [],
      }
    }

    let totalBirths = 0
    let totalSales = 0
    let totalLosses = 0
    const sizeOverTime: { date: string; size: number; event: string }[] = []

    // Start with initial mob size (we'll work backwards from current size)
    const currentSize = mob.size

    // Calculate totals
    mobEvents.forEach((event) => {
      if (event.event_type === "birth") {
        totalBirths += event.quantity || 0
      } else if (event.event_type === "sale") {
        totalSales += event.quantity || 0
      } else if (event.event_type === "death") {
        totalLosses += event.quantity || 0
      }
    })

    // Calculate size over time (working forward from creation)
    // We need to estimate the initial size by working backwards from current size
    const netChange = totalBirths - totalSales - totalLosses
    const initialSize = currentSize - netChange

    let runningSize = initialSize
    sizeOverTime.push({
      date: mob.created_at || new Date().toISOString(),
      size: Math.max(0, runningSize),
      event: "Initial",
    })

    mobEvents.forEach((event) => {
      if (event.event_type === "birth") {
        runningSize += event.quantity || 0
      } else if (event.event_type === "sale") {
        runningSize -= event.quantity || 0
      } else if (event.event_type === "death") {
        runningSize -= event.quantity || 0
      }

      sizeOverTime.push({
        date: event.event_date,
        size: Math.max(0, runningSize),
        event: event.event_type,
      })
    })

    // Calculate birth rate (births per 100 head)
    const birthRate = initialSize > 0 ? (totalBirths / initialSize) * 100 : 0

    return {
      totalBirths,
      totalSales,
      totalLosses,
      birthRate,
      sizeOverTime,
    }
  }

  return {
    mobEvents,
    loadingMobEvents,
    mobAnimals,
    loadingAnimals,
    calculateAge,
    calculateMobAnalytics,
    refetch: () => {
      if (mobId) {
        loadMobEvents(mobId)
        fetchMobAnimals(mobId)
      }
    },
  }
}

