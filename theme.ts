import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
      light: '#EADDFF',
      dark: '#4F378B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
      light: '#E8DEF8',
      dark: '#4A4458',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#B3261E',
      light: '#F9DEDC',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#7D5700',
      light: '#FFF8E7',
    },
    success: {
      main: '#386A20',
      light: '#EDFCD4',
    },
    background: {
      default: '#FFFBFE',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#49454F',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 },
    h4: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3 },
    h5: { fontWeight: 700, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.8125rem' },
    overline: {
      fontWeight: 700,
      fontSize: '0.6875rem',
      letterSpacing: '0.1em',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: { fontSize: '0.75rem', color: '#49454F' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#FFFBFE' },
        '*::-webkit-scrollbar': { width: 6, height: 6 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.15)',
          borderRadius: 3,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 100,
          fontWeight: 600,
          padding: '8px 20px',
          letterSpacing: '0.01em',
        },
        sizeLarge: { padding: '12px 28px', fontSize: '0.9375rem' },
        sizeSmall: { padding: '4px 12px', fontSize: '0.8125rem' },
        contained: {
          '&:hover': {
            boxShadow: '0 1px 4px rgba(103,80,164,0.25)',
          },
        },
        outlined: {
          borderColor: 'rgba(0,0,0,0.2)',
          '&:hover': { borderColor: 'rgba(0,0,0,0.35)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 28, padding: 4 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1.125rem' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '28px 0 0 28px',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
        },
        extended: { paddingLeft: 20, paddingRight: 20 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 100,
          height: 6,
          backgroundColor: 'rgba(0,0,0,0.08)',
        },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 12 },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: '100px !important',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          padding: '6px 16px',
          border: '1px solid rgba(0,0,0,0.15) !important',
          '&.Mui-selected': {
            backgroundColor: '#6750A4',
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#4F378B' },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          gap: 4,
          flexWrap: 'wrap',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: { borderRadius: 2, height: 3 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 44,
        },
      },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          border: 'none',
          '&:before': { display: 'none' },
          backgroundColor: 'transparent',
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { padding: 0, minHeight: 'unset' },
        content: { margin: '8px 0' },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: { padding: '8px 0 0 0' },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: '#6750A4' },
        thumb: { width: 20, height: 20 },
        rail: { borderRadius: 100, height: 6, backgroundColor: 'rgba(0,0,0,0.1)' },
        track: { borderRadius: 100, height: 6 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 500 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});