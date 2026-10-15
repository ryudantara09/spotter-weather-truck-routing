import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { SectionCard } from './SectionCard'

export interface TripFormValues {
  origin: string
  destination: string
  departureLocal: string
  loadWeightLb: number
  checkpointIntervalMiles: number
}

interface TripFormProps {
  loading: boolean
  error: string | null
  onSubmit: (values: TripFormValues) => void
}

function defaultDepartureLocal(): string {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`
}

function ErrorAlert({ message }: { message: string }) {
  const missingOrs = message.toLowerCase().includes('ors_api_key')

  return (
    <Alert severity="error" variant="outlined" sx={{ bgcolor: 'rgba(211, 47, 47, 0.04)' }}>
      <AlertTitle>Could not analyze routes</AlertTitle>
      {message}
      {missingOrs ? (
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Create a <strong>.env</strong> file in the project root with{' '}
          <strong>ORS_API_KEY</strong> (from openrouteservice.org), then restart the Django server.
        </Typography>
      ) : null}
    </Alert>
  )
}

export function TripForm({ loading, error, onSubmit }: TripFormProps) {
  const [origin, setOrigin] = useState('Chicago, IL')
  const [destination, setDestination] = useState('Detroit, MI')
  const [departureLocal, setDepartureLocal] = useState(defaultDepartureLocal)
  const [loadWeightLb, setLoadWeightLb] = useState(32000)
  const [checkpointIntervalMiles, setCheckpointIntervalMiles] = useState(25)

  return (
    <SectionCard
      title="Trip details"
      subtitle="Enter origin, destination, departure time, and load weight to generate three route options."
    >
      <Stack spacing={2.5}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <TextField
            label="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            fullWidth
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PlaceOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            fullWidth
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FlagOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' },
            gap: 2,
          }}
        >
          <TextField
            label="Departure (local time)"
            type="datetime-local"
            value={departureLocal}
            onChange={(e) => setDepartureLocal(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonthOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            fullWidth
            required
          />
          <TextField
            label="Load weight (lb)"
            type="number"
            value={loadWeightLb}
            onChange={(e) => setLoadWeightLb(Number(e.target.value))}
            fullWidth
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ScaleOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="Weather sample interval (mi)"
            type="number"
            value={checkpointIntervalMiles}
            onChange={(e) => setCheckpointIntervalMiles(Number(e.target.value))}
            fullWidth
            helperText="Checkpoints every 10, 25, or 50 mi"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <RouteOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {error ? <ErrorAlert message={error} /> : null}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />
            }
            disabled={loading}
            onClick={() =>
              onSubmit({
                origin,
                destination,
                departureLocal,
                loadWeightLb,
                checkpointIntervalMiles,
              })
            }
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          >
            {loading ? 'Analyzing…' : 'Analyze routes'}
          </Button>
        </Box>
      </Stack>
    </SectionCard>
  )
}
