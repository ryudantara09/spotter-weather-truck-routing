import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useState } from 'react'

export interface TripFormValues {
  origin: string
  destination: string
  departureLocal: string
  loadWeightLb: number
  checkpointIntervalMiles: number
}

interface DashboardSidebarProps {
  loading: boolean
  error: string | null
  showHeatmap: boolean
  onShowHeatmapChange: (value: boolean) => void
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
    <Alert severity="error" variant="outlined">
      <AlertTitle>Could not analyze routes</AlertTitle>
      {message}
      {missingOrs ? (
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Add ORS_API_KEY to the repo root .env and restart Django.
        </Typography>
      ) : null}
    </Alert>
  )
}

export function DashboardSidebar({
  loading,
  error,
  showHeatmap,
  onShowHeatmapChange,
  onSubmit,
}: DashboardSidebarProps) {
  const [origin, setOrigin] = useState('Chicago, IL')
  const [destination, setDestination] = useState('Detroit, MI')
  const [departureLocal, setDepartureLocal] = useState(defaultDepartureLocal)
  const [loadWeightLb, setLoadWeightLb] = useState(32000)
  const [checkpointIntervalMiles, setCheckpointIntervalMiles] = useState(25)

  return (
    <Paper
      sx={{
        width: { xs: '100%', lg: 320 },
        flexShrink: 0,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxHeight: { lg: 'calc(100vh - 64px)' },
        overflowY: 'auto',
      }}
    >
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Trip details
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PlaceOutlinedIcon fontSize="small" sx={{ color: '#22c55e' }} />
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FlagOutlinedIcon fontSize="small" sx={{ color: '#ef4444' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="Departure date & time"
            type="datetime-local"
            value={departureLocal}
            onChange={(e) => setDepartureLocal(e.target.value)}
            fullWidth
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
          />
          <TextField
            label="Load weight (lb)"
            type="number"
            value={loadWeightLb}
            onChange={(e) => setLoadWeightLb(Number(e.target.value))}
            fullWidth
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
        </Stack>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
          Checkpoint spacing
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={checkpointIntervalMiles}
          onChange={(_, value) => value && setCheckpointIntervalMiles(value)}
        >
          {[10, 25, 50].map((mi) => (
            <ToggleButton key={mi} value={mi}>
              {mi} mi
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {error ? <ErrorAlert message={error} /> : null}

      <Button
        variant="contained"
        size="large"
        fullWidth
        endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
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
      >
        {loading ? 'Finding routes…' : 'Find safe routes'}
      </Button>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Map layers
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox checked={showHeatmap} onChange={(e) => onShowHeatmapChange(e.target.checked)} />
            }
            label="Weather heatmap (forecast)"
          />
          <FormControlLabel control={<Checkbox checked disabled />} label="Route checkpoints" />
        </FormGroup>
      </Box>
    </Paper>
  )
}
