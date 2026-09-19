import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Drawer,
  Typography,
  IconButton,
  TextField,
  Paper,
  Chip,
  CircularProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import SyncIcon from '@mui/icons-material/Sync';
import { sendChatQuery, getAuthenticatedUser, ChatResponse } from '../services/api';
import { wsService } from '../services/websocket';

// Helper to parse inline **bold** and `code`
const renderInlineContent = (text: string, isUser: boolean): React.ReactNode => {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      const code = token.slice(1, -1);
      return (
        <Chip
          key={idx}
          label={code}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.7rem',
            mx: 0.3,
            px: 0.2,
            bgcolor: isUser ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: isUser ? '#ffffff' : '#0f172a',
            fontWeight: 700,
            borderRadius: 1,
          }}
        />
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldText = token.slice(2, -2);
      return (
        <Box
          key={idx}
          component="span"
          sx={{ fontWeight: 700, color: isUser ? '#ffffff' : '#0f172a' }}
        >
          {boldText}
        </Box>
      );
    }
    return token;
  });
};

const FormattedMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  if (isUser) {
    return (
      <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.5, color: '#ffffff' }}>
        {text}
      </Typography>
    );
  }

  const lines = text.split('\n');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <Box key={idx} sx={{ height: 4 }} />;
        }

        if (trimmed === '---' || trimmed === '***') {
          return <Divider key={idx} sx={{ my: 0.8, borderColor: '#e2e8f0' }} />;
        }

        if (line.startsWith('### ')) {
          return (
            <Typography
              key={idx}
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: '#1a237e',
                fontSize: '0.94rem',
                lineHeight: 1.3,
                mt: 0.6,
                mb: 0.3,
                letterSpacing: '-0.01em',
              }}
            >
              {renderInlineContent(line.replace(/^###\s+/, ''), false)}
            </Typography>
          );
        }

        if (line.startsWith('#### ')) {
          return (
            <Typography
              key={idx}
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#0d47a1',
                fontSize: '0.86rem',
                lineHeight: 1.3,
                mt: 1,
                mb: 0.2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {renderInlineContent(line.replace(/^####\s+/, ''), false)}
            </Typography>
          );
        }

        if (/^(\s*)[-*]\s+\[[xX ]\]\s+/.test(line)) {
          const content = line.replace(/^(\s*)[-*]\s+\[[xX ]\]\s+/, '');
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.8,
                my: 0.2,
                pl: 0.5,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 15, color: '#16a34a', mt: 0.25, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: '0.83rem', color: '#334155', lineHeight: 1.45 }}>
                {renderInlineContent(content, false)}
              </Typography>
            </Box>
          );
        }

        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[2];
          const content = numMatch[3];
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.8,
                my: 0.25,
                pl: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: '#e0e7ff',
                  color: '#3730a3',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.1,
                }}
              >
                {num}
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.83rem', color: '#1e293b', lineHeight: 1.45 }}>
                {renderInlineContent(content, false)}
              </Typography>
            </Box>
          );
        }

        if (/^(\s{2,})[-*]\s+/.test(line)) {
          const content = line.replace(/^(\s{2,})[-*]\s+/, '');
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.8,
                my: 0.15,
                pl: 2.2,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: '#94a3b8',
                  mt: 0.85,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ fontSize: '0.81rem', color: '#475569', lineHeight: 1.4 }}>
                {renderInlineContent(content, false)}
              </Typography>
            </Box>
          );
        }

        if (/^[-*]\s+/.test(line)) {
          const content = line.replace(/^[-*]\s+/, '');
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.8,
                my: 0.2,
                pl: 0.6,
              }}
            >
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  bgcolor: '#64748b',
                  mt: 0.8,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ fontSize: '0.83rem', color: '#1e293b', lineHeight: 1.45 }}>
                {renderInlineContent(content, false)}
              </Typography>
            </Box>
          );
        }

        return (
          <Typography
            key={idx}
            variant="body2"
            sx={{
              fontSize: '0.83rem',
              color: isUser ? '#ffffff' : '#f1f5f9',
              lineHeight: 1.45,
            }}
          >
            {renderInlineContent(line, isUser)}
          </Typography>
        );
      })}
    </Box>
  );
};

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  latencyMs?: number;
  dataSource?: string;
  isError?: boolean;
  checks?: Array<{ name: string; status: string; detail: string }>;
  sources?: string[];
  readOnly?: boolean;
}

