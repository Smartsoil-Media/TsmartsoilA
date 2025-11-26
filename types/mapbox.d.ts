// Mapbox type definitions
declare global {
  interface Window {
    mapboxgl: typeof import('mapbox-gl')
    MapboxDraw: typeof import('@mapbox/mapbox-gl-draw')
    MapboxGeocoder: any
    turf: any
  }
}

// Mapbox GL types
export interface MapboxMap {
  on(event: string, callback: (e: any) => void): void
  off(event: string, callback: (e: any) => void): void
  getSource(id: string): any
  addSource(id: string, source: any): void
  addLayer(layer: any): void
  removeLayer(id: string): void
  removeSource(id: string): void
  getLayer(id: string): any
  setLayoutProperty(layer: string, property: string, value: any): void
  setPaintProperty(layer: string, property: string, value: any): void
  fitBounds(bounds: [[number, number], [number, number]], options?: any): void
  getCenter(): { lng: number; lat: number }
  setCenter(center: [number, number]): void
  getZoom(): number
  setZoom(zoom: number): void
  flyTo(options: any): void
  remove(): void
  accessToken: string
}

export interface MapboxDraw {
  add(geojson: any): string[]
  get(featureId: string): any
  getAll(): any
  delete(ids: string | string[]): void
  deleteAll(): void
  getSelectedIds(): string[]
  getSelected(): any
  getSelectedPoints(): any
  set(featureCollection: any): string[]
  trash(): void
  changeMode(mode: string, options?: any): void
  on(event: string, callback: (e: any) => void): void
  off(event: string, callback: (e: any) => void): void
}

// GeoJSON types
export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'
  coordinates: number[] | number[][] | number[][][]
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONGeometry
  properties?: Record<string, any>
  id?: string | number
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export {}

