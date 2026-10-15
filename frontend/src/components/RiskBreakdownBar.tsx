import { Box, Stack, Typography } from '@mui/material'
import type { RiskMileBreakdown } from '../utils/routeRiskMiles'
import { riskColor } from '../utils/risk'

const SEGMENTS: { key: keyof RiskMileBreakdown; label: string; color: string }[] = [
  { key: 'low', label: 'Low', color: riskColor('Low') },
  { key: 'moderate', label: 'Mod', color: riskColor('Moderate') },
  { key: 'high', label: 'High', color: riskColor('High') },
  { key: 'severe', label: 'Sev', color: riskColor('Severe') },
  { key: 'noTravel', label: 'No go', color: riskColor('No Travel') },
]

export function RiskBreakdownBar({ breakdown }: { breakdown: RiskMileBreakdown }) {
  const total = breakdown.total || 1

  return (
    <Stack spacing={0.75}>
      <Stack direction="row" sx={{ height: 8, borderRadius: 99, overflow: 'hidden', bgcolor: 'rgba(15,23,42,0.8)' }}>
        {SEGMENTS.map(({ key, color }) => {
          const miles = breakdown[key]
          if (typeof miles !== 'number' || miles <= 0) return null
          return (
            <Box
              key={key}
              sx={{
                width: `${(miles / total) * 100}%`,
                bgcolor: color,
                minWidth: miles > 0 ? 4 : 0,
              }}
            />
          )
        })}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        {SEGMENTS.map(({ key, label, color }) => {
          const miles = breakdown[key]
          if (typeof miles !== 'number') return null
          return (
            <Typography key={key} variant="caption" sx={{ color: 'text.secondary' }}>
              <Box component="span" sx={{ color, fontWeight: 700 }}>
                {Math.round(miles)} mi
              </Box>{' '}
              {label}
            </Typography>
          )
        })}
      </Stack>
    </Stack>
  )
}
