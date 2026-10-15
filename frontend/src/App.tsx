import { Box, Container, Stack } from '@mui/material'
import { useMemo, useState } from 'react'
import { analyzeTrip } from './api/client'
import { AppHeader } from './components/AppHeader'
import { ForecastSlider } from './components/ForecastSlider'
import { RouteMap } from './components/RouteMap'
import { RouteResults } from './components/RouteResults'
import { TripForm, type TripFormValues } from './components/TripForm'
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

  const activeRouteId = useMemo(() => {
    if (!trip) {
      return null
    }
    return selectedRouteId ?? trip.recommended_route_id ?? trip.routes[0]?.id ?? null
  }, [trip, selectedRouteId])

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
      <AppHeader />
      <Container maxWidth="lg" sx={{ pb: 5 }}>
        <Stack spacing={3}>
          <TripForm loading={loading} error={error} onSubmit={handleSubmit} />

          {trip && activeRouteId ? (
            <>
              <RouteResults
                routes={trip.routes}
                recommendedRouteId={trip.recommended_route_id}
                selectedRouteId={activeRouteId}
                onSelectRoute={setSelectedRouteId}
              />
              <ForecastSlider
                hourOffset={forecastHourOffset}
                onChange={setForecastHourOffset}
                departureIso={trip.departure_at}
              />
              <RouteMap
                trip={trip}
                selectedRouteId={activeRouteId}
                forecastHourOffset={forecastHourOffset}
                showHeatmap
              />
            </>
          ) : null}
        </Stack>
      </Container>
    </Box>
  )
}
