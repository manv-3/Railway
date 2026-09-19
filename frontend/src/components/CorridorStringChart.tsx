/**
 * CorridorStringChart.tsx
 * Authentic Indian Railways COA (Control Office Application) Time-Distance String Chart
 * PS 26027 - Indian Railways AI Block Planning Platform
 *
 * Plots Corridor Stations (NDLS to CNB) along the Y-axis against Time (00:00 to 24:00) on the X-axis.
 * Visualizes:
 * - Train trajectories (diagonals) with train numbers and speeds
 * - Maintenance possession windows (shaded time-distance envelopes)
 * - Clear train clearance headway gaps before and after blocks
 */

import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import ConstructionIcon from '@mui/icons-material/Construction';
import { MaintenanceBlock } from '../types';

interface CorridorStringChartProps {
  selectedBlock?: MaintenanceBlock | null;
  onSelectBlock?: (block: MaintenanceBlock) => void;
  blocks: MaintenanceBlock[];
}

interface TrainPath {
  trainNo: string;
  name: string;
  type: 'VANDE_BHARAT' | 'RAJDHANI' | 'SHATABDI' | 'FREIGHT';
  color: string;
  direction: 'DN' | 'UP'; // DN: NDLS -> CNB, UP: CNB -> NDLS
  startKm: number;
  endKm: number;
  startTimeHrs: number; // e.g. 6.0 = 06:00
  endTimeHrs: number;   // e.g. 10.5 = 10:30
  status: string;
}

const STATIONS = [
  { code: 'NDLS', name: 'New Delhi', km: 0 },
  { code: 'ANVT', name: 'Anand Vihar', km: 13 },
  { code: 'GZB', name: 'Ghaziabad Jn', km: 26 },
  { code: 'ALJN', name: 'Aligarh Jn', km: 131 },
  { code: 'TDL', name: 'Tundla Jn', km: 206 },
  { code: 'ETW', name: 'Etawah Jn', km: 298 },
  { code: 'CNB', name: 'Kanpur Central', km: 440 },
];

const SCHEDULED_TRAINS: TrainPath[] = [
  {
    trainNo: '22436',
    name: 'Vande Bharat Express',
    type: 'VANDE_BHARAT',
    color: '#0284c7', // Vivid Blue
    direction: 'DN',
    startKm: 0,
    endKm: 440,
    startTimeHrs: 6.0,
    endTimeHrs: 10.1,
    status: 'Right Time • 130 km/h Clear Path',
  },
  {
    trainNo: '12004',
    name: 'Lucknow Swarna Shatabdi',
    type: 'SHATABDI',
    color: '#7c3aed', // Purple
    direction: 'DN',
    startKm: 0,
    endKm: 440,
    startTimeHrs: 6.8,
    endTimeHrs: 11.5,
    status: 'Right Time • Regulated via Down Line',
  },
  {
    trainNo: '12424',
    name: 'Dibrugarh Rajdhani',
    type: 'RAJDHANI',
    color: '#dc2626', // Crimson
    direction: 'DN',
    startKm: 0,
    endKm: 440,
    startTimeHrs: 16.2,
    endTimeHrs: 21.0,
    status: 'Priority Green Corridor • Nil Detention',
  },
  {
    trainNo: '12302',
    name: 'Howrah Rajdhani Express',
    type: 'RAJDHANI',
    color: '#b91c1c',
    direction: 'DN',
    startKm: 0,
    endKm: 440,
    startTimeHrs: 17.0,
    endTimeHrs: 21.8,
    status: 'Priority Scheduled',
  },
  {
    trainNo: 'BOXN-4122',
    name: 'Coal Freight Heavy Haul',
    type: 'FREIGHT',
    color: '#059669', // Emerald
    direction: 'DN',
    startKm: 26,
    endKm: 440,
    startTimeHrs: 1.5,
    endTimeHrs: 8.5,
    status: 'Regulated at ALJN Loop Line during block',
  },
  {
    trainNo: 'BCN-8841',
    name: 'Fertilizer Rake',
    type: 'FREIGHT',
    color: '#047857',
    direction: 'UP',
    startKm: 440,
    endKm: 26,
    startTimeHrs: 12.0,
    endTimeHrs: 19.5,
    status: 'Headway Matched • Zero Interference',
  },
  {
    trainNo: '12560',
    name: 'Shiv Ganga Express',
    type: 'SHATABDI',
    color: '#4f46e5',
    direction: 'DN',
    startKm: 0,
    endKm: 440,
    startTimeHrs: 20.0,
    endTimeHrs: 24.0,
    status: 'Clear Evening Window',
  },
];

