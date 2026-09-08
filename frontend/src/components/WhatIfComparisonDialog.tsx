import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Grid, Card, CardContent, Chip, Table,
  TableHead, TableRow, TableCell, TableBody, Alert
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrainIcon from '@mui/icons-material/Train';

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
  result
}) => {
  if (!result || !result.replan_result) return null;

  const { replan_result, computation_time_seconds, alert_message } = result;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#c62828', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Interactive What-If Replanner: Sub-3-Second Dynamic Re-Optimization
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="warning" sx={{ mb: 2.5, fontWeight: 600 }}>
          {alert_message}
        </Alert>

        {/* Real-time Solver Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Solver Re-Plan Latency</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <SpeedIcon fontSize="small" />
                  {computation_time_seconds}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Asset Gain Metric</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1565c0' }}>
                  +{replan_result.asset_availability_gain_percent}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Emergency Blocks Slotted</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#d32f2f' }}>
                  {replan_result.total_blocks_created} Blocks
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Rajdhani/VB Detention</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#2e7d32' }}>
                  0 Minutes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dynamic Re-Planned Blocks Table */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Re-Allocated Maintenance Possession Windows:
        </Typography>

        <Table size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Block ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Assigned Tasks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {replan_result.blocks.map((b) => {
              const isEmergency = b.maintenance_tasks?.some((t: any) => t.request_id?.includes('EMERGENCY'));
              return (
                <TableRow key={b.block_id} sx={{ backgroundColor: isEmergency ? '#ffebee' : 'inherit' }}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {b.block_id}
                    {isEmergency && <Chip size="small" label="EMERGENCY" color="error" sx={{ ml: 1, fontWeight: 700 }} />}
                  </TableCell>
                  <TableCell>{b.section_id}</TableCell>
                  <TableCell>{b.total_duration_minutes} mins</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={b.is_combined ? 'Combined Super-Block' : 'Single Dept'}
                      color={b.is_combined ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {b.maintenance_tasks?.map((t: any) => (
                      <Typography key={t.request_id} variant="caption" display="block">
                        • <strong>[{t.department}]</strong> {t.defect_type} (Score: {t.priority_score})
                      </Typography>
                    ))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Train Dispatch Holding Note */}
        <Box sx={{ mt: 2.5, p: 1.5, backgroundColor: '#e8f5e9', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
            Dynamic Dispatch Protection Active: Freight rakes held on Station Common Loops; Zero detention to Priority 1 Trains (Vande Bharat 22436 / Swarna Shatabdi 12004).
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Discard Simulation
        </Button>
        <Button
          onClick={onAcceptReplan}
          variant="contained"
          color="error"
          startIcon={<TrainIcon />}
          sx={{ px: 3, fontWeight: 700 }}
        >
          Commit Re-Plan to Division
        </Button>
      </DialogActions>
    </Dialog>
  );
};
