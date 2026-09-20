import React, { useState } from 'react';
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, Chip, Button } from '@mui/material';
import TrainIcon from '@mui/icons-material/Train';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Station, Section, MaintenanceBlock, CorridorTrain } from '../types';
import { CORRIDOR_TRAINS } from '../data/corridorTrains';

interface CorridorMapProps {
  stations: Station[];
  sections: Section[];
  blocks: MaintenanceBlock[];
  trains?: CorridorTrain[];
  selectedBlockId?: string;
  selectedTrainNumber?: string;
  onSelectBlock?: (block: MaintenanceBlock) => void;
  onSelectTrain?: (train: CorridorTrain) => void;
  height?: string | number;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  stations,
  sections,
  blocks,
  trains = CORRIDOR_TRAINS,
  selectedBlockId,
  selectedTrainNumber,
  onSelectBlock,
  onSelectTrain,
  height = '100%',
}) => {
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'DOWN' | 'UP' | 'DELAYED'>('ALL');

  // Center roughly at Aligarh Junction
  const defaultCenter: [number, number] = [27.8974, 78.0880];

  const getStationCoord = (code: string): [number, number] | null => {
    const s = stations.find((st) => st.code === code);
    return s ? [s.latitude, s.longitude] : null;
  };

  const filteredTrains = trains.filter((t) => {
    if (directionFilter === 'DOWN') return t.direction === 'DOWN';
    if (directionFilter === 'UP') return t.direction === 'UP';
    if (directionFilter === 'DELAYED') return t.delay_minutes > 0;
    return true;
  });

  // Create custom HTML icon for each train
  const createTrainIcon = (train: CorridorTrain, isSelected: boolean) => {
    const isDown = train.direction === 'DOWN';
    const isLate = train.delay_minutes > 0;
    const isMajorLate = train.delay_minutes >= 30;
    const bgCol = train.train_category === 'VANDE_BHARAT'
      ? '#0284c7'
      : train.train_category === 'RAJDHANI'
      ? '#dc2626'
      : train.train_category === 'SHATABDI'
      ? '#7c3aed'
      : '#059669';

    const delayBadgeText = isLate
      ? isMajorLate
        ? `+${Math.floor(train.delay_minutes / 60)}h${train.delay_minutes % 60}m`
        : `+${train.delay_minutes}m`
      : 'RT';

    const delayBadgeCol = isLate ? (isMajorLate ? '#dc2626' : '#d97706') : '#059669';

    const html = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        gap: 4px;
        background: #ffffff;
        border: 2px solid ${isSelected ? '#0f2b5c' : bgCol};
        box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        border-radius: 20px;
        padding: 3px 8px;
        cursor: pointer;
        font-family: 'JetBrains Mono', monospace;
        transform: translate(-50%, -50%);
        white-space: nowrap;
        ${isSelected ? 'transform: translate(-50%, -50%) scale(1.15); z-index: 1000;' : ''}
      ">
        <span style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${bgCol};
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        ">
          ${isDown ? '▼' : '▲'}
        </span>
        <span style="font-size: 11px; font-weight: 800; color: #0f172a;">
          ${train.train_number}
        </span>
        <span style="
          background: ${delayBadgeCol};
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 4px;
        ">
          ${delayBadgeText}
        </span>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-train-leaflet-marker',
      iconSize: [110, 26],
      iconAnchor: [55, 13],
    });
  };

  return (
    <Box sx={{ height, width: '100%', position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* ── Floating Train Filter Header Overlay ── */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 999,
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #cbd5e1',
          borderRadius: 2,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
          p: 0.8,
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.8 }}>
          <TrainIcon sx={{ fontSize: 16, color: '#0f2b5c' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c', fontSize: '0.7rem' }}>
            CORRIDOR TRAINS ({filteredTrains.length}):
          </Typography>
        </Box>

        <Chip
          label="All Trains"
          size="small"
          clickable
          onClick={() => setDirectionFilter('ALL')}
          sx={{
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 800,
            bgcolor: directionFilter === 'ALL' ? '#0f2b5c' : '#f1f5f9',
            color: directionFilter === 'ALL' ? '#ffffff' : '#334155',
          }}
        />

        <Chip
          label="Down Line (DN)"
          size="small"
          clickable
          onClick={() => setDirectionFilter('DOWN')}
          sx={{
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 800,
            bgcolor: directionFilter === 'DOWN' ? '#0284c7' : '#f1f5f9',
            color: directionFilter === 'DOWN' ? '#ffffff' : '#334155',
          }}
        />

        <Chip
          label="Up Line (UP)"
          size="small"
          clickable
          onClick={() => setDirectionFilter('UP')}
          sx={{
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 800,
            bgcolor: directionFilter === 'UP' ? '#7c3aed' : '#f1f5f9',
            color: directionFilter === 'UP' ? '#ffffff' : '#334155',
          }}
        />

        <Chip
          label="Delayed Only"
          size="small"
          clickable
          onClick={() => setDirectionFilter('DELAYED')}
          sx={{
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 800,
            bgcolor: directionFilter === 'DELAYED' ? '#dc2626' : '#f1f5f9',
            color: directionFilter === 'DELAYED' ? '#ffffff' : '#334155',
          }}
        />
      </Box>

      <MapContainer
        center={defaultCenter}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Draw Directional Railway Tracks */}
        {sections.map((sec) => {
          const start = getStationCoord(sec.start_station_code);
          const end = getStationCoord(sec.end_station_code);
          if (!start || !end) return null;

          const isUp = sec.track_direction === 'UP';
          const color = isUp ? '#0284c7' : '#7c3aed';

          return (
            <Polyline
              key={sec.id}
              positions={[start, end]}
              color={color}
              weight={isUp ? 4 : 3}
              dashArray={isUp ? undefined : '5, 5'}
            >
              <Popup>
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    {sec.name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                    Direction: <strong>{sec.track_direction}</strong> • Max Speed: <strong>{sec.speed_limit_kmh} km/h</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                    Span: KM {sec.start_km.toFixed(1)} to KM {sec.end_km.toFixed(1)} ({Math.abs(sec.end_km - sec.start_km).toFixed(1)} km)
                  </Typography>
                </Box>
              </Popup>
            </Polyline>
          );
        })}

        {/* Draw Stations */}
        {stations.map((st) => (
          <CircleMarker
            key={st.code}
            center={[st.latitude, st.longitude]}
            radius={7}
            pathOptions={{ fillColor: '#d32f2f', color: '#ffffff', weight: 2, fillOpacity: 0.9 }}
          >
            <Popup>
              <Box sx={{ p: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                  {st.name} ({st.code})
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                  KM Mark: <strong>KM {st.kilometer_mark}</strong> • Platforms: <strong>{st.platforms}</strong>
                </Typography>
                {st.has_loop_lines && (
                  <Chip label="Common Loop Lines Available" size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.62rem', bgcolor: '#eff6ff', color: '#1e40af' }} />
                )}
              </Box>
            </Popup>
          </CircleMarker>
        ))}

        {/* Draw Scheduled Maintenance Blocks on Sections */}
        {blocks.map((blk) => {
          const sec = sections.find((s) => s.id === blk.section_id);
          if (!sec) return null;
          const start = getStationCoord(sec.start_station_code);
          const end = getStationCoord(sec.end_station_code);
          if (!start || !end) return null;

          const midLat = (start[0] + end[0]) / 2;
          const midLng = (start[1] + end[1]) / 2;

          const isCombined = blk.is_combined;
          const isSelected = selectedBlockId === blk.block_id;
          const markerColor = isSelected
            ? '#10b981'
            : isCombined
            ? '#f59e0b'
            : '#0284c7';

          return (
            <CircleMarker
              key={blk.block_id}
              center={[midLat, midLng]}
              radius={isSelected ? 14 : isCombined ? 10 : 8}
              pathOptions={{
                fillColor: markerColor,
                color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.8)',
                weight: isSelected ? 4 : 2,
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                click: () => onSelectBlock && onSelectBlock(blk),
              }}
            >
              <Popup>
                <Box sx={{ p: 0.5 }}>
                  <Chip
                    label={isCombined ? 'COMBINED SUPER-BLOCK' : 'SINGLE BLOCK'}
                    color={isCombined ? 'warning' : 'success'}
                    size="small"
                    sx={{ fontWeight: 800, mb: 0.8, height: 20, fontSize: '0.65rem' }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    {blk.block_id}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Duration: <strong>{blk.duration_minutes} mins</strong> • Tasks: <strong>{blk.tasks?.length || 1}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Status: <strong>{blk.status}</strong>
                  </Typography>
                </Box>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* ── Draw Interactive Live Corridor Trains ── */}
        {filteredTrains.map((train) => {
          const isSelected = selectedTrainNumber === train.train_number;
          const icon = createTrainIcon(train, isSelected);

          return (
            <Marker
              key={train.train_number}
              position={[train.current_location.latitude, train.current_location.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectTrain && onSelectTrain(train),
              }}
            >
              <Popup>
                <Box sx={{ p: 1, minWidth: 220 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                      🚆 {train.train_number} {train.train_name}
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                    {train.source_station} → {train.destination_station}
                  </Typography>

                  <Box sx={{ p: 0.8, bgcolor: train.delay_minutes === 0 ? '#ecfdf5' : '#fffbeb', borderRadius: 1, border: `1px solid ${train.delay_minutes === 0 ? '#a7f3d0' : '#fde68a'}`, mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: train.delay_minutes === 0 ? '#059669' : '#d97706', display: 'block' }}>
                      {train.delay_display}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.68rem', display: 'block' }}>
                      {train.delay_cause || 'Cruising on schedule.'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Speed: <strong>{train.current_location.speed_kmh} km/h</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 800 }}>
                      KM {train.current_location.current_km}
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#0f2b5c', fontWeight: 700, display: 'block', mb: 1.2 }}>
                    Priority: {train.priority_label}
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                    onClick={() => onSelectTrain && onSelectTrain(train)}
                    sx={{
                      bgcolor: '#0f2b5c',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      py: 0.5,
                      '&:hover': { bgcolor: '#1e3a8a' },
                    }}
                  >
                    Inspect Full Details & Route
                  </Button>
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

export default CorridorMap;
