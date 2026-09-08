import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField,
  MenuItem, Button, Chip, Table, TableHead, TableRow, TableCell, TableBody, Alert
} from '@mui/material';
import AddTaskIcon from '@mui/icons-material/AddTask';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import { MaintenanceRequest, MaintenanceBlock } from '../types';
import { createMaintenanceRequest, getMaintenanceRequests, getBlocks, issueDisconnectionMemo } from '../services/api';
import { wsService } from '../services/websocket';
import { offlineStore } from '../services/offline_store';

export const FieldStationPortal: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [blocks, setBlocks] = useState<MaintenanceBlock[]>([]);
  const [signingMemoId, setSigningMemoId] = useState<string | null>(null);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const [department, setDepartment] = useState<'TMS' | 'SMMS' | 'TDMS'>('TMS');
  const [sectionId, setSectionId] = useState('SEC_GZB_ALJN_UP');
  const [fromKm, setFromKm] = useState('44.5');
  const [toKm, setToKm] = useState('45.0');
  const [assetType, setAssetType] = useState('RAIL');
  const [defectType, setDefectType] = useState('RAIL_CORRUGATION_GRINDING');
  const [severity, setSeverity] = useState<MaintenanceRequest['severity']>('CRITICAL');
  const [duration, setDuration] = useState('120');
  const [machineType, setMachineType] = useState('TAMPING_MACHINE');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await getMaintenanceRequests();
      const blkData = await getBlocks('DIV_DLI');
      setRequests(data);
      setBlocks(blkData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRequests();
    setPendingOfflineCount(offlineStore.getPendingTickets().length);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubOffline = offlineStore.onQueueChange((count) => {
      setPendingOfflineCount(count);
    });

    const unSubReq = wsService.on('REQUEST_CREATED', () => {
      loadRequests();
    });
    const unSubOpt = wsService.on('OPTIMIZATION_COMPLETED', () => {
      loadRequests();
    });
    const unSubSanction = wsService.on('BLOCK_SANCTIONED', () => {
      loadRequests();
    });
    const unSubMemo = wsService.on('DISCONNECTION_ISSUED', () => {
      loadRequests();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubOffline();
      unSubReq();
      unSubOpt();
      unSubSanction();
      unSubMemo();
    };
  }, []);

  const handleManualSync = async () => {
    setSyncingOffline(true);
    try {
      const result = await offlineStore.syncPendingTickets();
      if (result.synced > 0) {
        setSuccessMsg(`Successfully synced ${result.synced} offline tickets to Divisional Server!`);
        await loadRequests();
      }
      setPendingOfflineCount(offlineStore.getPendingTickets().length);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingOffline(false);
    }
  };

  const handleSignMemo = async (block: MaintenanceBlock) => {
    setSigningMemoId(String(block.id || block.block_id));
    try {
      const station = block.section_id.includes('GZB') ? 'GZB' : block.section_id.includes('ALJN') ? 'ALJN' : 'NDLS';
      const memoNum = `MEMO-${station}-${Math.floor(1000 + Math.random() * 9000)}`;
      await issueDisconnectionMemo(block.block_id, memoNum, station);
      setSuccessMsg(`Station Master Disconnection Memo #${memoNum} signed successfully at ${station}! Red reminder collars applied on levers.`);
      await loadRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setSigningMemoId(null);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      department,
      division_id: 'DIV_DLI',
      section_id: sectionId,
      from_km: parseFloat(fromKm),
      to_km: parseFloat(toKm),
      asset_type: assetType,
      defect_type: defectType,
      severity,
      estimated_duration_minutes: parseInt(duration),
      required_machine_type: machineType || null,
    };

    if (!isOnline) {
      const gps = await offlineStore.captureDeviceGPS();
      await offlineStore.saveOfflineTicket(payload, gps || undefined);
      setPendingOfflineCount(offlineStore.getPendingTickets().length);
      setSuccessMsg(`Offline Mode: Requisition queued locally with GPS coordinates (KM ${fromKm}-${toKm}). It will sync automatically when network is restored.`);
      setLoading(false);
      return;
    }

    try {
      await createMaintenanceRequest(payload);
      setSuccessMsg(`Requisition submitted successfully! ML Priority Engine calculated risk score.`);
      await loadRequests();
    } catch (err) {
      console.warn('Online submission failed, falling back to offline queue:', err);
      const gps = await offlineStore.captureDeviceGPS();
      await offlineStore.saveOfflineTicket(payload, gps || undefined);
      setPendingOfflineCount(offlineStore.getPendingTickets().length);
      setSuccessMsg(`Network connection interrupted: Requisition saved to offline queue and will sync automatically.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>
            Field & Station Operations Terminal
          </Typography>
          <Chip label="Tier 4 • Execution Tier" color="info" sx={{ fontWeight: 700 }} />
          {!isOnline && (
            <Chip icon={<SignalWifiOffIcon />} label="Offline Mode" color="error" sx={{ fontWeight: 700 }} />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Senior Section Engineers (SSE P-Way, Signal, OHE) Ticket Submission & Station Master Line Clearance Log
        </Typography>
      </Box>

      {!isOnline && (
        <Alert severity="warning" icon={<SignalWifiOffIcon />} sx={{ mb: 2 }}>
          <strong>Offline Mode Active:</strong> Field terminal has lost cellular signal. New requisitions will be queued locally with hardware GPS coordinates and synced automatically once signal is restored.
        </Alert>
      )}

      {pendingOfflineCount > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button
              color="primary"
              size="small"
              variant="outlined"
              startIcon={<SyncIcon />}
              disabled={syncingOffline || !isOnline}
              onClick={handleManualSync}
              sx={{ fontWeight: 700 }}
            >
              {syncingOffline ? 'Syncing...' : `Sync Queue (${pendingOfflineCount})`}
            </Button>
          }
        >
          <strong>{pendingOfflineCount} offline ticket(s) awaiting server dispatch.</strong> {isOnline ? 'Network available — click to flush queue.' : 'Will flush when connection resumes.'}
        </Alert>
      )}

      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

      <Grid container spacing={3}>
        {/* Ticket Submission Form */}
        <Grid item xs={12} md={5}>
          <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0d47a1' }}>
                New Maintenance Requisition Ticket
              </Typography>

              <form onSubmit={handleSubmitTicket}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as any)}
                    >
                      <MenuItem value="TMS">Engineering (TMS - Track)</MenuItem>
                      <MenuItem value="SMMS">Signalling (SMMS - S&T)</MenuItem>
                      <MenuItem value="TDMS">Traction (TDMS - OHE)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Severity"
                      value={severity}
                  onChange={(e) => setSeverity(e.target.value as MaintenanceRequest['severity'])}
                    >
                      <MenuItem value="EMERGENCY">EMERGENCY (Immediate)</MenuItem>
                      <MenuItem value="CRITICAL">CRITICAL (Within 24h)</MenuItem>
                      <MenuItem value="PLANNED_HIGH">PLANNED HIGH</MenuItem>
                      <MenuItem value="ROUTINE">ROUTINE MAINTENANCE</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Section"
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                    >
                      <MenuItem value="SEC_NDLS_GZB_UP">New Delhi - Ghaziabad (Up Line)</MenuItem>
                      <MenuItem value="SEC_GZB_ALJN_UP">Ghaziabad - Aligarh (Up Line)</MenuItem>
                      <MenuItem value="SEC_GZB_ALJN_DN">Ghaziabad - Aligarh (Down Line)</MenuItem>
                      <MenuItem value="SEC_ALJN_TDL_UP">Aligarh - Tundla (Up Line)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="From Kilometer"
                      value={fromKm}
                      onChange={(e) => setFromKm(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="To Kilometer"
                      value={toKm}
                      onChange={(e) => setToKm(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Asset Type"
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Duration (Minutes)"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Defect Description / Classification"
                      value={defectType}
                      onChange={(e) => setDefectType(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Required Machinery (TMO)"
                      value={machineType}
                      onChange={(e) => setMachineType(e.target.value)}
                    >
                      <MenuItem value="TAMPING_MACHINE">Tie Tamping Machine (CSM/Duomatic)</MenuItem>
                      <MenuItem value="TOWER_WAGON">OHE Inspection Car / Tower Wagon</MenuItem>
                      <MenuItem value="BALLAST_CLEANER">Ballast Cleaning Machine (BCM)</MenuItem>
                      <MenuItem value="">Manual Gang Only (No Heavy Machine)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      color="primary"
                      startIcon={<AddTaskIcon />}
                      disabled={loading}
                      sx={{ fontWeight: 700, py: 1.2 }}
                    >
                      {loading ? 'Registering...' : 'Dispatch Requisition to Divisional Cockpit'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Requisitions Log */}
        <Grid item xs={12} md={7}>
          <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1a237e' }}>
                Active Section Requisitions & ML Priority Scores ({requests.length})
              </Typography>

              <Box sx={{ maxHeight: 520, overflowY: 'auto' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Dept</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Section / KM</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Defect</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.request_id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{r.request_id}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.department}
                            size="small"
                            color={r.department === 'TMS' ? 'success' : r.department === 'SMMS' ? 'warning' : 'primary'}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>{r.section_id} (KM {r.from_km}-{r.to_km})</TableCell>
                        <TableCell>{r.defect_type}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.priority_score ? `${r.priority_score}` : 'Pending'}
                            size="small"
                            color={r.priority_score > 80 ? 'error' : r.priority_score > 70 ? 'warning' : 'default'}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={r.status} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Station Master Statutory Disconnection & Line Clearance Terminal */}
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AssignmentTurnedInIcon sx={{ color: '#2e7d32' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e' }}>
                  Station Master Line Clearance & Statutory Disconnection Terminal (Form T/351)
                </Typography>
              </Box>

              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Block ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Current Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Disconnection Memo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Station Master Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No active blocks scheduled on this station line.</TableCell>
                    </TableRow>
                  ) : (
                    blocks.map((b) => (
                      <TableRow key={b.id || b.block_id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{b.block_id}</TableCell>
                        <TableCell>{b.section_id}</TableCell>
                        <TableCell>{b.duration_minutes || b.total_duration_minutes} min</TableCell>
                        <TableCell>
                          <Chip
                            label={b.is_combined ? 'SUPER-BLOCK' : 'SINGLE'}
                            size="small"
                            color={b.is_combined ? 'warning' : 'default'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={b.status}
                            size="small"
                            color={b.status === 'FIT_RESTORED' ? 'success' : b.status === 'SANCTIONED' ? 'primary' : 'default'}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          {b.disconnection_memo_number ? (
                            <Chip label={b.disconnection_memo_number} size="small" color="secondary" sx={{ fontWeight: 700 }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">Pending Sign-off</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {b.status === 'SANCTIONED' ? (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={signingMemoId === (b.id || b.block_id)}
                              onClick={() => handleSignMemo(b)}
                              sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}
                            >
                              {signingMemoId === (b.id || b.block_id) ? 'Signing...' : 'Sign Form T/351 Memo'}
                            </Button>
                          ) : b.status === 'DISCONNECTED' || b.status === 'PTW_GRANTED' ? (
                            <Chip label="Line Disconnected (Protected)" size="small" color="warning" sx={{ fontWeight: 700 }} />
                          ) : b.status === 'FIT_RESTORED' ? (
                            <Chip label="Fit Restored (TSR Active)" size="small" color="success" sx={{ fontWeight: 700 }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">Awaiting Sr. DOM Sanction</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
