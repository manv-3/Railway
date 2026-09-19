import React from 'react';
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from 'react-leaflet';
import { Box, Typography, Chip } from '@mui/material';
import { Station, Section, MaintenanceBlock } from '../types';

interface CorridorMapProps {
  stations: Station[];
  sections: Section[];
  blocks: MaintenanceBlock[];
  selectedBlockId?: string;
  onSelectBlock?: (block: MaintenanceBlock) => void;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  stations,
  sections,
  blocks,
  onSelectBlock,
}) => {
  // Center roughly at Aligarh Junction
  const defaultCenter: [number, number] = [27.8974, 78.0880];

  const getStationCoord = (code: string): [number, number] | null => {
    const s = stations.find((st) => st.code === code);
    return s ? [s.latitude, s.longitude] : null;
  };

  return (
    <Box sx={{ height: 420, width: '100%', borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
      <MapContainer
        center={defaultCenter}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Draw Directional Railway Tracks */}
        {sections.map((sec) => {
          const start = getStationCoord(sec.start_station_code);
          const end = getStationCoord(sec.end_station_code);
          if (!start || !end) return null;

          const isUp = sec.track_direction === 'UP';
          const color = isUp ? '#0288d1' : '#7b1fa2'; // Blue for Up, Purple for Down

          return (
            <Polyline
              key={sec.id}
              positions={[start, end]}
              color={color}
              weight={isUp ? 4 : 3}
              dashArray={isUp ? undefined : '5, 5'}
            >
              <Popup>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {sec.name}
                  </Typography>
                  <Typography variant="body2">Direction: <b>{sec.track_direction}</b></Typography>
                  <Typography variant="body2">Max Speed: {sec.speed_limit_kmh} km/h</Typography>
                  <Typography variant="body2">Length: {Math.abs(sec.end_km - sec.start_km).toFixed(1)} km</Typography>
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
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {st.name} ({st.code})
                </Typography>
                <Typography variant="body2">KM Mark: {st.kilometer_mark} km</Typography>
                <Typography variant="body2">Platforms: {st.platforms}</Typography>
                <Chip label="Loop Line Available" size="small" color="primary" sx={{ mt: 0.5 }} />
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

          // Compute midpoint
          const midLat = (start[0] + end[0]) / 2;
          const midLng = (start[1] + end[1]) / 2;

          const isCombined = blk.is_combined;
          const markerColor = isCombined ? '#e65100' : '#2e7d32'; // Orange for combined, Green for single

          return (
            <CircleMarker
              key={blk.block_id}
              center={[midLat, midLng]}
              radius={isCombined ? 11 : 9}
              pathOptions={{ fillColor: markerColor, color: '#ffffff', weight: 3, fillOpacity: 1.0 }}
              eventHandlers={{
                click: () => onSelectBlock && onSelectBlock(blk),
              }}
            >
              <Popup>
                <Box>
                  <Chip
                    label={isCombined ? 'COMBINED SUPER-BLOCK' : 'SINGLE BLOCK'}
                    color={isCombined ? 'warning' : 'success'}
                    size="small"
                    sx={{ fontWeight: 700, mb: 1 }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {blk.block_id}
                  </Typography>
                  <Typography variant="body2">Duration: <b>{blk.duration_minutes} mins</b></Typography>
                  <Typography variant="body2">Tasks Bundled: <b>{blk.tasks?.length || 1}</b></Typography>
                  <Typography variant="body2">Status: <b>{blk.status}</b></Typography>
                </Box>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Box>
  );
};
