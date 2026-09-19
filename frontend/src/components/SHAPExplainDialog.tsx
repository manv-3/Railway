import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, LinearProgress, Chip, Divider, Grid, Card, CardContent
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BarChartIcon from '@mui/icons-material/BarChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface SHAPExplainDialogProps {
  open: boolean;
  onClose: () => void;
  data: {
    request_id?: string;
    department?: string;
    defect_type?: string;
    explanation?: {
      risk_score: number;
      base_risk: number;
      shap_attributions: Record<string, number>;
      primary_risk_driver: string;
    };
  } | null;
}

export const SHAPExplainDialog: React.FC<SHAPExplainDialogProps> = ({ open, onClose, data }) => {
  if (!data || !data.explanation) return null;

  const { risk_score, base_risk, shap_attributions, primary_risk_driver } = data.explanation;

  const getRiskColor = (score: number) => {
    if (score >= 80) return '#ef4444'; // Red
    if (score >= 65) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0c1220',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #581c87 0%, #0f172a 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <PsychologyIcon sx={{ fontSize: 26, color: '#c084fc' }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            XGBOOST + SHAP RISK EXPLAINABILITY ENGINE
          </Typography>
          <Typography variant="caption" sx={{ color: '#e9d5ff', display: 'block' }}>
            Transparent Feature Attribution & Failure Risk Factor Decomposition
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
            Requisition Ticket: <strong style={{ color: '#60a5fa' }}>{data.request_id || 'N/A'}</strong> • Department: <strong style={{ color: '#fbbf24' }}>{data.department || 'TMS'}</strong>
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
            Defect: {data.defect_type || 'Track Defect'}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Risk Score Metric Gauge */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: `1.5px solid ${getRiskColor(risk_score)}`, borderRadius: 2.5 }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                  PREDICTED FAILURE RISK SCORE
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: getRiskColor(risk_score), fontFamily: '"JetBrains Mono", monospace', mt: 0.5 }}>
                  {risk_score} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 100</span>
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={risk_score}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    '& .MuiLinearProgress-bar': { bgcolor: getRiskColor(risk_score) },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2.5 }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                  PRIMARY DEGRADATION DRIVER
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    icon={<WarningAmberIcon sx={{ color: '#fbbf24 !important' }} />}
                    label={primary_risk_driver}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      py: 1.8,
                      bgcolor: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#fbbf24',
                    }}
                  />
                </Box>
                <Typography variant="caption" display="block" sx={{ color: '#64748b', mt: 1.2 }}>
                  Baseline Cohort Risk: {base_risk} • Model: XGBoost Regressor (R² = 0.98)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* SHAP Attribution Waterfall Breakdown */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          <BarChartIcon sx={{ color: '#c084fc' }} />
          Quantitative Feature Attributions (SHAP Values)
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          {Object.entries(shap_attributions).map(([feature, val]) => {
            const isPositive = val >= 0;
            return (
              <Box
                key={feature}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#cbd5e1' }}>
                    {feature}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${isPositive ? '+' : ''}${val}%`}
                    sx={{
                      fontWeight: 800,
                      fontFamily: '"JetBrains Mono", monospace',
                      bgcolor: isPositive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: isPositive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                      color: isPositive ? '#f87171' : '#34d399',
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(Math.abs(val) * 4, 100)}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: isPositive ? '#ef4444' : '#10b981',
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#3b82f6', fontWeight: 800, px: 3, '&:hover': { bgcolor: '#2563eb' } }}>
          Close Explanation
        </Button>
      </DialogActions>
    </Dialog>
  );
};
