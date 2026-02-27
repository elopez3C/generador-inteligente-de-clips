import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Replay5Icon from '@mui/icons-material/Replay5';
import Forward5Icon from '@mui/icons-material/Forward5';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import SpeedIcon from '@mui/icons-material/Speed';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TuneIcon from '@mui/icons-material/Tune';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import FilterIcon from '@mui/icons-material/Filter';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import MovieIcon from '@mui/icons-material/Movie';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { Clip } from '../types';
import { formatDuration } from '../utils';

interface CapCutEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (clip: Clip) => void;
  totalDuration: number;
  nextNumber: number;
}

const TOOLS = [
  { icon: <ContentCutIcon sx={{ fontSize: 20 }} />, label: 'Dividir' },
  { icon: <SpeedIcon sx={{ fontSize: 20 }} />, label: 'Velocidad' },
  { icon: <VolumeUpIcon sx={{ fontSize: 20 }} />, label: 'Audio' },
  { icon: <TextFieldsIcon sx={{ fontSize: 20 }} />, label: 'Texto' },
  { icon: <MusicNoteIcon sx={{ fontSize: 20 }} />, label: 'Música' },
  { icon: <FilterIcon sx={{ fontSize: 20 }} />, label: 'Filtros' },
  { icon: <TuneIcon sx={{ fontSize: 20 }} />, label: 'Ajustes' },
];

