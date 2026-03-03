import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import MockVideoPlayer from './MockVideoPlayer';
import { Clip, TranscriptGroup } from '../types';
import { formatDuration } from '../utils';

interface ClipEditorDialogProps {
  open: boolean;
  clip: Clip | null;
  totalDuration: number;
  transcriptGroups: TranscriptGroup[];
  onClose: () => void;
  onSave: (updatedClip: Clip) => void;
}

function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

const ClipEditorDialog: React.FC<ClipEditorDialogProps> = ({
  open, clip, totalDuration, transcriptGroups, onClose, onSave,
}) => {
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, 60]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const [hoveredLineSec, setHoveredLineSec] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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
    if (clip) {
      setTitle(clip.title);
      setEditingTitle(false);
      const start = clip.startMinutes * 60 + clip.startSeconds;
      const end = clip.endMinutes * 60 + clip.endSeconds;
      setRange([start, end]);
      setPlayhead(start);
      setPlaying(false);
    }
  }, [clip]);

  useEffect(() => {
    if (open && clip && scrollRef.current) {
      const timer = setTimeout(() => {
        const el = scrollRef.current?.querySelector('[data-in-range="true"]');
        if (el) {
          el.scrollIntoView({ block: 'start', behavior: 'auto' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, clip]);

  // Drag handlers for CapCut-style timeline handles
  const handleTimelineDrag = useCallback((e: MouseEvent) => {
    if (!dragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const time = Math.round((x / rect.width) * totalDuration);
    setRange(prev => {
      if (dragging === 'start') {
        const clamped = Math.max(0, Math.min(time, prev[1] - 1));
        return [clamped, prev[1]];
      } else {
        const clamped = Math.min(totalDuration, Math.max(time, prev[0] + 1));
        return [prev[0], clamped];
      }
    });
  }, [dragging, totalDuration]);

  const handleTimelineDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleTimelineDrag);
      window.addEventListener('mouseup', handleTimelineDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleTimelineDrag);
        window.removeEventListener('mouseup', handleTimelineDragEnd);
      };
    }
  }, [dragging, handleTimelineDrag, handleTimelineDragEnd]);

  if (!clip) return null;

  const clipDuration = range[1] - range[0];
  const isValid = clipDuration > 0;

  const handleSave = () => {
    const startM = Math.floor(range[0] / 60);
    const startS = Math.round(range[0] % 60);
    const endM = Math.floor(range[1] / 60);
    const endS = Math.round(range[1] % 60);
    onSave({
      ...clip,
      title: title.trim() || clip.title,
      startMinutes: startM, startSeconds: startS,
      endMinutes: endM, endSeconds: endS,
    });
    onClose();
  };

  const getLineStatus = (timeSec: number): 'start' | 'end' | 'in' | null => {
    if (Math.abs(timeSec - range[0]) <= 1) return 'start';
    if (Math.abs(timeSec - range[1]) <= 1) return 'end';
    if (timeSec > range[0] && timeSec < range[1]) return 'in';
    return null;
  };

  const getHoverIntent = (lineSec: number): 'start' | 'end' => {
    if (lineSec < range[0]) return 'start';
    if (lineSec > range[1]) return 'end';
    const midpoint = (range[0] + range[1]) / 2;
    return lineSec <= midpoint ? 'start' : 'end';
  };

  const handleLineClick = (lineSec: number) => {
    const intent = getHoverIntent(lineSec);
    if (intent === 'start') {
      if (lineSec < range[1]) setRange([lineSec, range[1]]);
    } else {
      if (lineSec > range[0]) setRange([range[0], lineSec]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 'calc(100vw - 80px)',
          maxWidth: 'calc(100vw - 80px)',
          height: 'calc(100vh - 80px)',
          borderRadius: 3,
          m: '40px',
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
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              autoFocus
              sx={{ maxWidth: 360 }}
            />
          ) : (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="h6" fontWeight={600}>{title}</Typography>
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
                        const isBoundary = isStart || isEnd;
                        const q = search.trim().toLowerCase();
                        const hasMatch = q && line.text.toLowerCase().includes(q);
                        const dimmed = q && !hasMatch;
                        const isHovered = hoveredLineSec === lineSec && !isBoundary;
                        const hoverIntent = isHovered ? getHoverIntent(lineSec) : null;

                        const renderText = () => {
                          if (!q || !hasMatch) return line.text;
                          const idx = line.text.toLowerCase().indexOf(q);
                          return (
                            <>
                              {line.text.slice(0, idx)}
                              <Box component="span" sx={{ bgcolor: 'warning.light', borderRadius: 0.5, px: 0.25 }}>
                                {line.text.slice(idx, idx + q.length)}
                              </Box>
                              {line.text.slice(idx + q.length)}
                            </>
                          );
                        };

                        // Border color: hover preview overrides default
                        const borderColor = isStart ? 'success.main'
                          : isEnd ? 'error.main'
                          : hoverIntent === 'start' ? 'success.main'
                          : hoverIntent === 'end' ? 'error.main'
                          : isInRange ? 'success.light'
                          : 'transparent';

                        return (
                          <Box
                            key={li}
                            data-time={line.time}
                            data-in-range={isInRange ? 'true' : undefined}
                            data-search-match={hasMatch ? 'true' : undefined}
                            onClick={isBoundary ? undefined : () => handleLineClick(lineSec)}
                            onMouseEnter={() => setHoveredLineSec(lineSec)}
                            onMouseLeave={() => setHoveredLineSec(null)}
                            sx={{
                              display: 'flex', alignItems: 'flex-start', gap: 0.75, py: 0.5, px: 0.75,
                              borderRadius: 1, fontSize: '0.8rem',
                              bgcolor: isHovered
                                ? (hoverIntent === 'start' ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)')
                                : isInRange ? 'success.light' : 'transparent',
                              borderLeft: '3px solid',
                              borderColor,
                              opacity: dimmed ? 0.35 : 1,
                              transition: 'all 0.15s',
                              cursor: isBoundary ? 'default' : 'pointer',
                              '&:hover': !isBoundary ? {
                                bgcolor: hoverIntent === 'start' ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
                              } : {
                                bgcolor: isInRange ? 'rgba(76,175,80,0.15)' : undefined,
                              },
                            }}
                          >
                            <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 32, pt: 0.15, flexShrink: 0, color: 'text.disabled', fontSize: '0.65rem' }}>
                              {line.time}
                            </Typography>
                            <Typography variant="body2" sx={{ flexGrow: 1, lineHeight: 1.5, color: isInRange ? 'text.primary' : 'text.secondary', fontSize: '0.8rem' }}>
                              {renderText()}
                            </Typography>
                            {isHovered && hoverIntent === 'start' && (
                              <Typography variant="caption" sx={{ flexShrink: 0, color: 'success.main', fontWeight: 600, fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                                ↦ Inicio
                              </Typography>
                            )}
                            {isHovered && hoverIntent === 'end' && (
                              <Typography variant="caption" sx={{ flexShrink: 0, color: 'error.main', fontWeight: 600, fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                                Fin ↤
                              </Typography>
                            )}
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

          {/* RIGHT — Video + controls + range (Premiere-style) */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3, gap: 2, overflowY: 'auto' }}>

            {/* Mock video player with thumbnail */}
            <MockVideoPlayer
              currentTime={playhead}
              totalDuration={totalDuration}
              clipRange={{ start: range[0], end: range[1] }}
              onSeek={setPlayhead}
              readOnly
              thumbnail={clip.thumbnail}
              isVertical={clip.isVertical}
            />

            {/* CapCut-style Timeline */}
            <Box sx={{ width: '100%' }}>
              {/* Ruler with ticks */}
              <Box sx={{ position: 'relative', height: 20, mb: 0.25 }}>
                {Array.from({ length: 11 }).map((_, i) => {
                  const pct = (i / 10) * 100;
                  const time = Math.round((i / 10) * totalDuration);
                  return (
                    <Box key={i} sx={{ position: 'absolute', left: `${pct}%`, top: 0, transform: 'translateX(-50%)' }}>
                      <Box sx={{ width: 1, height: i % 5 === 0 ? 10 : 6, bgcolor: 'rgba(255,255,255,0.2)', mx: 'auto' }} />
                      {i % 2 === 0 && (
                        <Typography sx={{ color: 'grey.600', fontSize: '0.5rem', fontVariantNumeric: 'tabular-nums', textAlign: 'center', mt: 0.15, lineHeight: 1 }}>
                          {formatDuration(time)}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Track container — the outer long rectangle */}
              <Box
                ref={timelineRef}
                onClick={(e) => {
                  if (dragging) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const time = Math.round((x / rect.width) * totalDuration);
                  setPlayhead(Math.max(0, Math.min(totalDuration, time)));
                }}
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 72,
                  bgcolor: '#0d0d1a',
                  borderRadius: 2,
                  cursor: dragging ? (dragging === 'start' ? 'w-resize' : 'e-resize') : 'pointer',
                  overflow: 'visible',
                  userSelect: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Subtle grid lines inside the track */}
                {Array.from({ length: 40 }).map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: 'absolute',
                      left: `${(i / 40) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      bgcolor: i % 4 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    }}
                  />
                ))}

                {/* Clip block — the inner rectangle you drag */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    bottom: 4,
                    left: `${(range[0] / totalDuration) * 100}%`,
                    width: `${((range[1] - range[0]) / totalDuration) * 100}%`,
                    display: 'flex',
                    alignItems: 'stretch',
                    minWidth: 32,
                    zIndex: 1,
                  }}
                >
                  {/* Left handle (start) */}
                  <Box
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setDragging('start'); }}
                    sx={{
                      width: 14,
                      flexShrink: 0,
                      bgcolor: dragging === 'start' ? '#90caf9' : 'white',
                      borderRadius: '8px 0 0 8px',
                      cursor: 'w-resize',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.15s, box-shadow 0.15s',
                      '&:hover': { bgcolor: '#e0e0e0', boxShadow: '0 0 8px rgba(255,255,255,0.3)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: '2px' }}>
                      <Box sx={{ width: 2, height: 20, bgcolor: 'grey.500', borderRadius: 1 }} />
                      <Box sx={{ width: 2, height: 20, bgcolor: 'grey.500', borderRadius: 1 }} />
                    </Box>
                  </Box>

                  {/* Clip body — colored bar with thumbnail strip effect */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      position: 'relative',
                      overflow: 'hidden',
                      borderTop: '3px solid white',
                      borderBottom: '3px solid white',
                    }}
                  >
                    {/* Gradient fill simulating thumbnail frames */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, #5c3d99 0%, #7c5cbf 25%, #6a4fb0 50%, #7c5cbf 75%, #5c3d99 100%)',
                      }}
                    />
                    {/* Frame dividers */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          position: 'absolute',
                          left: `${((i + 1) / 13) * 100}%`,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          bgcolor: 'rgba(0,0,0,0.25)',
                        }}
                      />
                    ))}
                    {/* Center label */}
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography
                        sx={{
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                          letterSpacing: 0.5,
                        }}
                      >
                        {formatDuration(range[0])} — {formatDuration(range[1])}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right handle (end) */}
                  <Box
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setDragging('end'); }}
                    sx={{
                      width: 14,
                      flexShrink: 0,
                      bgcolor: dragging === 'end' ? '#90caf9' : 'white',
                      borderRadius: '0 8px 8px 0',
                      cursor: 'e-resize',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.15s, box-shadow 0.15s',
                      '&:hover': { bgcolor: '#e0e0e0', boxShadow: '0 0 8px rgba(255,255,255,0.3)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: '2px' }}>
                      <Box sx={{ width: 2, height: 20, bgcolor: 'grey.500', borderRadius: 1 }} />
                      <Box sx={{ width: 2, height: 20, bgcolor: 'grey.500', borderRadius: 1 }} />
                    </Box>
                  </Box>
                </Box>

                {/* Playhead */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    bottom: -6,
                    left: `${(playhead / totalDuration) * 100}%`,
                    width: 2,
                    bgcolor: '#ff5252',
                    zIndex: 3,
                    pointerEvents: 'none',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: -5,
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '8px solid #ff5252',
                    },
                  }}
                />
              </Box>

              {/* Info row below track */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.75, px: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
                  IN {formatDuration(range[0])}
                </Typography>
                <Chip
                  label={isValid ? `Duración: ${formatDuration(clipDuration)}` : 'Inválido'}
                  size="small"
                  color={isValid ? 'default' : 'error'}
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                />
                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
                  OUT {formatDuration(range[1])}
                </Typography>
              </Stack>
            </Box>

            {/* Transport controls */}
            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
              <Tooltip title="Ir al inicio">
                <IconButton onClick={() => setPlayhead(range[0])} size="medium" sx={{ color: 'text.secondary' }}>
                  <SkipPreviousIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="-5s">
                <IconButton onClick={() => setPlayhead(Math.max(0, playhead - 5))} size="medium" sx={{ color: 'text.secondary' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>-5s</Typography>
                </IconButton>
              </Tooltip>
              <Tooltip title="-1s">
                <IconButton onClick={() => setPlayhead(Math.max(0, playhead - 1))} size="medium" sx={{ color: 'text.secondary' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>-1s</Typography>
                </IconButton>
              </Tooltip>
              <IconButton
                onClick={() => setPlaying(p => !p)}
                sx={{
                  color: 'white', bgcolor: 'primary.main',
                  width: 48, height: 48,
                  '&:hover': { bgcolor: 'primary.dark' },
                  mx: 1,
                }}
              >
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <Tooltip title="+1s">
                <IconButton onClick={() => setPlayhead(Math.min(totalDuration, playhead + 1))} size="medium" sx={{ color: 'text.secondary' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>+1s</Typography>
                </IconButton>
              </Tooltip>
              <Tooltip title="+5s">
                <IconButton onClick={() => setPlayhead(Math.min(totalDuration, playhead + 5))} size="medium" sx={{ color: 'text.secondary' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>+5s</Typography>
                </IconButton>
              </Tooltip>
              <Tooltip title="Ir al fin">
                <IconButton onClick={() => setPlayhead(range[1])} size="medium" sx={{ color: 'text.secondary' }}>
                  <SkipNextIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Precise time inputs: Inicio / Fin */}
            <Stack direction="row" spacing={3} justifyContent="center" alignItems="flex-start">
              {/* Inicio */}
              <Box>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, mb: 0.5, display: 'block', textAlign: 'center' }}>
                  INICIO
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TextField
                    size="small"
                    value={String(Math.floor(range[0] / 60)).padStart(2, '0')}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const clamped = Math.max(0, Math.min(99, val));
                      const newStart = clamped * 60 + (range[0] % 60);
                      if (newStart < range[1]) setRange([newStart, range[1]]);
                    }}
                    slotProps={{ input: { sx: { textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 16 } } }}
                    sx={{ width: 52, '& .MuiOutlinedInput-root': { bgcolor: 'grey.50' } }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>:</Typography>
                  <TextField
                    size="small"
                    value={String(Math.round(range[0] % 60)).padStart(2, '0')}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const clamped = Math.max(0, Math.min(59, val));
                      const newStart = Math.floor(range[0] / 60) * 60 + clamped;
                      if (newStart < range[1]) setRange([newStart, range[1]]);
                    }}
                    slotProps={{ input: { sx: { textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 16 } } }}
                    sx={{ width: 52, '& .MuiOutlinedInput-root': { bgcolor: 'grey.50' } }}
                  />
                </Stack>
              </Box>

              {/* Duration chip */}
              <Box sx={{ pt: 3 }}>
                <Chip
                  label={isValid ? formatDuration(clipDuration) : 'Inválido'}
                  size="small"
                  color={isValid ? 'primary' : 'error'}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.8rem', px: 1 }}
                />
              </Box>

              {/* Fin */}
              <Box>
                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, mb: 0.5, display: 'block', textAlign: 'center' }}>
                  FIN
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TextField
                    size="small"
                    value={String(Math.floor(range[1] / 60)).padStart(2, '0')}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const clamped = Math.max(0, Math.min(99, val));
                      const newEnd = clamped * 60 + (range[1] % 60);
                      if (newEnd > range[0] && newEnd <= totalDuration) setRange([range[0], newEnd]);
                    }}
                    slotProps={{ input: { sx: { textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 16 } } }}
                    sx={{ width: 52, '& .MuiOutlinedInput-root': { bgcolor: 'grey.50' } }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>:</Typography>
                  <TextField
                    size="small"
                    value={String(Math.round(range[1] % 60)).padStart(2, '0')}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const clamped = Math.max(0, Math.min(59, val));
                      const newEnd = Math.floor(range[1] / 60) * 60 + clamped;
                      if (newEnd > range[0] && newEnd <= totalDuration) setRange([range[0], newEnd]);
                    }}
                    slotProps={{ input: { sx: { textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 16 } } }}
                    sx={{ width: 52, '& .MuiOutlinedInput-root': { bgcolor: 'grey.50' } }}
                  />
                </Stack>
              </Box>
            </Stack>

            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained" startIcon={<CheckIcon />}
                onClick={handleSave} disabled={!isValid}
              >
                Guardar cambios
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ClipEditorDialog;
