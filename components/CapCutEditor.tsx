import React, { useState, useRef, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Dialog from '@mui/material/Dialog';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Replay5Icon from '@mui/icons-material/Replay5';
import Forward5Icon from '@mui/icons-material/Forward5';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import MovieIcon from '@mui/icons-material/Movie';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import { Clip, TranscriptGroup } from '../types';
import { formatDuration } from '../utils';

interface CapCutEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (clip: Clip) => void;
  totalDuration: number;
  nextNumber: number;
  transcriptGroups: TranscriptGroup[];
}

function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

const CapCutEditor: React.FC<CapCutEditorProps> = ({
  open, onClose, onSave, totalDuration, nextNumber, transcriptGroups,
}) => {
  const defaultTitle = `Clip Manual #${nextNumber}`;
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, Math.min(60, totalDuration)]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [search, setSearch] = useState('');
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const searchMatchCount = useMemo(() => {
    if (!search.trim()) return 0;
    const q = search.trim().toLowerCase();
    return transcriptGroups.reduce((acc, g) => acc + g.lines.filter(l => l.text.toLowerCase().includes(q)).length, 0);
  }, [search, transcriptGroups]);

  useEffect(() => {
    if (search.trim() && scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-search-match="true"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [search]);

  useEffect(() => {
    if (open && scrollRef.current) {
      const timer = setTimeout(() => {
        const el = scrollRef.current?.querySelector('[data-in-range="true"]');
        if (el && scrollRef.current) {
          scrollRef.current.scrollTop = (el as HTMLElement).offsetTop - scrollRef.current.offsetTop - 8;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const clipDuration = range[1] - range[0];
  const isValid = clipDuration > 0;

  const handleRangeChange = (_: Event, value: number | number[]) => {
    const v = value as [number, number];
    setRange(v);
    setPlayhead(v[0]);
  };

  const handleSave = () => {
    const startM = Math.floor(range[0] / 60);
    const startS = Math.round(range[0] % 60);
    const endM = Math.floor(range[1] / 60);
    const endS = Math.round(range[1] % 60);
    const clip: Clip = {
      id: `manual-${Date.now()}`,
      number: nextNumber,
      title: title.trim() || defaultTitle,
      score: 0,
      hook: 'Clip definido manualmente.',
      category: 'Manual',
      startMinutes: startM, startSeconds: startS,
      endMinutes: endM, endSeconds: endS,
      justification: 'Creado manualmente desde el editor de video.',
      selected: true,
      isManual: true,
    };
    onSave(clip);
    onClose();
    setTitle('');
    setRange([0, Math.min(60, totalDuration)]);
  };

  // Flat array of all line timestamps for duration calculation
  const allLineTimes = useMemo(() => {
    const times: number[] = [];
    transcriptGroups.forEach(g => g.lines.forEach(l => times.push(timeToSeconds(l.time))));
    return times;
  }, [transcriptGroups]);

  const getWordTimestamp = (lineStartSec: number, wordIndex: number, totalWords: number): number => {
    const lineIdx = allLineTimes.indexOf(lineStartSec);
    const nextLineSec = lineIdx >= 0 && lineIdx < allLineTimes.length - 1
      ? allLineTimes[lineIdx + 1]
      : lineStartSec + 5;
    const lineDuration = nextLineSec - lineStartSec;
    return lineStartSec + (wordIndex / Math.max(totalWords, 1)) * lineDuration;
  };

  const handleWordClick = (wordTimeSec: number) => {
    if (!selectionMode) return;
    if (selectionMode === 'start') {
      if (wordTimeSec < range[1]) setRange([Math.round(wordTimeSec), range[1]]);
    } else {
      if (wordTimeSec > range[0]) setRange([range[0], Math.round(wordTimeSec)]);
    }
    setSelectionMode(null);
  };

  const getLineStatus = (timeSec: number): 'start' | 'end' | 'in' | null => {
    if (Math.abs(timeSec - range[0]) <= 1) return 'start';
    if (Math.abs(timeSec - range[1]) <= 1) return 'end';
    if (timeSec > range[0] && timeSec < range[1]) return 'in';
    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: 'calc(100vw - 80px)',
            maxWidth: 'calc(100vw - 80px)',
            height: 'calc(100vh - 80px)',
            borderRadius: 3,
            m: '40px',
          },
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Top toolbar */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        >
          {editingTitle ? (
            <TextField
              size="small"
              value={title}
              placeholder={defaultTitle}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              autoFocus
              sx={{ maxWidth: 360 }}
            />
          ) : (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="h6" fontWeight={600}>{title || defaultTitle}</Typography>
              <IconButton size="small" onClick={() => setEditingTitle(true)}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Two-column body: Transcript LEFT, Video RIGHT */}
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT — Transcript */}
          <Box sx={{ width: '45%', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0, fontSize: '0.8rem' }}>
                  Transcripción
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  size="small"
                  variant="outlined"
                  color={selectionMode === 'start' ? 'success' : 'inherit'}
                  onClick={() => setSelectionMode(selectionMode === 'start' ? null : 'start')}
                  sx={{ minWidth: 56, fontSize: '0.65rem', py: 0.25, px: 1 }}
                >
                  Inicio
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color={selectionMode === 'end' ? 'error' : 'inherit'}
                  onClick={() => setSelectionMode(selectionMode === 'end' ? null : 'end')}
                  sx={{ minWidth: 56, fontSize: '0.65rem', py: 0.25, px: 1 }}
                >
                  Fin
                </Button>
                <TextField
                  size="small"
                  placeholder="Buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                      endAdornment: search ? (
                        <InputAdornment position="end">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {searchMatchCount > 0 && (
                              <Chip label={searchMatchCount} size="small" sx={{ height: 18, fontSize: '0.6rem' }} color="primary" />
                            )}
                            <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.25 }}>
                              <CloseIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Stack>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  sx={{ maxWidth: 180 }}
                />
              </Stack>
            </Box>

            <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
              <Stack spacing={2}>
                {transcriptGroups.map((group, gi) => (
                  <Box key={gi}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Avatar
                        sx={{ width: 24, height: 24, fontSize: 10, fontWeight: 700, bgcolor: group.speakerColor === 'primary' ? 'primary.main' : 'secondary.main' }}
                      >
                        {group.speaker.charAt(group.speaker.length - 1)}
                      </Avatar>
                      <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        {group.speaker}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.25} sx={{ pl: 4 }}>
                      {group.lines.map((line, li) => {
                        const lineSec = timeToSeconds(line.time);
                        const status = getLineStatus(lineSec);
                        const isInRange = status !== null;
                        const isStart = status === 'start';
                        const isEnd = status === 'end';
                        const q = search.trim().toLowerCase();
                        const hasMatch = q && line.text.toLowerCase().includes(q);
                        const dimmed = q && !hasMatch;
                        const words = line.text.split(' ');

                        const borderColor = isStart ? 'success.main'
                          : isEnd ? 'error.main'
                          : isInRange ? 'success.light'
                          : 'transparent';

                        return (
                          <Box
                            key={li}
                            data-time={line.time}
                            data-in-range={isInRange ? 'true' : undefined}
                            data-search-match={hasMatch ? 'true' : undefined}
                            sx={{
                              display: 'flex', alignItems: 'flex-start', gap: 0.75, py: 0.5, px: 0.75,
                              borderRadius: 1, fontSize: '0.8rem',
                              bgcolor: isInRange ? 'success.light' : 'transparent',
                              borderLeft: '3px solid',
                              borderColor,
                              opacity: dimmed ? 0.35 : 1,
                              transition: 'all 0.15s',
                            }}
                          >
                            <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 32, pt: 0.15, flexShrink: 0, color: 'text.disabled', fontSize: '0.65rem' }}>
                              {line.time}
                            </Typography>
                            <Box sx={{ flexGrow: 1, lineHeight: 1.5, fontSize: '0.8rem', color: isInRange ? 'text.primary' : 'text.secondary', flexWrap: 'wrap' }}>
                              {words.map((word, wi) => {
                                const wordTime = getWordTimestamp(lineSec, wi, words.length);
                                const wordInRange = wordTime >= range[0] && wordTime <= range[1];
                                const isSearchMatch = q && word.toLowerCase().includes(q);
                                return (
                                  <Box
                                    key={wi}
                                    component="span"
                                    onClick={() => handleWordClick(wordTime)}
                                    sx={{
                                      cursor: selectionMode ? 'pointer' : 'default',
                                      borderRadius: 0.5,
                                      px: 0.15,
                                      bgcolor: isSearchMatch ? 'warning.light' : wordInRange ? 'rgba(76,175,80,0.15)' : 'transparent',
                                      transition: 'background-color 0.1s',
                                      ...(selectionMode && {
                                        '&:hover': {
                                          bgcolor: selectionMode === 'start' ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)',
                                        },
                                      }),
                                    }}
                                  >
                                    {word}{wi < words.length - 1 ? ' ' : ''}
                                  </Box>
                                );
                              })}
                            </Box>
                            {isStart && <Chip label="INICIO" size="small" color="success" sx={{ fontWeight: 700, fontSize: '0.55rem', height: 18, flexShrink: 0 }} />}
                            {isEnd && <Chip label="FIN" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.55rem', height: 18, flexShrink: 0 }} />}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* RIGHT — Video + controls + range */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3, gap: 2, overflowY: 'auto' }}>
            <Box
              sx={{
                width: '100%', aspectRatio: '16/9', bgcolor: 'grey.100', borderRadius: 2,
                border: '1px solid', borderColor: 'divider',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <MovieIcon sx={{ fontSize: 40, color: 'grey.400', mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>Vista previa no disponible</Typography>
              <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.6)', px: 1.5, py: 0.25, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'white' }}>
                  {formatDuration(playhead)} / {formatDuration(totalDuration)}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <IconButton onClick={() => setPlayhead(Math.max(0, playhead - 5))} size="small">
                <Replay5Icon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => setPlaying(p => !p)}
                sx={{ color: 'white', bgcolor: 'primary.main', width: 38, height: 38, '&:hover': { bgcolor: 'primary.dark' } }}
              >
                {playing ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
              </IconButton>
              <IconButton onClick={() => setPlayhead(Math.min(totalDuration, playhead + 5))} size="small">
                <Forward5Icon fontSize="small" />
              </IconButton>
              <Chip
                label={isValid ? `${Math.round(clipDuration)}s` : 'Inválido'}
                size="small"
                color={isValid ? 'success' : 'error'}
                variant="outlined"
                sx={{ ml: 1, fontWeight: 600 }}
              />
            </Stack>

            <Box sx={{ px: 0.5 }}>
              <Slider
                value={range} onChange={handleRangeChange} min={0} max={totalDuration} step={1}
                valueLabelDisplay="auto" valueLabelFormat={formatDuration}
              />
            </Box>
            <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                Inicio: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{formatDuration(range[0])}</Box>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                Fin: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{formatDuration(range[1])}</Box>
              </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained" startIcon={<CheckIcon />}
                onClick={handleSave} disabled={!isValid}
              >
                Guardar clip
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default CapCutEditor;
