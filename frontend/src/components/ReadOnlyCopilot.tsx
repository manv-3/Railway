import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  Chip,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { askReadOnlyCopilot, CopilotResponse } from '../services/api';
import { wsService } from '../services/websocket';

export const ReadOnlyCopilot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('What is the current corridor status?');
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [freshness, setFreshness] = useState('Live data updates will appear here.');

  useEffect(() => {
    const unsubscribe = wsService.on('BLOCK_SANCTIONED', () => {
      setFreshness('A corridor event occurred. Ask again to refresh the live snapshot.');
    });
    const unsubscribeRequest = wsService.on('REQUEST_CREATED', () => {
      setFreshness('A maintenance request changed. Ask again to refresh the live snapshot.');
    });
    return () => {
      unsubscribe();
      unsubscribeRequest();
    };
  }, []);

  const ask = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await askReadOnlyCopilot(question.trim());
      setResponse(result);
      setFreshness(`Snapshot: ${new Date(result.as_of_utc).toLocaleString()}`);
    } catch {
      setError('Rail Sarthi could not reach the live operational data source. No action was performed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        color="inherit"
        startIcon={<SmartToyIcon />}
        onClick={() => setOpen(true)}
        sx={{ textTransform: 'none', fontWeight: 700 }}
      >
        Operations Copilot
      </Button>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: 'min(100vw, 380px)', sm: 380 }, p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Rail Sarthi</Typography>
              <Typography variant="caption" color="text.secondary">Read-only railway intelligence</Typography>
            </Box>
            <IconButton aria-label="Close copilot" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Alert severity="info" icon={<SmartToyIcon />} sx={{ mt: 2, mb: 2 }}>
            I can explain live blocks, requests, trains, risks, and events. I cannot approve, schedule, or change anything.
          </Alert>
          <Typography variant="caption" color="text.secondary">{freshness}</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
            <Chip label="LIVE SNAPSHOT" size="small" color="success" variant="outlined" />
            <Chip label="NO WRITE ACCESS" size="small" color="info" variant="outlined" />
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.5 }}>
            {[
              'Which blocks are active or planned?',
              'Show critical maintenance risks',
              'Which trains are in the live scope?',
            ].map((suggestion) => (
              <Button
                key={suggestion}
                size="small"
                variant="outlined"
                onClick={() => setQuestion(suggestion)}
                sx={{ textTransform: 'none', textAlign: 'left' }}
              >
                {suggestion}
              </Button>
            ))}
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Ask about operations"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            sx={{ mt: 1.5, mb: 1.5 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={ask}
            disabled={loading || question.trim().length < 2}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SmartToyIcon />}
          >
            Ask Rail Sarthi
          </Button>
          {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
          {response && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
                {response.bot_name} • verified {response.confidence} confidence
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{response.answer}</Typography>
              <Box sx={{ mt: 2 }}>
                {response.checks.map((check) => (
                  <Typography key={check.name} variant="caption" sx={{ display: 'block' }}>
                    {check.status === 'PASSED' ? '✓' : '!' } {check.name}: {check.detail}
                  </Typography>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                {response.disclaimer} Sources: {response.sources.join(', ')}. Model: {response.model}.
              </Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={ask}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                Refresh live answer
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};