import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#212121',
      light: '#F5F5F5',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#455a64',
      light: '#ECEFF1',
      dark: '#37474F',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#d32f2f',
      light: '#FFEBEE',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#ED6C02',
      light: '#FFF3E0',
    },
    success: {
      main: '#2e7d32',
      light: '#E8F5E9',
    },
    background: {
      default: '#FDFDFD',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
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
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    caption: { fontSize: '0.75rem', color: '#757575' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#FDFDFD' },
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
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600,
          padding: '8px 20px',
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
        },
        sizeLarge: { padding: '12px 28px', fontSize: '0.8125rem' },
        sizeSmall: { padding: '4px 12px', fontSize: '0.6875rem' },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          },
        },
        outlined: {
          borderColor: 'rgba(0,0,0,0.23)',
          '&:hover': { borderColor: 'rgba(0,0,0,0.4)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: '50%' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 6px rgba(0,0,0,0.03), 0 1px 4px rgba(0,0,0,0.015)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 4, padding: 4 },
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
          borderRadius: 0,
          boxShadow: '-4px 0 48px rgba(0,0,0,0.02)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: '50%',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 3px 16px rgba(0,0,0,0.035)',
        },
        extended: { borderRadius: 24, paddingLeft: 20, paddingRight: 20 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 4,
          backgroundColor: 'rgba(0,0,0,0.08)',
        },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 4, backgroundColor: '#FFFFFF' },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px !important',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          padding: '6px 16px',
          border: '1px solid rgba(0,0,0,0.15) !important',
          '&.Mui-selected': {
            backgroundColor: '#212121',
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#000000' },
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
        root: { color: '#212121' },
        thumb: { width: 12, height: 12 },
        rail: { borderRadius: 4, height: 4, backgroundColor: 'rgba(0,0,0,0.1)' },
        track: { borderRadius: 4, height: 4 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 4, fontWeight: 500 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});
