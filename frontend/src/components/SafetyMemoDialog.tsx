import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  TextField, Box, Stepper, Step, StepLabel, Alert, Chip
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { MaintenanceBlock } from '../types';
import { sanctionBlock, issueDisconnectionMemo, issuePTW, issueTrackFit } from '../services/api';

interface SafetyDialogProps {
  block: MaintenanceBlock | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const SafetyMemoDialog: React.FC<SafetyDialogProps> = ({ block, open, onClose, onRefresh }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [memoNumber, setMemoNumber] = useState('DISC/DLI/2026/042');
  const [stationCode, setStationCode] = useState('GZB');
  const [ptwNumber, setPtwNumber] = useState('PTW/OHE/781');
  const [tpcName, setTpcName] = useState('R. K. Sharma (CPRC/TPC)');
  const [subsector, setSubsector] = useState('SS-GZB-04');
  const [cautionSpeed, setCautionSpeed] = useState(30);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!block) return null;

  const steps = [
    'Joint Sanction (Sr. DOM)',
    'Form T/351 Disconnection',
    'Traction 25kV PTW',
    'Track Fit & Caution Order'
  ];

  const handleSanction = async () => {
    setLoading(true);
    try {
      await sanctionBlock(block.block_id);
      setSuccessMsg('Block Jointly Sanctioned by Sr. DOM and Technical Branch controllers.');
      setActiveStep(1);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnection = async () => {
    setLoading(true);
    try {
      await issueDisconnectionMemo(block.block_id, memoNumber, stationCode);
      setSuccessMsg(`Form T/351 Disconnection Memo #${memoNumber} registered at ${stationCode}. Signals holding at Danger.`);
      setActiveStep(2);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePTW = async () => {
    setLoading(true);
    try {
      await issuePTW(block.block_id, ptwNumber, tpcName, subsector);
      setSuccessMsg(`Permit-to-Work #${ptwNumber} granted. 25kV OHE catenary de-energized in ${subsector}.`);
      setActiveStep(3);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackFit = async () => {
    setLoading(true);
    try {
      await issueTrackFit(block.block_id, cautionSpeed, 24);
      setSuccessMsg(`Track Fit Certified. Block cancelled & Caution Order ${cautionSpeed} km/h active.`);
      onRefresh();
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShieldIcon sx={{ fontSize: 24, color: '#38bdf8' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              STATUTORY G&SR 2026 SAFETY HANDSHAKE • {block.block_id}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
              Commissioner of Railway Safety (CRS) Compliant Digital Paper Trail
            </Typography>
          </Box>
        </Box>
        <Chip
          label="ED25519 SIGNED"
          size="small"
          sx={{
            bgcolor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontWeight: 800,
            fontSize: '0.68rem',
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: 3,
            '& .MuiStepLabel-label': { color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem' },
            '& .MuiStepLabel-label.Mui-active': { color: '#60a5fa', fontWeight: 800 },
            '& .MuiStepLabel-label.Mui-completed': { color: '#34d399', fontWeight: 800 },
            '& .MuiStepIcon-root': { color: 'rgba(255, 255, 255, 0.15)' },
            '& .MuiStepIcon-root.Mui-active': { color: '#3b82f6' },
            '& .MuiStepIcon-root.Mui-completed': { color: '#10b981' },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34d399' }}>
            {successMsg}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box sx={{ p: 2, bgcolor: 'rgba(15, 23, 42, 0.7)', borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <VerifiedUserIcon sx={{ color: '#60a5fa' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                Step 1: Divisional Joint Sanction
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Requires statutory dual concurrence from Operating (Sr. DOM) and Technical Branches (Track, Signal, OHE) before traffic suspension.
            </Typography>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.08)', borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <Typography variant="caption" sx={{ color: '#93c5fd', display: 'block' }}>
                Section: <strong>{block.section_id}</strong> • Duration: <strong>{block.duration_minutes || block.total_duration_minutes} mins</strong> • Bundled Work Items: <strong>{block.tasks?.length || 1}</strong>
              </Typography>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ p: 2, bgcolor: 'rgba(15, 23, 42, 0.7)', borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AssignmentTurnedInIcon sx={{ color: '#fbbf24' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                Step 2: Digital Form T/351 Disconnection Memo
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Formal statutory handover between Senior Section Engineer and Station Master. Locks all protecting signals at DANGER.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Disconnection Memo Number"
                fullWidth
                size="small"
                value={memoNumber}
                onChange={(e) => setMemoNumber(e.target.value)}
              />
              <TextField
                label="Station Code"
                size="small"
                value={stationCode}
                onChange={(e) => setStationCode(e.target.value)}
              />
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ p: 2, bgcolor: 'rgba(15, 23, 42, 0.7)', borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ElectricalServicesIcon sx={{ color: '#22d3ee' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                Step 3: Traction Power Permit-to-Work (PTW)
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Traction Power Controller (TPC) verifies that the 25kV OHE catenary is de-energized, isolated, and earthed.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                label="PTW Certificate Number"
                fullWidth
                size="small"
                value={ptwNumber}
                onChange={(e) => setPtwNumber(e.target.value)}
              />
              <TextField
                label="TPC Controller Name"
                fullWidth
                size="small"
                value={tpcName}
                onChange={(e) => setTpcName(e.target.value)}
              />
              <TextField
                label="OHE Elementary Subsector"
                fullWidth
                size="small"
                value={subsector}
                onChange={(e) => setSubsector(e.target.value)}
              />
            </Box>
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ p: 2, bgcolor: 'rgba(15, 23, 42, 0.7)', borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircleIcon sx={{ color: '#34d399' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                Step 4: Track Fit Handover & Caution Order (TSR)
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Senior Section Engineer certifies track stability. Automatically imposes Temporary Speed Restriction (TSR) for safety.
            </Typography>
            <TextField
              label="Temporary Speed Restriction (km/h)"
              type="number"
              fullWidth
              size="small"
              value={cautionSpeed}
              onChange={(e) => setCautionSpeed(Number(e.target.value))}
              helperText="Statutory caution order speed until newly packed ballast stabilizes."
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8', fontWeight: 700 }}>
          Close
        </Button>
        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleSanction}
            disabled={loading}
            sx={{ fontWeight: 800, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Sign Joint Sanction
          </Button>
        )}
        {activeStep === 1 && (
          <Button
            variant="contained"
            onClick={handleDisconnection}
            disabled={loading}
            sx={{ fontWeight: 800, bgcolor: '#f59e0b', color: '#000', '&:hover': { bgcolor: '#d97706' } }}
          >
            Sign Form T/351 Disconnection
          </Button>
        )}
        {activeStep === 2 && (
          <Button
            variant="contained"
            onClick={handlePTW}
            disabled={loading}
            sx={{ fontWeight: 800, bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}
          >
            Grant Traction PTW
          </Button>
        )}
        {activeStep === 3 && (
          <Button
            variant="contained"
            onClick={handleTrackFit}
            disabled={loading}
            sx={{ fontWeight: 800, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
          >
            Certify Track Fit & Restore Corridor
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
