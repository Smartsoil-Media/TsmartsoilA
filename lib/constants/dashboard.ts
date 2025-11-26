/**
 * Dashboard Constants
 * Centralized constants and mappings used throughout the dashboard
 */

// Livestock type icons mapping
export const LIVESTOCK_ICONS: Record<string, string> = {
  cattle: "🐄",
  sheep: "🐑",
  goats: "🐐",
  horses: "🐴",
  pigs: "🐷",
  chickens: "🐔",
  other: "🐾",
}

// DSE (Dry Sheep Equivalent) rates for different livestock types
export const DSE_RATES: Record<string, number> = {
  sheep: 1.0,
  cattle: 8.0,
  horse: 10.0,
  goat: 0.8,
  lamb: 0.6,
  calf: 4.0,
}

// Offspring names for different livestock types
export const OFFSPRING_NAMES: Record<string, string> = {
  sheep: "Lambs",
  cattle: "Calves",
  chickens: "Chicks",
  horses: "Foals",
  goats: "Kids",
}

// Weather code descriptions
export const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
}

// Task priority color classes
export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}

// Infrastructure condition color classes
export const CONDITION_COLORS: Record<string, string> = {
  good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-orange-100 text-orange-700",
  needs_repair: "bg-red-100 text-red-700",
}

// Infrastructure type icons
export const INFRASTRUCTURE_TYPE_ICONS: Record<string, string> = {
  shed: "🏚️",
  dam: "💧",
  house: "🏠",
  water_tank: "🚰",
  trough: "🪣",
  fence: "🚧",
  gate: "🚪",
  pump: "⚙️",
  other: "📍",
}

// Area conversion constant (square meters to hectares)
export const SQUARE_METERS_TO_HECTARES = 10000

// Default DSE rate for unknown livestock types
export const DEFAULT_DSE_RATE = 1.0

// Default livestock icon
export const DEFAULT_LIVESTOCK_ICON = "🐾"

// Default offspring name
export const DEFAULT_OFFSPRING_NAME = "Offspring"

// Unknown weather description
export const UNKNOWN_WEATHER = "Unknown"

// Paddock type colors (auto-assigned based on type)
export const PADDOCK_TYPE_COLORS: Record<string, string> = {
  pasture: "#10b981", // Green
  cropping: "#f59e0b", // Amber/Orange
  mixed: "#8b5cf6", // Purple
  native_bush: "#059669", // Dark green
  wetland: "#0891b2", // Cyan
  agroforestry: "#16a34a", // Forest green
  other: "#6b7280", // Gray
}

// Paddock type labels (for display)
export const PADDOCK_TYPE_LABELS: Record<string, string> = {
  pasture: "Pasture",
  cropping: "Cropping",
  mixed: "Mixed",
  native_bush: "Native Bush",
  wetland: "Wetland",
  agroforestry: "Agroforestry",
  other: "Other",
}

// Default paddock color (fallback)
export const DEFAULT_PADDOCK_COLOR = "#10b981"

// Helper function to get paddock color (from user preferences or defaults)
export function getPaddockColor(type: string, userColors?: Record<string, string> | null): string {
  if (userColors && userColors[type]) {
    return userColors[type]
  }
  return PADDOCK_TYPE_COLORS[type] || DEFAULT_PADDOCK_COLOR
}

