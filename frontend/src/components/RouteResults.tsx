import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { RouteResult } from '../types/trip'
import { SectionCard } from './SectionCard'

interface RouteResultsProps {
  routes: RouteResult[]
  recommendedRouteId: string | null
  selectedRouteId: string | null
  onSelectRoute: (routeId: string) => void
}

export function RouteResults({
  routes,
  recommendedRouteId,
  selectedRouteId,
  onSelectRoute,
}: RouteResultsProps) {
  return (
    <SectionCard
      title="Route comparison"
      subtitle="Click a row to highlight that route on the map. Recommended route uses fewest severe miles, then high miles, then travel time."
      noPadding
    >
      <Table size="small" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            <TableCell>Route</TableCell>
            <TableCell align="right">Miles</TableCell>
            <TableCell align="right">Hours</TableCell>
            <TableCell align="right">No travel</TableCell>
            <TableCell align="right">Severe</TableCell>
            <TableCell align="right">High</TableCell>
            <TableCell align="right">Avg risk</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {routes.map((route) => {
            const recommended = route.id === recommendedRouteId
            const selected = route.id === selectedRouteId
            return (
              <TableRow
                key={route.id}
                hover
                selected={selected}
                onClick={() => onSelectRoute(route.id)}
                sx={{
                  cursor: 'pointer',
                  '&.Mui-selected': { bgcolor: 'rgba(30, 111, 217, 0.08)' },
                }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: selected ? 700 : 500 }}>{route.id}</Typography>
                    {recommended ? (
                      <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        icon={<CheckCircleIcon />}
                        label="Recommended"
                      />
                    ) : null}
                  </Stack>
                </TableCell>
                <TableCell align="right">{route.summary.distance_miles}</TableCell>
                <TableCell align="right">{route.summary.duration_hours}</TableCell>
                <TableCell align="right">{route.stats.no_travel_miles}</TableCell>
                <TableCell align="right">{route.stats.severe_miles}</TableCell>
                <TableCell align="right">{route.stats.high_miles}</TableCell>
                <TableCell align="right">{route.stats.avg_risk_score}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </SectionCard>
  )
}
