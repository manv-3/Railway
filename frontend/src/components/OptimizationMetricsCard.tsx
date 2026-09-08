import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import SpeedIcon from '@mui/icons-material/Speed';
import { OptimizationMetrics } from '../types';

interface MetricsProps {
  metrics: OptimizationMetrics | null;
}

export const OptimizationMetricsCard: React.FC<MetricsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <Card sx={{ bgcolor: '#f5f5f5', border: '1px dashed #bdbdbd', p: 1 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Run optimization or load daily schedule to inspect line availability and bundling metrics.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: '#ffffff', boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e' }}>
            Daily Optimization Performance (Delhi Division)
          </Typography>
          <Chip
            icon={<SpeedIcon />}
            label={`CP-SAT Wall Time: ${metrics.wall_time_seconds}s`}
            color="success"
            variant="outlined"
            size="small"
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2, borderLeft: '4px solid #2e7d32' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: '#2e7d32' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1b5e20' }}>
                  ASSET AVAILABILITY GAIN
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#2e7d32', mt: 0.5 }}>
                +{metrics.asset_availability_gain_percent}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Additional operational line capacity
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '4px solid #1565c0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ color: '#1565c0' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#0d47a1' }}>
                  LINE DOWNTIME SAVED
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1565c0', mt: 0.5 }}>
                {metrics.time_saved_hours} hrs
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Was {metrics.separate_maintenance_hours}h ➔ Now {metrics.optimized_block_hours}h
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, bgcolor: '#fff3e0', borderRadius: 2, borderLeft: '4px solid #e65100' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MergeTypeIcon sx={{ color: '#e65100' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#bf360c' }}>
                  COMBINED SUPER-BLOCKS
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#e65100', mt: 0.5 }}>
                {metrics.combined_super_blocks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Co-located TMS + SMMS + TDMS
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, bgcolor: '#f3e5f5', borderRadius: 2, borderLeft: '4px solid #7b1fa2' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#4a148c' }}>
                SCHEDULED REQUISITIONS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#7b1fa2', mt: 0.5 }}>
                {metrics.scheduled_requests} / {metrics.total_input_requests}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Into {metrics.total_blocks_created} unified traffic blocks
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
