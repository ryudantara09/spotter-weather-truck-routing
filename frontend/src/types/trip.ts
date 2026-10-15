export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'No Travel'

export interface RiskInfo {
  level: RiskLevel
  score: number
}

export interface WeatherSnapshot {
  wind_mph: number
  rain_in_per_hr: number
  snow_in_per_hr: number
}

export interface Checkpoint {
  mile: number
  lat: number
  lng: number
  eta: string
  weather: WeatherSnapshot
  risk: RiskInfo
}

export interface RouteStats {
  no_travel_miles: number
  severe_miles: number
  high_miles: number
  avg_risk_score: number
  total_miles: number
}

export interface RouteSummary {
  distance_miles: number
  duration_seconds: number
  duration_hours: number
}

export interface HeatmapPoint {
  lat: number
  lng: number
  mile: number
  hourly_risk: { time: string; risk: RiskInfo }[]
}

export interface RouteGeometry {
  type: 'LineString'
  coordinates: [number, number][]
}

export interface RouteResult {
  id: string
  summary: RouteSummary
  geometry: RouteGeometry
  checkpoints: Checkpoint[]
  stats: RouteStats
  heatmap: HeatmapPoint[]
}

export interface TripAnalyzeResponse {
  origin: { query: string; lat: number; lng: number }
  destination: { query: string; lat: number; lng: number }
  departure_at: string
  load_weight_lb: number
  checkpoint_interval_miles: number
  recommended_route_id: string | null
  routes: RouteResult[]
}

export interface TripAnalyzeRequest {
  origin: string
  destination: string
  departure_at: string
  load_weight_lb: number
  checkpoint_interval_miles?: number
}
