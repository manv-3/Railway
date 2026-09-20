import React, { useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Chip, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TrainIcon from '@mui/icons-material/Train';
import ShieldIcon from '@mui/icons-material/Shield';
import HubIcon from '@mui/icons-material/Hub';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TimelineIcon from '@mui/icons-material/Timeline';
import DnsIcon from '@mui/icons-material/Dns';
import SecurityIcon from '@mui/icons-material/Security';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import { login } from '../services/api';
import { TrainDetailDialog } from '../components/TrainDetailDialog';
import { CorridorTrain } from '../types';
import { CORRIDOR_TRAINS } from '../data/corridorTrains';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<CorridorTrain | null>(null);
  const [trainDialogOpen, setTrainDialogOpen] = useState<boolean>(false);
  const [trainFilter, setTrainFilter] = useState<'ALL' | 'DOWN' | 'UP' | 'DELAYED'>('ALL');

  const handleLaunchRole = async (roleUsername: string, targetPath: string) => {
    setLoadingRole(roleUsername);
    try {
      await login(roleUsername, 'demo123');
      navigate(targetPath);
    } catch (e) {
      console.error('Auto login error:', e);
      navigate(targetPath);
    } finally {
      setLoadingRole(null);
    }
  };

  const operationalTiers = [
    {
      tierNumber: 'Tier 3',
      title: 'Divisional Operations Workstation',
      roleTitle: 'Senior DOM & Section Controllers',
      roleId: 'div_controller',
      route: '/division',
      badge: 'TACTICAL CORE • FEATURED',
      badgeColor: '#059669',
      borderColor: '#0f2b5c',
      featured: true,
      description:
        'Real-time tactical corridor dispatch console. Includes the 24-Hour COA Time-Distance String Chart, Google OR-Tools CP-SAT auto-planner, train regulation conflict matrix, and heavy track machine staging.',
      keyCapabilities: [
        '24H COA String Chart (NDLS ⇄ CNB KM 0-440)',
        'CP-SAT Multi-Department Combinatorial Solver',
        'Train Headway & Conflict Regulation Matrix',
        'Heavy Track Machine Roster (BCM, CSM, Tower Wagon)',
      ],
    },
    {
      tierNumber: 'Tier 4',
      title: 'Field Station & SSE Safety Terminal',
      roleTitle: 'Station Master (GZB) & SSE (P-Way / S&T / OHE)',
      roleId: 'station_master',
      route: '/field',
      badge: 'STATUTORY SAFETY',
      badgeColor: '#d97706',
      borderColor: '#d97706',
      featured: false,
      description:
        'Field-level safety handshakes and maintenance ticket intake. Features offline GPS-tagged defect logging, digital Form T/351 Disconnection Notice, and Track Fit certification with Caution Orders (TSR).',
      keyCapabilities: [
        'Form T/351 Disconnection & Signal Danger Lock',
        '25kV OHE Power Isolation Permit-to-Work (PTW)',
        'Track Fit Certification & TSR Caution Orders',
        'Offline GPS-Tagged Requisition Intake',
      ],
    },
    {
      tierNumber: 'Tier 2',
      title: 'Zonal Headquarters Command',
      roleTitle: 'General Manager (GM) & PCOM (Operations)',
      roleId: 'zonal_gm',
      route: '/zone',
      badge: 'INTER-DIVISIONAL HQ',
      badgeColor: '#0284c7',
      borderColor: '#0284c7',
      featured: false,
      description:
        'Cross-divisional corridor synchronization across Northern Railway (Delhi Division) and North Central Railway (Prayagraj Division) at Aligarh Junction, alongside Track Machine Organization (TMO) fleet routing.',
      keyCapabilities: [
        'NR ⇄ NCR Inter-Divisional Stagger Synchronization',
        'Aligarh (ALJN) Handover Velocity Optimization',
        'TMO Machine Fleet Chaining & Diesel Minimization',
        'Corridor-Wide Speed & Punctuality Indexing',
      ],
    },
    {
      tierNumber: 'Tier 1',
      title: 'Railway Board National Strategic Apex',
      roleTitle: 'Chairman & CEO, Railway Board / Member Operations',
      roleId: 'board_exec',
      route: '/board',
      badge: 'APEX EXECUTIVE',
      badgeColor: '#7c3aed',
      borderColor: '#7c3aed',
      featured: false,
      description:
        'National-level infrastructure oversight and strategic investment analytics. Tracks Pan-India asset availability gains, corridor bottleneck relief, and Commissioner of Railway Safety (CRS) audit trails.',
      keyCapabilities: [
        'National Corridor Asset Availability KPI (+32.4%)',
        'Capex vs Maintenance ROI Strategic Allocation',
        'Pan-India Golden Corridor Bottleneck Heatmaps',
        'Judicial Audit & Statutory Compliance Index',
      ],
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', color: '#0f172a' }}>
      {/* ── 1. OFFICIAL GOVERNMENT EMBLAZONED TOP BAR ── */}
      <Box
        sx={{
          bgcolor: '#081a38',
          borderBottom: '2px solid #0f2b5c',
          color: '#ffffff',
          py: 0.6,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            maxWidth: 1400,
            mx: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', color: '#e2e8f0', fontSize: '0.72rem' }}>
              GOVERNMENT OF INDIA • MINISTRY OF RAILWAYS
            </Typography>
            <Box sx={{ height: 12, width: '1px', bgcolor: 'rgba(255,255,255,0.3)' }} />
            <Typography variant="caption" sx={{ color: '#93c5fd', fontSize: '0.72rem', fontWeight: 600 }}>
              Centre for Railway Information Systems (CRIS)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#34d399', boxShadow: '0 0 8px #34d399' }} />
              <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', color: '#6ee7b7', fontWeight: 700 }}>
                CRIS TELEMETRY ACTIVE
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>|</Typography>
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
              SIH Problem Statement 26027
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── 2. PORTAL HEADER BAR ── */}
      <Box
        sx={{
          bgcolor: '#0f2b5c',
          borderBottom: '1px solid #1e3a8a',
          boxShadow: '0 2px 8px rgba(15, 43, 92, 0.25)',
          py: 1.5,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: 1400,
            mx: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <TrainIcon sx={{ fontSize: 28, color: '#ffffff' }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff', lineHeight: 1.1 }}>
                  INDIAN RAILWAYS
                </Typography>
                <Chip
                  label="NATIONAL COMMAND PORTAL"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#93c5fd', fontSize: '0.74rem' }}>
                AI-Driven Integrated Maintenance Block Planning & Real-Time Corridor Optimization
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LockOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/login')}
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.35)',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderRadius: 1.5,
                px: 1.8,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', borderColor: '#ffffff' },
              }}
            >
              Portal Login
            </Button>
            <Button
              variant="contained"
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              onClick={() => handleLaunchRole('div_controller', '/division')}
              sx={{
                bgcolor: '#ffffff',
                color: '#0f2b5c',
                fontWeight: 800,
                fontSize: '0.78rem',
                borderRadius: 1.5,
                px: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              Launch Workstation
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── 3. HERO COMMAND SECTION ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          py: { xs: 5, md: 7 },
          backgroundImage: `
            radial-gradient(circle at 80% 20%, rgba(15, 43, 92, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(2, 132, 199, 0.04) 0%, transparent 40%)
          `,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} lg={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                  icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#0f2b5c !important' }} />}
                  label="G&SR 2026 Statutory Compliance Ready"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    bgcolor: '#eff6ff',
                    color: '#0f2b5c',
                    border: '1px solid #bfdbfe',
                  }}
                />
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                  label="Golden Corridor NDLS ⇄ CNB (440 KM)"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    bgcolor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                  }}
                />
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: '#0f2b5c',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  mb: 2.5,
                }}
              >
                Zero-Detention Maintenance Block Planning with Combinatorial AI
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#475569',
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  mb: 3.5,
                  maxWidth: 680,
                }}
              >
                Eliminating siloed railway line disruptions through a unified multi-branch platform. Bundles Track (TMS), Signal (SMMS), and Traction (TDMS) works into synchronized super-blocks, audited in real-time under Indian Railways General & Subsidiary Rules.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => handleLaunchRole('div_controller', '/division')}
                  sx={{
                    py: 1.4,
                    px: 3,
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    bgcolor: '#0f2b5c',
                    color: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(15, 43, 92, 0.3)',
                    '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 6px 18px rgba(15, 43, 92, 0.4)' },
                  }}
                >
                  Enter Divisional Cockpit (Tier 3)
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<TimelineIcon />}
                  onClick={() => handleLaunchRole('div_controller', '/division')}
                  sx={{
                    py: 1.4,
                    px: 3,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderColor: '#cbd5e1',
                    color: '#0f2b5c',
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
                  }}
                >
                  View 24H COA String Chart
                </Button>
              </Box>
            </Grid>

            {/* Right: Key National Telemetry Box */}
            <Grid item xs={12} lg={5}>
              <Box
                sx={{
                  bgcolor: '#ffffff',
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    CORRIDOR TELEMETRY AT A GLANCE
                  </Typography>
                  <Chip label="LIVE" size="small" sx={{ height: 20, bgcolor: '#ecfdf5', color: '#059669', fontWeight: 800 }} />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                        TRACK AVAILABILITY
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', my: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>
                        +32.4%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                        21.1 hours/day recovered
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                        PASSENGER DELAYS
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f2b5c', my: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>
                        0 Mins
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                        VB & Rajdhani Paths Cleared
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                        BUNDLING FACTOR
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#d97706', my: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>
                        3.8x
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                        Requisitions per Block
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                        KAVACH TCAS L2
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284c7', my: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>
                        100%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                        Automatic Red Envelope
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2.5, p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                  <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, display: 'block' }}>
                    ⚡ Real-Time Optimization Engine
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.72rem', display: 'block', mt: 0.3 }}>
                    Google OR-Tools CP-SAT solver continuously computes conflict-free headway gaps on Delhi-Kanpur high-density quadruple tracks.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── 3.5. INTERACTIVE LIVE CORRIDOR TRAFFIC RADAR ── */}
      <Box sx={{ py: 5, px: { xs: 2, md: 4 }, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <DirectionsTransitIcon sx={{ fontSize: 24, color: '#0f2b5c' }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                  Live Golden Corridor Traffic Radar
                </Typography>
                <Chip
                  label="CLICK TRAIN TO INSPECT"
                  size="small"
                  sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 800, fontSize: '0.65rem' }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
                Real-time train running status, delay hours, priority precedence, and divisional station stop timings along NDLS ⇄ CNB (440 KM)
              </Typography>
            </Box>

            {/* Filter Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={trainFilter === 'ALL' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTrainFilter('ALL')}
                sx={{
                  bgcolor: trainFilter === 'ALL' ? '#0f2b5c' : '#ffffff',
                  color: trainFilter === 'ALL' ? '#ffffff' : '#0f2b5c',
                  borderColor: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                All Fleet ({CORRIDOR_TRAINS.length})
              </Button>
              <Button
                variant={trainFilter === 'DOWN' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTrainFilter('DOWN')}
                sx={{
                  bgcolor: trainFilter === 'DOWN' ? '#0284c7' : '#ffffff',
                  color: trainFilter === 'DOWN' ? '#ffffff' : '#0284c7',
                  borderColor: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                Down Line (NDLS → CNB)
              </Button>
              <Button
                variant={trainFilter === 'UP' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTrainFilter('UP')}
                sx={{
                  bgcolor: trainFilter === 'UP' ? '#7c3aed' : '#ffffff',
                  color: trainFilter === 'UP' ? '#ffffff' : '#7c3aed',
                  borderColor: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                Up Line (CNB → NDLS)
              </Button>
              <Button
                variant={trainFilter === 'DELAYED' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTrainFilter('DELAYED')}
                sx={{
                  bgcolor: trainFilter === 'DELAYED' ? '#dc2626' : '#ffffff',
                  color: trainFilter === 'DELAYED' ? '#ffffff' : '#dc2626',
                  borderColor: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                Delayed Running
              </Button>
            </Box>
          </Box>

          {/* Grid of Interactive Trains */}
          <Grid container spacing={2.5}>
            {CORRIDOR_TRAINS.filter((t) => {
              if (trainFilter === 'DOWN') return t.direction === 'DOWN';
              if (trainFilter === 'UP') return t.direction === 'UP';
              if (trainFilter === 'DELAYED') return t.delay_minutes > 0;
              return true;
            }).map((train) => {
              const isLate = train.delay_minutes > 0;
              const isMajor = train.delay_minutes >= 30;
              const delayCol = isLate ? (isMajor ? '#dc2626' : '#d97706') : '#059669';
              const delayBg = isLate ? (isMajor ? '#fef2f2' : '#fffbeb') : '#ecfdf5';

              return (
                <Grid item xs={12} sm={6} lg={3} key={train.train_number}>
                  <Card
                    onClick={() => {
                      setSelectedTrain(train);
                      setTrainDialogOpen(true);
                    }}
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 2.5,
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        border: '1.5px solid #0f2b5c',
                        boxShadow: '0 10px 24px rgba(15, 43, 92, 0.12)',
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f2b5c', fontSize: '1.05rem' }}>
                            {train.train_number}
                          </Typography>
                          <Chip
                            label={train.train_category}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              bgcolor: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                        </Box>
                        <Chip
                          label={train.direction === 'DOWN' ? 'DN LINE' : 'UP LINE'}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            bgcolor: train.direction === 'DOWN' ? '#eff6ff' : '#f5f3ff',
                            color: train.direction === 'DOWN' ? '#1e40af' : '#6d28d9',
                            border: `1px solid ${train.direction === 'DOWN' ? '#bfdbfe' : '#ddd6fe'}`,
                          }}
                        />
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2, mb: 0.5 }}>
                        {train.train_name}
                      </Typography>

                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                        {train.source_station} → {train.destination_station}
                      </Typography>

                      <Box sx={{ p: 1, bgcolor: delayBg, borderRadius: 1.5, border: `1px solid ${delayCol}30`, mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: delayCol, display: 'block', fontSize: '0.72rem' }}>
                          ● {train.delay_display}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.68rem', display: 'block', mt: 0.2 }}>
                          {train.delay_cause || 'On schedule.'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Speed: <strong>{train.current_location.speed_kmh} km/h</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 800 }}>
                          KM {train.current_location.current_km}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1.2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                          {train.station_stops.length} Division Stops
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0f2b5c', fontWeight: 800, fontSize: '0.72rem' }}>
                          Inspect Route & Stops →
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* ── 4. 4-TIER HIERARCHICAL OPERATIONAL LAUNCHPADS ── */}
      <Box sx={{ py: 6, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Chip
              label="4-TIER HIERARCHY"
              size="small"
              sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', mb: 1.5 }}
            />
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f2b5c', letterSpacing: '-0.01em' }}>
              Select Operational Workspace
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 640, mx: 'auto', mt: 1 }}>
              Each tier provides role-tailored tooling designed for specific administrative, tactical, and field responsibilities across Indian Railways.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {operationalTiers.map((tier) => (
              <Grid item xs={12} md={6} key={tier.tierNumber}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    border: tier.featured ? '2px solid #0f2b5c' : '1px solid #cbd5e1',
                    bgcolor: '#ffffff',
                    boxShadow: tier.featured
                      ? '0 10px 25px -5px rgba(15, 43, 92, 0.15)'
                      : '0 2px 6px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {tier.featured && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: '#0f2b5c',
                        color: '#ffffff',
                        px: 2,
                        py: 0.4,
                        borderBottomLeftRadius: 10,
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                      }}
                    >
                      CORE WORKSTATION
                    </Box>
                  )}

                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Chip
                        label={tier.tierNumber}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          bgcolor: `${tier.badgeColor}15`,
                          color: tier.badgeColor,
                          border: `1px solid ${tier.badgeColor}35`,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                        {tier.roleTitle}
                      </Typography>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f2b5c', mb: 1 }}>
                      {tier.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.55, mb: 2.5 }}>
                      {tier.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
                      KEY CAPABILITIES:
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      {tier.keyCapabilities.map((cap, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 15, color: '#059669' }} />
                          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.75rem' }}>
                            {cap}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={tier.featured ? 'contained' : 'outlined'}
                      endIcon={<ArrowForwardIcon />}
                      disabled={loadingRole === tier.roleId}
                      onClick={() => handleLaunchRole(tier.roleId, tier.route)}
                      sx={{
                        py: 1.2,
                        borderRadius: 2,
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        bgcolor: tier.featured ? '#0f2b5c' : '#ffffff',
                        color: tier.featured ? '#ffffff' : '#0f2b5c',
                        borderColor: '#0f2b5c',
                        '&:hover': {
                          bgcolor: tier.featured ? '#1e3a8a' : '#f1f5f9',
                          borderColor: '#0f2b5c',
                        },
                      }}
                    >
                      {loadingRole === tier.roleId ? 'INITIALIZING ENCRYPTED WORKSPACE…' : `Open ${tier.title} →`}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── 5. AI ENGINE & ARCHITECTURAL OVERVIEW ── */}
      <Box sx={{ bgcolor: '#ffffff', py: 6, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
              Comprehensive 4-Layer Engineering Intelligence
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              How the platform solves combinatorial line maintenance under strict railway safety regulations
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0', height: '100%' }}>
                <PsychologyIcon sx={{ fontSize: 28, color: '#0284c7', mb: 1.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c', mb: 0.8 }}>
                  1. ML Risk Scoring
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block' }}>
                  XGBoost & SHAP explainability engine evaluates gross million tonnes (GMT), defect severity, and asset age to compute dynamic priority ranks (0-100).
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0', height: '100%' }}>
                <HubIcon sx={{ fontSize: 28, color: '#059669', mb: 1.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c', mb: 0.8 }}>
                  2. Combinatorial CP-SAT
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block' }}>
                  Google OR-Tools Constraint Programming engine packages spatial track, signal, and OHE requisitions into optimal unified super-blocks.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0', height: '100%' }}>
                <SecurityIcon sx={{ fontSize: 28, color: '#d97706', mb: 1.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c', mb: 0.8 }}>
                  3. G&SR 2026 Protocol
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block' }}>
                  Statutory safety handshakes enforce Form T/351 Disconnection, TPC 25kV Traction Power Permit-to-Work, and Caution Order speed limits.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0', height: '100%' }}>
                <DnsIcon sx={{ fontSize: 28, color: '#7c3aed', mb: 1.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c', mb: 0.8 }}>
                  4. Live PubSub Event Bus
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block' }}>
                  High-throughput Redis & WebSocket broker synchronizes block sanctions, emergency rail fracture replans, and track fit certs across all 4 tiers in &lt;100ms.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── 6. OFFICIAL FOOTER ── */}
      <Box sx={{ bgcolor: '#081a38', color: '#cbd5e1', py: 4, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff' }}>
                INDIAN RAILWAYS • NATIONAL AI BLOCK PLANNING PLATFORM
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.3 }}>
                Centre for Railway Information Systems (CRIS) • Smart India Hackathon PS 26027
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button size="small" onClick={() => navigate('/division')} sx={{ color: '#93c5fd', textTransform: 'none' }}>
                Divisional Cockpit
              </Button>
              <Button size="small" onClick={() => navigate('/field')} sx={{ color: '#93c5fd', textTransform: 'none' }}>
                Field Portal
              </Button>
              <Button size="small" onClick={() => navigate('/zone')} sx={{ color: '#93c5fd', textTransform: 'none' }}>
                Zonal HQ
              </Button>
              <Button size="small" onClick={() => navigate('/board')} sx={{ color: '#93c5fd', textTransform: 'none' }}>
                Railway Board
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── 7. TRAIN DETAIL TACTICAL INSPECTOR DIALOG ── */}
      <TrainDetailDialog
        open={trainDialogOpen}
        train={selectedTrain}
        onClose={() => setTrainDialogOpen(false)}
        onSelectTrain={(t) => setSelectedTrain(t)}
      />
    </Box>
  );
};

export default LandingPage;
