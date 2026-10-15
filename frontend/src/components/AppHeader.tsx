import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { Box, Chip, Container, Stack, Typography } from '@mui/material'

export function AppHeader() {
  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 45%, #1e6fd9 100%)',
        color: '#fff',
        py: { xs: 3, md: 4 },
        mb: 3,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <LocalShippingOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#fff' }}>
                Spotter-AI
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: 15 }}>
                Weather-aware truck routing
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ color: 'rgba(255,255,255,0.88)', maxWidth: 720, lineHeight: 1.6 }}>
            Compare three HGV routes with checkpoint weather risk, travel time, and a corridor heatmap
            with a 0–48 hour forecast slider.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="3 route alternatives"
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
            />
            <Chip
              label="Load-aware risk"
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
            />
            <Chip
              label="Live weather sampling"
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
            />
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
