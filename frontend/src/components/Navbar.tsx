import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import TrainIcon from '@mui/icons-material/Train';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LogoutIcon from '@mui/icons-material/Logout';
import ShieldIcon from '@mui/icons-material/Shield';
import { getAuthenticatedUser, logout } from '../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthenticatedUser();

  const navItems = [
    { label: 'Tier 3: Divisional Control', path: '/division', role: 'Sr. DOM / Tactical Core' },
    { label: 'Tier 4: Field & Station', path: '/field', role: 'SSE & Station Master' },
    { label: 'Tier 2: Zonal HQ', path: '/zone', role: 'GM & PCOM' },
    { label: 'Tier 1: Railway Board', path: '/board', role: 'Apex National KPI' },
  ];

  const allowedPaths: Record<string, string[]> = {
    BOARD_EXEC: ['/division', '/field', '/zone', '/board'],
    ZONAL_HEAD: ['/division', '/field', '/zone'],
    DIV_CONTROLLER: ['/division', '/field'],
    FIELD_SSE: ['/field'],
    STATION_MASTER: ['/field'],
  };
  const visibleNavItems = navItems.filter((item) => user && allowedPaths[user.tier_role]?.includes(item.path));

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: '#0f2b5c',
        borderBottom: '2px solid #1e3a8a',
        boxShadow: '0 2px 8px rgba(15, 43, 92, 0.25)',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1.5, md: 3 }, py: 0.5 }}>
        {/* Left: Branding & Corridor Identification */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <TrainIcon sx={{ fontSize: 24, color: '#ffffff' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff', lineHeight: 1.2 }}>
                INDIAN RAILWAYS
              </Typography>
              <Chip
                label="AI BLOCK PLANNING"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  bgcolor: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#93c5fd', fontSize: '0.72rem', display: 'block' }}>
              Golden Corridor • New Delhi (NDLS) → Kanpur (CNB)
            </Typography>
          </Box>
        </Box>

        {/* Center: Live Telemetry Gauges & Tier Tabs */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 2.5 }}>
          {/* Live Corridor Status Indicator */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.8,
              py: 0.5,
              borderRadius: 20,
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#34d399',
                  boxShadow: '0 0 8px #34d399',
                  animation: 'pulse-live 1.8s infinite',
                }}
              />
              <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700 }}>
                WS LIVE
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>|</Typography>

            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#e2e8f0' }}>
              TRAINS: <span style={{ color: '#93c5fd', fontWeight: 700 }}>58 ACTIVE</span>
            </Typography>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>|</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ShieldIcon sx={{ fontSize: 13, color: '#fbbf24' }} />
              <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#fde047', fontWeight: 700 }}>
                KAVACH TCAS L2
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: 0.6 }}>
            {visibleNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  size="small"
                  sx={{
                    px: 1.6,
                    py: 0.6,
                    borderRadius: 1.5,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#0f2b5c' : '#cbd5e1',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                    '&:hover': {
                      bgcolor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Right: Copilot Trigger & User Identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<SmartToyIcon sx={{ color: '#fbbf24' }} />}
            onClick={() => window.dispatchEvent(new CustomEvent('open-rail-copilot'))}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.82rem',
              borderRadius: 2,
              px: 1.8,
              py: 0.65,
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
              color: '#fbbf24',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
              },
            }}
          >
            Rail Sarthi AI
          </Button>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pl: 1,
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Chip
              label={user?.username || 'Session'}
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            />
            <Button
              size="small"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              sx={{
                minWidth: 'auto',
                p: 0.8,
                borderRadius: 1.5,
                color: '#94a3b8',
                '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' },
              }}
              title="Sign Out"
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
            </Button>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
