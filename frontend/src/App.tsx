import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, ThemeProvider, createTheme, CssBaseline, LinearProgress } from '@mui/material';

import { Navbar } from './components/Navbar';
import { AuthenticatedUser, getAuthenticatedUser } from './services/api';

// Route-level code splitting via React.lazy (V3-06 - P1)
// Named-export pages use .then(m => ({default: m.X})) shim for React.lazy compatibility.
const DivisionalControlCockpit = React.lazy(() =>
  import('./pages/DivisionalControlCockpit').then((m) => ({ default: m.DivisionalControlCockpit }))
);
const FieldStationPortal = React.lazy(() =>
  import('./pages/FieldStationPortal').then((m) => ({ default: m.FieldStationPortal }))
);
const ZonalDashboard = React.lazy(() =>
  import('./pages/ZonalDashboard').then((m) => ({ default: m.ZonalDashboard }))
);
const RailwayBoardCockpit = React.lazy(() =>
  import('./pages/RailwayBoardCockpit').then((m) => ({ default: m.RailwayBoardCockpit }))
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);

const homeByRole: Record<AuthenticatedUser['tier_role'], string> = {
  BOARD_EXEC: '/board',
  ZONAL_HEAD: '/zone',
  DIV_CONTROLLER: '/division',
  FIELD_SSE: '/field',
  STATION_MASTER: '/field',
};

const ProtectedRoute: React.FC<{
  allowedRoles: AuthenticatedUser['tier_role'][];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const user = getAuthenticatedUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.tier_role)) return <Navigate to={homeByRole[user.tier_role]} replace />;
  return <>{children}</>;
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
    },
    secondary: {
      main: '#c2185b',
    },
    background: {
      default: '#f4f6f8',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isLoginPage && <Navbar />}
      <Box sx={{ flexGrow: 1 }}>{children}</Box>
    </Box>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          {/* Suspense shows a LinearProgress bar while lazy chunks load (V3-06) */}
          <Suspense fallback={<Box sx={{ width: '100%' }}><LinearProgress /></Box>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/division" element={<ProtectedRoute allowedRoles={['DIV_CONTROLLER', 'ZONAL_HEAD', 'BOARD_EXEC']}><DivisionalControlCockpit /></ProtectedRoute>} />
              <Route path="/field" element={<ProtectedRoute allowedRoles={['FIELD_SSE', 'STATION_MASTER', 'DIV_CONTROLLER', 'ZONAL_HEAD', 'BOARD_EXEC']}><FieldStationPortal /></ProtectedRoute>} />
              <Route path="/zone" element={<ProtectedRoute allowedRoles={['ZONAL_HEAD', 'BOARD_EXEC']}><ZonalDashboard /></ProtectedRoute>} />
              <Route path="/board" element={<ProtectedRoute allowedRoles={['BOARD_EXEC']}><RailwayBoardCockpit /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
