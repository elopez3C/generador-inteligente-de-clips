import React, { useState, useEffect, useRef } from 'react';
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
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Replay5Icon from '@mui/icons-material/Replay5';
import Forward5Icon from '@mui/icons-material/Forward5';
import MovieIcon from '@mui/icons-material/Movie';
import FlagIcon from '@mui/icons-material/Flag';
import DescriptionIcon from '@mui/icons-material/Description';
import { Clip, TranscriptGroup } from '../types';
import { formatDuration, parseDuration } from '../utils';

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
  const [range, setRange] = useState<[number, number]>([0, 60]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clip) {
      setTitle(clip.title);
      const start = clip.startMinutes * 60 + clip.startSeconds;
      const end = clip.endMinutes * 60 + clip.endSeconds;
      setRange([start, end]);
      setPlayhead(start);
      setPlaying(false);
    }
  }, [clip]);

  // Auto-scroll to clip start on open
  useEffect(() => {
    if (open && clip && scrollRef.current) {
      const timer = setTimeout(() => {
        const startSec = clip.startMinutes * 60 + clip.startSeconds;
        // Find the first line in range
        const el = scrollRef.current?.querySelector('[data-in-range="true"]');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, clip]);

  if (!clip) return null;

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

    onSave({
      ...clip,
      title: title.trim() || clip.title,
      startMinutes: startM,
      startSeconds: startS,
      endMinutes: endM,
      endSeconds: endS,
    });
    onClose();
  };

  const setStartFromLine = (timeSec: number) => {
    if (timeSec < range[1]) {
      setRange([timeSec, range[1]]);
    }
  };

  const setEndFromLine = (timeSec: number) => {
    if (timeSec > range[0]) {
      setRange([range[0], timeSec]);
    }
  };

  const getLineStatus = (timeSec: number): 'start' | 'end' | 'in' | null => {
    // Use a small tolerance for matching start/end
    if (Math.abs(timeSec - range[0]) <= 1) return 'start';
    if (Math.abs(timeSec - range[1]) <= 1) return 'end';
    if (timeSec > range[0] && timeSec < range[1]) return 'in';
    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { bgcolor: '#1a1a2e', color: 'white' },
      }}
    >
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Top toolbar */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
        >
          <IconButton onClick={onClose} sx={{ color: 'grey.400' }}>
            <CloseIcon />
          </IconButton>
          <TextField
            size="small"
            value={title}
            onChange={e => setTitle(e.target.value)}
            sx={{
              ml: 1, flexGrow: 1, maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.06)',
                color: 'white',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#7c5cbf' },
              },
              '& .MuiInputBase-input::placeholder': { color: 'grey.500' },
            }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckIcon />}
            onClick={handleSave}
            disabled={!isValid}
            sx={{ borderRadius: 2 }}
          >
            Guardar cambios
          </Button>
        </Stack>

        {/* Scrollable content area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>

            {/* Video preview */}
            <Box
              sx={{
                width: '100%',
                aspectRatio: '16/9',
                bgcolor: '#0d0d1a',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                mb: 2,
              }}
            >
              <MovieIcon sx={{ fontSize: 48, color: 'grey.700', mb: 1 }} />
              <Typography variant="caption" sx={{ color: 'grey.600' }}>
                Vista previa del clip
              </Typography>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'grey.300' }}
                >
                  {formatDuration(range[0])} — {formatDuration(range[1])}
                </Typography>
              </Box>
            </Box>

            {/* Playback controls */}
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
              <IconButton onClick={() => setPlayhead(Math.max(0, playhead - 5))} sx={{ color: 'grey.400' }} size="small">
                <Replay5Icon />
              </IconButton>
              <IconButton
                onClick={() => setPlaying(p => !p)}
                sx={{
                  color: 'white',
                  bgcolor: '#7c5cbf',
                  width: 44, height: 44,
                  '&:hover': { bgcolor: '#6a4da8' },
                }}
              >
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <IconButton onClick={() => setPlayhead(Math.min(totalDuration, playhead + 5))} sx={{ color: 'grey.400' }} size="small">
                <Forward5Icon />
              </IconButton>
              <Chip
                label={isValid ? `${Math.round(clipDuration)}s` : 'Inválido'}
                size="small"
                sx={{
                  ml: 2,
                  bgcolor: isValid ? 'rgba(129,199,132,0.15)' : 'rgba(229,115,115,0.15)',
                  color: isValid ? '#81c784' : '#e57373',
                  fontWeight: 600,
                }}
              />
            </Stack>

            {/* Range slider */}
            <Box sx={{ px: 1, mb: 1 }}>
              <Slider
                value={range}
                onChange={handleRangeChange}
                min={0}
                max={totalDuration}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={formatDuration}
                sx={{
                  color: '#7c5cbf',
                  '& .MuiSlider-thumb': {
                    width: 14,
                    height: 14,
                    '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 6px rgba(124,92,191,0.3)' },
                  },
                  '& .MuiSlider-track': { height: 4 },
                  '& .MuiSlider-rail': { height: 4, bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              />
            </Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3, px: 1 }}>
              <Typography variant="caption" sx={{ color: 'grey.500', fontVariantNumeric: 'tabular-nums' }}>
                Inicio: <Box component="span" sx={{ color: '#b39ddb', fontWeight: 600 }}>{formatDuration(range[0])}</Box>
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.500', fontVariantNumeric: 'tabular-nums' }}>
                Fin: <Box component="span" sx={{ color: '#b39ddb', fontWeight: 600 }}>{formatDuration(range[1])}</Box>
              </Typography>
            </Stack>

            {/* Transcript section */}
            <Box
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.03)' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DescriptionIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                  <Typography variant="subtitle2" sx={{ color: 'grey.400' }}>
                    Transcripción del video
                  </Typography>
                </Stack>
              </Box>
              <Box ref={scrollRef} sx={{ maxHeight: 400, overflowY: 'auto', p: 2 }}>
                <Stack spacing={2.5}>
                  {transcriptGroups.map((group, gi) => (
                    <Box key={gi}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        <Avatar
                          sx={{
                            width: 28, height: 28, fontSize: 11, fontWeight: 700,
                            bgcolor: group.speakerColor === 'primary' ? '#7c5cbf' : '#e91e63',
                          }}
                        >
                          {group.speaker.charAt(group.speaker.length - 1)}
                        </Avatar>
                        <Typography variant="overline" sx={{ fontSize: '0.65rem', color: 'grey.500' }}>
                          {group.speaker}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.25} sx={{ pl: 5 }}>
                        {group.lines.map((line, li) => {
                          const lineSec = timeToSeconds(line.time);
                          const status = getLineStatus(lineSec);
                          const isInRange = status !== null;
                          const isStart = status === 'start';
                          const isEnd = status === 'end';

                          return (
                            <Box
                              key={li}
                              data-time={line.time}
                              data-in-range={isInRange ? 'true' : undefined}
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1,
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: isInRange ? 'rgba(76,175,80,0.1)' : 'transparent',
                                borderLeft: '3px solid',
                                borderColor: isStart
                                  ? '#66bb6a'
                                  : isEnd
                                  ? '#ef5350'
                                  : isInRange
                                  ? 'rgba(76,175,80,0.3)'
                                  : 'transparent',
                                transition: 'all 0.15s',
                                '&:hover': {
                                  bgcolor: isInRange ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.04)',
                                  '& .flag-buttons': { opacity: 1 },
                                },
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 36, pt: 0.15, flexShrink: 0, color: 'grey.600' }}
                              >
                                {line.time}
                              </Typography>
                              <Typography variant="body2" sx={{ flexGrow: 1, lineHeight: 1.6, color: isInRange ? 'grey.200' : 'grey.500' }}>
                                {line.text}
                              </Typography>
                              <Stack direction="row" spacing={0.25} className="flag-buttons" sx={{ flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}>
                                <Tooltip title="Establecer como inicio">
                                  <IconButton
                                    size="small"
                                    onClick={() => setStartFromLine(lineSec)}
                                    sx={{ color: 'grey.600', '&:hover': { color: '#66bb6a' } }}
                                  >
                                    <FlagIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Establecer como fin">
                                  <IconButton
                                    size="small"
                                    onClick={() => setEndFromLine(lineSec)}
                                    sx={{ color: 'grey.600', '&:hover': { color: '#ef5350' } }}
                                  >
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                              {isStart && (
                                <Chip label="INICIO" size="small" sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20, flexShrink: 0, bgcolor: 'rgba(102,187,106,0.2)', color: '#66bb6a' }} />
                              )}
                              {isEnd && (
                                <Chip label="FIN" size="small" sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20, flexShrink: 0, bgcolor: 'rgba(239,83,80,0.2)', color: '#ef5350' }} />
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>

          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ClipEditorDialog;
