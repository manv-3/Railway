import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import TrainIcon from '@mui/icons-material/Train';
import SmartToyIcon from '@mui/icons-material/SmartToy';
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
  const visibleNavItems = navItems.filter((item) => user && allowedPaths[user.tier_role].includes(item.path));

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a237e' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrainIcon sx={{ fontSize: 32, color: '#ffab00' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              Indian Railways AI Block Planning Platform
            </Typography>
            <Typography variant="caption" sx={{ color: '#b0bec5' }}>
              PS 26027 / 26028 • Delhi - Kanpur High-Density Corridor
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {visibleNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                variant={isActive ? 'contained' : 'text'}
                color={isActive ? 'warning' : 'inherit'}
                sx={{
                  textTransform: 'none',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  borderRadius: 2,
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<SmartToyIcon sx={{ color: '#ffab00' }} />}
            onClick={() => window.dispatchEvent(new CustomEvent('open-rail-copilot'))}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderRadius: 2,
              border: '1px solid rgba(255,171,0,0.4)',
              backgroundColor: 'rgba(255,171,0,0.08)',
              '&:hover': {
                backgroundColor: 'rgba(255,171,0,0.18)',
              },
            }}
          >
            Rail Sarthi AI
          </Button>
          <Chip
            label={`${user?.username || 'Session'} • LIVE`}
            color="success"
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Button color="inherit" size="small" onClick={() => { logout(); navigate('/login'); }}>
            Sign out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
