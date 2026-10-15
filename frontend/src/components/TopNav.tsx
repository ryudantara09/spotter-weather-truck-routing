import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { AppBar, Avatar, Box, Button, Stack, Toolbar, Typography } from '@mui/material'

const NAV_ITEMS = ['Plan Route', 'Saved Routes', 'Weather', 'Settings'] as const

export function TopNav() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(10, 15, 26, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: { xs: 56, md: 64 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexGrow: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
            }}
          >
            <LocalShippingOutlinedIcon color="primary" fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
              Spotter-AI
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Safer routes. Smoother deliveries.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
          {NAV_ITEMS.map((item, index) => (
            <Button
              key={item}
              color="inherit"
              disabled={index > 0}
              sx={{
                opacity: index === 0 ? 1 : 0.45,
                borderBottom: index === 0 ? '2px solid' : '2px solid transparent',
                borderColor: index === 0 ? 'primary.main' : 'transparent',
                borderRadius: 0,
                px: 1.5,
              }}
            >
              {item}
            </Button>
          ))}
        </Stack>

        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>RY</Avatar>
      </Toolbar>
    </AppBar>
  )
}
