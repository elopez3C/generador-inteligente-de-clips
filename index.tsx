import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { theme } from './theme';

// Lazy-load agentation so its module-level CSS side effects
// only execute in dev mode and don't block initial render
const AgentationDev = process.env.NODE_ENV !== 'production'
  ? lazy(() => import('agentation').then(m => ({ default: m.Agentation })))
  : null;

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
    {AgentationDev && (
      <Suspense fallback={null}>
        <AgentationDev />
      </Suspense>
    )}
  </React.StrictMode>
);
