// Application constants

// Map defaults
export const MAP_DEFAULTS = {
  DEFAULT_CENTER: [115.3464, -33.6506] as [number, number], // Perth, Australia
  DEFAULT_ZOOM: 12,
  CONFIRMED_LOCATION_ZOOM: 15,
  MAP_STYLE: "mapbox://styles/mapbox/satellite-streets-v12",
} as const

// API endpoints
export const API_ENDPOINTS = {
  WEATHER: "https://api.open-meteo.com/v1/forecast",
  RAINFALL: "https://api.open-meteo.com/v1/forecast",
} as const

// Weather API parameters
export const WEATHER_PARAMS = {
  CURRENT: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
  DAILY: "precipitation_sum",
  PAST_DAYS: 92,
  FORECAST_DAYS: 16,
} as const

// Mapbox CDN URLs
export const MAPBOX_CDN = {
  GL_JS: "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js",
  GL_CSS: "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css",
  DRAW_JS: "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.js",
  DRAW_CSS: "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css",
  GEOCODER_JS: "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js",
  GEOCODER_CSS: "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css",
} as const

// Timeouts and delays
export const TIMING = {
  MAP_VIEW_MODE_DELAY: 350, // milliseconds
} as const

// Task statuses
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const

// Task priorities
export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

// Mob event types
export const MOB_EVENT_TYPES = {
  BIRTH: "birth",
  SALE: "sale",
  DEATH: "death",
  PURCHASE: "purchase",
  TREATMENT: "treatment",
  OBSERVATION: "observation",
  MOVEMENT: "movement",
} as const

// Farm member roles
export const FARM_MEMBER_ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  VIEWER: "viewer",
} as const