export const CorridorStringChart: React.FC<CorridorStringChartProps> = ({
  selectedBlock,
  onSelectBlock,
  blocks,
}) => {
  const [hoveredTrain, setHoveredTrain] = useState<TrainPath | null>(null);

  // SVG Coordinate mapping
  const width = 850;
  const height = 480;
  const paddingLeft = 100;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxKm = 440;
  const hours = 24;

  const getX = (hour: number) => paddingLeft + (hour / hours) * chartWidth;
  const getY = (km: number) => paddingTop + (km / maxKm) * chartHeight;

  // Render station horizontal lines
  const stationLines = STATIONS.map((st) => ({
    ...st,
    y: getY(st.km),
  }));

  // Render time vertical grid lines (every 2 hours)
  const timeTicks = Array.from({ length: 13 }, (_, i) => i * 2);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Chart Top Header & Legend */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: '1px solid #e2e8f0',
          bgcolor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c', fontSize: '0.82rem' }}>
            COA TIME-DISTANCE STRING CHART (24 HOURS)
          </Typography>
          <Chip
            label="Section Controller Master Timetable"
            size="small"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }}
          />
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 14, height: 3, bgcolor: '#0284c7', borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
              Vande Bharat (130 km/h)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 14, height: 3, bgcolor: '#dc2626', borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
              Rajdhani (130 km/h)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 14, height: 3, bgcolor: '#059669', borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
              Freight Goods (75 km/h)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 10, bgcolor: 'rgba(245, 158, 11, 0.25)', border: '1px solid #d97706', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 700 }}>
              Possession Slot
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* SVG String Chart Canvas */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'auto', bgcolor: '#ffffff' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', minWidth: 600, minHeight: 380, display: 'block' }}
        >
          {/* Background Grid - Horizontal Station Lines */}
          {stationLines.map((st) => (
            <g key={st.code}>
              <line
                x1={paddingLeft}
                y1={st.y}
                x2={width - paddingRight}
                y2={st.y}
                stroke={st.km === 0 || st.km === maxKm ? '#94a3b8' : '#e2e8f0'}
                strokeWidth={st.km === 0 || st.km === maxKm ? 1.5 : 1}
                strokeDasharray={st.km === 0 || st.km === maxKm ? undefined : '3 3'}
              />
              {/* Station Label on Left */}
              <text
                x={paddingLeft - 8}
                y={st.y + 3}
                fontSize="9"
                fontWeight="700"
                fill="#1e293b"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                {st.name} ({st.code})
              </text>
              <text
                x={paddingLeft - 8}
                y={st.y + 13}
                fontSize="7.5"
                fill="#64748b"
                textAnchor="end"
                fontFamily="monospace"
              >
                KM {st.km}
              </text>
            </g>
          ))}

          {/* Background Grid - Vertical Time Lines */}
          {timeTicks.map((hour) => {
            const x = getX(hour);
            const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <g key={hour}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={height - paddingBottom}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                {/* Top Time Axis */}
                <text
                  x={x}
                  y={paddingTop - 12}
                  fontSize="8.5"
                  fill="#475569"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {timeLabel}
                </text>
                {/* Bottom Time Axis */}
                <text
                  x={x}
                  y={height - paddingBottom + 16}
                  fontSize="8.5"
                  fill="#64748b"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {timeLabel}
                </text>
              </g>
            );
          })}

          {/* Time Axis Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={width - paddingRight}
            y2={paddingTop}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Current Time Indicator Line (e.g. 09:30 AM simulation) */}
          {(() => {
            const currentHour = 9.5; // 09:30
            const cx = getX(currentHour);
            return (
              <g>
                <line
                  x1={cx}
                  y1={paddingTop}
                  x2={cx}
                  y2={height - paddingBottom}
                  stroke="#dc2626"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <circle cx={cx} cy={paddingTop} r="4" fill="#dc2626" />
                <rect x={cx - 30} y={paddingTop - 25} width="60" height="14" rx="3" fill="#dc2626" />
                <text x={cx} y={paddingTop - 15} fontSize="7.5" fill="#ffffff" fontWeight="800" textAnchor="middle" fontFamily="monospace">
                  NOW 09:30
                </text>
              </g>
            );
          })()}

          {/* ── Maintenance Block Possession Rectangles ── */}
          {blocks.map((blk, idx) => {
            // Estimate spatial coordinates
            const isGzbAljn = blk.section_id?.includes('GZB_ALJN');
            const startKm = isGzbAljn ? 26 : 131;
            const endKm = isGzbAljn ? 131 : 206;

            // Map hours
            const startHour = (10 + (idx * 2.5)) % 22;
            const durationHrs = (blk.duration_minutes || 120) / 60;
            const endHour = startHour + durationHrs;

            const rx = getX(startHour);
            const rw = getX(endHour) - rx;
            const ry = getY(startKm);
            const rh = getY(endKm) - ry;

            const isSelected = selectedBlock?.block_id === blk.block_id;

            return (
              <g
                key={blk.block_id || idx}
                onClick={() => onSelectBlock && onSelectBlock(blk)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={rx}
                  y={ry}
                  width={Math.max(rw, 15)}
                  height={Math.max(rh, 20)}
                  fill={isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.18)'}
                  stroke={isSelected ? '#059669' : '#d97706'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  rx="3"
                />
                <text
                  x={rx + 4}
                  y={ry + 14}
                  fontSize="8"
                  fontWeight="800"
                  fill={isSelected ? '#047857' : '#92400e'}
                  fontFamily="monospace"
                >
                  ⚡ {blk.block_id}
                </text>
                <text
                  x={rx + 4}
                  y={ry + 25}
                  fontSize="7"
                  fontWeight="700"
                  fill="#64748b"
                  fontFamily="sans-serif"
                >
                  {blk.duration_minutes || 120}m POSSESSION
                </text>
              </g>
            );
          })}

          {/* ── Scheduled Train Diagonal Trajectories ── */}
          {SCHEDULED_TRAINS.map((train) => {
            const x1 = getX(train.startTimeHrs);
            const y1 = getY(train.startKm);
            const x2 = getX(train.endTimeHrs);
            const y2 = getY(train.endKm);

            const isHovered = hoveredTrain?.trainNo === train.trainNo;

            return (
              <g
                key={train.trainNo}
                onMouseEnter={() => setHoveredTrain(train)}
                onMouseLeave={() => setHoveredTrain(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hit area */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="12"
                />
                {/* Main Trajectory Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={train.color}
                  strokeWidth={isHovered ? 3.5 : 2}
                  strokeLinecap="round"
                />

                {/* Train Label Along Path */}
                <text
                  x={(x1 + x2) / 2 + 6}
                  y={(y1 + y2) / 2 - 4}
                  fontSize="7.5"
                  fontWeight="800"
                  fill={train.color}
                  fontFamily="monospace"
                  transform={`rotate(18, ${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}
                >
                  {train.trainNo} {train.name}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>

      {/* Interactive Active Hover Train Strip */}
      <Box
        sx={{
          px: 2,
          py: 0.8,
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {hoveredTrain ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DirectionsTransitIcon sx={{ fontSize: 16, color: hoveredTrain.color }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Train #{hoveredTrain.trainNo} • {hoveredTrain.name}
            </Typography>
            <Chip
              label={hoveredTrain.status}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#ecfdf5', color: '#059669' }}
            />
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
            💡 Hover over any train trajectory or click shaded possession rectangles to verify zero-detention headway buffer.
          </Typography>
        )}

        {selectedBlock && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <ConstructionIcon sx={{ fontSize: 14, color: '#d97706' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309', fontSize: '0.72rem' }}>
              Focused Possession: <strong>{selectedBlock.block_id}</strong> on {selectedBlock.section_id}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CorridorStringChart;
