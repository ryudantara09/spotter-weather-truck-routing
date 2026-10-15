import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { memo, useEffect, useMemo, useRef } from 'react'
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
import type { HeatmapPoint, RouteResult, TripAnalyzeResponse } from '../types/trip'
import { ROUTE_LINE_COLORS } from '../theme'
import { riskAtForecastHour } from '../utils/forecast'
import { riskColor, riskHeatRadius } from '../utils/risk'

interface RouteMapProps {
  trip: TripAnalyzeResponse | null
  selectedRouteId: string | null
  forecastHourOffset: number
  showHeatmap: boolean
  mapStyle: 'road' | 'satellite'
  onMapStyleChange: (style: 'road' | 'satellite') => void
}

const TILES = {
  road: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
}

function FitBounds({ bounds, tripKey }: { bounds: LatLngBoundsExpression | null; tripKey: string }) {
  const map = useMap()
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    if (!bounds || lastKey.current === tripKey) return
    lastKey.current = tripKey
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, bounds, tripKey])

  return null
}

function toLatLng(geometry: RouteResult['geometry']): LatLngTuple[] {
  return geometry.coordinates.map(([lng, lat]) => [lat, lng])
}

const HeatmapCircles = memo(function HeatmapCircles({
  points,
  departureIso,
  hourOffset,
}: {
  points: HeatmapPoint[]
  departureIso: string
  hourOffset: number
}) {
  const circles = useMemo(
    () =>
      points.map((point) => {
        const risk = riskAtForecastHour(point, departureIso, hourOffset)
        return {
          key: `${point.lat}-${point.mile}`,
          center: [point.lat, point.lng] as LatLngTuple,
          risk,
        }
      }),
    [points, departureIso, hourOffset],
  )

  return (
    <>
      {circles.map(({ key, center, risk }) => (
        <Circle
          key={key}
          center={center}
          radius={riskHeatRadius(risk.score)}
          pathOptions={{
            color: riskColor(risk.level),
            fillColor: riskColor(risk.level),
            fillOpacity: 0.22,
            weight: 0,
          }}
        />
      ))}
    </>
  )
})

export function RouteMap({
  trip,
  selectedRouteId,
  forecastHourOffset,
  showHeatmap,
  mapStyle,
  onMapStyleChange,
}: RouteMapProps) {
  const tripKey = trip ? `${trip.departure_at}-${trip.routes.length}` : 'empty'

  const bounds = useMemo(() => {
    if (!trip) return null
    const points: LatLngTuple[] = []
    for (const route of trip.routes) {
      points.push(...toLatLng(route.geometry))
    }
    return points.length ? (points as LatLngBoundsExpression) : null
  }, [trip])

  const center: LatLngTuple = useMemo(() => {
    if (!trip?.routes.length) return [39.8, -98.5]
    const flat = trip.routes.flatMap((r) => toLatLng(r.geometry))
    const lat = flat.reduce((sum, p) => sum + p[0], 0) / flat.length
    const lng = flat.reduce((sum, p) => sum + p[1], 0) / flat.length
    return [lat, lng]
  }, [trip])

  const selectedRoute =
    trip?.routes.find((r) => r.id === selectedRouteId) ?? trip?.routes[0] ?? null

  const routePolylines = useMemo(() => {
    if (!trip) return []
    return trip.routes.map((route, index) => ({
      route,
      index,
      positions: toLatLng(route.geometry),
      recommended: route.id === trip.recommended_route_id,
      selected: route.id === selectedRouteId,
    }))
  }, [trip, selectedRouteId])

  return (
    <Paper
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: { xs: 360, md: 480 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        sx={{
          px: 1.5,
          py: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2">Route map</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mapStyle}
          onChange={(_, v) => v && onMapStyleChange(v)}
        >
          <ToggleButton value="road">Map</ToggleButton>
          <ToggleButton value="satellite">Satellite</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box sx={{ flex: 1, position: 'relative' }}>
        {!trip ? (
          <Stack
            sx={{
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" color="text.primary" gutterBottom>
              Plan your trip
            </Typography>
            <Typography variant="body2">
              Enter trip details and click Find safe routes to compare three HGV options with weather
              risk.
            </Typography>
          </Stack>
        ) : (
          <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution={TILES[mapStyle].attribution} url={TILES[mapStyle].url} />
            {bounds ? <FitBounds bounds={bounds} tripKey={tripKey} /> : null}

            {routePolylines.map(({ route, index, positions, recommended, selected }) => (
              <Polyline
                key={route.id}
                positions={positions}
                pathOptions={{
                  color: ROUTE_LINE_COLORS[index % ROUTE_LINE_COLORS.length],
                  weight: selected ? 8 : recommended ? 6 : 4,
                  opacity: selected || recommended ? 0.95 : 0.35,
                }}
              />
            ))}

            {selectedRoute?.checkpoints.map((cp) => (
              <CircleMarker
                key={`${cp.lat}-${cp.mile}`}
                center={[cp.lat, cp.lng]}
                radius={6}
                pathOptions={{
                  color: '#fff',
                  weight: 1,
                  fillColor: riskColor(cp.risk.level),
                  fillOpacity: 0.95,
                }}
              >
                <Popup>
                  Mile {cp.mile} · {cp.risk.level}
                  <br />
                  ETA: {new Date(cp.eta).toLocaleString()}
                </Popup>
              </CircleMarker>
            ))}

            {showHeatmap && selectedRoute && trip ? (
              <HeatmapCircles
                points={selectedRoute.heatmap}
                departureIso={trip.departure_at}
                hourOffset={forecastHourOffset}
              />
            ) : null}
          </MapContainer>
        )}

        {trip && showHeatmap ? (
          <Paper
            sx={{
              position: 'absolute',
              left: 12,
              bottom: 12,
              px: 1.5,
              py: 1,
              bgcolor: 'rgba(18, 26, 43, 0.92)',
            }}
          >
            <Typography variant="caption" gutterBottom sx={{ display: 'block' }}>
              Weather intensity
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 48, height: 8, borderRadius: 99, background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444, #4a148c)' }} />
              <Typography variant="caption">Low → Severe</Typography>
            </Stack>
          </Paper>
        ) : null}
      </Box>
    </Paper>
  )
}
