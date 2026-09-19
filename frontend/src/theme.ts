import { createTheme } from '@mui/material/styles';

export const commandTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f2b5c', // Indian Railways Imperial Navy
      light: '#1e3a8a',
      dark: '#081a38',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb', // Vivid Operational Blue
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    success: {
      main: '#059669', // Forest Emerald
      light: '#10b981',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706', // Operational Amber
      light: '#f59e0b',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626', // Signal Red / Emergency
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Crisp Light Canvas
      paper: '#ffffff',   // Pure White Surface
    },
    text: {
      primary: '#0f172a',   // Deep Slate
      secondary: '#475569', // Muted Slate
      disabled: '#94a3b8',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em', color: '#0f172a' },
    h2: { fontWeight: 800, letterSpacing: '-0.025em', color: '#0f172a' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' },
    h5: { fontWeight: 700, letterSpacing: '-0.015em', color: '#0f172a' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em', color: '#0f172a' },
    subtitle1: { fontWeight: 600, color: '#1e293b' },
    subtitle2: { fontWeight: 600, color: '#334155' },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          color: '#0f172a',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
          borderRadius: 10,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 700,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0f2b5c',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1e3a8a',
          },
        },
        containedSecondary: {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1d4ed8',
          },
        },
        containedWarning: {
          backgroundColor: '#d97706',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#b45309',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 6,
        },
        outlined: {
          border: '1px solid #cbd5e1',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e2e8f0',
          padding: '10px 14px',
          color: '#1e293b',
        },
        head: {
          fontWeight: 700,
          color: '#334155',
          backgroundColor: '#f1f5f9',
          textTransform: 'uppercase',
          fontSize: '0.73rem',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0f2b5c',
            borderWidth: '2px',
          },
        },
      },
    },
  },
});
