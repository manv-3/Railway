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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0a0f1d',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          borderRadius: 3,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CompareArrowsIcon sx={{ fontSize: 30, color: '#fbbf24' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              OPTIMIZER BENCHMARK & COMPARATIVE ROI ANALYSIS
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>
              PS 26027 Algorithmic Rigor • Traditional Manual vs. Greedy Priority vs. AI Coordinated CP-SAT
            </Typography>
          </Box>
        </Box>
        <Button
          size="small"
          onClick={fetchBenchmark}
          disabled={loading}
          startIcon={<RefreshIcon />}
          sx={{
            color: '#fbbf24',
            bgcolor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 2,
            px: 1.5,
            fontWeight: 800,
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' },
          }}
        >
          Re-run Benchmark
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#070b14' }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ color: '#3b82f6', mb: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
              Evaluating 3-Way Algorithmic Benchmark...
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Simulating manual departmental isolation, running Greedy heuristic, and solving OR-Tools CP-SAT multi-department model.
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ my: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && data && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {/* Executive ROI Cards */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <TrendingUpIcon sx={{ color: '#34d399', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#34d399' }}>
                        AVAILABILITY GAIN
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981', fontFamily: '"JetBrains Mono", monospace' }}>
                      +{data.comparative_summary.asset_availability_gain_percent}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      vs. Traditional Manual Planning
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <AccessTimeIcon sx={{ color: '#22d3ee', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#22d3ee' }}>
                        TIME RECLAIMED
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#06b6d4', fontFamily: '"JetBrains Mono", monospace' }}>
                      {data.comparative_summary.track_possession_hours_saved}h
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Returned for train throughput
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <TrainIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#fbbf24' }}>
                        DETENTION AVOIDED
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#f59e0b', fontFamily: '"JetBrains Mono", monospace' }}>
                      -{data.comparative_summary.train_delay_reduction_percent}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {data.comparative_summary.train_delays_avoided_minutes} train-minutes saved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <SpeedIcon sx={{ color: '#c084fc', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#c084fc' }}>
                        SOLVE LATENCY
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#a855f7', fontFamily: '"JetBrains Mono", monospace' }}>
                      {(data.comparative_summary.overall_benchmark_time_ms / 1000).toFixed(2)}s
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {data.sample_size.total_maintenance_requests} requests & {data.sample_size.total_active_trains} trains
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Executive Statutory Takeaway */}
            <Alert
              severity="success"
              icon={<CheckCircleIcon sx={{ fontSize: 24, color: '#34d399' }} />}
              sx={{
                border: '1px solid rgba(16, 185, 129, 0.35)',
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: '#f8fafc',
                borderRadius: 2.5,
                '& .MuiAlert-message': { fontSize: '0.88rem', lineHeight: 1.5 },
              }}
            >
              <strong style={{ color: '#34d399' }}>Railway Board Statutory Takeaway:</strong> {data.executive_takeaway}
            </Alert>

            {/* Side-by-Side Algorithmic Comparison Cards */}
            <Grid container spacing={2.5}>
              {/* Algorithm 1: Manual */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', bgcolor: 'rgba(239, 68, 68, 0.06)', border: '1.5px solid rgba(239, 68, 68, 0.3)', borderRadius: 3 }}>
                  <Box sx={{ p: 1.8, borderBottom: '1px solid rgba(239, 68, 68, 0.2)', bgcolor: 'rgba(239, 68, 68, 0.1)' }}>
                    <Chip label="BASELINE 1" size="small" sx={{ bgcolor: '#ef4444', color: '#fff', fontWeight: 800, mb: 0.5, height: 20, fontSize: '0.65rem' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fca5a5' }}>
                      {data.algorithms.manual_baseline.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#f87171', display: 'block', fontSize: '0.72rem' }}>
                      {data.algorithms.manual_baseline.description}
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Total Track Hours:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#f87171' }}>
                          {data.algorithms.manual_baseline.total_track_hours} hrs
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Combined Super-Blocks:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                          0 (Isolated Demands)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Train Detention:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#f87171' }}>
                          {data.algorithms.manual_baseline.total_train_delay_minutes} mins
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Impacted Trains:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                          {data.algorithms.manual_baseline.impacted_trains_count} trains
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
                      <Typography variant="caption" sx={{ color: '#f87171', fontWeight: 700 }}>
                        ⚠️ G&SR: {data.algorithms.manual_baseline.gsr_compliance}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Algorithm 2: Greedy */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', bgcolor: 'rgba(245, 158, 11, 0.06)', border: '1.5px solid rgba(245, 158, 11, 0.3)', borderRadius: 3 }}>
                  <Box sx={{ p: 1.8, borderBottom: '1px solid rgba(245, 158, 11, 0.2)', bgcolor: 'rgba(245, 158, 11, 0.1)' }}>
                    <Chip label="BASELINE 2" size="small" sx={{ bgcolor: '#f59e0b', color: '#000', fontWeight: 800, mb: 0.5, height: 20, fontSize: '0.65rem' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fcd34d' }}>
                      {data.algorithms.greedy_heuristic.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#fbbf24', display: 'block', fontSize: '0.72rem' }}>
                      {data.algorithms.greedy_heuristic.description}
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Total Track Hours:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#fbbf24' }}>
                          {data.algorithms.greedy_heuristic.total_track_hours} hrs
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Combined Super-Blocks:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                          0 (No cross-dept bundling)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Train Detention:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#fbbf24' }}>
                          {data.algorithms.greedy_heuristic.total_train_delay_minutes} mins
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Impacted Trains:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                          {data.algorithms.greedy_heuristic.impacted_trains_count} trains
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
                      <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 700 }}>
                        ℹ️ G&SR: {data.algorithms.greedy_heuristic.gsr_compliance}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Algorithm 3: CP-SAT Winner */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '2px solid #10b981', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)', borderRadius: 3, position: 'relative' }}>
                  <Box sx={{ p: 1.8, borderBottom: '1px solid rgba(16, 185, 129, 0.2)', bgcolor: 'rgba(16, 185, 129, 0.15)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label="PROPOSED AI ENGINE" size="small" sx={{ bgcolor: '#10b981', color: '#fff', fontWeight: 900, mb: 0.5, height: 20, fontSize: '0.65rem' }} />
                      <Chip label="WINNER" size="small" sx={{ bgcolor: '#059669', color: '#fff', fontWeight: 900, height: 20, fontSize: '0.65rem' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#34d399' }}>
                      {data.algorithms.ai_cpsat_solver.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a7f3d0', display: 'block', fontSize: '0.72rem' }}>
                      {data.algorithms.ai_cpsat_solver.description}
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Total Track Hours:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#34d399' }}>
                          {data.algorithms.ai_cpsat_solver.total_track_hours} hrs ({data.comparative_summary.asset_availability_gain_percent}% saved)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Combined Super-Blocks:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#34d399' }}>
                          {data.algorithms.ai_cpsat_solver.combined_super_blocks} Coordinated Blocks
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Train Detention:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#34d399' }}>
                          {data.algorithms.ai_cpsat_solver.total_train_delay_minutes} mins (-{data.comparative_summary.train_delay_reduction_percent}%)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Impacted Trains:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#34d399' }}>
                          {data.algorithms.ai_cpsat_solver.impacted_trains_count} trains
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
                      <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 800 }}>
                        ✓ {data.algorithms.ai_cpsat_solver.gsr_compliance}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Detailed Side-by-Side Metric Matrix */}
            <Box sx={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2.5, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Operational Parameter Benchmark Matrix
                </Typography>
              </Box>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(10, 15, 26, 0.95)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>Performance Dimension</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#f87171' }}>Traditional Manual</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#fbbf24' }}>Greedy Priority</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#34d399' }}>AI CP-SAT Coordinated</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#60a5fa' }}>AI Improvement Delta</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#cbd5e1' }}>Total Corridor Possession Hours</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{data.algorithms.manual_baseline.total_track_hours} hrs</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{data.algorithms.greedy_heuristic.total_track_hours} hrs</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#34d399' }}>{data.algorithms.ai_cpsat_solver.total_track_hours} hrs</TableCell>
                    <TableCell>
                      <Chip label={`+${data.comparative_summary.asset_availability_gain_percent}% Availability`} size="small" color="success" sx={{ fontWeight: 800, height: 20, fontSize: '0.68rem' }} />
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#cbd5e1' }}>Total Train Delay Minutes</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{data.algorithms.manual_baseline.total_train_delay_minutes} min</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{data.algorithms.greedy_heuristic.total_train_delay_minutes} min</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#34d399' }}>{data.algorithms.ai_cpsat_solver.total_train_delay_minutes} min</TableCell>
                    <TableCell>
                      <Chip label={`-${data.comparative_summary.train_delay_reduction_percent}% Delay Avoided`} size="small" color="success" sx={{ fontWeight: 800, height: 20, fontSize: '0.68rem' }} />
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#cbd5e1' }}>Passenger Train Delays</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{data.algorithms.manual_baseline.passenger_train_delay_minutes} min</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{data.algorithms.greedy_heuristic.passenger_train_delay_minutes} min</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#34d399' }}>{data.algorithms.ai_cpsat_solver.passenger_train_delay_minutes} min</TableCell>
                    <TableCell sx={{ color: '#34d399', fontWeight: 800 }}>Preserves Timetable Precedence</TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#cbd5e1' }}>Multi-Department Bundling</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>0% (Siloed Demands)</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>0% (No Spatial Clustering)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#34d399' }}>{data.comparative_summary.super_block_bundling_efficiency}</TableCell>
                    <TableCell sx={{ color: '#34d399', fontWeight: 800 }}>Single Disconnection Memo</TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#cbd5e1' }}>Solver Execution Time</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>~3 to 5 hours (Manual)</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{(data.algorithms.greedy_heuristic.computation_time_seconds * 1000).toFixed(0)} ms</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#34d399' }}>{data.algorithms.ai_cpsat_solver.computation_time_seconds} s</TableCell>
                    <TableCell sx={{ color: '#38bdf8', fontWeight: 800 }}>Sub-3-Second Interactive</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#0a0f1d', borderTop: '1px solid rgba(255, 255, 255, 0.08)', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Certified for Indian Railways Smart India Hackathon (SIH PS 26027/26028)
        </Typography>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#3b82f6', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#2563eb' } }}>
          Close Benchmark View
        </Button>
      </DialogActions>
    </Dialog>
  );
};
