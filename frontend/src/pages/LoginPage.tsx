import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Grid,
} from '@mui/material';
import TrainIcon from '@mui/icons-material/Train';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShieldIcon from '@mui/icons-material/Shield';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RadarIcon from '@mui/icons-material/Radar';
import DnsIcon from '@mui/icons-material/Dns';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const destinationByRole: Record<string, string> = {
  BOARD_EXEC: '/board',
  ZONAL_HEAD: '/zone',
  DIV_CONTROLLER: '/division',
  FIELD_SSE: '/field',
  STATION_MASTER: '/field',
};

const demoRoles = [
  {
    id: 'div_controller',
    name: 'Sr. DOM (Division)',
    tier: 'Tier 3 • Operational Core',
    desc: 'Joint block sanction, CP-SAT solve, What-If simulation',
    color: '#0f2b5c',
    recommended: true,
  },
  {
    id: 'station_master',
    name: 'Station Master (GZB)',
    tier: 'Tier 4 • Safety Memos',
    desc: 'Form T/351 Disconnection, track circuit isolation',
    color: '#d97706',
  },
  {
    id: 'field_sse',
    name: 'Field SSE (P-Way)',
    tier: 'Tier 4 • Execution',
    desc: 'Defect requisition, track fit certification',
    color: '#059669',
  },
  {
    id: 'zonal_gm',
    name: 'Zonal GM / PCOM',
    tier: 'Tier 2 • Strategic HQ',
    desc: 'Inter-divisional boundary sync, machine chaining',
    color: '#0284c7',
  },
  {
    id: 'board_exec',
    name: 'Railway Board (CRB)',
    tier: 'Tier 1 • National Apex',
    desc: 'Pan-India asset availability & corridor KPIs',
    color: '#7c3aed',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('div_controller');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customUser?: string) => {
    if (e) e.preventDefault();
    const userToLogin = customUser || username;
    setError('');
    setLoading(true);
    try {
      const user = await login(userToLogin, password);
      navigate(destinationByRole[user.tier_role] || '/division');
    } catch {
      setError('Authentication failed. Check credentials or select a demo role.');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (roleId: string) => {
    setUsername(roleId);
    setPassword('demo123');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f1f5f9',
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(15, 43, 92, 0.08) 0%, transparent 60%),
          radial-gradient(circle at 10% 80%, rgba(2, 132, 199, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(217, 119, 6, 0.04) 0%, transparent 50%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Telemetry Banner */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
          px: 2.5,
          py: 0.8,
          borderRadius: 20,
          bgcolor: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: '#059669',
            boxShadow: '0 0 8px #059669',
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            color: '#334155',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          CRIS-COA SECURE TELEMETRY • KAVACH PROTOCOL ARMED • NDLS-CNB CORRIDOR
        </Typography>
      </Box>

      {/* Main Enterprise Card */}
      <Card
        sx={{
          width: '100%',
          maxWidth: 640,
          bgcolor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Card Header Strip */}
        <Box
          sx={{
            p: 3,
            pb: 2.5,
            borderBottom: '2px solid #1e3a8a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#0f2b5c',
            color: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <TrainIcon sx={{ fontSize: 30, color: '#ffffff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                INDIAN RAILWAYS
              </Typography>
              <Typography variant="caption" sx={{ color: '#93c5fd', fontWeight: 700, letterSpacing: '0.05em' }}>
                AI BLOCK PLANNING & POSSESSION PLATFORM
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#ffffff !important' }} />}
            label="PS 26027"
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.72rem',
            }}
          />
        </Box>

        <CardContent sx={{ p: 3.5, bgcolor: '#ffffff' }}>
          {/* Role Quick Selector */}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: '#0f2b5c',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1.5,
            }}
          >
            Select Operational Persona (One-Click Switch)
          </Typography>

          <Grid container spacing={1.2} sx={{ mb: 3 }}>
            {demoRoles.map((role) => {
              const isSelected = username === role.id;
              return (
                <Grid item xs={12} sm={6} key={role.id}>
                  <Box
                    onClick={() => selectRole(role.id)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      bgcolor: isSelected ? '#eff6ff' : '#ffffff',
                      border: isSelected
                        ? '2px solid #0f2b5c'
                        : '1px solid #e2e8f0',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        border: isSelected ? '2px solid #0f2b5c' : '1px solid #94a3b8',
                        bgcolor: isSelected ? '#eff6ff' : '#f8fafc',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isSelected ? '#0f2b5c' : '#1e293b', fontSize: '0.85rem' }}>
                        {role.name}
                      </Typography>
                      {role.recommended && (
                        <Chip
                          label="DEMO HERO"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            bgcolor: '#d97706',
                            color: '#ffffff',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', color: role.color, fontWeight: 700, fontSize: '0.7rem' }}>
                      {role.tier}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', display: 'block', mt: 0.2 }}>
                      {role.desc}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* Form Credentials */}
          <form onSubmit={handleLogin}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Employee ID / User"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Security Credential"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
              sx={{
                mt: 2.5,
                py: 1.3,
                fontSize: '0.92rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                bgcolor: '#0f2b5c',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(15, 43, 92, 0.25)',
                '&:hover': {
                  bgcolor: '#1e3a8a',
                  boxShadow: '0 4px 12px rgba(15, 43, 92, 0.35)',
                },
              }}
            >
              {loading ? 'AUTHENTICATING ENCRYPTED SESSION…' : 'LAUNCH OPERATIONAL COCKPIT'}
            </Button>
          </form>
        </CardContent>

        {/* Status Footer */}
        <Box
          sx={{
            px: 3.5,
            py: 1.8,
            bgcolor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <DnsIcon sx={{ fontSize: 15, color: '#059669' }} />
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600 }}>
                PostgreSQL + Redis Connected
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <RadarIcon sx={{ fontSize: 15, color: '#0284c7' }} />
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600 }}>
                CP-SAT Solver Ready
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
            Password: <strong>demo123</strong>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
