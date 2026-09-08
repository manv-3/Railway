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
    if (score >= 80) return '#d32f2f'; // Red
    if (score >= 65) return '#ed6c02'; // Orange
    return '#2e7d32'; // Green
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#0d47a1', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
        <PsychologyIcon />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          XGBoost + SHAP Failure Risk Explainability Card
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Requisition Ticket: <strong>{data.request_id || 'N/A'}</strong> • Department: <strong>{data.department || 'TMS'}</strong>
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
            Defect: {data.defect_type || 'Track Defect'}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Risk Score Metric Gauge */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card variant="outlined" sx={{ borderColor: getRiskColor(risk_score), borderWidth: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Predicted Failure Risk Score
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: getRiskColor(risk_score) }}>
                  {risk_score} / 100
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={risk_score}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mt: 1,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': { backgroundColor: getRiskColor(risk_score) }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Primary Degradation Driver
                </Typography>
                <Chip
                  icon={<WarningAmberIcon />}
                  label={primary_risk_driver}
                  color="warning"
                  sx={{ mt: 1, fontWeight: 700, fontSize: '0.95rem', py: 2 }}
                />
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                  Base Population Risk: {base_risk} • Model: XGBoost Regressor (R² = 0.98)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* SHAP Attribution Waterfall Breakdown */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChartIcon color="primary" />
          Quantitative Feature Attributions (SHAP Values)
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Object.entries(shap_attributions).map(([feature, val]) => {
            const isPositive = val >= 0;
            return (
              <Box key={feature} sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {feature}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${isPositive ? '+' : ''}${val}%`}
                    sx={{
                      fontWeight: 800,
                      backgroundColor: isPositive ? '#ffebee' : '#e8f5e9',
                      color: isPositive ? '#c62828' : '#2e7d32'
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(Math.abs(val) * 4, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: isPositive ? '#e53935' : '#43a047'
                    }
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ px: 3, fontWeight: 700 }}>
          Close Explanation
        </Button>
      </DialogActions>
    </Dialog>
  );
};
