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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Divisional Control Cockpit
            </Typography>
            <Chip
              label="Tier 3 • Tactical Core"
              size="small"
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa',
                fontWeight: 800,
                fontSize: '0.72rem',
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Senior Divisional Operations Manager (Sr. DOM) & Section Controllers Real-Time Tactical Dispatch & Optimization Console
          </Typography>
        </Box>

        {/* Tactical Action Hub */}
        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<CompareArrowsIcon />}
            onClick={() => setBenchmarkOpen(true)}
            disabled={loading}
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              borderColor: 'rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              bgcolor: 'rgba(59, 130, 246, 0.06)',
              '&:hover': {
                bgcolor: 'rgba(59, 130, 246, 0.15)',
                borderColor: '#60a5fa',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
              },
            }}
          >
            Benchmark vs Manual
          </Button>

          <Button
            variant="outlined"
            startIcon={<AccessTimeIcon />}
            onClick={handleSimulateTrainDelay}
            disabled={loading}
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              borderColor: 'rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              bgcolor: 'rgba(245, 158, 11, 0.06)',
              '&:hover': {
                bgcolor: 'rgba(245, 158, 11, 0.15)',
                borderColor: '#fbbf24',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)',
              },
            }}
          >
            What-If: VB +45m
          </Button>

          <Button
            variant="outlined"
            startIcon={<WarningAmberIcon />}
            onClick={handleSimulateEmergencyFracture}
            disabled={loading}
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              bgcolor: 'rgba(239, 68, 68, 0.06)',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.15)',
                borderColor: '#f87171',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
              },
            }}
          >
            What-If: Rail Fracture
          </Button>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleRunOptimization}
            disabled={loading}
            sx={{
              fontWeight: 900,
              fontSize: '0.92rem',
              px: 2.8,
              py: 0.9,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)',
              },
            }}
          >
            {loading ? 'SOLVING CP-SAT…' : 'RUN CP-SAT OPTIMIZER'}
          </Button>
        </Box>
      </Box>

      {/* KPI Metrics */}
      <OptimizationMetricsCard metrics={metrics} />

      {/* Main Grid: GIS Map + Scheduled Blocks */}
      <Grid container spacing={3}>
        {/* Left Column: Interactive GIS Map */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#60a5fa', letterSpacing: '0.01em' }}>
                    {viewMode === 'gis'
                      ? 'GOLDEN CORRIDOR DIRECTIONAL TOPOLOGY (NDLS - CNB)'
                      : `JUNCTION YARD INTERLOCKING SCHEMATIC (${schematicStation})`}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                    {viewMode === 'gis'
                      ? 'Real-time GIS track telemetry • Directional Up/Down separation • High-density monitoring'
                      : '4-Aspect colour signalling, points/crossings & active maintenance possession isolation envelope'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, val) => val && setViewMode(val)}
                    size="small"
                  >
                    <ToggleButton
                      value="gis"
                      sx={{
                        fontWeight: 800,
                        px: 1.8,
                        fontSize: '0.75rem',
                        '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' },
                      }}
                    >
                      GIS MAP
                    </ToggleButton>
                    <ToggleButton
                      value="schematic"
                      sx={{
                        fontWeight: 800,
                        px: 1.8,
                        fontSize: '0.75rem',
                        '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' },
                      }}
                    >
                      YARD SCHEMATIC
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {viewMode === 'schematic' && (
                    <ToggleButtonGroup
                      value={schematicStation}
                      exclusive
                      onChange={(_, val) => val && setSchematicStation(val)}
                      size="small"
                    >
                      <ToggleButton
                        value="GZB"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          '&.Mui-selected': { bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' },
                        }}
                      >
                        GZB
                      </ToggleButton>
                      <ToggleButton
                        value="ALJN"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          '&.Mui-selected': { bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' },
                        }}
                      >
                        ALJN
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                </Box>
              </Box>

              {viewMode === 'gis' ? (
                <Box sx={{ height: 500, width: '100%', borderRadius: 2.5, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <CorridorMap stations={stations} sections={sections} blocks={blocks} />
                </Box>
              ) : (
                <Box sx={{ minHeight: 480, width: '100%', borderRadius: 2.5, overflow: 'hidden', p: 1.5, bgcolor: '#070c18', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <YardInterlockingSchematic
                    stationCode={schematicStation}
                    activeBlock={selectedBlock?.block_id}
                  />
                  {selectedBlock && (
                    <Alert
                      severity="warning"
                      sx={{
                        mt: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                      }}
                    >
                      Interlocking Highlight: <b>{selectedBlock.block_id}</b> on section <b>{selectedBlock.section_id}</b> ({selectedBlock.duration_minutes || selectedBlock.total_duration_minutes} mins) — Signals holding automatic red envelope under G&SR 2026.
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
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '0.01em' }}>
              SCHEDULED MAINTENANCE POSSESSIONS
            </Typography>
            <Chip
              label={`${filteredBlocks.length} of ${blocks.length} Blocks`}
              size="small"
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                fontWeight: 800,
                fontSize: '0.72rem',
              }}
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
              sx={{ flexGrow: 1, minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
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
              <ToggleButton value="ALL" sx={{ px: 1.2, py: 0.5, fontSize: '0.72rem', fontWeight: 800 }}>
                All ({blocks.length})
              </ToggleButton>
              <ToggleButton value="PLANNED" sx={{ px: 1.2, py: 0.5, fontSize: '0.72rem', fontWeight: 800 }}>
                Planned ({plannedCount})
              </ToggleButton>
              <ToggleButton value="SANCTIONED" sx={{ px: 1.2, py: 0.5, fontSize: '0.72rem', fontWeight: 800 }}>
                Sanctioned ({sanctionedCount})
              </ToggleButton>
              <ToggleButton value="FIT_RESTORED" sx={{ px: 1.2, py: 0.5, fontSize: '0.72rem', fontWeight: 800 }}>
                Restored ({fitCount})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {filteredBlocks.length === 0 ? (
            <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255,255,255,0.15)' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {blocks.length === 0
                  ? <>No active blocks scheduled. Click <b>Run CP-SAT Optimizer</b> above to bundle pending TMS/SMMS/TDMS requisitions.</>
                  : <>No maintenance blocks match the search/filter criteria.</>}
              </Typography>
            </Card>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, maxHeight: 620, overflowY: 'auto', pr: 0.5 }}>
                {paginatedBlocks.map((b) => {
                  const isSelected = selectedBlock?.block_id === b.block_id;
                  return (
                    <Card
                      key={b.id || b.block_id}
                      onClick={() => {
                        setSelectedBlock(b);
                        if (b.section_id?.includes('ALJN')) setSchematicStation('ALJN');
                        else setSchematicStation('GZB');
                      }}
                      sx={{
                        flexShrink: 0,
                        minHeight: 'fit-content',
                        borderRadius: 2.5,
                        border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderLeft: `5px solid ${b.is_combined ? '#f59e0b' : '#3b82f6'}`,
                        bgcolor: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 25px rgba(16, 185, 129, 0.25)' : '0 4px 15px rgba(0,0,0,0.4)',
                        '&:hover': {
                          border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, pb: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', fontFamily: '"JetBrains Mono", monospace' }}>
                              {b.block_id}
                            </Typography>
                            <Chip
                              label={b.is_combined ? 'SUPER-BLOCK' : 'SINGLE'}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                bgcolor: b.is_combined ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                border: b.is_combined ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
                                color: b.is_combined ? '#fbbf24' : '#60a5fa',
                              }}
                            />
                          </Box>
                          <Chip
                            label={b.status}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              bgcolor:
                                b.status === 'FIT_RESTORED'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : b.status === 'SANCTIONED'
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(148, 163, 184, 0.12)',
                              border:
                                b.status === 'FIT_RESTORED'
                                  ? '1px solid rgba(16, 185, 129, 0.4)'
                                  : b.status === 'SANCTIONED'
                                  ? '1px solid rgba(59, 130, 246, 0.4)'
                                  : '1px solid rgba(148, 163, 184, 0.25)',
                              color:
                                b.status === 'FIT_RESTORED'
                                  ? '#34d399'
                                  : b.status === 'SANCTIONED'
                                  ? '#60a5fa'
                                  : '#94a3b8',
                            }}
                          />
                        </Box>

                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                          Section: <strong style={{ color: '#f1f5f9' }}>{b.section_id}</strong> • Duration: <strong style={{ color: '#22d3ee' }}>{b.duration_minutes || b.total_duration_minutes} mins</strong>
                        </Typography>

                        {b.explanation && (
                          <Box sx={{ my: 1 }}>
                            <Box sx={{ p: 1, bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 1.5, mb: 0.6 }}>
                              <Typography variant="caption" sx={{ color: '#93c5fd', fontSize: '0.74rem', display: 'block' }}>
                                <b>🤖 AI Reasoner:</b> {b.explanation.summary}
                              </Typography>
                            </Box>
                            {b.explanation.tradeoff && (
                              <Box sx={{ p: 1, bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 1.5 }}>
                                <Typography variant="caption" sx={{ color: '#fde047', fontSize: '0.74rem', display: 'block' }}>
                                  <b>⚖️ Operational Trade-off:</b> {b.explanation.tradeoff}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}

                        <Accordion
                          sx={{
                            boxShadow: 'none',
                            '&:before': { display: 'none' },
                            bgcolor: 'rgba(10, 15, 26, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: 1.5,
                            mt: 1,
                          }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#64748b' }} />}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8' }}>
                              View {(b.tasks || b.maintenance_tasks)?.length || 1} Bundled Department Requisitions
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 1 }}>
                            {(b.tasks || b.maintenance_tasks)?.map((t: any) => (
                              <Box
                                key={t.request_id}
                                sx={{
                                  mb: 0.8,
                                  p: 1.2,
                                  bgcolor: 'rgba(15, 23, 42, 0.9)',
                                  borderRadius: 1.5,
                                  border: '1px solid rgba(255, 255, 255, 0.06)',
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#60a5fa' }}>
                                    [{t.department}] {t.request_id} • {t.defect_type}
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<PsychologyIcon sx={{ fontSize: 13 }} />}
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '0.68rem',
                                      py: 0.2,
                                      px: 0.8,
                                      bgcolor: 'rgba(168, 85, 247, 0.1)',
                                      color: '#c084fc',
                                      border: '1px solid rgba(168, 85, 247, 0.3)',
                                      '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.2)' },
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExplainTask(t.request_id);
                                    }}
                                  >
                                    Explain Risk
                                  </Button>
                                </Box>
                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                                  KM {t.from_km} to {t.to_km} • Priority Score: <strong style={{ color: '#fbbf24' }}>{t.priority_score}</strong>
                                </Typography>
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<SecurityIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBlock(b);
                              setSafetyDialogOpen(true);
                            }}
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              py: 0.6,
                              px: 1.5,
                              borderRadius: 1.5,
                              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              },
                            }}
                          >
                            Safety Handshake (Form T/351)
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
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
