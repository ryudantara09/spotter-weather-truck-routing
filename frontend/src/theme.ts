import { alpha, createTheme } from '@mui/material/styles'

const bgDefault = '#0a0f1a'
const bgPaper = '#121a2b'
const accent = '#3b82f6'
const border = alpha('#94a3b8', 0.16)

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: accent, light: '#60a5fa', dark: '#2563eb', contrastText: '#fff' },
    secondary: { main: '#14b8a6' },
    success: { main: '#22c55e' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    background: {
      default: bgDefault,
      paper: bgPaper,
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: border,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 600, color: '#cbd5e1' },
    body2: { color: '#94a3b8' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: bgDefault,
          backgroundImage: `radial-gradient(${alpha(accent, 0.08)} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: bgPaper,
          border: `1px solid ${border}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10 },
        contained: {
          background: `linear-gradient(135deg, ${accent} 0%, #2563eb 100%)`,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#0f172a', 0.6),
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#0f172a', 0.6),
          border: `1px solid ${border}`,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          color: '#94a3b8',
          border: 'none',
          '&.Mui-selected': {
            backgroundColor: alpha(accent, 0.25),
            color: '#fff',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, minHeight: 44 },
      },
    },
  },
})

export const dashboardPanelSx = {
  bgcolor: bgPaper,
  border: `1px solid ${border}`,
  borderRadius: 2,
}

export const ROUTE_LINE_COLORS = ['#3b82f6', '#f97316', '#a855f7']
