import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import type { RouteResult } from '../types/trip'
import { overallRiskLabel, riskMilesFromCheckpoints } from '../utils/routeRiskMiles'
import { RiskBreakdownBar } from './RiskBreakdownBar'
import { ROUTE_LINE_COLORS } from '../theme'

interface RouteOptionCardsProps {
  routes: RouteResult[]
  recommendedRouteId: string | null
  selectedRouteId: string
  onSelectRoute: (routeId: string) => void
}

function riskChipColor(label: ReturnType<typeof overallRiskLabel>): 'success' | 'warning' | 'error' {
  if (label === 'Low Risk') return 'success'
  if (label === 'Moderate Risk') return 'warning'
  return 'error'
}

export function RouteOptionCards({
  routes,
  recommendedRouteId,
  selectedRouteId,
  onSelectRoute,
}: RouteOptionCardsProps) {
  return (
    <Stack spacing={1.5} sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0 }}>
      <Typography variant="subtitle2" sx={{ px: 0.5 }}>
        Route options
      </Typography>
      {routes.map((route, index) => {
        const recommended = route.id === recommendedRouteId
        const selected = route.id === selectedRouteId
        const breakdown = riskMilesFromCheckpoints(route.checkpoints)
        const riskLabel = overallRiskLabel(breakdown)
        const routeLabel = String.fromCharCode(65 + index)

        return (
          <Paper
            key={route.id}
            sx={{
              p: 1.75,
              cursor: 'pointer',
              borderColor: selected ? 'primary.main' : 'divider',
              boxShadow: selected ? '0 0 0 1px rgba(59,130,246,0.5)' : 'none',
              bgcolor: selected ? 'rgba(59,130,246,0.08)' : 'background.paper',
            }}
            onClick={() => onSelectRoute(route.id)}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: ROUTE_LINE_COLORS[index % ROUTE_LINE_COLORS.length],
                  }}
                />
                <Typography variant="subtitle1">Route {routeLabel}</Typography>
                {recommended ? <Chip size="small" color="success" label="Recommended" /> : null}
                <Chip size="small" color={riskChipColor(riskLabel)} label={riskLabel} variant="outlined" />
              </Stack>

              <Stack direction="row" spacing={2}>
                <Typography variant="body2">
                  <strong>{route.summary.distance_miles}</strong> mi
                </Typography>
                <Typography variant="body2">
                  <strong>{route.summary.duration_hours}</strong> h
                </Typography>
                <Typography variant="body2">
                  <strong>{route.checkpoints.length}</strong> checkpoints
                </Typography>
              </Stack>

              <RiskBreakdownBar breakdown={breakdown} />

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={selected ? 'contained' : 'outlined'}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectRoute(route.id)
                  }}
                >
                  Show on map
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )
      })}
    </Stack>
  )
}
