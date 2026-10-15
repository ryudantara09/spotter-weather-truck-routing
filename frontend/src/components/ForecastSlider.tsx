import { Slider, Stack, Typography } from '@mui/material'
import { SectionCard } from './SectionCard'

interface ForecastSliderProps {
  hourOffset: number
  onChange: (hour: number) => void
  departureIso: string
}

export function ForecastSlider({ hourOffset, onChange, departureIso }: ForecastSliderProps) {
  const forecastTime = new Date(new Date(departureIso).getTime() + hourOffset * 3600 * 1000)

  return (
    <SectionCard
      title="Corridor weather heatmap"
      subtitle={`Forecast time: ${forecastTime.toLocaleString()} (${hourOffset}h from departure)`}
    >
      <Stack spacing={1.5} sx={{ px: { xs: 0, sm: 1 } }}>
        <Typography variant="body2" color="text.secondary">
          Drag to preview risk along the selected route corridor for the next 48 hours.
        </Typography>
        <Slider
          value={hourOffset}
          min={0}
          max={48}
          step={1}
          marks={[
            { value: 0, label: 'Now' },
            { value: 24, label: '24h' },
            { value: 48, label: '48h' },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `${v}h`}
          onChange={(_, value) => onChange(value as number)}
        />
      </Stack>
    </SectionCard>
  )
}
