import {
  Box,
  Paper,
  Slider,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { RouteResult, TripAnalyzeResponse } from '../types/trip'
import { riskColor } from '../utils/risk'

interface RouteDetailsPanelProps {
  trip: TripAnalyzeResponse
  selectedRoute: RouteResult
  forecastHourOffset: number
  onForecastHourChange: (hour: number) => void
}

export function RouteDetailsPanel({
  trip,
  selectedRoute,
  forecastHourOffset,
  onForecastHourChange,
}: RouteDetailsPanelProps) {
  const [tab, setTab] = useState(0)
  const [previewHour, setPreviewHour] = useState(forecastHourOffset)

  useEffect(() => {
    setPreviewHour(forecastHourOffset)
  }, [forecastHourOffset, selectedRoute.id])

  const forecastTime = new Date(
    new Date(trip.departure_at).getTime() + previewHour * 3600 * 1000,
  )

  return (
    <Paper sx={{ mt: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1">
          Selected route — {selectedRoute.id.replace('route-', 'Route ').toUpperCase()}
        </Typography>
        <Typography variant="body2">
          {selectedRoute.summary.distance_miles} mi · {selectedRoute.summary.duration_hours} h ·{' '}
          {selectedRoute.checkpoints.length} checkpoints
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Overview" />
        <Tab label={`Checkpoints (${selectedRoute.checkpoints.length})`} />
      </Tabs>

      <Box sx={{ p: 2 }}>
        {tab === 0 ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Weather preview (0–48 hours)
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Corridor risk at {forecastTime.toLocaleString()} (+{previewHour}h from departure)
              </Typography>
              <Slider
                value={previewHour}
                min={0}
                max={48}
                step={1}
                marks={[
                  { value: 0, label: '0h' },
                  { value: 24, label: '24h' },
                  { value: 48, label: '48h' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}h`}
                onChange={(_, v) => setPreviewHour(v as number)}
                onChangeCommitted={(_, v) => onForecastHourChange(v as number)}
              />
            </Box>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {(['Low', 'Moderate', 'High', 'Severe', 'No Travel'] as const).map((level) => (
                <Stack key={level} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: riskColor(level) }} />
                  <Typography variant="caption">{level}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto', maxHeight: 280 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mile</TableCell>
                  <TableCell>ETA</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell align="right">Wind</TableCell>
                  <TableCell align="right">Rain</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedRoute.checkpoints.map((cp) => (
                  <TableRow key={`${cp.mile}-${cp.lat}`}>
                    <TableCell>{cp.mile}</TableCell>
                    <TableCell>{new Date(cp.eta).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: riskColor(cp.risk.level), fontWeight: 600 }}>
                      {cp.risk.level}
                    </TableCell>
                    <TableCell align="right">{cp.weather.wind_mph} mph</TableCell>
                    <TableCell align="right">{cp.weather.rain_in_per_hr}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </Paper>
  )
}
