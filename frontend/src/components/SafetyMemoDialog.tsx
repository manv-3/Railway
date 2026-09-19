import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  TextField, Box, Stepper, Step, StepLabel, Alert, Chip, ToggleButtonGroup,
  ToggleButton, Divider
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import TouchAppIcon from '@mui/icons-material/TouchApp';
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
  const [activeTab, setActiveTab] = useState<'workflow' | 'document'>('workflow');
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#0f2b5c',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.8,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShieldIcon sx={{ fontSize: 24, color: '#93c5fd' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#ffffff' }}>
              STATUTORY G&SR 2026 SAFETY HANDSHAKE • {block.block_id}
            </Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd', display: 'block' }}>
              Commissioner of Railway Safety (CRS) Compliant Digital Protocol
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={(_, val) => val && setActiveTab(val)}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 1.5,
              '& .MuiToggleButton-root': {
                color: '#ffffff',
                border: 'none',
                px: 1.2,
                py: 0.4,
                fontSize: '0.72rem',
                fontWeight: 700,
                '&.Mui-selected': { bgcolor: '#ffffff', color: '#0f2b5c' },
              },
            }}
          >
            <ToggleButton value="workflow">
              <TouchAppIcon sx={{ fontSize: 14, mr: 0.5 }} /> Workflow
            </ToggleButton>
            <ToggleButton value="document">
              <DescriptionIcon sx={{ fontSize: 14, mr: 0.5 }} /> Official Form T/351
            </ToggleButton>
          </ToggleButtonGroup>

          <Chip
            label="CRS VERIFIED"
            size="small"
            sx={{
              bgcolor: 'rgba(5, 150, 105, 0.25)',
              border: '1px solid #10b981',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.68rem',
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {activeTab === 'workflow' ? (
          <>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                mb: 3,
                '& .MuiStepLabel-label': { color: '#64748b', fontWeight: 700, fontSize: '0.75rem' },
                '& .MuiStepLabel-label.Mui-active': { color: '#0f2b5c', fontWeight: 800 },
                '& .MuiStepLabel-label.Mui-completed': { color: '#059669', fontWeight: 800 },
                '& .MuiStepIcon-root': { color: '#cbd5e1' },
                '& .MuiStepIcon-root.Mui-active': { color: '#0f2b5c' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#059669' },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {successMsg && (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46' }}>
                {successMsg}
              </Alert>
            )}

            {activeStep === 0 && (
              <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VerifiedUserIcon sx={{ color: '#0f2b5c' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    Step 1: Divisional Joint Sanction
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                  Requires statutory dual concurrence from Operating (Sr. DOM) and Technical Branches (Track, Signal, OHE) before traffic suspension.
                </Typography>
                <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe' }}>
                  <Typography variant="caption" sx={{ color: '#1e40af', display: 'block', fontSize: '0.76rem' }}>
                    Section: <strong>{block.section_id}</strong> • Duration: <strong>{block.duration_minutes || block.total_duration_minutes} mins</strong> • Bundled Work Items: <strong>{block.tasks?.length || 1}</strong>
                  </Typography>
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AssignmentTurnedInIcon sx={{ color: '#d97706' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    Step 2: Digital Form T/351 Disconnection Memo
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                  Formal statutory handover between Senior Section Engineer and Station Master. Locks all protecting signals at DANGER under ABS rules.
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
              <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ElectricalServicesIcon sx={{ color: '#0891b2' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    Step 3: Traction Power Permit-to-Work (PTW)
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
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
              <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#059669' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    Step 4: Track Fit Handover & Caution Order (TSR)
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
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
          </>
        ) : (
          /* ── PRINTABLE STATUTORY FORM T/351 & T/409 ── */
          <Box
            id="printable-railway-memo"
            sx={{
              p: 3,
              bgcolor: '#ffffff',
              borderRadius: 2,
              border: '2px solid #0f2b5c',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              fontFamily: '"Times New Roman", Times, serif',
            }}
          >
            {/* Government Official Header */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#000000', letterSpacing: '0.05em', fontFamily: 'serif' }}>
                GOVERNMENT OF INDIA • MINISTRY OF RAILWAYS
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#000000', fontFamily: 'serif' }}>
                NORTHERN RAILWAY • DELHI DIVISION
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c', textDecoration: 'underline', mt: 0.5, fontFamily: 'serif' }}>
                FORM T/351 — NOTICE OF DISCONNECTION OF SIGNALS & INTERLOCKING
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic', display: 'block', mt: 0.2 }}>
                [Prescribed under Rules 15.06 & 15.08 of General and Subsidiary Rules, 2026]
              </Typography>
            </Box>

            <Divider sx={{ my: 1.5, borderColor: '#000000' }} />

            {/* Document Body */}
            <Box sx={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#000000' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <span><strong>Serial Notice No:</strong> {memoNumber}</span>
                <span><strong>Station / Cabin:</strong> {stationCode}</span>
                <span><strong>Date / Time:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
              </Box>

              <p style={{ margin: '8px 0' }}>
                <strong>To:</strong> Station Master on Duty, <u>{stationCode}</u> Station.
              </p>

              <p style={{ margin: '8px 0', textAlign: 'justify' }}>
                Sir, Please note that the Block Section <strong>{block.section_id}</strong> is hereby placed under statutory engineering possession for a duration of <strong>{block.duration_minutes || block.total_duration_minutes} minutes</strong> for bundled track, signal, and overhead equipment renewal.
              </p>

              <Box sx={{ my: 1.5, p: 1.5, bgcolor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c', display: 'block', mb: 0.5 }}>
                  CORRIDOR ISOLATION & COMPLIANCE PARAMETERS:
                </Typography>
                <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '0.8rem' }}>
                  <li><strong>G&SR Rule 15.06:</strong> Up/Down Home & Starter signals placed at DANGER. Points clamped and padlocked where required.</li>
                  <li><strong>Traction PTW #{ptwNumber}:</strong> 25kV Catenary de-energized in subsector {subsector}. Earthed by TPC {tpcName}.</li>
                  <li><strong>Form T/409 Caution Order:</strong> Imposed Temporary Speed Restriction of <strong>{cautionSpeed} km/h</strong> upon fit restoration.</li>
                </ul>
              </Box>

              {/* Statutory Dual Signature Blocks */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#059669' }}>
                    [DIGITALLY SIGNED VIA PKI]
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                    Shri R. K. Sharma
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    Senior Section Engineer (P-Way / S&T)
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#059669' }}>
                    [DIGITALLY SIGNED VIA PKI]
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                    Station Master On Duty
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    {stationCode} Yard Interlocking Cabin
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#059669' }}>
                    [DUAL CONCURRENCE GRANTED]
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                    Section Controller (Operating)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    Delhi Divisional Control (DIV_DLI)
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center', bgcolor: '#f1f5f9', p: 1, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#64748b' }}>
                  CRS JUDICIAL PKI AUDIT HASH: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 • 2026-09-20T04:50:00Z
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          {activeTab === 'document' && (
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ fontWeight: 700, color: '#0f2b5c', borderColor: '#0f2b5c', mr: 1 }}
            >
              Print Form / Export PDF
            </Button>
          )}
          <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 700 }}>
            Close
          </Button>
        </Box>

        <Box>
          {activeStep === 0 && (
            <Button
              variant="contained"
              onClick={handleSanction}
              disabled={loading}
              sx={{ fontWeight: 800, bgcolor: '#0f2b5c', '&:hover': { bgcolor: '#1e3a8a' } }}
            >
              Sign Joint Sanction
            </Button>
          )}
          {activeStep === 1 && (
            <Button
              variant="contained"
              onClick={handleDisconnection}
              disabled={loading}
              sx={{ fontWeight: 800, bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}
            >
              Sign Form T/351 Disconnection
            </Button>
          )}
          {activeStep === 2 && (
            <Button
              variant="contained"
              onClick={handlePTW}
              disabled={loading}
              sx={{ fontWeight: 800, bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}
            >
              Grant Traction PTW
            </Button>
          )}
          {activeStep === 3 && (
            <Button
              variant="contained"
              onClick={handleTrackFit}
              disabled={loading}
              sx={{ fontWeight: 800, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              Certify Track Fit & Restore Corridor
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SafetyMemoDialog;
