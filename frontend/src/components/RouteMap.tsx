import { Box } from '@mui/material'
import { useEffect, useMemo } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'
import type { RouteResult, TripAnalyzeResponse } from '../types/trip'
import { riskAtForecastHour } from '../utils/forecast'
import { riskColor, riskHeatRadius } from '../utils/risk'
import { SectionCard } from './SectionCard'

const ROUTE_COLORS = ['#1e6fd9', '#0d9488', '#5e35b1']

interface RouteMapProps {
  trip: TripAnalyzeResponse
  selectedRouteId: string
  forecastHourOffset: number
  showHeatmap: boolean
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [48, 48] })
    }
  }, [map, bounds])
  return null
}

function toLatLng(geometry: RouteResult['geometry']): LatLngTuple[] {
  return geometry.coordinates.map(([lng, lat]) => [lat, lng])
}

export function RouteMap({
  trip,
  selectedRouteId,
  forecastHourOffset,
  showHeatmap,
}: RouteMapProps) {
  const bounds = useMemo(() => {
    const points: LatLngTuple[] = []
    for (const route of trip.routes) {
      points.push(...toLatLng(route.geometry))
    }
    if (!points.length) {
      return null
    }
    return points as LatLngBoundsExpression
  }, [trip.routes])

  const center: LatLngTuple = bounds
    ? (() => {
        const flat = trip.routes.flatMap((r) => toLatLng(r.geometry))
        const lat = flat.reduce((sum, p) => sum + p[0], 0) / flat.length
        const lng = flat.reduce((sum, p) => sum + p[1], 0) / flat.length
        return [lat, lng]
      })()
    : [39.8, -98.5]

  const selectedRoute = trip.routes.find((r) => r.id === selectedRouteId) ?? trip.routes[0]

  return (
    <SectionCard
      title="Route map"
      subtitle="Polylines show all options; checkpoints reflect ETA-matched weather risk; heat circles follow the forecast slider."
      noPadding
    >
      <Box sx={{ height: { xs: 380, md: 540 } }}>
        <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {bounds ? <FitBounds bounds={bounds} /> : null}

          {trip.routes.map((route, index) => {
            const recommended = route.id === trip.recommended_route_id
            const selected = route.id === selectedRouteId
            const positions = toLatLng(route.geometry)
            return (
              <Polyline
                key={route.id}
                positions={positions}
                pathOptions={{
                  color: ROUTE_COLORS[index % ROUTE_COLORS.length],
                  weight: selected ? 7 : recommended ? 6 : 4,
                  opacity: selected || recommended ? 0.95 : 0.45,
                }}
              />
            )
          })}

          {selectedRoute?.checkpoints.map((cp) => (
            <CircleMarker
              key={`${cp.lat}-${cp.mile}`}
              center={[cp.lat, cp.lng]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                weight: 1,
                fillColor: riskColor(cp.risk.level),
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <strong>Mile {cp.mile}</strong>
                <br />
                ETA: {new Date(cp.eta).toLocaleString()}
                <br />
                Risk: {cp.risk.level}
                <br />
                Wind: {cp.weather.wind_mph} mph
              </Popup>
            </CircleMarker>
          ))}

          {showHeatmap && selectedRoute
            ? selectedRoute.heatmap.map((point) => {
                const risk = riskAtForecastHour(point, trip.departure_at, forecastHourOffset)
                return (
                  <Circle
                    key={`heat-${point.lat}-${point.mile}`}
                    center={[point.lat, point.lng]}
                    radius={riskHeatRadius(risk.score)}
                    pathOptions={{
                      color: riskColor(risk.level),
                      fillColor: riskColor(risk.level),
                      fillOpacity: 0.18,
                      weight: 0,
                    }}
                  />
                )
              })
            : null}
        </MapContainer>
      </Box>
    </SectionCard>
  )
}
