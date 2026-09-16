import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import TrainIcon from '@mui/icons-material/Train';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getOptimizerBenchmark, OptimizerBenchmarkResponse } from '../services/api';

interface OptimizerBenchmarkModalProps {
  open: boolean;
  onClose: () => void;
  divisionId?: string;
}

export const OptimizerBenchmarkModal: React.FC<OptimizerBenchmarkModalProps> = ({
  open,
  onClose,
  divisionId = 'DIV_DLI',
}) => {
  const [data, setData] = useState<OptimizerBenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOptimizerBenchmark(divisionId);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to execute comparative optimizer benchmark.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBenchmark();
    }
  }, [open, divisionId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: '#1a237e',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.8,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CompareArrowsIcon sx={{ fontSize: 30, color: '#ffab00' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Optimizer Benchmark & Comparative ROI Analysis
            </Typography>
            <Typography variant="caption" sx={{ color: '#b0bec5', fontSize: '0.75rem' }}>
              PS 26027 Algorithmic Rigor • Traditional Manual vs. Greedy Priority vs. AI Coordinated CP-SAT
            </Typography>
          </Box>
        </Box>
        <Button
          color="inherit"
          size="small"
          onClick={fetchBenchmark}
          disabled={loading}
          startIcon={<RefreshIcon />}
          sx={{ textTransform: 'none' }}
        >
          Re-run Benchmark
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ color: '#1a237e', mb: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Evaluating 3-Way Algorithmic Benchmark...
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Simulating manual departmental isolation, running Greedy heuristic, and solving OR-Tools CP-SAT multi-department possession model.
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && data && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {/* Executive ROI Cards */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Card sx={{ borderLeft: '5px solid #16a34a', boxShadow: 2, height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <TrendingUpIcon sx={{ color: '#16a34a' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                        TRACK ASSET AVAILABILITY
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a' }}>
                      +{data.comparative_summary.asset_availability_gain_percent}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600 }}>
                      vs. Traditional Manual Planning
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Card sx={{ borderLeft: '5px solid #0284c7', boxShadow: 2, height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <AccessTimeIcon sx={{ color: '#0284c7' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                        TRACK TIME RETURNED
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284c7' }}>
                      {data.comparative_summary.track_possession_hours_saved}h
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600 }}>
                      Reclaimed for train throughput
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Card sx={{ borderLeft: '5px solid #ea580c', boxShadow: 2, height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <TrainIcon sx={{ color: '#ea580c' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                        TRAIN DETENTION AVOIDED
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#ea580c' }}>
                      -{data.comparative_summary.train_delay_reduction_percent}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 600 }}>
                      {data.comparative_summary.train_delays_avoided_minutes} train-minutes saved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Card sx={{ borderLeft: '5px solid #7c3aed', boxShadow: 2, height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <SpeedIcon sx={{ color: '#7c3aed' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                        BENCHMARK SOLVE LATENCY
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#7c3aed' }}>
                      {(data.comparative_summary.overall_benchmark_time_ms / 1000).toFixed(2)}s
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6d28d9', fontWeight: 600 }}>
                      {data.sample_size.total_maintenance_requests} requests & {data.sample_size.total_active_trains} trains
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Executive Statutory Takeaway */}
            <Alert
              severity="success"
              icon={<CheckCircleIcon sx={{ fontSize: 24 }} />}
              sx={{
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                '& .MuiAlert-message': { fontSize: '0.88rem', lineHeight: 1.5 },
              }}
            >
              <strong>Railway Board Statutory Takeaway:</strong> {data.executive_takeaway}
            </Alert>

            {/* Side-by-Side Algorithmic Comparison Cards */}
            <Grid container spacing={2.5}>
              {/* Algorithm 1: Manual */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '2px solid #fca5a5', boxShadow: 1 }}>
                  <Box sx={{ backgroundColor: '#fee2e2', p: 1.5, borderBottom: '1px solid #fecaca' }}>
                    <Chip label="BASELINE 1" size="small" sx={{ bgcolor: '#ef4444', color: '#fff', fontWeight: 700, mb: 0.5 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#991b1b' }}>
                      {data.algorithms.manual_baseline.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#7f1d1d', display: 'block', fontSize: '0.72rem' }}>
                      {data.algorithms.manual_baseline.description}
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Total Track Hours:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#b91c1c' }}>
                          {data.algorithms.manual_baseline.total_track_hours} hrs
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Combined Super-Blocks:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          0 (Isolated Demands)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Train Detention:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#b91c1c' }}>
                          {data.algorithms.manual_baseline.total_train_delay_minutes} mins
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Impacted Trains:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {data.algorithms.manual_baseline.impacted_trains_count} trains
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600 }}>
                        ⚠️ G&SR: {data.algorithms.manual_baseline.gsr_compliance}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Algorithm 2: Greedy */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '2px solid #fed7aa', boxShadow: 1 }}>
                  <Box sx={{ backgroundColor: '#ffedd5', p: 1.5, borderBottom: '1px solid #fed7aa' }}>
                    <Chip label="BASELINE 2" size="small" sx={{ bgcolor: '#f97316', color: '#fff', fontWeight: 700, mb: 0.5 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#9a3412' }}>
                      {data.algorithms.greedy_heuristic.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#7c2d12', display: 'block', fontSize: '0.72rem' }}>
                      {data.algorithms.greedy_heuristic.description}
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Total Track Hours:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ea580c' }}>
                          {data.algorithms.greedy_heuristic.total_track_hours} hrs
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Combined Super-Blocks:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          0 (No cross-dept bundling)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Train Detention:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ea580c' }}>
                          {data.algorithms.greedy_heuristic.total_train_delay_minutes} mins
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Impacted Trains:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {data.algorithms.greedy_heuristic.impacted_trains_count} trains
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 600 }}>
                        ℹ️ G&SR: {data.algorithms.greedy_heuristic.gsr_compliance}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Algorithm 3: CP-SAT Winner */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '2px solid #86efac', boxShadow: 3, position: 'relative' }}>
                  <Box sx={{ backgroundColor: '#dcfce7', p: 1.5, borderBottom: '1px solid #bbf7d0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label="PROPOSED AI ENGINE" size="small" sx={{ bgcolor: '#16a34a', color: '#fff', fontWeight: 800, mb: 0.5 }} />
                      <Chip label="WINNER" size="small" color="success" variant="outlined" sx={{ fontWeight: 800, height: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#166534' }}>
                      {data.algorithms.ai_cpsat_solver.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#14532d', display: 'block', fontSize: '0.72rem' }}>
                      {data.algorithms.ai_cpsat_solver.description}
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Total Track Hours:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803d' }}>
                          {data.algorithms.ai_cpsat_solver.total_track_hours} hrs ({data.comparative_summary.asset_availability_gain_percent}% saved)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Combined Super-Blocks:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803d' }}>
                          {data.algorithms.ai_cpsat_solver.combined_super_blocks} Coordinated Blocks
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Train Detention:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803d' }}>
                          {data.algorithms.ai_cpsat_solver.total_train_delay_minutes} mins (-{data.comparative_summary.train_delay_reduction_percent}%)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Impacted Trains:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803d' }}>
                          {data.algorithms.ai_cpsat_solver.impacted_trains_count} trains
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700 }}>
                        ✓ {data.algorithms.ai_cpsat_solver.gsr_compliance}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Detailed Side-by-Side Metric Matrix */}
            <Card sx={{ boxShadow: 1 }}>
              <Box sx={{ p: 2, backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  Operational Parameter Benchmark Matrix
                </Typography>
              </Box>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Performance Dimension</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#dc2626' }}>Traditional Manual</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#ea580c' }}>Greedy Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>AI CP-SAT Coordinated</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>AI Improvement Delta</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Total Corridor Possession Hours</TableCell>
                    <TableCell>{data.algorithms.manual_baseline.total_track_hours} hrs</TableCell>
                    <TableCell>{data.algorithms.greedy_heuristic.total_track_hours} hrs</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{data.algorithms.ai_cpsat_solver.total_track_hours} hrs</TableCell>
                    <TableCell>
                      <Chip label={`+${data.comparative_summary.asset_availability_gain_percent}% Availability`} size="small" color="success" sx={{ fontWeight: 700 }} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Total Train Delay Minutes</TableCell>
                    <TableCell>{data.algorithms.manual_baseline.total_train_delay_minutes} min</TableCell>
                    <TableCell>{data.algorithms.greedy_heuristic.total_train_delay_minutes} min</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{data.algorithms.ai_cpsat_solver.total_train_delay_minutes} min</TableCell>
                    <TableCell>
                      <Chip label={`-${data.comparative_summary.train_delay_reduction_percent}% Delay Avoided`} size="small" color="success" sx={{ fontWeight: 700 }} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Passenger Train Delays</TableCell>
                    <TableCell>{data.algorithms.manual_baseline.passenger_train_delay_minutes} min</TableCell>
                    <TableCell>{data.algorithms.greedy_heuristic.passenger_train_delay_minutes} min</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{data.algorithms.ai_cpsat_solver.passenger_train_delay_minutes} min</TableCell>
                    <TableCell sx={{ color: '#16a34a', fontWeight: 700 }}>Preserves Timetable Precedence</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Multi-Department Bundling</TableCell>
                    <TableCell>0% (Siloed Demands)</TableCell>
                    <TableCell>0% (No Spatial Clustering)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{data.comparative_summary.super_block_bundling_efficiency}</TableCell>
                    <TableCell sx={{ color: '#16a34a', fontWeight: 700 }}>Single Disconnection Memo</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Solver Execution Time</TableCell>
                    <TableCell>~3 to 5 hours (Manual)</TableCell>
                    <TableCell>{(data.algorithms.greedy_heuristic.computation_time_seconds * 1000).toFixed(0)} ms</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{data.algorithms.ai_cpsat_solver.computation_time_seconds} s</TableCell>
                    <TableCell sx={{ color: '#0284c7', fontWeight: 700 }}>Sub-3-Second Interactive</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#f1f5f9', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Certified for Indian Railways Smart India Hackathon (SIH PS 26027/26028)
        </Typography>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#1a237e', textTransform: 'none' }}>
          Close Benchmark View
        </Button>
      </DialogActions>
    </Dialog>
  );
};