const CapCutEditor: React.FC<CapCutEditorProps> = ({
  open, onClose, onSave, totalDuration, nextNumber,
}) => {
  const [title, setTitle] = useState('');
  const [range, setRange] = useState<[number, number]>([0, Math.min(60, totalDuration)]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);

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
      title: title.trim() || `Clip Manual #${nextNumber}`,
      score: 0,
      hook: 'Clip definido manualmente.',
      category: 'Manual',
      startMinutes: startM,
      startSeconds: startS,
      endMinutes: endM,
      endSeconds: endS,
      justification: 'Creado manualmente desde el editor de video.',
      selected: true,
      isManual: true,
    };
    onSave(clip);
    onClose();
    setTitle('');
    setRange([0, Math.min(60, totalDuration)]);
  };

  // Generate waveform bars
  const waveformBars = 80;
  const trackBars = 120;

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
          <Typography variant="subtitle1" fontWeight={700} sx={{ ml: 1, flexGrow: 1 }}>
            Nuevo clip manual
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mr: 2 }}>
            <IconButton size="small" sx={{ color: 'grey.500' }}><UndoIcon fontSize="small" /></IconButton>
            <IconButton size="small" sx={{ color: 'grey.500' }}><RedoIcon fontSize="small" /></IconButton>
          </Stack>
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckIcon />}
            onClick={handleSave}
            disabled={!isValid}
            sx={{ borderRadius: 2 }}
          >
            Guardar clip
          </Button>
        </Stack>

        {/* Main area: tools + preview */}
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left tools sidebar */}
          <Box
            sx={{
              width: 72,
              borderRight: '1px solid rgba(255,255,255,0.08)',
              py: 2,
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            {TOOLS.map(tool => (
              <Tooltip key={tool.label} title={tool.label} placement="right">
                <IconButton
                  sx={{
                    color: 'grey.500',
                    borderRadius: 2,
                    width: 52,
                    height: 52,
                    flexDirection: 'column',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'grey.300' },
                  }}
                >
                  {tool.icon}
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 0.25, color: 'inherit' }}>
                    {tool.label}
                  </Typography>
                </IconButton>
              </Tooltip>
            ))}
          </Box>

          {/* Preview area */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 2 }}>

            {/* Video preview (mock) */}
            <Box
              sx={{
                width: '100%',
                maxWidth: 640,
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
              }}
            >
              {/* Waveform background */}
              <Stack
                direction="row" spacing={0.25}
                sx={{
                  position: 'absolute',
                  bottom: '35%',
                  left: '8%', right: '8%',
                  height: 50,
                  alignItems: 'flex-end',
                  opacity: 0.12,
                }}
              >
                {Array.from({ length: waveformBars }).map((_, i) => {
                  const h = 10 + Math.sin(i * 0.7) * 20 + Math.cos(i * 1.1) * 15;
                  const progress = totalDuration > 0 ? playhead / totalDuration : 0;
                  const barPct = i / waveformBars;
                  return (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        height: Math.max(4, h),
                        bgcolor: barPct <= progress ? '#7c5cbf' : 'grey.600',
                        borderRadius: 0.5,
                      }}
                    />
                  );
                })}
              </Stack>

              <MovieIcon sx={{ fontSize: 56, color: 'grey.700', mb: 1 }} />
              <Typography variant="caption" sx={{ color: 'grey.600' }}>
                Vista previa no disponible
              </Typography>

              {/* Timecode overlay */}
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
                  {formatDuration(playhead)} / {formatDuration(totalDuration)}
                </Typography>
              </Box>
            </Box>

            {/* Playback controls */}
            <Stack direction="row" spacing={1.5} alignItems="center">
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
            </Stack>

            {/* Title input */}
            <TextField
              size="small"
              placeholder={`Clip Manual #${nextNumber}`}
              value={title}
              onChange={e => setTitle(e.target.value)}
              sx={{
                maxWidth: 400,
                width: '100%',
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
          </Box>
        </Box>

        {/* Bottom timeline panel */}
        <Box
          sx={{
            flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            bgcolor: '#16162a',
          }}
        >
          {/* Zoom controls + clip info */}
          <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1 }}>
            <IconButton size="small" sx={{ color: 'grey.500' }} onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Box sx={{ width: 60, mx: 1 }}>
              <Slider
                value={zoom}
                min={0.5}
                max={3}
                step={0.25}
                onChange={(_, v) => setZoom(v as number)}
                size="small"
                sx={{
                  color: 'grey.500',
                  '& .MuiSlider-thumb': { width: 12, height: 12 },
                }}
              />
            </Box>
            <IconButton size="small" sx={{ color: 'grey.500' }} onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
              <ZoomInIcon fontSize="small" />
            </IconButton>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="caption" sx={{ color: 'grey.500', fontVariantNumeric: 'tabular-nums' }}>
                Inicio: <Box component="span" sx={{ color: '#b39ddb', fontWeight: 600 }}>{formatDuration(range[0])}</Box>
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.500', fontVariantNumeric: 'tabular-nums' }}>
                Fin: <Box component="span" sx={{ color: '#b39ddb', fontWeight: 600 }}>{formatDuration(range[1])}</Box>
              </Typography>
              <Typography variant="caption" sx={{ color: isValid ? '#81c784' : '#e57373', fontWeight: 700 }}>
                {isValid ? `${Math.round(clipDuration)}s` : 'Inválido'}
              </Typography>
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* Multi-track timeline */}
          <Box sx={{ px: 2, py: 1.5 }}>

            {/* Time ruler */}
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5, px: 0.5 }}>
              {Array.from({ length: 11 }).map((_, i) => (
                <Typography key={i} variant="caption" sx={{ color: 'grey.600', fontSize: '0.6rem', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDuration((totalDuration / 10) * i)}
                </Typography>
              ))}
            </Stack>

            {/* Video track */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'grey.600', fontSize: '0.6rem', mb: 0.25, display: 'block' }}>
                Video
              </Typography>
              <Box
                sx={{
                  height: 40,
                  bgcolor: 'rgba(124,92,191,0.15)',
                  borderRadius: 1,
                  border: '1px solid rgba(124,92,191,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Film strip pattern */}
                <Stack direction="row" sx={{ height: '100%' }}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        borderRight: '1px solid rgba(124,92,191,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box sx={{ width: 2, height: 8, bgcolor: 'rgba(124,92,191,0.2)', borderRadius: 0.5 }} />
                    </Box>
                  ))}
                </Stack>

                {/* Selection highlight */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    left: `${(range[0] / totalDuration) * 100}%`,
                    width: `${((range[1] - range[0]) / totalDuration) * 100}%`,
                    bgcolor: 'rgba(124,92,191,0.4)',
                    border: '2px solid #7c5cbf',
                    borderRadius: 0.5,
                    // Left handle
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -3, top: 0, bottom: 0,
                      width: 6,
                      bgcolor: '#7c5cbf',
                      borderRadius: '3px 0 0 3px',
                      cursor: 'ew-resize',
                    },
                    // Right handle
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: -3, top: 0, bottom: 0,
                      width: 6,
                      bgcolor: '#7c5cbf',
                      borderRadius: '0 3px 3px 0',
                      cursor: 'ew-resize',
                    },
                  }}
                />

                {/* Playhead */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4, bottom: -4,
                    left: `${(playhead / totalDuration) * 100}%`,
                    width: 2,
                    bgcolor: '#ff5252',
                    zIndex: 2,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: -4,
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '6px solid #ff5252',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Audio waveform track */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'grey.600', fontSize: '0.6rem', mb: 0.25, display: 'block' }}>
                Audio
              </Typography>
              <Box
                sx={{
                  height: 32,
                  bgcolor: 'rgba(76,175,80,0.08)',
                  borderRadius: 1,
                  border: '1px solid rgba(76,175,80,0.2)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  px: 0.25,
                  overflow: 'hidden',
                }}
              >
                {Array.from({ length: trackBars }).map((_, i) => {
                  const h = 4 + Math.abs(Math.sin(i * 0.5) * 14) + Math.abs(Math.cos(i * 0.8) * 10);
                  const inRange = totalDuration > 0 && (i / trackBars) >= (range[0] / totalDuration) && (i / trackBars) <= (range[1] / totalDuration);
                  return (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        height: Math.max(2, h),
                        bgcolor: inRange ? 'rgba(76,175,80,0.5)' : 'rgba(76,175,80,0.15)',
                        mx: '0.5px',
                        borderRadius: 0.25,
                        transition: 'background-color 0.1s',
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Range slider (functional) */}
            <Box sx={{ px: 0.5, mt: 1 }}>
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
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default CapCutEditor;
