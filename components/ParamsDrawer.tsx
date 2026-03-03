import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CloseIcon from '@mui/icons-material/Close';
import { AnalysisParams, ClipStyle, SocialFocus, PLATFORM_PRESETS } from '../types';

const DEFAULT_PARAMS: AnalysisParams = {
  minScore: 7.5,
  durationMin: 15,
  durationMax: 45,
  maxClips: '5-7',
  numClips: 5,
  style: 'Informativo',
  socialFocus: 'TikTok',
  keywords: '',
};

const STYLES: ClipStyle[] = ['Educativo', 'Entretenimiento', 'Informativo', 'Inspiracional', 'Ventas'];
const PLATFORMS: SocialFocus[] = ['TikTok', 'YouTube Shorts', 'LinkedIn', 'Instagram Reels'];

interface ParamsDrawerProps {
  open: boolean;
  onClose: () => void;
  onReAnalyze: (params: AnalysisParams) => void;
  initialParams: AnalysisParams;
}

const ParamsDrawer: React.FC<ParamsDrawerProps> = ({ open, onClose, onReAnalyze, initialParams }) => {
  const [params, setParams] = useState<AnalysisParams>(initialParams);

  const handleOpen = () => setParams(initialParams);
  const handleReset = () => setParams(DEFAULT_PARAMS);
  const handleConfirm = () => { onReAnalyze(params); onClose(); };

  return (
    <Drawer
      anchor="right" open={open} onClose={onClose}
      onTransitionEnter={handleOpen}
    >
      <Box sx={{ width: { xs: '100vw', sm: 420 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Re-configurar Análisis</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Stack spacing={4}>
            <Alert severity="info" sx={{ fontSize: '0.8125rem' }}>
              La IA re-analizará la transcripción guardada con los nuevos parámetros. Gratis y en ~30 segundos.
            </Alert>

            {/* Estilo */}
            <Box>
              <Typography variant="overline" display="block" sx={{ mb: 1 }}>Estilo de Clips</Typography>
              <ToggleButtonGroup exclusive value={params.style}
                onChange={(_, v) => v && setParams(p => ({ ...p, style: v }))}>
                {STYLES.map(s => <ToggleButton key={s} value={s}>{s}</ToggleButton>)}
              </ToggleButtonGroup>
            </Box>

            <Divider />

            {/* Plataforma */}
            <Box>
              <Typography variant="overline" display="block" sx={{ mb: 1 }}>Plataforma Objetivo</Typography>
              <ToggleButtonGroup exclusive value={params.socialFocus}
                onChange={(_, v) => {
                  if (!v) return;
                  const preset = PLATFORM_PRESETS[v as SocialFocus];
                  setParams(p => ({ ...p, socialFocus: v, durationMin: preset.durationMin, durationMax: preset.durationMax }));
                }}>
                {PLATFORMS.map(pl => <ToggleButton key={pl} value={pl}>{pl}</ToggleButton>)}
              </ToggleButtonGroup>
            </Box>

            <Divider />

            {/* Keywords */}
            <Box>
              <Typography variant="overline" display="block" sx={{ mb: 1 }}>Palabras Clave</Typography>
              <TextField
                fullWidth placeholder="Ej: IA, Futuro, Productividad..."
                value={params.keywords}
                onChange={e => setParams(p => ({ ...p, keywords: e.target.value }))}
              />
            </Box>

            <Divider />

            {/* Number of clips */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="overline">Número de Clips</Typography>
                <Chip size="small" label={params.numClips} color="primary" />
              </Stack>
              <Slider
                min={1} max={15} step={1}
                value={params.numClips}
                valueLabelDisplay="auto"
                onChange={(_, v) => setParams(p => ({ ...p, numClips: v as number }))}
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.disabled">1</Typography>
                <Typography variant="caption" color="text.disabled">15</Typography>
              </Stack>
            </Box>

            <Divider />

            {/* Score slider */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="overline">Score Viral Mínimo</Typography>
                <Chip size="small" label={params.minScore.toFixed(1)} color="primary" />
              </Stack>
              <Slider
                min={6.0} max={9.0} step={0.1}
                value={params.minScore}
                valueLabelDisplay="auto"
                onChange={(_, v) => setParams(p => ({ ...p, minScore: v as number }))}
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.disabled">Flexible (6.0)</Typography>
                <Typography variant="caption" color="text.disabled">Estricto (9.0)</Typography>
              </Stack>
            </Box>

            <Divider />

            {/* Duration range */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="overline">Duración de Clips</Typography>
                {(params.durationMin !== PLATFORM_PRESETS[params.socialFocus].durationMin ||
                  params.durationMax !== PLATFORM_PRESETS[params.socialFocus].durationMax) && (
                  <Chip size="small" label="Personalizado" color="warning" variant="outlined" />
                )}
              </Stack>
              <Slider
                min={5} max={180} step={5}
                value={[params.durationMin, params.durationMax]}
                valueLabelDisplay="auto"
                valueLabelFormat={v => `${v}s`}
                onChange={(_, v) => {
                  const [min, max] = v as number[];
                  setParams(p => ({ ...p, durationMin: min, durationMax: max }));
                }}
              />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.disabled">5s</Typography>
                <Typography variant="caption" color="text.secondary">
                  Recomendado para {params.socialFocus}: {PLATFORM_PRESETS[params.socialFocus].durationMin}–{PLATFORM_PRESETS[params.socialFocus].durationMax}s
                </Typography>
                <Typography variant="caption" color="text.disabled">180s</Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={handleReset} sx={{ flex: 1 }}>Restablecer</Button>
            <Button variant="outlined" onClick={onClose} sx={{ flex: 1 }}>Cancelar</Button>
            <Button variant="contained" onClick={handleConfirm} sx={{ flex: 2 }}>
              Re-analizar
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ParamsDrawer;
