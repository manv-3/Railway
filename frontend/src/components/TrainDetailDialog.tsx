import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  Button, Chip, Divider, Grid, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, Tabs, Tab, IconButton, Card, CardContent
} from '@mui/material';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import CloseIcon from '@mui/icons-material/Close';
import TrainIcon from '@mui/icons-material/Train';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { CorridorTrain } from '../types';
import { getTrainsOnSameRoute } from '../data/corridorTrains';

interface TrainDetailDialogProps {
  open: boolean;
  train: CorridorTrain | null;
  onClose: () => void;
  onSelectTrain?: (train: CorridorTrain) => void;
}

export const TrainDetailDialog: React.FC<TrainDetailDialogProps> = ({
  open,
  train,
  onClose,
  onSelectTrain,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!train) return null;

  const sameRouteTrains = getTrainsOnSameRoute(train.train_number);

  // Compute delay status styling
  const isMajorDelay = train.delay_minutes >= 30;
  const isMinorDelay = train.delay_minutes > 0 && !isMajorDelay;
  const isOnTime = train.delay_minutes === 0;

  const delayColor = isOnTime ? '#059669' : isMajorDelay ? '#dc2626' : '#d97706';
  const delayBg = isOnTime ? '#ecfdf5' : isMajorDelay ? '#fef2f2' : '#fffbeb';
  const delayBorder = isOnTime ? '#a7f3d0' : isMajorDelay ? '#fecaca' : '#fde68a';

  // Station coordinates for mini map
  const routePositions: [number, number][] = train.station_stops.map((st) => [
    st.latitude,
    st.longitude,
  ]);

  const trainPosition: [number, number] = [
    train.current_location.latitude,
    train.current_location.longitude,
  ];

  // Custom SVG icon for current train marker
  const trainSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
      <circle cx="12" cy="12" r="11" fill="${train.direction === 'DOWN' ? '#0284c7' : '#7c3aed'}" stroke="#ffffff" stroke-width="2.5" />
      <path d="M12 4c-3.51 0-4.96.48-5.57.76C5.58 5.16 5 6.09 5 7.2v8.6c0 1.25.76 2.31 1.83 2.7l-1.33 1.33v.67h13v-.67L17.17 18.5c1.07-.39 1.83-1.45 1.83-2.7V7.2c0-1.11-.58-2.04-1.43-2.44C16.96 4.48 15.51 4 12 4zm0 2c3.5 0 4 .5 4 .5v2H8V6.5s.5-.5 4-.5zm-4 5h8v4H8v-4zm1.5 5.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" fill="#ffffff" />
    </svg>
  `;

  const trainIcon = L.divIcon({
    html: trainSvg,
    className: 'custom-train-marker-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 50px -12px rgba(15, 43, 92, 0.25)',
          overflow: 'hidden',
          bgcolor: '#ffffff',
        },
      }}
    >
      {/* ─── 1. OFFICIAL DIALOG HEADER ─── */}
      <DialogTitle
        sx={{
          bgcolor: '#0f2b5c',
          color: '#ffffff',
          py: 1.8,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #1e3a8a',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrainIcon sx={{ fontSize: 24, color: '#ffffff' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {train.train_number} • {train.train_name}
              </Typography>
              <Chip
                label={train.train_category}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  bgcolor:
                    train.train_category === 'VANDE_BHARAT'
                      ? '#0284c7'
                      : train.train_category === 'RAJDHANI'
                      ? '#dc2626'
                      : train.train_category === 'SHATABDI'
                      ? '#7c3aed'
                      : '#059669',
                  color: '#ffffff',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#93c5fd', fontSize: '0.74rem' }}>
              Direction: <strong>{train.direction === 'DOWN' ? 'DOWN LINE (NDLS → CNB)' : 'UP LINE (CNB → NDLS)'}</strong> • {train.source_station} ⇄ {train.destination_station}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#ffffff' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ─── 2. PUNCTUALITY & RUNNING STATUS BANNER ─── */}
      <Box
        sx={{
          bgcolor: delayBg,
          borderBottom: `1px solid ${delayBorder}`,
          p: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isOnTime ? (
            <CheckCircleIcon sx={{ fontSize: 28, color: delayColor }} />
          ) : isMinorDelay ? (
            <WarningAmberIcon sx={{ fontSize: 28, color: delayColor }} />
          ) : (
            <ErrorOutlineIcon sx={{ fontSize: 28, color: delayColor }} />
          )}

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: delayColor, lineHeight: 1.1 }}>
                {train.delay_display}
              </Typography>
              <Chip
                label={
                  isOnTime
                    ? 'ON SCHEDULE'
                    : `${Math.floor(train.delay_minutes / 60)}h ${train.delay_minutes % 60}m BEHIND TIME`
                }
                size="small"
                sx={{
                  height: 19,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  bgcolor: delayColor,
                  color: '#ffffff',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem', display: 'block', mt: 0.2 }}>
              <strong>Operational Delay Cause:</strong> {train.delay_cause || 'Normal line clearance and scheduled halts.'}
            </Typography>
          </Box>
        </Box>

        {/* Current Location & Speed Telemetry */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
              CURRENT SPEED
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f2b5c', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
              {train.current_location.speed_kmh} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>km/h</span>
            </Typography>
          </Box>
          <Box sx={{ height: 28, width: '1px', bgcolor: delayBorder }} />
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
              KM POSITION
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0284c7', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
              KM {train.current_location.current_km}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ─── 3. NAVIGATION TABS ─── */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc', px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              fontWeight: 700,
              fontSize: '0.78rem',
              color: '#64748b',
              '&.Mui-selected': { color: '#0f2b5c' },
            },
            '& .MuiTabs-indicator': { bgcolor: '#0f2b5c', height: 3 },
          }}
        >
          <Tab label="Division Station Stops & Interactive Map" />
          <Tab label={`Trains on Same Route (${sameRouteTrains.length})`} />
          <Tab label="Priority & G&SR 2026 Precedence" />
        </Tabs>
      </Box>

      {/* ─── 4. DIALOG BODY ─── */}
      <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
        {/* ── TAB 0: DIVISION STOPS & INTERACTIVE MAP ── */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Top: Route Map */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c', letterSpacing: '0.04em' }}>
                  CORRIDOR TRAJECTORY & LIVE TRAIN POSITION
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                  Section: <strong>{train.current_location.section_name}</strong>
                </Typography>
              </Box>

              <Box
                sx={{
                  height: 220,
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <MapContainer
                  center={[27.8974, 78.0880]}
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />

                  {/* Complete Route Track Polyline */}
                  <Polyline
                    positions={routePositions}
                    color={train.direction === 'DOWN' ? '#0284c7' : '#7c3aed'}
                    weight={5}
                    opacity={0.8}
                  />

                  {/* Divisional Station Stops */}
                  {train.station_stops.map((st) => (
                    <CircleMarker
                      key={st.station_code}
                      center={[st.latitude, st.longitude]}
                      radius={6}
                      pathOptions={{
                        fillColor:
                          st.status === 'PASSED'
                            ? '#059669'
                            : st.status === 'APPROACHING' || st.status === 'AT_STATION'
                            ? '#0284c7'
                            : '#94a3b8',
                        color: '#ffffff',
                        weight: 2,
                        fillOpacity: 0.95,
                      }}
                    >
                      <Popup>
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                            {st.station_name} ({st.station_code})
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                            KM {st.kilometer_mark} • {st.platform}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#334155', display: 'block', mt: 0.5 }}>
                            Sch Arr/Dep: <strong>{st.scheduled_arrival} / {st.scheduled_departure}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#0f2b5c', display: 'block' }}>
                            Act Arr/Dep: <strong>{st.actual_arrival} / {st.actual_departure}</strong>
                          </Typography>
                          <Chip
                            label={st.status}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              mt: 0.8,
                              bgcolor: st.status === 'PASSED' ? '#ecfdf5' : '#eff6ff',
                              color: st.status === 'PASSED' ? '#059669' : '#1e40af',
                            }}
                          />
                        </Box>
                      </Popup>
                    </CircleMarker>
                  ))}

                  {/* Pulsating Current Live Train Marker */}
                  <Marker position={trainPosition} icon={trainIcon}>
                    <Popup>
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                          🚆 {train.train_number} {train.train_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          Speed: <strong>{train.current_location.speed_kmh} km/h</strong> • KM {train.current_location.current_km}
                        </Typography>
                        <Typography variant="caption" sx={{ color: delayColor, fontWeight: 800, display: 'block' }}>
                          {train.delay_display}
                        </Typography>
                      </Box>
                    </Popup>
                  </Marker>
                </MapContainer>
              </Box>
            </Box>

            {/* Bottom: Station Stops in Our Division Table */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
                DIVISIONAL TIMINGS & PLATFORM ASSIGNMENTS ({train.station_stops.length} STOPS)
              </Typography>

              <Paper sx={{ border: '1px solid #cbd5e1', borderRadius: 2, overflow: 'hidden', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#0f2b5c', py: 1 }}>STATION</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f2b5c' }}>KM MARK</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f2b5c' }}>SCHEDULED ARR/DEP</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f2b5c' }}>ACTUAL / PROJECTED</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f2b5c' }}>PLATFORM</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f2b5c' }}>HALT</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f2b5c', textAlign: 'right' }}>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {train.station_stops.map((st) => (
                      <TableRow
                        key={st.station_code}
                        hover
                        sx={{
                          bgcolor:
                            st.status === 'APPROACHING' || st.status === 'AT_STATION'
                              ? '#eff6ff'
                              : 'inherit',
                        }}
                      >
                        <TableCell sx={{ py: 1.2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f2b5c' }}>
                            {st.station_name} ({st.station_code})
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#475569' }}>
                            KM {st.kilometer_mark.toFixed(1)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#334155' }}>
                            {st.scheduled_arrival} / {st.scheduled_departure}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontWeight: 700,
                              color: st.actual_arrival !== st.scheduled_arrival ? delayColor : '#059669',
                            }}
                          >
                            {st.actual_arrival} / {st.actual_departure}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={st.platform}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {st.halt_minutes > 0 ? `${st.halt_minutes}m` : 'Pass'}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'right' }}>
                          <Chip
                            label={st.status}
                            size="small"
                            sx={{
                              height: 19,
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              bgcolor:
                                st.status === 'PASSED'
                                  ? '#ecfdf5'
                                  : st.status === 'APPROACHING' || st.status === 'AT_STATION'
                                  ? '#eff6ff'
                                  : '#f8fafc',
                              color:
                                st.status === 'PASSED'
                                  ? '#059669'
                                  : st.status === 'APPROACHING' || st.status === 'AT_STATION'
                                  ? '#1e40af'
                                  : '#64748b',
                              border: `1px solid ${
                                st.status === 'PASSED'
                                  ? '#a7f3d0'
                                  : st.status === 'APPROACHING' || st.status === 'AT_STATION'
                                  ? '#bfdbfe'
                                  : '#e2e8f0'
                              }`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          </Box>
        )}

        {/* ── TAB 1: TRAINS ON SAME ROUTE ── */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 1.8, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af' }}>
                Corridor Traffic Fleet Sharing This Route ({train.direction === 'DOWN' ? 'Down Line NDLS → CNB' : 'Up Line CNB → NDLS'})
              </Typography>
              <Typography variant="caption" sx={{ color: '#334155', display: 'block', mt: 0.3 }}>
                The following {sameRouteTrains.length} trains operate along the same corridor path. Headways, overtake opportunities, and conflict regulations are actively monitored by the Google OR-Tools CP-SAT solver.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {sameRouteTrains.map((otherTrain) => {
                // Compute KM separation
                const kmDiff = otherTrain.current_location.current_km - train.current_location.current_km;
                const isAhead = train.direction === 'DOWN' ? kmDiff > 0 : kmDiff < 0;
                const absKm = Math.abs(kmDiff).toFixed(1);

                const isOtherMajorDelay = otherTrain.delay_minutes >= 30;
                const isOtherOnTime = otherTrain.delay_minutes === 0;
                const otherDelayColor = isOtherOnTime ? '#059669' : isOtherMajorDelay ? '#dc2626' : '#d97706';

                return (
                  <Grid item xs={12} key={otherTrain.train_number}>
                    <Card
                      sx={{
                        borderRadius: 2.5,
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          border: '1.5px solid #0f2b5c',
                          boxShadow: '0 4px 12px rgba(15,43,92,0.1)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                                {otherTrain.train_number} • {otherTrain.train_name}
                              </Typography>
                              <Chip
                                label={otherTrain.train_category}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  bgcolor: '#f1f5f9',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Current Position: <strong>KM {otherTrain.current_location.current_km}</strong> ({otherTrain.current_location.section_name})
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={otherTrain.delay_display}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor: `${otherDelayColor}15`,
                                color: otherDelayColor,
                                border: `1px solid ${otherDelayColor}35`,
                              }}
                            />
                            {onSelectTrain && (
                              <Button
                                size="small"
                                variant="contained"
                                endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                                onClick={() => onSelectTrain(otherTrain)}
                                sx={{
                                  height: 26,
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  bgcolor: '#0f2b5c',
                                  '&:hover': { bgcolor: '#1e3a8a' },
                                }}
                              >
                                Inspect
                              </Button>
                            )}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                              HEADWAY SEPARATION
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0284c7' }}>
                              {isAhead ? `Ahead by ${absKm} KM` : `Trailing by ${absKm} KM`}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                              PRIORITY PRECEDENCE
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f2b5c' }}>
                              Priority {otherTrain.priority_precedence} ({otherTrain.train_category})
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                              REGULATION STATUS
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, display: 'block' }}>
                              {otherTrain.current_location.speed_kmh === 0
                                ? '🛑 Looped / Held at Station'
                                : `🟢 Cruising at ${otherTrain.current_location.speed_kmh} km/h`}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* ── TAB 2: PRIORITY & G&SR PRECEDENCE ── */}
        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <ShieldIcon sx={{ fontSize: 24, color: '#0f2b5c' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                  {train.priority_label}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, mb: 2 }}>
                {train.regulation_rights}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                    LOCOMOTIVE CLASS
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f2b5c', mt: 0.3 }}>
                    {train.locomotive_class}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                    RAKE COMPOSITION
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f2b5c', mt: 0.3 }}>
                    {train.rake_composition}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                    KAVACH TCAS L2 ONBOARD
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#059669' }} />
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                      SYNCHRONIZED (Red Envelope Enforcement Active)
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                    STATUTORY G&SR RULE 2026
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f2b5c', mt: 0.3 }}>
                    Rule 4.09 & 15.06 (Automatic Headway Clearing)
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* ─── 5. DIALOG FOOTER ─── */}
      <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Indian Railways CRIS COA Live Stream • SIH PS 26027
        </Typography>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: '#0f2b5c',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.8rem',
            px: 2.5,
            '&:hover': { bgcolor: '#1e3a8a' },
          }}
        >
          Close Inspector
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrainDetailDialog;
