import { createTheme, alpha } from '@mui/material/styles'

const navy = '#0f2744'
const accent = '#1e6fd9'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: accent, dark: '#1558b0', contrastText: '#ffffff' },
    secondary: { main: '#0d9488' },
    background: {
      default: '#eef2f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a2332',
      secondary: '#5c677a',
    },
    divider: alpha(navy, 0.12),
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `radial-gradient(${alpha(accent, 0.06)} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          paddingInline: 20,
        },
        contained: {
          background: `linear-gradient(135deg, ${accent} 0%, ${navy} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, #2580ef 0%, #163552 100%)`,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid',
          borderColor: alpha(navy, 0.1),
          backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#5c677a',
            backgroundColor: alpha(navy, 0.04),
          },
        },
      },
    },
  },
})
