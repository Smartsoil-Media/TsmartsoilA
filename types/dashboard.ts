import type { GeoJSONGeometry } from "./mapbox"

export interface Profile {
  name: string
  display_name: string
  farm_location: string
  enterprise_type: string
  animal_type: string | null
  crop_type: string | null
  bio: string | null
  latitude: number | null
  longitude: number | null
  location_confirmed: boolean
  paddock_type_colors?: Record<string, string> | null
  map_settings?: {
    show_paddock_names?: boolean
  } | null
}

export interface Paddock {
  id: string
  name: string
  geometry: GeoJSONGeometry
  area: number
  color: string
  type?: string
  tree_species?: string | null
  area_hectares?: number
}

export interface Mob {
  id: string
  name: string
  livestock_type: string
  size: number
  notes: string | null
  current_paddock_id: string | null
  created_at: string
  status?: string // Added status field for soft delete
  user_id: string
}

export interface MobEvent {
  id: string
  mob_id: string
  user_id: string
  event_type: "birth" | "sale" | "death" | "purchase" | "treatment" | "observation" | "movement"
  quantity: number
  event_date: string
  notes: string | null
  loss_reason?: string | null
  price_per_head?: number | null
  total_price?: number | null
  buyer_name?: string | null
}

export interface GrazingEvent {
  id: string
  mob_id: string
  paddock_id: string
  moved_in_at: string
  moved_out_at: string | null
  user_id: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  related_paddock_id: string | null
  related_paddock_ids?: string[] // Array of paddock IDs from task_paddocks junction table
  related_mob_id: string | null
  completed_at: string | null
  created_at: string
  assigned_to: string | null
  user_id: string
}

export interface Infrastructure {
  id: string
  user_id: string
  name: string
  type: string
  geometry: GeoJSONGeometry
  area?: number
  capacity?: number
  condition: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  weatherDescription: string
  weatherCode: number
}

export interface RainfallData {
  date: string
  rainfall: number
  type: "historical" | "forecast"
}

export type ActiveTab = "overview" | "livestock" | "tasks" | "infrastructure" | "edit"
export type MapViewMode = "default" | "fullscreen" | "collapsed"
export type DrawingMode = "paddock" | "infrastructure" | null
export type TaskStatus = "todo" | "in_progress" | "completed"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type InfrastructureCondition = "good" | "fair" | "poor" | "needs_repair"

