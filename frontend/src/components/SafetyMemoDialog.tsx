import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  TextField, Box, Stepper, Step, StepLabel, Alert, Divider
} from '@mui/material';
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

  const steps = ['Joint Sanction', 'Disconnection Memo', 'Traction PTW (OHE)', 'Track Fit & Caution Order'];

  const handleSanction = async () => {
    setLoading(true);
    try {
      await sanctionBlock(block.block_id);
      setSuccessMsg('Block Jointly Sanctioned by Sr. DOM and Technical Branches.');
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
      setSuccessMsg(`Disconnection Memo #${memoNumber} registered at ${stationCode}.`);
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
      setSuccessMsg(`Permit to Work #${ptwNumber} issued. OHE De-energized.`);
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
      await issueTrackFit(block.block_id, cautionSpeed, 2);
      setSuccessMsg(`Track Fit Certified. Caution Order: ${cautionSpeed} km/h TSR active.`);
      onRefresh();
      setTimeout(onClose, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1a237e', color: '#fff' }}>
        Statutory Block Execution Handshake • {block.block_id}
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Step 1: Divisional Joint Sanction
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Requires joint approval from Operating (Sr. DOM) and Engineering/S&T/Electrical heads before traffic suspension.
            </Typography>
            <Alert severity="info">
              Block Section: <b>{block.section_id}</b> | Duration: <b>{block.duration_minutes} mins</b> | Tasks: <b>{block.tasks?.length || 1}</b>
            </Alert>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Step 2: Digital Disconnection Memo (S&T / P-Way)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Legal formal handover between Senior Section Engineer and Station Master.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Disconnection Memo Number"
                fullWidth
                value={memoNumber}
                onChange={(e) => setMemoNumber(e.target.value)}
              />
              <TextField
                label="Station Code"
                value={stationCode}
                onChange={(e) => setStationCode(e.target.value)}
              />
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Step 3: Traction Power Permit-to-Work (PTW)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Traction Power Controller verifies that 25kV OHE catenary is isolated and earthed in subsector.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="PTW Certificate Number"
                fullWidth
                value={ptwNumber}
                onChange={(e) => setPtwNumber(e.target.value)}
              />
              <TextField
                label="TPC Controller Name"
                fullWidth
                value={tpcName}
                onChange={(e) => setTpcName(e.target.value)}
              />
              <TextField
                label="OHE Elementary Subsector"
                fullWidth
                value={subsector}
                onChange={(e) => setSubsector(e.target.value)}
              />
            </Box>
          </Box>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Step 4: Track Fit Handover & Caution Order (TSR)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Certifies track is safe for traffic, automatically imposing Temporary Speed Restriction.
            </Typography>
            <TextField
              label="Temporary Speed Restriction (km/h)"
              type="number"
              fullWidth
              value={cautionSpeed}
              onChange={(e) => setCautionSpeed(Number(e.target.value))}
              helperText="Standard caution order speed for newly tamped/repaired track"
            />
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        {activeStep === 0 && (
          <Button variant="contained" color="primary" onClick={handleSanction} disabled={loading}>
            Sign Joint Sanction
          </Button>
        )}
        {activeStep === 1 && (
          <Button variant="contained" color="warning" onClick={handleDisconnection} disabled={loading}>
            Sign Disconnection Memo
          </Button>
        )}
        {activeStep === 2 && (
          <Button variant="contained" color="secondary" onClick={handlePTW} disabled={loading}>
            Verify Traction PTW
          </Button>
        )}
        {activeStep === 3 && (
          <Button variant="contained" color="success" onClick={handleTrackFit} disabled={loading}>
            Sign Track Fit Certificate
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
