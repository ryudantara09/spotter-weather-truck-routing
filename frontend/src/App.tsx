import { Box, Stack } from '@mui/material'
import { useMemo, useState } from 'react'
import { analyzeTrip } from './api/client'
import { DashboardSidebar, type TripFormValues } from './components/DashboardSidebar'
import { RouteDetailsPanel } from './components/RouteDetailsPanel'
import { RouteMap } from './components/RouteMap'
import { RouteOptionCards } from './components/RouteOptionCards'
import { TopNav } from './components/TopNav'
import type { TripAnalyzeResponse } from './types/trip'

function localInputToIso(value: string): string {
  return new Date(value).toISOString()
}

export default function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trip, setTrip] = useState<TripAnalyzeResponse | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [forecastHourOffset, setForecastHourOffset] = useState(0)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [mapStyle, setMapStyle] = useState<'road' | 'satellite'>('satellite')

  const activeRouteId = useMemo(() => {
    if (!trip) return null
    return selectedRouteId ?? trip.recommended_route_id ?? trip.routes[0]?.id ?? null
  }, [trip, selectedRouteId])

  const selectedRoute = useMemo(() => {
    if (!trip || !activeRouteId) return null
    return trip.routes.find((r) => r.id === activeRouteId) ?? trip.routes[0]
  }, [trip, activeRouteId])

  async function handleSubmit(values: TripFormValues) {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeTrip({
        origin: values.origin,
        destination: values.destination,
        departure_at: localInputToIso(values.departureLocal),
        load_weight_lb: values.loadWeightLb,
        checkpoint_interval_miles: values.checkpointIntervalMiles,
      })
      setTrip(result)
      setSelectedRouteId(result.recommended_route_id ?? result.routes[0]?.id ?? null)
      setForecastHourOffset(0)
    } catch (err) {
      setTrip(null)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopNav />

      <Box sx={{ px: { xs: 1.5, md: 2 }, py: 2, maxWidth: 1800, mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{ alignItems: { lg: 'stretch' } }}
        >
          <DashboardSidebar
            loading={loading}
            error={error}
            showHeatmap={showHeatmap}
            onShowHeatmapChange={setShowHeatmap}
            onSubmit={handleSubmit}
          />

          <RouteMap
            trip={trip}
            selectedRouteId={activeRouteId}
            forecastHourOffset={forecastHourOffset}
            showHeatmap={showHeatmap}
            mapStyle={mapStyle}
            onMapStyleChange={setMapStyle}
          />

          {trip && activeRouteId ? (
            <RouteOptionCards
              routes={trip.routes}
              recommendedRouteId={trip.recommended_route_id}
              selectedRouteId={activeRouteId}
              onSelectRoute={setSelectedRouteId}
            />
          ) : null}
        </Stack>

        {trip && selectedRoute ? (
          <RouteDetailsPanel
            trip={trip}
            selectedRoute={selectedRoute}
            forecastHourOffset={forecastHourOffset}
            onForecastHourChange={setForecastHourOffset}
          />
        ) : null}
      </Box>
    </Box>
  )
}
