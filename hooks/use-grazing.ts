"use client"

import { useMemo } from "react"
import type { Mob, GrazingEvent, Paddock } from "@/types/dashboard"
import { DSE_RATES, DEFAULT_DSE_RATE, SQUARE_METERS_TO_HECTARES } from "@/lib/constants/dashboard"

export type GrazingStatus = {
  status: "grazing" | "resting" | "never"
  days: number
  mobCount: number
}

export function useGrazing(mobs: Mob[], grazingEvents: GrazingEvent[]) {
  const getGrazingStatus = (paddockId: string): GrazingStatus => {
    // Check if there are any active mobs currently in this paddock
    const activeMobs = mobs.filter(
      (mob) => mob.current_paddock_id === paddockId && mob.status === "active" && mob.size > 0,
    )

    if (activeMobs.length > 0) {
      // Find when the first mob moved into this paddock
      const grazingEventsData = grazingEvents.filter((event) => event.paddock_id === paddockId && !event.moved_out_at)

      if (grazingEventsData.length > 0) {
        const earliestMoveIn = grazingEventsData.sort(
          (a, b) => new Date(a.moved_in_at).getTime() - new Date(b.moved_in_at).getTime(),
        )[0]

        const daysGrazing = Math.floor(
          (new Date().getTime() - new Date(earliestMoveIn.moved_in_at).getTime()) / (1000 * 60 * 60 * 24),
        )

        return {
          status: "grazing" as const,
          days: daysGrazing,
          mobCount: activeMobs.length,
        }
      }

      return {
        status: "grazing" as const,
        days: 0,
        mobCount: activeMobs.length,
      }
    }

    // No active mobs, calculate rest period
    const grazingEventsData = grazingEvents.filter((event) => event.paddock_id === paddockId)

    if (grazingEventsData.length === 0) {
      return { status: "never" as const, days: 0, mobCount: 0 }
    }

    // Find the most recent moved_out_at date
    const lastGrazed = grazingEventsData
      .filter((event) => event.moved_out_at)
      .sort((a, b) => new Date(b.moved_out_at!).getTime() - new Date(a.moved_out_at!).getTime())[0]

    if (!lastGrazed) {
      return { status: "never" as const, days: 0, mobCount: 0 }
    }

    const daysResting = Math.floor(
      (new Date().getTime() - new Date(lastGrazed.moved_out_at!).getTime()) / (1000 * 60 * 60 * 24),
    )

    return {
      status: "resting" as const,
      days: daysResting,
      mobCount: 0,
    }
  }

  const getDaysSinceLastGrazed = (paddockId: string) => {
    const grazingEventsData = grazingEvents.filter((event) => event.paddock_id === paddockId)

    if (grazingEventsData.length === 0) {
      return null // Never grazed
    }

    // Find the most recent moved_out_at date
    const lastGrazed = grazingEventsData
      .filter((event) => event.moved_out_at)
      .sort((a, b) => new Date(b.moved_out_at!).getTime() - new Date(a.moved_out_at!).getTime())[0]

    if (!lastGrazed) {
      // Check if there's an active grazing (moved_in but not moved_out)
      const activeGrazing = grazingEventsData.find((event) => event.moved_in_at && !event.moved_out_at)
      if (activeGrazing) {
        return 0 // Currently being grazed
      }
      return null
    }

    const daysSince = Math.floor(
      (new Date().getTime() - new Date(lastGrazed.moved_out_at!).getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysSince
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

  const calculateDSE = (livestockType: string, size: number): number => {
    const rate = DSE_RATES[livestockType.toLowerCase()] || DEFAULT_DSE_RATE
    return rate * size
  }

  const calculatePaddockDSE = (paddockId: string): number => {
    return mobs
      .filter((mob) => mob.current_paddock_id === paddockId)
      .reduce((total, mob) => total + calculateDSE(mob.livestock_type, mob.size), 0)
  }

  const calculateStockingRate = (paddockId: string, paddockArea: number): number => {
    const totalDSE = calculatePaddockDSE(paddockId)
    const areaInHectares = paddockArea / SQUARE_METERS_TO_HECTARES
    return areaInHectares > 0 ? totalDSE / areaInHectares : 0
  }

  return {
    getGrazingStatus,
    getDaysSinceLastGrazed,
    getDaysInPaddock,
    calculateDSE,
    calculatePaddockDSE,
    calculateStockingRate,
  }
}

