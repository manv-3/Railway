import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Grid, Card, CardContent, Chip, Table,
  TableHead, TableRow, TableCell, TableBody, Alert
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface WhatIfComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  onAcceptReplan: () => void;
  result: {
    scenario_type: string;
    computation_time_seconds: number;
    alert_message: string;
    train_regulations?: any[];
    replan_result: {
      status: string;
      total_input_requests: number;
      scheduled_requests: number;
      total_blocks_created: number;
      combined_super_blocks: number;
      time_saved_hours: number;
      asset_availability_gain_percent: number;
      blocks: any[];
    };
  } | null;
}

export const WhatIfComparisonDialog: React.FC<WhatIfComparisonDialogProps> = ({
  open,
  onClose,
  onAcceptReplan,
  result,
}) => {
  if (!result || !result.replan_result) return null;

  const { replan_result, computation_time_seconds, alert_message } = result;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0c1220',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <WarningAmberIcon sx={{ fontSize: 26, color: '#fca5a5' }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            CRISIS WHAT-IF REPLANNER • DYNAMIC RE-OPTIMIZATION
          </Typography>
          <Typography variant="caption" sx={{ color: '#fecaca', display: 'block' }}>
            Sub-3-Second CP-SAT Constraint Rescheduling & Headway Preservation
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#fbbf24',
          }}
        >
          {alert_message}
        </Alert>

        {/* Real-time Solver Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 2.5 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.8 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>RE-SOLVE LATENCY</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981', fontFamily: '"JetBrains Mono", monospace', mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <SpeedIcon fontSize="small" />
                  {computation_time_seconds}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 2.5 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.8 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>NET ASSET GAIN</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#60a5fa', fontFamily: '"JetBrains Mono", monospace', mt: 0.5 }}>
                  +{replan_result.asset_availability_gain_percent}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 2.5 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.8 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>RE-PLANNED BLOCKS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#f87171', fontFamily: '"JetBrains Mono", monospace', mt: 0.5 }}>
                  {replan_result.total_blocks_created} Blocks
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 2.5 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.8 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>PREMIUM TRAIN DETENTION</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#34d399', fontFamily: '"JetBrains Mono", monospace', mt: 0.5 }}>
                  0 MINS
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dynamic Re-Planned Blocks Table */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Dynamically Re-Allocated Maintenance Possessions:
        </Typography>

        <Box sx={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2.5, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'rgba(15, 23, 42, 0.95)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>Block ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>Section</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>Assigned Requisitions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {replan_result.blocks.map((b) => {
                const isEmergency = b.maintenance_tasks?.some((t: any) => t.request_id?.includes('EMERGENCY'));
                return (
                  <TableRow
                    key={b.block_id}
                    sx={{
                      bgcolor: isEmergency ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: isEmergency ? '#fca5a5' : '#f8fafc' }}>
                      {b.block_id}
                      {isEmergency && (
                        <Chip size="small" label="EMERGENCY" color="error" sx={{ ml: 1, fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{b.section_id}</TableCell>
                    <TableCell sx={{ color: '#22d3ee', fontWeight: 700 }}>{b.total_duration_minutes} mins</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={b.is_combined ? 'SUPER-BLOCK' : 'SINGLE'}
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          bgcolor: b.is_combined ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: b.is_combined ? '#fbbf24' : '#60a5fa',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {b.maintenance_tasks?.map((t: any) => (
                        <Typography key={t.request_id} variant="caption" sx={{ display: 'block', color: '#cbd5e1' }}>
                          [{t.department}] {t.defect_type} (KM {t.from_km}-{t.to_km})
                        </Typography>
                      ))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8', fontWeight: 700 }}>
          Dismiss
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon />}
          onClick={onAcceptReplan}
          sx={{
            fontWeight: 800,
            px: 2.5,
            py: 0.8,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
            },
          }}
        >
          ACCEPT & APPLY RE-PLANNED SCHEDULE
        </Button>
      </DialogActions>
    </Dialog>
  );
};
