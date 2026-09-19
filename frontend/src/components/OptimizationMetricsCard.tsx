import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import SpeedIcon from '@mui/icons-material/Speed';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { OptimizationMetrics } from '../types';

interface MetricsProps {
  metrics: OptimizationMetrics | null;
}

export const OptimizationMetricsCard: React.FC<MetricsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <Card
        sx={{
          bgcolor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: 3,
          p: 1.5,
          mb: 3,
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#f59e0b',
                boxShadow: '0 0 10px #f59e0b',
                animation: 'pulse-live 2s infinite',
              }}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                CP-SAT OPTIMIZATION ENGINE STANDBY
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Click <strong>"Run CP-SAT Optimizer"</strong> above to bundle TMS (Track) + SMMS (Signal) + TDMS (OHE) requisitions into Coordinated Super-Blocks.
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<PlayArrowIcon sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
            label="READY TO SOLVE"
            size="small"
            sx={{
              bgcolor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontWeight: 800,
              fontSize: '0.72rem',
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        bgcolor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        borderRadius: 3,
        mb: 3,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#10b981',
                boxShadow: '0 0 10px #10b981',
              }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
              DAILY OPTIMIZATION TELEMETRY (DELHI DIVISION)
            </Typography>
          </Box>
          <Chip
            icon={<SpeedIcon sx={{ fontSize: '14px !important', color: '#34d399 !important' }} />}
            label={`CP-SAT SOLVE TIME: ${metrics.wall_time_seconds}s`}
            size="small"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 800,
              fontSize: '0.72rem',
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
            }}
          />
        </Box>

        <Grid container spacing={2}>
          {/* Card 1: Asset Availability */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#34d399', letterSpacing: '0.05em' }}>
                  AVAILABILITY GAIN
                </Typography>
                <TrendingUpIcon sx={{ fontSize: 18, color: '#34d399' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#10b981',
                  fontFamily: '"JetBrains Mono", monospace',
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                }}
              >
                +{metrics.asset_availability_gain_percent}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', mt: 0.5 }}>
                Net track capacity unlocked
              </Typography>
            </Box>
          </Grid>

          {/* Card 2: Downtime Saved */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#22d3ee', letterSpacing: '0.05em' }}>
                  LINE DOWNTIME SAVED
                </Typography>
                <AccessTimeIcon sx={{ fontSize: 18, color: '#22d3ee' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#06b6d4',
                  fontFamily: '"JetBrains Mono", monospace',
                  textShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                }}
              >
                {metrics.time_saved_hours}h
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', mt: 0.5 }}>
                Was {metrics.separate_maintenance_hours}h ➔ Now {metrics.optimized_block_hours}h
              </Typography>
            </Box>
          </Grid>

          {/* Card 3: Combined Super-Blocks */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em' }}>
                  COMBINED SUPER-BLOCKS
                </Typography>
                <MergeTypeIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#f59e0b',
                  fontFamily: '"JetBrains Mono", monospace',
                  textShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
                }}
              >
                {metrics.combined_super_blocks}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', mt: 0.5 }}>
                Bundled TMS + SMMS + TDMS
              </Typography>
            </Box>
          </Grid>

          {/* Card 4: Scheduled Requisitions */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#c084fc', letterSpacing: '0.05em' }}>
                  REQUISITIONS SERVICED
                </Typography>
                <TaskAltIcon sx={{ fontSize: 18, color: '#c084fc' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#a855f7',
                  fontFamily: '"JetBrains Mono", monospace',
                  textShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                }}
              >
                {metrics.scheduled_requests} / {metrics.total_input_requests}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', mt: 0.5 }}>
                Integrated into {metrics.total_blocks_created} unified traffic windows
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
