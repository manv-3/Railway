import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress,
  ToggleButtonGroup, ToggleButton, TextField, InputAdornment,
  Snackbar, Tooltip, IconButton
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
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CloseIcon from '@mui/icons-material/Close';

import { CorridorMap } from '../components/CorridorMap';
import { YardInterlockingSchematic } from '../components/YardInterlockingSchematic';
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

  // Search and Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUPER' | 'PLANNED' | 'SANCTIONED' | 'FIT_RESTORED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
        bgcolor: '#080c14',
        color: '#f8fafc',
      }}
    >
      {/* ─── TOP COMMAND STRIP (46px) ────────────────────────────────────────── */}
      <Box
        sx={{
          height: 48,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(11, 15, 25, 0.95)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          gap: 2,
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
                bgcolor: '#10b981',
                boxShadow: '0 0 10px #10b981',
                animation: 'pulse 2s infinite',
              }}
            />
            <Typography
              variant="subtitle2"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 800,
                color: '#f8fafc',
                fontSize: '0.82rem',
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
                bgcolor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            />
          </Box>

          <Box sx={{ height: 16, width: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />

          <Chip
            icon={<DirectionsTransitIcon sx={{ fontSize: '13px !important', color: '#10b981 !important' }} />}
            label="58 Live Trains"
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          />

          <Chip
            icon={<ShieldIcon sx={{ fontSize: '13px !important', color: '#06b6d4 !important' }} />}
            label="Kavach TCAS L2 Active"
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: 'rgba(6, 182, 212, 0.1)',
              color: '#22d3ee',
              border: '1px solid rgba(6, 182, 212, 0.25)',
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
              px: 1.5,
              py: 0.3,
              borderRadius: 2,
              bgcolor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Availability:{' '}
              <strong style={{ color: '#10b981', fontFamily: '"JetBrains Mono", monospace' }}>
                +{metrics ? metrics.asset_availability_gain_percent.toFixed(1) : '32.4'}%
              </strong>
            </Typography>
            <Box sx={{ height: 12, width: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Saved:{' '}
              <strong style={{ color: '#06b6d4', fontFamily: '"JetBrains Mono", monospace' }}>
                {metrics ? metrics.time_saved_hours.toFixed(1) : '21.1'}h
              </strong>
            </Typography>
            <Box sx={{ height: 12, width: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Detentions:{' '}
              <strong style={{ color: '#a855f7', fontFamily: '"JetBrains Mono", monospace' }}>
                0
              </strong>
            </Typography>
            <Box sx={{ height: 12, width: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Bundling Multiplier:{' '}
              <strong style={{ color: '#f59e0b', fontFamily: '"JetBrains Mono", monospace' }}>
                {metrics ? `${(metrics.scheduled_requests / (metrics.total_blocks_created || 1)).toFixed(1)}x` : '3.8x'}
              </strong>
            </Typography>
          </Box>
        </Box>

        {/* Right: Tactical Triggers */}
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
              fontWeight: 800,
              borderRadius: 1.5,
              borderColor: 'rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              bgcolor: 'rgba(59, 130, 246, 0.08)',
              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)', borderColor: '#60a5fa' },
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
              fontWeight: 800,
              borderRadius: 1.5,
              borderColor: 'rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              bgcolor: 'rgba(245, 158, 11, 0.08)',
              '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)', borderColor: '#fbbf24' },
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
              fontWeight: 800,
              borderRadius: 1.5,
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)', borderColor: '#f87171' },
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
              fontWeight: 900,
              px: 1.8,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.55)',
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
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            bgcolor: 'rgba(11, 15, 25, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Queue Header & Filters */}
          <Box sx={{ p: 1.5, pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: '0.05em', color: '#94a3b8' }}>
                  POSSESSION QUEUE
                </Typography>
                <Chip
                  label={`${filteredBlocks.length} / ${blocks.length}`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
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
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 1.5,
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                },
              }}
            />

            {/* Status Filter Pills */}
            <Box sx={{ display: 'flex', gap: 0.6, mt: 1, overflowX: 'auto', pb: 0.2 }}>
              {[
                { id: 'ALL', label: `All (${blocks.length})` },
                { id: 'SUPER', label: `Super (${superCount})`, highlight: '#f59e0b' },
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
                      fontWeight: 800,
                      cursor: 'pointer',
                      bgcolor: isActive ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? (f.highlight || '#60a5fa') : '#94a3b8',
                      border: isActive
                        ? `1px solid ${f.highlight || '#3b82f6'}`
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.15)',
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
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
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
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isSelected
                        ? '1.5px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderLeft: `4px solid ${
                        b.status === 'FIT_RESTORED'
                          ? '#10b981'
                          : isSuper
                          ? '#f59e0b'
                          : '#3b82f6'
                      }`,
                      bgcolor: isSelected
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'rgba(15, 23, 42, 0.75)',
                      boxShadow: isSelected
                        ? '0 0 15px rgba(16, 185, 129, 0.25)'
                        : '0 2px 8px rgba(0,0,0,0.3)',
                      '&:hover': {
                        border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.18)',
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
                            color: isSelected ? '#34d399' : '#f8fafc',
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
                              fontWeight: 900,
                              bgcolor: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
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
                          fontWeight: 800,
                          bgcolor:
                            b.status === 'FIT_RESTORED'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : b.status === 'SANCTIONED'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(148, 163, 184, 0.1)',
                          color:
                            b.status === 'FIT_RESTORED'
                              ? '#34d399'
                              : b.status === 'SANCTIONED'
                              ? '#60a5fa'
                              : '#94a3b8',
                          border:
                            b.status === 'FIT_RESTORED'
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : b.status === 'SANCTIONED'
                              ? '1px solid rgba(59, 130, 246, 0.3)'
                              : '1px solid rgba(148, 163, 184, 0.2)',
                        }}
                      />
                    </Box>

                    {/* Card Middle: Section & Duration */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                      <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 600 }}>
                        {b.section_id}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color: '#22d3ee',
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
                          const deptColor =
                            t.department === 'TMS' ? '#10b981' : t.department === 'SMMS' ? '#f59e0b' : '#06b6d4';
                          return (
                            <Chip
                              key={idx}
                              label={t.department}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                bgcolor: `${deptColor}15`,
                                color: deptColor,
                                border: `1px solid ${deptColor}30`,
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
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            bgcolor: '#050811',
          }}
        >
          {/* Canvas Sub-Header */}
          <Box
            sx={{
              height: 42,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              bgcolor: 'rgba(15, 23, 42, 0.6)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                }}
              >
                {viewMode === 'gis' ? (
                  <>
                    <MapIcon sx={{ fontSize: 15 }} />
                    GIS TRACK TOPOLOGY • DIRECTIONAL UP/DOWN MAIN LINES
                  </>
                ) : (
                  <>
                    <AccountTreeIcon sx={{ fontSize: 15 }} />
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
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
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
                  value="gis"
                  sx={{
                    fontWeight: 800,
                    px: 1.2,
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa' },
                  }}
                >
                  GIS MAP
                </ToggleButton>
                <ToggleButton
                  value="schematic"
                  sx={{
                    fontWeight: 800,
                    px: 1.2,
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa' },
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
                  sx={{ height: 26 }}
                >
                  <ToggleButton
                    value="GZB"
                    sx={{
                      fontWeight: 800,
                      px: 1,
                      fontSize: '0.68rem',
                      color: '#94a3b8',
                      borderColor: 'rgba(255,255,255,0.1)',
                      '&.Mui-selected': { bgcolor: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24' },
                    }}
                  >
                    GZB
                  </ToggleButton>
                  <ToggleButton
                    value="ALJN"
                    sx={{
                      fontWeight: 800,
                      px: 1,
                      fontSize: '0.68rem',
                      color: '#94a3b8',
                      borderColor: 'rgba(255,255,255,0.1)',
                      '&.Mui-selected': { bgcolor: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24' },
                    }}
                  >
                    ALJN
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            </Box>
          </Box>

          {/* Canvas Viewport Body */}
          <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
            {viewMode === 'gis' ? (
              <CorridorMap
                stations={stations}
                sections={sections}
                blocks={blocks}
                selectedBlockId={selectedBlock?.block_id}
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
                  bgcolor: '#070c18',
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
                      bgcolor: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
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
                        bgcolor: '#ef4444',
                        boxShadow: '0 0 10px #ef4444',
                      }}
                    />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#fbbf24', display: 'block' }}>
                        AUTOMATIC RED ENVELOPE LOCKED — {selectedBlock.block_id}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.72rem' }}>
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
            bgcolor: 'rgba(11, 15, 25, 0.75)',
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
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              bgcolor: 'rgba(15, 23, 42, 0.6)',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: '0.05em', color: '#94a3b8' }}>
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
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
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
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
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
                <FlashOnIcon sx={{ fontSize: 48, color: '#334155', mb: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#94a3b8', mb: 1 }}>
                  No Possession Selected
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', maxWidth: 260 }}>
                  Click any possession block from the left queue or tap a section node on the GIS map to inspect AI trade-offs and execute safety handshakes.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Block Telemetry Overview */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                      SECTION & CORRIDOR
                    </Typography>
                    <Chip
                      label={selectedBlock.is_combined ? 'SUPER-BLOCK' : 'SINGLE DEPT'}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: selectedBlock.is_combined ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: selectedBlock.is_combined ? '#fbbf24' : '#60a5fa',
                      }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
                    {selectedBlock.section_id}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>
                        Duration
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#22d3ee', fontFamily: '"JetBrains Mono", monospace' }}>
                        {selectedBlock.duration_minutes || selectedBlock.total_duration_minutes} Mins
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>
                        G&SR Status
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981' }}>
                        {selectedBlock.status === 'FIT_RESTORED' ? 'Fit Restored' : 'Form T/351 Ready'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>
                        Bundled Work
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#fbbf24' }}>
                        {selectedTasks.length || 1} Departments
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* AI Reasoner & Operational Trade-Off Card (Linear style) */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                    <PsychologyIcon sx={{ fontSize: 18, color: '#60a5fa' }} />
                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#93c5fd', letterSpacing: '0.02em' }}>
                      AI REASONER & CORRIDOR TRADE-OFF
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mb: 1.2, lineHeight: 1.45 }}>
                    {selectedBlock.explanation?.summary ||
                      `CP-SAT Solver scheduled this slot during optimal freight headway window to eliminate passenger timetable conflicts on ${selectedBlock.section_id}.`}
                  </Typography>

                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#fde047', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>
                      Operational Trade-off:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#fef08a', fontSize: '0.7rem', display: 'block', mt: 0.2 }}>
                      {selectedBlock.explanation?.tradeoff ||
                        'Zero Vande Bharat (22436) / Rajdhani delays. Freight rake 4122 routed to ALJN loop line.'}
                    </Typography>
                  </Box>
                </Box>

                {/* Bundled Requisitions List */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#94a3b8', letterSpacing: '0.04em' }}>
                      BUNDLED REQUISITIONS ({selectedTasks.length})
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                      Multi-Department Pack
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedTasks.map((t: any, idx: number) => {
                      const deptColor =
                        t.department === 'TMS' ? '#10b981' : t.department === 'SMMS' ? '#f59e0b' : '#06b6d4';
                      return (
                        <Box
                          key={t.request_id || idx}
                          sx={{
                            p: 1.2,
                            borderRadius: 1.8,
                            bgcolor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
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
                                  fontWeight: 900,
                                  bgcolor: `${deptColor}15`,
                                  color: deptColor,
                                  border: `1px solid ${deptColor}35`,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: '"JetBrains Mono", monospace',
                                  color: '#cbd5e1',
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
                                  fontWeight: 800,
                                  py: 0.2,
                                  px: 0.8,
                                  bgcolor: 'rgba(168, 85, 247, 0.1)',
                                  color: '#c084fc',
                                  border: '1px solid rgba(168, 85, 247, 0.3)',
                                  '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.2)' },
                                }}
                              >
                                Explain Risk
                              </Button>
                            </Tooltip>
                          </Box>

                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.78rem', mb: 0.4 }}>
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
                                  fontWeight: 900,
                                  bgcolor: t.priority_score > 85 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: t.priority_score > 85 ? '#f87171' : '#fbbf24',
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
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              bgcolor: 'rgba(11, 15, 25, 0.95)',
              backdropFilter: 'blur(12px)',
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
                fontWeight: 900,
                fontSize: '0.82rem',
                letterSpacing: '0.02em',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)',
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
