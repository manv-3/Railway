import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress,
  ToggleButtonGroup, ToggleButton, TextField, InputAdornment,
  Snackbar, Tooltip, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SecurityIcon from '@mui/icons-material/Security';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import ShieldIcon from '@mui/icons-material/Shield';
import MapIcon from '@mui/icons-material/Map';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TimelineIcon from '@mui/icons-material/Timeline';
import ConstructionIcon from '@mui/icons-material/Construction';
import EngineeringIcon from '@mui/icons-material/Engineering';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { CorridorMap } from '../components/CorridorMap';
import { YardInterlockingSchematic } from '../components/YardInterlockingSchematic';
import { CorridorStringChart } from '../components/CorridorStringChart';
import { SafetyMemoDialog } from '../components/SafetyMemoDialog';
import { SHAPExplainDialog } from '../components/SHAPExplainDialog';
import { WhatIfComparisonDialog } from '../components/WhatIfComparisonDialog';
import { OptimizerBenchmarkModal } from '../components/OptimizerBenchmarkModal';
import { TrainDetailDialog } from '../components/TrainDetailDialog';
import { Station, Section, MaintenanceBlock, OptimizationMetrics, CorridorTrain } from '../types';
import { getTrainByNumber } from '../data/corridorTrains';
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
  const [viewMode, setViewMode] = useState<'timeline' | 'gis' | 'schematic'>('timeline');
  const [schematicStation, setSchematicStation] = useState<'GZB' | 'ALJN'>('GZB');
  const [safetyDialogOpen, setSafetyDialogOpen] = useState(false);

  // Train Tactical Inspector states
  const [selectedTrain, setSelectedTrain] = useState<CorridorTrain | null>(null);
  const [trainDialogOpen, setTrainDialogOpen] = useState<boolean>(false);

  const handleInspectTrain = (trainOrNumber: CorridorTrain | string) => {
    if (typeof trainOrNumber === 'string') {
      const found = getTrainByNumber(trainOrNumber);
      if (found) {
        setSelectedTrain(found);
        setTrainDialogOpen(true);
      }
    } else {
      setSelectedTrain(trainOrNumber);
      setTrainDialogOpen(true);
    }
  };

  // Phase 2: What-If & SHAP states
  const [whatIfResult, setWhatIfResult] = useState<any | null>(null);
  const [whatIfDialogOpen, setWhatIfDialogOpen] = useState(false);
  const [shapData, setShapData] = useState<any | null>(null);
  const [shapDialogOpen, setShapDialogOpen] = useState(false);

  // Search and Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUPER' | 'PLANNED' | 'SANCTIONED' | 'FIT_RESTORED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);

  // Interactive regulation state for real-life usability
  const [regulatedTrain, setRegulatedTrain] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const st = await getCorridorStations();
      const sec = await getCorridorSections();
      const blk = await getBlocks('DIV_DLI');
      setStations(st);
      setSections(sec);
      setBlocks(blk);
      if (blk.length > 0 && !selectedBlock) {
        setSelectedBlock(blk[0]);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Real-time WebSocket broadcasts across all tiers
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
      setToastMessage(`✅ Track Fit certified on ${data.section_id}. Caution Order active.`);
      loadData();
    });

    const unSubReq = wsService.on('REQUEST_CREATED', (data) => {
      setToastMessage(`🆕 New [${data.department}] Requisition: ${data.defect_type}`);
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
      setToastMessage('🚀 CP-SAT Engine solved optimal conflict-free maintenance plan.');
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

  // Filter blocks
  const superCount = blocks.filter((b) => b.is_combined).length;
  const plannedCount = blocks.filter((b) => b.status === 'PLANNED').length;
  const sanctionedCount = blocks.filter((b) => b.status === 'SANCTIONED').length;
  const fitCount = blocks.filter((b) => b.status === 'FIT_RESTORED').length;

  const filteredBlocks = blocks.filter((b) => {
    if (statusFilter === 'SUPER' && !b.is_combined) return false;
    if (statusFilter === 'PLANNED' && b.status !== 'PLANNED') return false;
    if (statusFilter === 'SANCTIONED' && b.status !== 'SANCTIONED') return false;
    if (statusFilter === 'FIT_RESTORED' && b.status !== 'FIT_RESTORED') return false;

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

  const selectedTasks = selectedBlock ? (selectedBlock.tasks || selectedBlock.maintenance_tasks || []) : [];

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f8fafc',
        color: '#0f172a',
      }}
    >
      {/* ─── TOP COMMAND STRIP (48px) ────────────────────────────────────────── */}
      <Box
        sx={{
          height: 48,
          flexShrink: 0,
          borderBottom: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          gap: 2,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Left: Corridor & TCAS Telemetry */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#059669',
                boxShadow: '0 0 8px #059669',
              }}
            />
            <Typography
              variant="subtitle2"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 800,
                color: '#0f2b5c',
                fontSize: '0.85rem',
                letterSpacing: '-0.01em',
              }}
            >
              NDLS ⇄ CNB
            </Typography>
            <Chip
              label="GOLDEN CORRIDOR"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                bgcolor: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
              }}
            />
          </Box>

          <Box sx={{ height: 16, width: '1px', bgcolor: '#cbd5e1' }} />

          <Tooltip title="Click to inspect active corridor trains fleet and punctuality">
            <Chip
              icon={<DirectionsTransitIcon sx={{ fontSize: '13px !important', color: '#059669 !important' }} />}
              label="58 Live Trains • Radar"
              size="small"
              clickable
              onClick={() => handleInspectTrain('22436')}
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 800,
                bgcolor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                '&:hover': { bgcolor: '#d1fae5' },
              }}
            />
          </Tooltip>

          <Chip
            icon={<ShieldIcon sx={{ fontSize: '13px !important', color: '#d97706 !important' }} />}
            label="Kavach TCAS L2 Active"
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
            }}
          />
        </Box>

        {/* Center: Inline Key Metrics Telemetry Strip */}
        <Box sx={{ display: { xs: 'none', xl: 'flex' }, alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.8,
              py: 0.35,
              borderRadius: 2,
              bgcolor: '#f1f5f9',
              border: '1px solid #e2e8f0',
            }}
          >
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
              Availability:{' '}
              <strong style={{ color: '#059669', fontFamily: '"JetBrains Mono", monospace' }}>
                +{metrics ? metrics.asset_availability_gain_percent.toFixed(1) : '32.4'}%
              </strong>
            </Typography>
            <Box sx={{ height: 12, width: '1px', bgcolor: '#cbd5e1' }} />
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
              Saved:{' '}
              <strong style={{ color: '#0284c7', fontFamily: '"JetBrains Mono", monospace' }}>
                {metrics ? metrics.time_saved_hours.toFixed(1) : '21.1'}h
              </strong>
            </Typography>
            <Box sx={{ height: 12, width: '1px', bgcolor: '#cbd5e1' }} />
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
              Detentions:{' '}
              <strong style={{ color: '#0f2b5c', fontFamily: '"JetBrains Mono", monospace' }}>
                0
              </strong>
            </Typography>
            <Box sx={{ height: 12, width: '1px', bgcolor: '#cbd5e1' }} />
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
              Bundling Multiplier:{' '}
              <strong style={{ color: '#d97706', fontFamily: '"JetBrains Mono", monospace' }}>
                {metrics ? `${(metrics.scheduled_requests / (metrics.total_blocks_created || 1)).toFixed(1)}x` : '3.8x'}
              </strong>
            </Typography>
          </Box>
        </Box>

        {/* Right: Tactical Action Triggers */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CompareArrowsIcon sx={{ fontSize: 15 }} />}
            onClick={() => setBenchmarkOpen(true)}
            disabled={loading}
            sx={{
              height: 28,
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: 1.5,
              borderColor: '#cbd5e1',
              color: '#1e40af',
              bgcolor: '#ffffff',
              '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
            }}
          >
            Benchmark ROI
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<AccessTimeIcon sx={{ fontSize: 15 }} />}
            onClick={handleSimulateTrainDelay}
            disabled={loading}
            sx={{
              height: 28,
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: 1.5,
              borderColor: '#fde68a',
              color: '#b45309',
              bgcolor: '#fffbeb',
              '&:hover': { bgcolor: '#fef3c7', borderColor: '#f59e0b' },
            }}
          >
            What-If: VB +45m
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<WarningAmberIcon sx={{ fontSize: 15 }} />}
            onClick={handleSimulateEmergencyFracture}
            disabled={loading}
            sx={{
              height: 28,
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: 1.5,
              borderColor: '#fecaca',
              color: '#b91c1c',
              bgcolor: '#fef2f2',
              '&:hover': { bgcolor: '#fee2e2', borderColor: '#ef4444' },
            }}
          >
            What-If: Rail Fracture
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
            onClick={handleRunOptimization}
            disabled={loading}
            sx={{
              height: 30,
              fontSize: '0.75rem',
              fontWeight: 800,
              px: 1.8,
              borderRadius: 1.5,
              bgcolor: '#0f2b5c',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(15, 43, 92, 0.25)',
              '&:hover': {
                bgcolor: '#1e3a8a',
                boxShadow: '0 4px 10px rgba(15, 43, 92, 0.35)',
              },
            }}
          >
            {loading ? 'SOLVING CP-SAT…' : '⚡ AUTO-PLAN (CP-SAT)'}
          </Button>
        </Box>
      </Box>

      {/* ─── 3-PANE MASTER WORKSTATION ────────────────────────────────────────── */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── PANE 1: POSSESSION QUEUE & REQUISITIONS (Left 28%) ── */}
        <Box
          sx={{
            width: '28%',
            minWidth: 320,
            maxWidth: 400,
            flexShrink: 0,
            borderRight: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Queue Header & Filters */}
          <Box sx={{ p: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.04em', color: '#0f2b5c' }}>
                  POSSESSION QUEUE
                </Typography>
                <Chip
                  label={`${filteredBlocks.length} / ${blocks.length}`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    bgcolor: '#eff6ff',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                Divisional Slot Board
              </Typography>
            </Box>

            {/* Quick Search */}
            <TextField
              size="small"
              fullWidth
              placeholder="Search block, section, defect..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.2 }}>
                      <CloseIcon sx={{ fontSize: 14, color: '#64748b' }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  height: 32,
                  fontSize: '0.75rem',
                  bgcolor: '#ffffff',
                  borderRadius: 1.5,
                },
              }}
            />

            {/* Status Filter Pills */}
            <Box sx={{ display: 'flex', gap: 0.6, mt: 1, overflowX: 'auto', pb: 0.2 }}>
              {[
                { id: 'ALL', label: `All (${blocks.length})` },
                { id: 'SUPER', label: `Super (${superCount})`, highlight: '#b45309' },
                { id: 'PLANNED', label: `Plan (${plannedCount})` },
                { id: 'SANCTIONED', label: `Sanct (${sanctionedCount})` },
                { id: 'FIT_RESTORED', label: `Fit (${fitCount})` },
              ].map((f) => {
                const isActive = statusFilter === f.id;
                return (
                  <Chip
                    key={f.id}
                    label={f.label}
                    size="small"
                    onClick={() => setStatusFilter(f.id as any)}
                    sx={{
                      height: 22,
                      fontSize: '0.67rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: isActive ? '#0f2b5c' : '#ffffff',
                      color: isActive ? '#ffffff' : '#475569',
                      border: isActive ? '1px solid #0f2b5c' : '1px solid #cbd5e1',
                      '&:hover': {
                        bgcolor: isActive ? '#0f2b5c' : '#f1f5f9',
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Queue Scrollable Cards */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 1.2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              bgcolor: '#f8fafc',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' },
            }}
          >
            {filteredBlocks.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  No possessions match your active filter.
                </Typography>
              </Box>
            ) : (
              filteredBlocks.map((b) => {
                const isSelected = selectedBlock?.block_id === b.block_id;
                const tasks = b.tasks || b.maintenance_tasks || [];
                const isSuper = b.is_combined;

                return (
                  <Box
                    key={b.id || b.block_id}
                    onClick={() => {
                      setSelectedBlock(b);
                      if (b.section_id?.includes('ALJN')) setSchematicStation('ALJN');
                      else setSchematicStation('GZB');
                    }}
                    sx={{
                      p: 1.2,
                      borderRadius: 1.8,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isSelected ? '1.5px solid #0f2b5c' : '1px solid #e2e8f0',
                      borderLeft: `4px solid ${
                        b.status === 'FIT_RESTORED'
                          ? '#059669'
                          : isSuper
                          ? '#d97706'
                          : '#2563eb'
                      }`,
                      bgcolor: isSelected ? '#eff6ff' : '#ffffff',
                      boxShadow: isSelected
                        ? '0 2px 8px rgba(15, 43, 92, 0.12)'
                        : '0 1px 2px rgba(0,0,0,0.03)',
                      '&:hover': {
                        border: isSelected ? '1.5px solid #0f2b5c' : '1px solid #cbd5e1',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    {/* Card Top: ID + Super Tag + Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: 800,
                            color: isSelected ? '#0f2b5c' : '#1e293b',
                            fontSize: '0.8rem',
                          }}
                        >
                          {b.block_id}
                        </Typography>
                        {isSuper && (
                          <Chip
                            label="SUPER-BLOCK"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.58rem',
                              fontWeight: 800,
                              bgcolor: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                            }}
                          />
                        )}
                      </Box>
                      <Chip
                        label={b.status}
                        size="small"
                        sx={{
                          height: 17,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          bgcolor:
                            b.status === 'FIT_RESTORED'
                              ? '#ecfdf5'
                              : b.status === 'SANCTIONED'
                              ? '#eff6ff'
                              : '#f1f5f9',
                          color:
                            b.status === 'FIT_RESTORED'
                              ? '#047857'
                              : b.status === 'SANCTIONED'
                              ? '#1e40af'
                              : '#475569',
                          border:
                            b.status === 'FIT_RESTORED'
                              ? '1px solid #a7f3d0'
                              : b.status === 'SANCTIONED'
                              ? '1px solid #bfdbfe'
                              : '1px solid #cbd5e1',
                        }}
                      />
                    </Box>

                    {/* Card Middle: Section & Duration */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                      <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.72rem', fontWeight: 600 }}>
                        {b.section_id}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color: '#0284c7',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        ⏱️ {b.duration_minutes || b.total_duration_minutes}m slot
                      </Typography>
                    </Box>

                    {/* Card Bottom: Bundled Departments & Task Count */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {tasks.slice(0, 3).map((t: any, idx: number) => {
                          const isTms = t.department === 'TMS';
                          const isSmms = t.department === 'SMMS';
                          return (
                            <Chip
                              key={idx}
                              label={t.department}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                bgcolor: isTms ? '#ecfdf5' : isSmms ? '#fffbeb' : '#ecfeff',
                                color: isTms ? '#047857' : isSmms ? '#b45309' : '#0e7490',
                                border: `1px solid ${isTms ? '#a7f3d0' : isSmms ? '#fde68a' : '#a5f3fc'}`,
                              }}
                            />
                          );
                        })}
                        {tasks.length > 3 && (
                          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#64748b' }}>
                            +{tasks.length - 3}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                        {tasks.length || 1} bundled {tasks.length === 1 ? 'task' : 'tasks'}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* ── PANE 2: INTERACTIVE VISUAL CENTERPIECE (Center 44%) ── */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          {/* Canvas Sub-Header with 3 View Switchers */}
          <Box
            sx={{
              height: 42,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              borderBottom: '1px solid #e2e8f0',
              bgcolor: '#f8fafc',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  color: '#0f2b5c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                }}
              >
                {viewMode === 'timeline' ? (
                  <>
                    <TimelineIcon sx={{ fontSize: 16, color: '#0284c7' }} />
                    COA TIME-DISTANCE STRING CHART (24H TRAFFIC TIMETABLE)
                  </>
                ) : viewMode === 'gis' ? (
                  <>
                    <MapIcon sx={{ fontSize: 16, color: '#059669' }} />
                    GIS TRACK TOPOLOGY (UP/DOWN MAIN LINES)
                  </>
                ) : (
                  <>
                    <AccountTreeIcon sx={{ fontSize: 16, color: '#d97706' }} />
                    JUNCTION INTERLOCKING & SIGNAL ENVELOPE ({schematicStation})
                  </>
                )}
              </Typography>
              {selectedBlock && (
                <Chip
                  label={`Focused: ${selectedBlock.section_id}`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    bgcolor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                  }}
                />
              )}
            </Box>

            {/* View Switcher Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, val) => val && setViewMode(val)}
                size="small"
                sx={{ height: 26 }}
              >
                <ToggleButton
                  value="timeline"
                  sx={{
                    fontWeight: 700,
                    px: 1.2,
                    fontSize: '0.68rem',
                    color: '#475569',
                    borderColor: '#cbd5e1',
                    '&.Mui-selected': { bgcolor: '#0f2b5c', color: '#ffffff' },
                  }}
                >
                  STRING CHART
                </ToggleButton>
                <ToggleButton
                  value="gis"
                  sx={{
                    fontWeight: 700,
                    px: 1.2,
                    fontSize: '0.68rem',
                    color: '#475569',
                    borderColor: '#cbd5e1',
                    '&.Mui-selected': { bgcolor: '#0f2b5c', color: '#ffffff' },
                  }}
                >
                  GIS MAP
                </ToggleButton>
                <ToggleButton
                  value="schematic"
                  sx={{
                    fontWeight: 700,
                    px: 1.2,
                    fontSize: '0.68rem',
                    color: '#475569',
                    borderColor: '#cbd5e1',
                    '&.Mui-selected': { bgcolor: '#0f2b5c', color: '#ffffff' },
                  }}
                >
                  YARD
                </ToggleButton>
              </ToggleButtonGroup>

              {viewMode === 'schematic' && (
                <ToggleButtonGroup
                  value={schematicStation}
                  exclusive
                  onChange={(_, val) => val && setSchematicStation(val)}
                  size="small"
                  sx={{ height: 26 }}
                >
                  <ToggleButton
                    value="GZB"
                    sx={{
                      fontWeight: 700,
                      px: 1,
                      fontSize: '0.68rem',
                      color: '#475569',
                      borderColor: '#cbd5e1',
                      '&.Mui-selected': { bgcolor: '#d97706', color: '#ffffff' },
                    }}
                  >
                    GZB
                  </ToggleButton>
                  <ToggleButton
                    value="ALJN"
                    sx={{
                      fontWeight: 700,
                      px: 1,
                      fontSize: '0.68rem',
                      color: '#475569',
                      borderColor: '#cbd5e1',
                      '&.Mui-selected': { bgcolor: '#d97706', color: '#ffffff' },
                    }}
                  >
                    ALJN
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            </Box>
          </Box>

          {/* Canvas Viewport Body */}
          <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', p: 1, bgcolor: '#f8fafc' }}>
            {viewMode === 'timeline' ? (
              <CorridorStringChart
                selectedBlock={selectedBlock}
                onSelectBlock={(b) => setSelectedBlock(b)}
                onSelectTrain={handleInspectTrain}
                blocks={blocks}
              />
            ) : viewMode === 'gis' ? (
              <CorridorMap
                stations={stations}
                sections={sections}
                blocks={blocks}
                selectedBlockId={selectedBlock?.block_id}
                selectedTrainNumber={selectedTrain?.train_number}
                onSelectTrain={handleInspectTrain}
                onSelectBlock={(b) => {
                  setSelectedBlock(b);
                  if (b.section_id?.includes('ALJN')) setSchematicStation('ALJN');
                  else setSchematicStation('GZB');
                }}
                height="100%"
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  border: '1px solid #cbd5e1',
                  overflowY: 'auto',
                }}
              >
                <YardInterlockingSchematic
                  stationCode={schematicStation}
                  activeBlock={selectedBlock?.block_id}
                />

                {selectedBlock && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#fef2f2',
                      border: '1px solid #fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: '#dc2626',
                        boxShadow: '0 0 8px #dc2626',
                      }}
                    />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#b91c1c', display: 'block' }}>
                        AUTOMATIC RED ENVELOPE LOCKED — {selectedBlock.block_id}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
                        Signals holding absolute stop under G&SR 2026. Point machines locked to prevent routing into possession zone on {selectedBlock.section_id}.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* ── PANE 3: TACTICAL INSPECTOR & SAFETY HANDSHAKE (Right 28%) ── */}
        <Box
          sx={{
            width: '28%',
            minWidth: 330,
            maxWidth: 420,
            flexShrink: 0,
            bgcolor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Inspector Header */}
          <Box
            sx={{
              height: 42,
              flexShrink: 0,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e2e8f0',
              bgcolor: '#f8fafc',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.04em', color: '#0f2b5c' }}>
              TACTICAL INSPECTOR
            </Typography>
            {selectedBlock && (
              <Chip
                label={selectedBlock.block_id}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  fontFamily: '"JetBrains Mono", monospace',
                  bgcolor: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                }}
              />
            )}
          </Box>

          {/* Inspector Scrollable Body */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: '#f8fafc',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' },
            }}
          >
            {!selectedBlock ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                }}
              >
                <FlashOnIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c', mb: 1 }}>
                  No Possession Selected
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', maxWidth: 260 }}>
                  Click any possession block from the queue or tap a section node on the string chart to inspect live operational parameters and execute handshakes.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Block Telemetry Overview */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                      SECTION & CORRIDOR
                    </Typography>
                    <Chip
                      label={selectedBlock.is_combined ? 'SUPER-BLOCK' : 'SINGLE DEPT'}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: selectedBlock.is_combined ? '#fffbeb' : '#eff6ff',
                        color: selectedBlock.is_combined ? '#b45309' : '#1e40af',
                        border: selectedBlock.is_combined ? '1px solid #fde68a' : '1px solid #bfdbfe',
                      }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f2b5c', mb: 0.5 }}>
                    {selectedBlock.section_id}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>
                        Duration
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0284c7', fontFamily: '"JetBrains Mono", monospace' }}>
                        {selectedBlock.duration_minutes || selectedBlock.total_duration_minutes} Mins
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>
                        G&SR Status
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669' }}>
                        {selectedBlock.status === 'FIT_RESTORED' ? 'Fit Restored' : 'Form T/351 Ready'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>
                        Bundled Work
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#d97706' }}>
                        {selectedTasks.length || 1} Departments
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* AI Reasoner & Operational Trade-Off Card */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    position: 'relative',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                    <PsychologyIcon sx={{ fontSize: 18, color: '#1e40af' }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.02em' }}>
                      AI REASONER & CORRIDOR TRADE-OFF
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#1e293b', display: 'block', mb: 1.2, lineHeight: 1.45 }}>
                    {selectedBlock.explanation?.summary ||
                      `CP-SAT Solver scheduled this slot during optimal freight headway window to eliminate passenger timetable conflicts on ${selectedBlock.section_id}.`}
                  </Typography>

                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: '#ffffff',
                      border: '1px solid #93c5fd',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>
                      Operational Trade-off:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.7rem', display: 'block', mt: 0.2 }}>
                      {selectedBlock.explanation?.tradeoff ||
                        'Zero Vande Bharat (22436) / Rajdhani delays. Freight rake 4122 routed to ALJN loop line.'}
                    </Typography>
                  </Box>
                </Box>

                {/* ── REAL-LIFE FEATURE: Train Conflict & Regulation Matrix ── */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <DirectionsTransitIcon sx={{ fontSize: 16, color: '#0f2b5c' }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                        TRAIN CONFLICT & REGULATION MATRIX
                      </Typography>
                    </Box>
                    <Chip label="Section Impact" size="small" sx={{ height: 17, fontSize: '0.6rem', bgcolor: '#f1f5f9', color: '#475569' }} />
                  </Box>

                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 0.5, fontSize: '0.68rem', fontWeight: 700 }}>Train</TableCell>
                          <TableCell sx={{ py: 0.5, fontSize: '0.68rem', fontWeight: 700 }}>ETA</TableCell>
                          <TableCell sx={{ py: 0.5, fontSize: '0.68rem', fontWeight: 700 }}>Regulation Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow
                          hover
                          onClick={() => handleInspectTrain('22436')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#eff6ff' } }}
                        >
                          <TableCell sx={{ py: 0.6, fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#0284c7' }}>
                            22436 VB 🔍
                          </TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.68rem' }}>07:42</TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                            Green Path (Clear)
                          </TableCell>
                        </TableRow>
                        <TableRow
                          hover
                          onClick={() => handleInspectTrain('12004')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#eff6ff' } }}
                        >
                          <TableCell sx={{ py: 0.6, fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#7c3aed' }}>
                            12004 LKO 🔍
                          </TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.68rem' }}>08:15</TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                            Alternate Line (0m)
                          </TableCell>
                        </TableRow>
                        <TableRow
                          hover
                          onClick={() => handleInspectTrain('BOXN-4122')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#eff6ff' } }}
                        >
                          <TableCell sx={{ py: 0.6, fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#059669' }}>
                            BOXN-4122 🔍
                          </TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.68rem' }}>09:10</TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.68rem' }}>
                            {regulatedTrain === 'BOXN' ? (
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: '11px !important', color: '#059669 !important' }} />}
                                label="Loop Line Regulated"
                                size="small"
                                sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#ecfdf5', color: '#047857' }}
                              />
                            ) : (
                              <Button
                                size="small"
                                onClick={() => {
                                  setRegulatedTrain('BOXN');
                                  setToastMessage('✅ Freight BOXN-4122 diverted to ALJN Loop 2. 0m Passenger delay.');
                                }}
                                sx={{ height: 18, fontSize: '0.6rem', p: 0.5, bgcolor: '#fef3c7', color: '#b45309' }}
                              >
                                Regulate at Loop
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* ── REAL-LIFE FEATURE: Track Machine & Gang Allocation ── */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <ConstructionIcon sx={{ fontSize: 16, color: '#d97706' }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                        TRACK MACHINE & GANG ROSTER
                      </Typography>
                    </Box>
                    <Chip label="Active Deployment" size="small" sx={{ height: 17, fontSize: '0.6rem', bgcolor: '#fffbeb', color: '#b45309' }} />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.8, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f2b5c', display: 'block' }}>
                          BCM-341 (Ballast Cleaning Machine)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.66rem' }}>
                          Staged at GZB Siding 3 • Transit Clearance OK
                        </Typography>
                      </Box>
                      <Chip label="Ready" size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700 }} />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.8, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f2b5c', display: 'block' }}>
                          Tower Wagon TW-14 (OHE Isolator)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.66rem' }}>
                          TPC Power Block Approved • ALJN Depot
                        </Typography>
                      </Box>
                      <Chip label="Allocated" size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700 }} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, p: 0.8, bgcolor: '#f1f5f9', borderRadius: 1.5 }}>
                      <EngineeringIcon sx={{ fontSize: 16, color: '#475569' }} />
                      <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.68rem', fontWeight: 600 }}>
                        In-Charge: <strong>SSE/P-Way/ALJN Shri R.K. Sharma</strong> • 24 Trackmen Muster Roster
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Bundled Requisitions List */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c', letterSpacing: '0.03em' }}>
                      BUNDLED REQUISITIONS ({selectedTasks.length})
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                      Joint Maintenance Pack
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedTasks.map((t: any, idx: number) => {
                      const isTms = t.department === 'TMS';
                      const isSmms = t.department === 'SMMS';
                      return (
                        <Box
                          key={t.request_id || idx}
                          sx={{
                            p: 1.2,
                            borderRadius: 1.8,
                            bgcolor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Chip
                                label={t.department}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  bgcolor: isTms ? '#ecfdf5' : isSmms ? '#fffbeb' : '#ecfeff',
                                  color: isTms ? '#047857' : isSmms ? '#b45309' : '#0e7490',
                                  border: `1px solid ${isTms ? '#a7f3d0' : isSmms ? '#fde68a' : '#a5f3fc'}`,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: '"JetBrains Mono", monospace',
                                  color: '#0f2b5c',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                }}
                              >
                                {t.request_id}
                              </Typography>
                            </Box>

                            <Tooltip title="View SHAP feature importance & risk drivers">
                              <Button
                                size="small"
                                startIcon={<PsychologyIcon sx={{ fontSize: 13 }} />}
                                onClick={() => handleExplainTask(t.request_id)}
                                sx={{
                                  height: 22,
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  py: 0.2,
                                  px: 0.8,
                                  bgcolor: '#f5f3ff',
                                  color: '#7c3aed',
                                  border: '1px solid #ddd6fe',
                                  '&:hover': { bgcolor: '#ede9fe' },
                                }}
                              >
                                Explain Risk
                              </Button>
                            </Tooltip>
                          </Box>

                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.78rem', mb: 0.4 }}>
                            {t.defect_type}
                          </Typography>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                              KM {t.from_km} - {t.to_km}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                Risk Score:
                              </Typography>
                              <Chip
                                label={t.priority_score}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  bgcolor: t.priority_score > 85 ? '#fef2f2' : '#fffbeb',
                                  color: t.priority_score > 85 ? '#dc2626' : '#d97706',
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </>
            )}
          </Box>

          {/* Sticky Bottom Action Footer: Form T/351 Safety Handshake */}
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
            }}
          >
            <Button
              fullWidth
              variant="contained"
              disabled={!selectedBlock}
              startIcon={<SecurityIcon />}
              onClick={() => setSafetyDialogOpen(true)}
              sx={{
                py: 1.1,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: '0.82rem',
                letterSpacing: '0.02em',
                bgcolor: '#0f2b5c',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(15, 43, 92, 0.25)',
                '&:hover': {
                  bgcolor: '#1e3a8a',
                  boxShadow: '0 4px 12px rgba(15, 43, 92, 0.35)',
                },
              }}
            >
              SAFETY HANDSHAKE (FORM T/351)
            </Button>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#64748b', fontSize: '0.65rem', mt: 0.6 }}>
              Joint Disconnection Memo & Caution Order Under G&SR 2026
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ─── MODALS & DIALOGS ─────────────────────────────────────────────────── */}
      <SafetyMemoDialog
        block={selectedBlock}
        open={safetyDialogOpen}
        onClose={() => setSafetyDialogOpen(false)}
        onRefresh={loadData}
      />

      <SHAPExplainDialog
        open={shapDialogOpen}
        onClose={() => setShapDialogOpen(false)}
        data={shapData}
      />

      <WhatIfComparisonDialog
        open={whatIfDialogOpen}
        onClose={() => setWhatIfDialogOpen(false)}
        onAcceptReplan={handleAcceptWhatIf}
        result={whatIfResult}
      />

      <OptimizerBenchmarkModal
        open={benchmarkOpen}
        onClose={() => setBenchmarkOpen(false)}
        divisionId="DIV_DLI"
      />

      <TrainDetailDialog
        open={trainDialogOpen}
        train={selectedTrain}
        onClose={() => setTrainDialogOpen(false)}
        onSelectTrain={(t) => setSelectedTrain(t)}
      />

      {/* Real-time Toast Notifications */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default DivisionalControlCockpit;
