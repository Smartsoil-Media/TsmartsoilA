/**
 * Dashboard Utility Functions
 * Pure utility functions used throughout the dashboard
 */

import {
  LIVESTOCK_ICONS,
  DEFAULT_LIVESTOCK_ICON,
  OFFSPRING_NAMES,
  DEFAULT_OFFSPRING_NAME,
} from "@/lib/constants/dashboard"
import type { Paddock } from "@/types/dashboard"

/**
 * Calculate the area of a polygon from coordinates (in square meters)
 * Uses the shoelace formula for polygon area calculation
 */
export function calculateArea(coordinates: number[][]): number {
  if (typeof window === "undefined" || !window.mapboxgl) return 0
  let area = 0
  const numPoints = coordinates.length
  for (let i = 0; i < numPoints - 1; i++) {
    const p1 = coordinates[i]
    const p2 = coordinates[i + 1]
    area += (p2[0] - p1[0]) * (p2[1] + p1[1])
  }
  return Math.abs(area / 2) * 111320 * 111320
}

/**
 * Calculate the centroid (center point) of a polygon from coordinates
 * Returns [longitude, latitude]
 */
export function calculateCentroid(coordinates: number[][]): [number, number] {
  let x = 0
  let y = 0
  const numPoints = coordinates.length - 1
  for (let i = 0; i < numPoints; i++) {
    x += coordinates[i][0]
    y += coordinates[i][1]
  }
  return [x / numPoints, y / numPoints]
}

/**
 * Get the emoji icon for a livestock type
 */
export function getLivestockIcon(livestockType: string): string {
  return LIVESTOCK_ICONS[livestockType] || DEFAULT_LIVESTOCK_ICON
}

/**
 * Get the offspring name for a livestock type (e.g., "sheep" -> "Lambs")
 */
export function getOffspringName(livestockType: string): string {
  const type = livestockType.toLowerCase()
  return OFFSPRING_NAMES[type] || DEFAULT_OFFSPRING_NAME
}

/**
 * Calculate the distance between two points in meters using the Haversine formula
 * @param point1 [longitude, latitude]
 * @param point2 [longitude, latitude]
 * @returns distance in meters
 */
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
  const R = 6371000 // Earth's radius in meters
  const [lng1, lat1] = point1
  const [lng2, lat2] = point2
  
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Get the name of a paddock by its ID
 * Returns "Not in paddock" if paddockId is null
 * Returns "Unknown paddock" if paddock is not found
 */
export function getPaddockName(paddockId: string | null, paddocks: Paddock[]): string {
  if (!paddockId) return "Not in paddock"
  const paddock = paddocks.find((p) => p.id === paddockId)
  return paddock ? paddock.name : "Unknown paddock"
}

