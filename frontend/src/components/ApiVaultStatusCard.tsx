import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import { getSystemConfigStatus, SystemConfigStatus } from '../services/api';

export const ApiVaultStatusCard: React.FC = () => {
  const [config, setConfig] = useState<SystemConfigStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await getSystemConfigStatus();
      setConfig(data);
    } catch (err) {
      console.error('Failed to load system config status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 12px rgba(15, 43, 92, 0.08)',
        bgcolor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.8,
          bgcolor: '#0f2b5c',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <VpnKeyIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Enterprise API Key Vault & Telemetry Infrastructure
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={config?.environment?.toUpperCase() || 'PRODUCTION'}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 800,
              bgcolor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
            }}
          />
          <Tooltip title="Refresh Vault Diagnostics">
            <IconButton size="small" onClick={fetchConfig} sx={{ color: '#ffffff' }}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#0f2b5c' } }} />}

      <CardContent sx={{ p: 2.5 }}>
        {/* Core Infrastructure Databases */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <StorageIcon sx={{ color: '#0f2b5c', fontSize: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    PostgreSQL 15 + PostGIS
                  </Typography>
                  <Chip
                    label="CONNECTED"
                    size="small"
                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d' }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', fontFamily: '"JetBrains Mono", monospace' }}>
                  {config?.database?.url || 'postgresql://railway:***@localhost:5433/railway_ai'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <MemoryIcon sx={{ color: '#dc2626', fontSize: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f2b5c' }}>
                    Redis 7.0 Token Vault & Blacklist
                  </Typography>
                  <Chip
                    label="ARMED"
                    size="small"
                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d' }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', fontFamily: '"JetBrains Mono", monospace' }}>
                  {config?.redis?.url || 'redis://localhost:6380/0'} (7-Day Rotation Active)
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* API Key Vault Records */}
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}
        >
          Masked Credentials & Integration Telemetry
        </Typography>

        <Grid container spacing={1.5}>
          {config?.vault_keys &&
            Object.entries(config.vault_keys).map(([key, info]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Box
                  sx={{
                    p: 1.4,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.74rem' }}>
                      {key}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 14, color: '#16a34a' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#16a34a' }}>
                        ACTIVE
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <LockIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.72rem',
                        color: '#0f2b5c',
                        bgcolor: '#f1f5f9',
                        px: 0.8,
                        py: 0.2,
                        borderRadius: 1,
                        fontWeight: 700,
                      }}
                    >
                      {info.masked_value}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.67rem' }}>
                    {info.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ApiVaultStatusCard;
