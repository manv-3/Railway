import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Chip, CircularProgress, Alert, Accordion, AccordionSummary, AccordionDetails, Snackbar,
  ToggleButtonGroup, ToggleButton, Pagination, TextField, InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SecurityIcon from '@mui/icons-material/Security';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SearchIcon from '@mui/icons-material/Search';

import { CorridorMap } from '../components/CorridorMap';
import { YardInterlockingSchematic } from '../components/YardInterlockingSchematic';
import { OptimizationMetricsCard } from '../components/OptimizationMetricsCard';
import { SafetyMemoDialog } from '../components/SafetyMemoDialog';
import { SHAPExplainDialog } from '../components/SHAPExplainDialog';
import { WhatIfComparisonDialog } from '../components/WhatIfComparisonDialog';
import { OptimizerBenchmarkModal } from '../components/OptimizerBenchmarkModal';
import { Station, Section, MaintenanceBlock, OptimizationMetrics } from '../types';
import {
  getCorridorStations,
  getCorridorSections,
  getBlocks,
  runOptimization,
  runWhatIfSimulation,
  explainMaintenanceRequest
} from '../services/api';
import { wsService } from '../services/websocket';

export const DivisionalControlCockpit: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [blocks, setBlocks] = useState<MaintenanceBlock[]>([]);
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<MaintenanceBlock | null>(null);
  const [viewMode, setViewMode] = useState<'gis' | 'schematic'>('gis');
  const [schematicStation, setSchematicStation] = useState<'GZB' | 'ALJN'>('GZB');
  const [safetyDialogOpen, setSafetyDialogOpen] = useState(false);
  
  // Phase 2: What-If & SHAP states
  const [whatIfResult, setWhatIfResult] = useState<any | null>(null);
  const [whatIfDialogOpen, setWhatIfDialogOpen] = useState(false);
  const [shapData, setShapData] = useState<any | null>(null);
  const [shapDialogOpen, setShapDialogOpen] = useState(false);
  
  // Filter & Pagination states for Scheduled Blocks
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PLANNED' | 'SANCTIONED' | 'FIT_RESTORED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Real-time toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);

  const loadData = async () => {
    try {
      const st = await getCorridorStations();
      const sec = await getCorridorSections();
      const blk = await getBlocks('DIV_DLI');
      setStations(st);
      setSections(sec);
      setBlocks(blk);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time WebSocket broadcasts across all tiers
    const unSubSanction = wsService.on('BLOCK_SANCTIONED', (data) => {
      setToastMessage(`⚡ Block ${data.block_id} Jointly Sanctioned on ${data.section_id}`);
      loadData();
    });

    const unSubMemo = wsService.on('DISCONNECTION_ISSUED', (data) => {
      setToastMessage(`📝 Disconnection Memo #${data.memo_number} signed at ${data.station_code}`);
      loadData();
    });

    const unSubPtw = wsService.on('PTW_GRANTED', (data) => {
      setToastMessage(`⚡ PTW #${data.ptw_number} granted by TPC: ${data.tpc_controller}`);
      loadData();
    });

    const unSubFit = wsService.on('TRACK_FIT_ISSUED', (data) => {
      setToastMessage(`✅ Track Fit certified on ${data.section_id}. Caution Order ${data.tsr_speed_kmh} km/h active.`);
      loadData();
    });

    const unSubReq = wsService.on('REQUEST_CREATED', (data) => {
      setToastMessage(`🆕 New [${data.department}] Requisition: ${data.defect_type} (Score: ${data.priority_score})`);
      loadData();
    });

    const unSubDisruption = wsService.on('EMERGENCY_DISRUPTION', (data) => {
      setToastMessage(`🚨 EMERGENCY: ${data.message}`);
      loadData();
    });

    return () => {
      unSubSanction();
      unSubMemo();
      unSubPtw();
      unSubFit();
      unSubReq();
      unSubDisruption();
    };
  }, []);

  const handleRunOptimization = async () => {
    setLoading(true);
    try {
      const res = await runOptimization('DIV_DLI');
      setMetrics(res.metrics);
      await loadData();
    } catch (e) {
      console.error('Optimization error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateEmergencyFracture = async () => {
    setLoading(true);
    try {
      const res = await runWhatIfSimulation('EMERGENCY_RAIL_FRACTURE', 'SEC_GZB_ALJN_UP', 52.4);
      setWhatIfResult(res);
      setWhatIfDialogOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTrainDelay = async () => {
    setLoading(true);
    try {
      const res = await runWhatIfSimulation('PREMIUM_TRAIN_DELAY', 'SEC_GZB_ALJN_UP', 45, '22436');
      setWhatIfResult(res);
      setWhatIfDialogOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainTask = async (requestId: string) => {
    try {
      const res = await explainMaintenanceRequest(requestId);
      setShapData(res);
      setShapDialogOpen(true);
    } catch (e) {
      console.error('Error fetching SHAP explanation:', e);
    }
  };

  const handleAcceptWhatIf = () => {
    if (whatIfResult?.replan_result?.blocks) {
      setBlocks(whatIfResult.replan_result.blocks);
    }
    setWhatIfDialogOpen(false);
    setToastMessage('✅ What-If Emergency Re-Plan committed to Section Controller board.');
  };

  // Filter and paginate blocks
  const plannedCount = blocks.filter((b) => b.status === 'PLANNED').length;
  const sanctionedCount = blocks.filter((b) => b.status === 'SANCTIONED').length;
  const fitCount = blocks.filter((b) => b.status === 'FIT_RESTORED').length;

  const filteredBlocks = blocks.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = b.block_id?.toLowerCase().includes(q);
      const matchSec = b.section_id?.toLowerCase().includes(q);
      const matchType = b.block_type?.toLowerCase().includes(q);
      const matchDefect = (b.tasks || b.maintenance_tasks)?.some((t: any) =>
        t.defect_type?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q) ||
        t.request_id?.toLowerCase().includes(q)
      );
      return matchId || matchSec || matchType || matchDefect;
    }
    return true;
  });

  const pageCount = Math.ceil(filteredBlocks.length / pageSize) || 1;
  const paginatedBlocks = filteredBlocks.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Hero Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>
              Divisional Control Cockpit
            </Typography>
            <Chip label="Tier 3 • Operational Core" color="primary" sx={{ fontWeight: 700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Senior Divisional Operations Manager (Sr. DOM) & Section Controllers Real-Time Tactical Dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CompareArrowsIcon />}
            onClick={() => setBenchmarkOpen(true)}
            disabled={loading}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Benchmark vs Manual
          </Button>

          <Button
            variant="outlined"
            color="warning"
            startIcon={<AccessTimeIcon />}
            onClick={handleSimulateTrainDelay}
            disabled={loading}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            What-If: VB +45m
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<WarningAmberIcon />}
            onClick={handleSimulateEmergencyFracture}
            disabled={loading}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            What-If: Rail Fracture
          </Button>

          <Button
            variant="contained"
            color="warning"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleRunOptimization}
            disabled={loading}
            sx={{ fontWeight: 800, fontSize: '1rem', px: 3, borderRadius: 2 }}
          >
            Run CP-SAT Optimizer
          </Button>
        </Box>
      </Box>

      {/* KPI Metrics */}
      <OptimizationMetricsCard metrics={metrics} />

      {/* Main Grid: GIS Map + Scheduled Blocks */}
      <Grid container spacing={3}>
        {/* Left Column: Interactive GIS Map */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d47a1' }}>
                    {viewMode === 'gis'
                      ? 'Golden Corridor Directional Track Topology (NDLS - CNB)'
                      : `Junction Yard Interlocking Schematic (${schematicStation})`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewMode === 'gis'
                      ? 'Real-time GIS track monitoring with directional separation (Up/Down) & station loop lines'
                      : '4-Aspect signalling, points/crossings & active maintenance block track circuit isolation'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, val) => val && setViewMode(val)}
                    size="small"
                  >
                    <ToggleButton value="gis" sx={{ fontWeight: 700, px: 2 }}>GIS Map</ToggleButton>
                    <ToggleButton value="schematic" sx={{ fontWeight: 700, px: 2 }}>Yard Schematic</ToggleButton>
                  </ToggleButtonGroup>

                  {viewMode === 'schematic' && (
                    <ToggleButtonGroup
                      value={schematicStation}
                      exclusive
                      onChange={(_, val) => val && setSchematicStation(val)}
                      size="small"
                      color="primary"
                    >
                      <ToggleButton value="GZB" sx={{ fontWeight: 700 }}>GZB</ToggleButton>
                      <ToggleButton value="ALJN" sx={{ fontWeight: 700 }}>ALJN</ToggleButton>
                    </ToggleButtonGroup>
                  )}
                </Box>
              </Box>

              {viewMode === 'gis' ? (
                <Box sx={{ height: 500, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                  <CorridorMap stations={stations} sections={sections} blocks={blocks} />
                </Box>
              ) : (
                <Box sx={{ minHeight: 480, width: '100%', borderRadius: 2, overflow: 'hidden', p: 1, bgcolor: '#f8fafc' }}>
                  <YardInterlockingSchematic
                    stationCode={schematicStation}
                    activeBlock={selectedBlock?.block_id}
                  />
                  {selectedBlock && (
                    <Alert severity="info" sx={{ mt: 1.5, py: 0.5, borderRadius: 1.5 }}>
                      Interlocking Highlight: <b>{selectedBlock.block_id}</b> on section <b>{selectedBlock.section_id}</b> ({selectedBlock.duration_minutes || selectedBlock.total_duration_minutes} mins) — Signals holding automatic red envelope.
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Scheduled Combined Blocks & Tasks */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d47a1' }}>
              Scheduled Maintenance Blocks & Bundles
            </Typography>
            <Chip
              label={`${filteredBlocks.length} of ${blocks.length} Blocks`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          {/* Search & Filter Controls */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search block, section, or defect..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              sx={{ flexGrow: 1, minWidth: 160 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <ToggleButtonGroup
              size="small"
              value={statusFilter}
              exclusive
              onChange={(_, val) => {
                if (val) {
                  setStatusFilter(val);
                  setPage(1);
                }
              }}
            >
              <ToggleButton value="ALL" sx={{ px: 1, py: 0.5, fontSize: '0.72rem', fontWeight: 700 }}>
                All ({blocks.length})
              </ToggleButton>
              <ToggleButton value="PLANNED" sx={{ px: 1, py: 0.5, fontSize: '0.72rem', fontWeight: 700 }}>
                Planned ({plannedCount})
              </ToggleButton>
              <ToggleButton value="SANCTIONED" sx={{ px: 1, py: 0.5, fontSize: '0.72rem', fontWeight: 700 }}>
                Sanctioned ({sanctionedCount})
              </ToggleButton>
              <ToggleButton value="FIT_RESTORED" sx={{ px: 1, py: 0.5, fontSize: '0.72rem', fontWeight: 700 }}>
                Restored ({fitCount})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {filteredBlocks.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {blocks.length === 0
                ? <>No active maintenance blocks. Click <b>Run CP-SAT Optimizer</b> above to solve pending TMS/SMMS/TDMS requisitions.</>
                : <>No maintenance blocks match the search/filter criteria.</>}
            </Alert>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 620, overflowY: 'auto', pr: 0.5 }}>
                {paginatedBlocks.map((b) => (
                  <Card
                    key={b.id || b.block_id}
                    variant="outlined"
                    onClick={() => {
                      setSelectedBlock(b);
                      if (b.section_id?.includes('ALJN')) setSchematicStation('ALJN');
                      else setSchematicStation('GZB');
                    }}
                    sx={{
                      flexShrink: 0,
                      minHeight: 'fit-content',
                      borderRadius: 2,
                      borderLeft: `6px solid ${b.is_combined ? '#ff9800' : '#2196f3'}`,
                      borderRight: selectedBlock?.block_id === b.block_id ? '4px solid #00c853' : 'none',
                      bgcolor: selectedBlock?.block_id === b.block_id ? '#f0fdf4' : 'inherit',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedBlock?.block_id === b.block_id ? 3 : 1
                    }}
                  >
                    <CardContent sx={{ pb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            {b.block_id}
                          </Typography>
                          <Chip
                            label={b.is_combined ? 'COMBINED SUPER-BLOCK' : 'SINGLE'}
                            size="small"
                            color={b.is_combined ? 'warning' : 'default'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Chip
                          label={b.status}
                          size="small"
                          color={b.status === 'FIT_RESTORED' ? 'success' : b.status === 'SANCTIONED' ? 'primary' : 'default'}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        Section: <b>{b.section_id}</b> • Duration: <b>{b.duration_minutes || b.total_duration_minutes} mins</b>
                      </Typography>

                      {b.explanation && (
                        <Box sx={{ my: 1 }}>
                          <Alert severity="info" sx={{ p: 0.8, fontSize: '0.78rem', mb: 0.5, borderRadius: 1.5 }}>
                            <b>AI Operational Reasoner Brief:</b> {b.explanation.summary}
                          </Alert>
                          {b.explanation.tradeoff && (
                            <Box sx={{ p: 1, bgcolor: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 1.5, fontSize: '0.75rem', color: '#e65100' }}>
                              <b>⚖️ Operational Trade-off:</b> {b.explanation.tradeoff}
                            </Box>
                          )}
                        </Box>
                      )}

                      <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' }, bgcolor: '#f9f9f9', mt: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            View {(b.tasks || b.maintenance_tasks)?.length || 1} Bundled Requisitions
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 1 }}>
                          {(b.tasks || b.maintenance_tasks)?.map((t: any) => (
                            <Box key={t.request_id} sx={{ mb: 0.5, p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #eee' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a237e' }}>
                                  [{t.department}] {t.request_id} - {t.defect_type}
                                </Typography>
                                <Button
                                  size="small"
                                  startIcon={<PsychologyIcon />}
                                  sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExplainTask(t.request_id);
                                  }}
                                >
                                  Explain Risk
                                </Button>
                              </Box>
                              <Typography variant="caption" display="block" color="text.secondary">
                                KM {t.from_km} to {t.to_km} • Priority Score: <strong>{t.priority_score}</strong>
                              </Typography>
                            </Box>
                          ))}
                        </AccordionDetails>
                      </Accordion>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<SecurityIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBlock(b);
                            setSafetyDialogOpen(true);
                          }}
                        >
                          Safety Handshake (Memos)
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {pageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                  <Pagination
                    count={pageCount}
                    page={page}
                    onChange={(_, val) => setPage(val)}
                    color="primary"
                    size="small"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Safety Memo Dialog */}
      <SafetyMemoDialog
        block={selectedBlock}
        open={safetyDialogOpen}
        onClose={() => setSafetyDialogOpen(false)}
        onRefresh={loadData}
      />

      {/* Phase 2: SHAP Explainability Dialog */}
      <SHAPExplainDialog
        open={shapDialogOpen}
        onClose={() => setShapDialogOpen(false)}
        data={shapData}
      />

      {/* Phase 2: What-If Comparison Dialog */}
      <WhatIfComparisonDialog
        open={whatIfDialogOpen}
        onClose={() => setWhatIfDialogOpen(false)}
        onAcceptReplan={handleAcceptWhatIf}
        result={whatIfResult}
      />

      {/* Optimizer Benchmark Modal */}
      <OptimizerBenchmarkModal
        open={benchmarkOpen}
        onClose={() => setBenchmarkOpen(false)}
        divisionId="DIV_DLI"
      />

      {/* Real-time Toast Notifications */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Container>
  );
};
