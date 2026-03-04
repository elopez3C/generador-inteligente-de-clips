import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import FlagIcon from '@mui/icons-material/Flag';
import { TranscriptGroup, Clip } from '../types';

function normalizeText(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

interface TranscriptClipCreatorProps {
  open: boolean;
  onClose: () => void;
  onSave: (clip: Clip) => void;
  groups: TranscriptGroup[];
  nextNumber: number;
}

interface LineRef {
  groupIndex: number;
  lineIndex: number;
  time: string;
  text: string;
}

const TranscriptClipCreator: React.FC<TranscriptClipCreatorProps> = ({
  open, onClose, onSave, groups, nextNumber,
}) => {
  const [search, setSearch] = useState('');
  const [startLine, setStartLine] = useState<LineRef | null>(null);
  const [endLine, setEndLine] = useState<LineRef | null>(null);
  const [title, setTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setStartLine(null);
      setEndLine(null);
      setTitle('');
      setSearch('');
    }
  }, [open]);

  const normQuery = normalizeText(search);

  const filteredGroups = groups
    .map(g => ({
      ...g,
      lines: g.lines.filter(l =>
        !normQuery ||
        normalizeText(l.text).includes(normQuery) ||
        normalizeText(g.speaker).includes(normQuery)
      ),
    }))
    .filter(g => g.lines.length > 0);

  // Build flat line index for range detection
  const flatLines: LineRef[] = [];
  filteredGroups.forEach((g, gi) => {
    g.lines.forEach((l, li) => {
      flatLines.push({ groupIndex: gi, lineIndex: li, time: l.time, text: l.text });
    });
  });

  const getFlatIndex = (gi: number, li: number) =>
    flatLines.findIndex(f => f.groupIndex === gi && f.lineIndex === li);

  const isInRange = (gi: number, li: number): boolean => {
    if (!startLine || !endLine) return false;
    const sFlat = getFlatIndex(startLine.groupIndex, startLine.lineIndex);
    const eFlat = getFlatIndex(endLine.groupIndex, endLine.lineIndex);
    const cur = getFlatIndex(gi, li);
    const lo = Math.min(sFlat, eFlat);
    const hi = Math.max(sFlat, eFlat);
    return cur >= lo && cur <= hi;
  };

  const isStart = (gi: number, li: number) =>
    startLine?.groupIndex === gi && startLine?.lineIndex === li;
  const isEnd = (gi: number, li: number) =>
    endLine?.groupIndex === gi && endLine?.lineIndex === li;

  const handleLineClick = (gi: number, li: number, time: string, text: string) => {
    const ref: LineRef = { groupIndex: gi, lineIndex: li, time, text };
    if (!startLine) {
      setStartLine(ref);
    } else if (!endLine) {
      setEndLine(ref);
    } else {
      // Restart
      setStartLine(ref);
      setEndLine(null);
      setTitle('');
    }
  };

  const handleSave = () => {
    if (!startLine || !endLine) return;

    const startTime = startLine.time <= endLine.time ? startLine.time : endLine.time;
    const endTime = startLine.time <= endLine.time ? endLine.time : startLine.time;

    const [startM, startS] = startTime.split(':').map(Number);
    let [endM, endS] = endTime.split(':').map(Number);
    endS += 30;
    if (endS >= 60) { endM += 1; endS -= 60; }

    const clip: Clip = {
      id: `manual-${Date.now()}`,
      number: nextNumber,
      title: title.trim() || `Clip Manual #${nextNumber}`,
      score: 0,
      hook: 'Clip definido manualmente.',
      category: 'Manual',
      startMinutes: startM,
      startSeconds: startS,
      endMinutes: endM,
      endSeconds: endS,
      justification: 'Creado manualmente desde la transcripción.',
      selected: true,
      isManual: true,
    };

    onSave(clip);
    onClose();
  };

  const actualStart = startLine && endLine
    ? (startLine.time <= endLine.time ? startLine : endLine)
    : startLine;
  const actualEnd = startLine && endLine
    ? (startLine.time <= endLine.time ? endLine : startLine)
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
    >
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <Box
          sx={{
            px: 2, py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
            <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
              Crear clip desde transcripción
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckIcon />}
              disabled={!startLine || !endLine}
              onClick={handleSave}
            >
              Guardar clip
            </Button>
          </Stack>
        </Box>

        {/* Instructions + status bar */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'grey.50' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Box sx={{ flexGrow: 1 }}>
              {!startLine && (
                <Typography variant="body2" color="text.secondary">
                  Haz scroll y selecciona la <strong>frase de inicio</strong> del clip
                </Typography>
              )}
              {startLine && !endLine && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={`Inicio: ${startLine.time}`} size="small" color="success" icon={<FlagIcon />} />
                  <Typography variant="body2" color="text.secondary">
                    Ahora selecciona la <strong>frase de fin</strong>
                  </Typography>
                  <Button size="small" variant="text" onClick={() => { setStartLine(null); setEndLine(null); }}>
                    Reiniciar
                  </Button>
                </Stack>
              )}
              {startLine && endLine && (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip label={`Inicio: ${actualStart?.time}`} size="small" color="success" icon={<FlagIcon />} />
                  <Chip label={`Fin: ${actualEnd?.time}`} size="small" color="error" icon={<FlagIcon />} />
                  <TextField
                    size="small"
                    placeholder={`Clip Manual #${nextNumber}`}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                  <Button size="small" variant="text" onClick={() => { setStartLine(null); setEndLine(null); setTitle(''); }}>
                    Reiniciar
                  </Button>
                </Stack>
              )}
            </Box>

            {/* Search */}
            <TextField
              size="small"
              placeholder="Buscar en transcripción..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', sm: 260 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Box>

        {/* Transcript scroll area */}
        <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2 }}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {filteredGroups.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 6 }}>
                Sin resultados para "{search}"
              </Typography>
            ) : (
              <Stack spacing={3}>
                {filteredGroups.map((group, gi) => (
                  <Box key={gi}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar
                        sx={{
                          width: 30, height: 30, fontSize: 12, fontWeight: 700,
                          bgcolor: group.speakerColor === 'primary' ? 'primary.main' : 'secondary.main',
                        }}
                      >
                        {group.speaker.charAt(group.speaker.length - 1)}
                      </Avatar>
                      <Typography variant="overline" color="text.secondary">
                        {group.speaker}
                      </Typography>
                    </Stack>

                    <Stack spacing={0.5} sx={{ pl: 5.5 }}>
                      {group.lines.map((line, li) => {
                        const inRange = isInRange(gi, li);
                        const isStartLine = isStart(gi, li);
                        const isEndLine = isEnd(gi, li);
                        const isBoundary = isStartLine || isEndLine;

                        return (
                          <Box
                            key={li}
                            onClick={() => handleLineClick(gi, li, line.time, line.text)}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: 2,
                              cursor: 'pointer',
                              bgcolor: inRange
                                ? 'rgba(76,175,80,0.08)'
                                : 'transparent',
                              borderLeft: isBoundary
                                ? '4px solid'
                                : inRange
                                ? '4px solid'
                                : '4px solid transparent',
                              borderColor: isStartLine
                                ? 'success.main'
                                : isEndLine
                                ? 'error.main'
                                : inRange
                                ? 'rgba(76,175,80,0.3)'
                                : 'transparent',
                              transition: 'all 0.15s',
                              '&:hover': {
                                bgcolor: inRange
                                  ? 'rgba(76,175,80,0.12)'
                                  : 'grey.100',
                              },
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 40, pt: 0.25, flexShrink: 0 }}
                            >
                              {line.time}
                            </Typography>
                            <Typography variant="body1" sx={{ flexGrow: 1, lineHeight: 1.7 }}>
                              {line.text}
                            </Typography>
                            {isStartLine && (
                              <Chip label="INICIO" size="small" color="success" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22, flexShrink: 0 }} />
                            )}
                            {isEndLine && (
                              <Chip label="FIN" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22, flexShrink: 0 }} />
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default TranscriptClipCreator;