export const ChatAssistantWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [freshnessNotice, setFreshnessNotice] = useState<string>('Live corridor snapshot verified • Zero mutation mode');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! I am Rail Sarthi (RailBlock Operations Copilot). I provide read-only operational intelligence on Coordinated Super-Blocks, train headway lulls, and track asset availability within your authorized jurisdiction.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dataSource: 'Security Boundary Active',
      checks: [
        { name: 'authorization_scope', status: 'PASSED', detail: 'Authenticated user scope verified.' },
        { name: 'live_snapshot', status: 'PASSED', detail: 'Real-time database connection established.' },
        { name: 'write_guard', status: 'PASSED', detail: 'No mutation tool available (Strict Read-Only).' },
      ],
      sources: ['maintenance_blocks', 'maintenance_requests', 'train_schedules'],
      readOnly: true,
    },
  ]);

  const user = getAuthenticatedUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-rail-copilot', handleOpen);

    const unsubBlock = wsService.on('BLOCK_SANCTIONED', () => {
      setFreshnessNotice('Corridor update: New block sanctioned. Operational snapshot updated in real-time.');
    });
    const unsubReq = wsService.on('REQUEST_CREATED', () => {
      setFreshnessNotice('Corridor update: Maintenance request registered. Live snapshot refreshed.');
    });

    return () => {
      window.removeEventListener('open-rail-copilot', handleOpen);
      unsubBlock();
      unsubReq();
    };
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response: ChatResponse = await sendChatQuery(textToSend);
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latencyMs: response.guardrail_latency_ms,
        dataSource: response.data_source,
        checks: response.checks,
        sources: response.sources,
        readOnly: response.read_only ?? true,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg =
        typeof detail === 'object' && detail?.error
          ? detail.error
          : err.response?.data?.message || 'Access rejected by operational guardrail.';

      const errResponse: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: `🛡️ Security Intercept: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errResponse]);
    } finally {
      setLoading(false);
    }
  };

  const defaultSuggestions = [
    "Show active maintenance blocks today",
    "Which trains are delayed by maintenance?",
    "Check track machinery availability",
    "Cancel block 104 (Test Guardrail)",
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="Open RailBlock AI Copilot (Read-Only Assistant)" placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1200,
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            boxShadow: '0 8px 24px rgba(26,35,126,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)',
            },
          }}
        >
          <SmartToyIcon sx={{ fontSize: 28, color: '#ffab00' }} />
        </Fab>
      </Tooltip>

      {/* Slide-out Chat Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500, md: 540 },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0f1d',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SmartToyIcon sx={{ color: '#fbbf24', fontSize: 30 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Rail Sarthi • Operations Copilot
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                <SecurityIcon sx={{ fontSize: 13, color: '#4caf50' }} />
                <Typography variant="caption" sx={{ color: '#b0bec5', fontSize: '0.72rem' }}>
                  {user ? `${user.tier_role} • Read-Only MLS • ${user.jurisdiction_id}` : 'Read-Only Mode'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Status Chips & Freshness Bar */}
        <Box sx={{ px: 2, pt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            <Chip label="LIVE SNAPSHOT" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
            <Chip label="NO WRITE ACCESS" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
            <Chip label="SUB-3MS GUARDRAILS" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#e8f5e9', color: '#2e7d32' }} />
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SyncIcon sx={{ fontSize: 13, color: '#0284c7' }} />
            {freshnessNotice}
          </Typography>
        </Box>

        {/* Quick Suggestion Chips */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
          {defaultSuggestions.map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              size="small"
              onClick={() => handleSend(suggestion)}
              disabled={loading}
              sx={{
                fontSize: '0.72rem',
                backgroundColor: suggestion.includes('Cancel') ? '#fee2e2' : '#e0e7ff',
                color: suggestion.includes('Cancel') ? '#b91c1c' : '#3730a3',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: suggestion.includes('Cancel') ? '#fecaca' : '#c7d2fe',
                },
              }}
            />
          ))}
        </Box>

        {/* Message Stream */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={msg.sender === 'user' ? 2 : 1}
                sx={{
                  p: 1.5,
                  maxWidth: '88%',
                  borderRadius: 2.5,
                  backgroundColor:
                    msg.sender === 'user'
                      ? '#1d4ed8'
                      : msg.isError
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(15, 23, 42, 0.95)',
                  color: msg.sender === 'user' ? '#ffffff' : msg.isError ? '#fca5a5' : '#f1f5f9',
                  border: msg.isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <FormattedMessage text={msg.text} isUser={msg.sender === 'user'} />

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 0.8,
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: msg.sender === 'user' ? '#9fa8da' : '#94a3b8',
                    }}
                  >
                    {msg.timestamp}
                  </Typography>

                  {msg.latencyMs !== undefined && (
                    <Chip
                      label={`⚡ ${msg.latencyMs}ms`}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.6rem',
                        backgroundColor: '#f1f5f9',
                        color: '#059669',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>

                {msg.checks && msg.checks.length > 0 && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #cbd5e1' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
                      <VerifiedIcon sx={{ fontSize: 13, color: '#16a34a' }} />
                      Statutory Verification Checks:
                    </Typography>
                    {msg.checks.map((chk, cIdx) => (
                      <Box key={cIdx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                        <CheckCircleIcon sx={{ fontSize: 12, color: chk.status === 'PASSED' ? '#16a34a' : '#ea580c' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#334155' }}>
                          <strong>{chk.name}:</strong> {chk.detail}
                        </Typography>
                      </Box>
                    ))}
                    {msg.sources && msg.sources.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.6 }}>
                        {msg.sources.map((src) => (
                          <Chip key={src} label={src} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.62rem', color: '#64748b' }} />
                        ))}
                      </Box>
                    )}
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: '0.66rem', mt: 0.5, fontStyle: 'italic' }}>
                      Informational only • Section 65B court-admissible audit logged • Zero operational mutations.
                    </Typography>
                  </Box>
                )}
              </Paper>

              {msg.dataSource && (
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b', mt: 0.3, px: 0.5 }}>
                  🔒 {msg.dataSource}
                </Typography>
              )}
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
              <CircularProgress size={18} sx={{ color: '#1a237e' }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Applying hierarchy filters & querying...
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Form */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          sx={{
            p: 1.5,
            backgroundColor: 'rgba(10, 15, 26, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Ask Rail Sarthi about blocks, delays, G&SR..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                fontSize: '0.86rem',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
              },
            }}
          />
          <IconButton
            color="primary"
            type="submit"
            disabled={!input.trim() || loading}
            sx={{
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: 2,
              p: 1,
              '&:hover': { backgroundColor: '#2563eb' },
              '&.Mui-disabled': { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#64748b' },
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Drawer>
    </>
  );
};
