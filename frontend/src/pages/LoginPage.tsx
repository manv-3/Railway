import React, { useState } from 'react';
import { Container, Card, CardContent, Typography, TextField, Button, MenuItem, Alert } from '@mui/material';
import TrainIcon from '@mui/icons-material/Train';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const destinationByRole = {
  BOARD_EXEC: '/board',
  ZONAL_HEAD: '/zone',
  DIV_CONTROLLER: '/division',
  FIELD_SSE: '/field',
  STATION_MASTER: '/field',
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('div_controller');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(destinationByRole[user.tier_role]);
    } catch {
      setError('Authentication failed. Use one of the provided demo accounts and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', p: 2, boxShadow: 4, borderRadius: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <TrainIcon sx={{ fontSize: 56, color: '#1a237e', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>
            Indian Railways
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#455a64' }}>
            AI-Powered Block Planning Platform
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
            PS 26027 / 26028 Enterprise Access Portal
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username / Railway Employee ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              select
              fullWidth
              label="Demo account"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 3, textAlign: 'left' }}
            >
              <MenuItem value="div_controller">Divisional Controller — Tier 3</MenuItem>
              <MenuItem value="field_sse">Field SSE — Tier 4</MenuItem>
              <MenuItem value="station_master">Station Master — Tier 4</MenuItem>
              <MenuItem value="zonal_gm">Zonal GM — Tier 2</MenuItem>
              <MenuItem value="board_exec">Railway Board Executive — Tier 1</MenuItem>
            </TextField>

            {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ bgcolor: '#1a237e', fontWeight: 700, py: 1.2 }}
              disabled={loading}
            >
              {loading ? 'Authenticating…' : 'Authenticate & Enter Cockpit'}
            </Button>
          </form>

          <Alert severity="info" sx={{ mt: 3, textAlign: 'left', fontSize: '0.75rem' }}>
            Use any listed demo account with password <strong>demo123</strong>. Your role determines the available portal and protected actions.
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};
