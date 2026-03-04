import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Switch from '@mui/material/Switch';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { AnalysisParams, ClipStyle, SocialFocus, FileData, PLATFORM_PRESETS } from '../types';

const VIDEO_FORMATS = ['.MP4', '.MOV', '.AVI', '.MKV', '.WEBM'];
const AUDIO_FORMATS = ['.MP3', '.WAV', '.M4A', '.AAC'];
const STYLES: ClipStyle[] = ['Educativo', 'Entretenimiento', 'Informativo', 'Inspiracional', 'Ventas'];
const PLATFORMS: SocialFocus[] = ['TikTok', 'YouTube Shorts', 'LinkedIn', 'Instagram Reels'];

interface UploadDialogProps {
  open: boolean;
  initialParams: AnalysisParams;
  onClose: () => void;
  onStart: (file: FileData, params: AnalysisParams) => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ open, initialParams, onClose, onStart }) => {
  const [localFile, setLocalFile] = useState<FileData | null>(null);
  const [localParams, setLocalParams] = useState<AnalysisParams>(initialParams);
  const [dragging, setDragging] = useState(false);

  const handleSimulate = () => {
    setLocalFile({ name: 'podcast_episodio_42_final.mp4', size: 450.5, duration: '45:12' });
  };

  const handleExited = () => {
    setLocalFile(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{ onExited: handleExited }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, pt: 4, pb: 2 }}>
        <Typography variant="h6" component="span">Nuevo análisis</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 0 }}>
        <Grid container sx={{ minHeight: 420 }}>
          {/* Left column: drop zone */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ pr: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper
                variant="outlined"
                onClick={!localFile ? handleSimulate : undefined}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleSimulate(); }}
                sx={{
                  flexGrow: 1,
                  border: localFile ? '1px solid' : 'none',
                  borderColor: localFile ? 'primary.light' : undefined,
                  borderRadius: '16px',
                  ...(!localFile && {
                    backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='${dragging ? '%23212121' : 'rgba(0%2C0%2C0%2C0.3)'}' stroke-width='1.5' stroke-dasharray='8%2c 5' stroke-linecap='round'/%3e%3c/svg%3e")`,
                  }),
                  bgcolor: dragging ? 'primary.light' : localFile ? 'rgba(0,0,0,0.02)' : 'background.paper',
                  cursor: localFile ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  p: 3,
                  ...(!localFile && {
                    '&:hover': {
                      backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23212121' stroke-width='1.5' stroke-dasharray='8%2c 5' stroke-linecap='round'/%3e%3c/svg%3e")`,
                      bgcolor: 'rgba(0,0,0,0.02)',
                    },
                  }),
                }}
              >
                {!localFile ? (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Sube tu archivo</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
                      Arrastra aquí o haz clic para seleccionar
                    </Typography>
                    <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={0.5}>
                      {VIDEO_FORMATS.map(f => <Chip key={f} label={f} size="small" variant="outlined" />)}
                      {AUDIO_FORMATS.map(f => <Chip key={f} label={f} size="small" variant="outlined" />)}
                    </Stack>
                  </>
                ) : (
                  <>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
                      <VideoFileIcon />
                    </Avatar>
                    <Typography variant="subtitle2" noWrap sx={{ maxWidth: '100%', mb: 0.5 }}>{localFile.name}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                      <Chip size="small" label={`${localFile.size} MB`} />
                      <Chip size="small" label={`⏱ ${localFile.duration}`} />
                    </Stack>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={e => { e.stopPropagation(); setLocalFile(null); }}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </Paper>
            </Box>
          </Grid>

          {/* Right column: params */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ pl: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography variant="overline" color="text.secondary">Configuración del Análisis</Typography>
                <Button size="small" onClick={() => setLocalParams(initialParams)}>
                  Restablecer
                </Button>
              </Stack>

              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="overline" display="block" sx={{ mb: 1 }}>Estilo de Clips</Typography>
                  <ToggleButtonGroup exclusive value={localParams.style} size="small"
                    onChange={(_, v) => v && setLocalParams(p => ({ ...p, style: v }))}>
                    {STYLES.map(s => <ToggleButton key={s} value={s} sx={{ fontSize: '0.7rem', px: 1.2 }}>{s}</ToggleButton>)}
                  </ToggleButtonGroup>
                </Box>

                <Box>
                  <Typography variant="overline" display="block" sx={{ mb: 1 }}>Plataforma</Typography>
                  <ToggleButtonGroup exclusive value={localParams.socialFocus} size="small"
                    onChange={(_, v) => {
                      if (!v) return;
                      const preset = PLATFORM_PRESETS[v as SocialFocus];
                      setLocalParams(p => ({
                        ...p,
                        socialFocus: v,
                        durationMin: preset.durationMin,
                        durationMax: preset.durationMax,
                        avgDuration: p.avgDuration === null ? null : preset.avgDuration,
                      }));
                    }}>
                    {PLATFORMS.map(pl => {
                      const preset = PLATFORM_PRESETS[pl];
                      return (
                        <ToggleButton key={pl} value={pl} sx={{ fontSize: '0.7rem', px: 1.2 }}>
                          <Stack alignItems="center" spacing={0}>
                            <span>{pl}</span>
                            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.disabled', lineHeight: 1 }}>
                              {preset.durationMin}–{preset.durationMax}s
                            </Typography>
                          </Stack>
                        </ToggleButton>
                      );
                    })}
                  </ToggleButtonGroup>
                </Box>

                <Box>
                  <Typography variant="overline" display="block" sx={{ mb: 1 }}>Palabras Clave (Opcional)</Typography>
                  <TextField
                    fullWidth size="small"
                    placeholder="Ej: IA, Futuro, Productividad..."
                    value={localParams.keywords}
                    onChange={e => setLocalParams(p => ({ ...p, keywords: e.target.value }))}
                  />
                </Box>

                <Box>
                  <Typography variant="overline" display="block" sx={{ mb: 1 }}>Número de Clips</Typography>
                  <Stack direction="row" alignItems="center" spacing={0}>
                    <IconButton
                      size="small"
                      onClick={() => setLocalParams(p => ({ ...p, numClips: Math.max(1, p.numClips - 1) }))}
                      disabled={localParams.numClips <= 1}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '4px 0 0 4px', height: 36, width: 36 }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <TextField
                      size="small"
                      value={localParams.numClips}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= 1 && v <= 15) setLocalParams(p => ({ ...p, numClips: v }));
                      }}
                      inputProps={{ style: { textAlign: 'center', width: 40, padding: '6px 0' } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setLocalParams(p => ({ ...p, numClips: Math.min(15, p.numClips + 1) }))}
                      disabled={localParams.numClips >= 15}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '0 4px 4px 0', height: 36, width: 36 }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="overline">Duración Promedio de Clips</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">Automático</Typography>
                      <Switch
                        size="small"
                        checked={localParams.avgDuration === null}
                        onChange={(_, checked) =>
                          setLocalParams(p => ({ ...p, avgDuration: checked ? null : 45 }))
                        }
                      />
                    </Stack>
                  </Stack>
                    <Stack direction="row" alignItems="center" spacing={0} sx={{ opacity: localParams.avgDuration === null ? 0.4 : 1, pointerEvents: localParams.avgDuration === null ? 'none' : 'auto' }}>
                      <IconButton
                        size="small"
                        onClick={() => setLocalParams(p => ({ ...p, avgDuration: Math.max(15, (p.avgDuration ?? 45) - 5) }))}
                        disabled={(localParams.avgDuration ?? 45) <= 15}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '4px 0 0 4px', height: 36, width: 36 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <TextField
                        size="small"
                        value={`${Math.floor((localParams.avgDuration ?? 45) / 60)}:${String((localParams.avgDuration ?? 45) % 60).padStart(2, '0')}`}
                        onChange={e => {
                          const raw = e.target.value;
                          let secs: number | null = null;
                          if (raw.includes(':')) {
                            const [m, s] = raw.split(':');
                            const mins = parseInt(m); const sec = parseInt(s || '0');
                            if (!isNaN(mins) && !isNaN(sec)) secs = mins * 60 + sec;
                          } else {
                            const v = parseInt(raw.replace('s', ''));
                            if (!isNaN(v)) secs = v;
                          }
                          if (secs !== null && secs >= 15 && secs <= 600) setLocalParams(p => ({ ...p, avgDuration: secs }));
                        }}
                        inputProps={{ style: { textAlign: 'center', width: 48, padding: '6px 0' } }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setLocalParams(p => ({ ...p, avgDuration: Math.min(600, (p.avgDuration ?? 45) + 5) }))}
                        disabled={(localParams.avgDuration ?? 45) >= 600}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '0 4px 4px 0', height: 36, width: 36 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                </Box>

              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
        <Button variant="outlined" onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!localFile}
          onClick={() => localFile && onStart(localFile, localParams)}
        >
          Empezar Análisis
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
