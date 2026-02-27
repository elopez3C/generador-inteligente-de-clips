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
import Slider from '@mui/material/Slider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import { AnalysisParams, ClipStyle, SocialFocus, FileData } from '../types';

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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeIcon color="primary" fontSize="small" />
          <Typography variant="h6" component="span">Nuevo análisis</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Grid container sx={{ minHeight: 420 }}>
          {/* Left column: drop zone */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper
                variant="outlined"
                onClick={handleSimulate}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleSimulate(); }}
                sx={{
                  flexGrow: 1,
                  borderStyle: 'dashed',
                  borderRadius: 3,
                  borderWidth: 2,
                  borderColor: dragging ? 'primary.main' : localFile ? 'primary.light' : 'divider',
                  bgcolor: dragging ? 'primary.light' : localFile ? 'rgba(103,80,164,0.04)' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  p: 3,
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(103,80,164,0.04)' },
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.light', mb: 1.5 }} />
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Sube tu archivo</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
                  Arrastra aquí o haz clic para seleccionar
                </Typography>
                <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={0.5}>
                  {VIDEO_FORMATS.map(f => <Chip key={f} label={f} size="small" variant="outlined" />)}
                  <Divider orientation="vertical" flexItem />
                  {AUDIO_FORMATS.map(f => <Chip key={f} label={f} size="small" variant="outlined" />)}
                </Stack>
              </Paper>

              {localFile && (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                      <VideoFileIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>{localFile.name}</Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                        <Chip size="small" label={`${localFile.size} MB`} />
                        <Chip size="small" label={`⏱ ${localFile.duration}`} />
                      </Stack>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={e => { e.stopPropagation(); setLocalFile(null); }}
                      sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              )}
            </Box>
          </Grid>

          {/* Right column: params */}
          <Grid size={{ xs: 12, md: 7 }}
            sx={{ borderLeft: { md: '1px solid' }, borderColor: 'divider' }}>
            <Box sx={{ p: 3 }}>
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
                    onChange={(_, v) => v && setLocalParams(p => ({ ...p, socialFocus: v }))}>
                    {PLATFORMS.map(pl => <ToggleButton key={pl} value={pl} sx={{ fontSize: '0.7rem', px: 1.2 }}>{pl}</ToggleButton>)}
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Slider
                      min={1} max={15} step={1}
                      value={localParams.numClips}
                      valueLabelDisplay="auto"
                      onChange={(_, v) => setLocalParams(p => ({ ...p, numClips: v as number }))}
                      sx={{ flexGrow: 1 }}
                    />
                    <Chip size="small" label={localParams.numClips} color="primary" sx={{ minWidth: 36 }} />
                  </Stack>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="overline">Score Viral Mínimo</Typography>
                    <Chip size="small" label={localParams.minScore.toFixed(1)} color="primary" />
                  </Stack>
                  <Slider
                    min={6.0} max={9.0} step={0.5}
                    value={localParams.minScore}
                    valueLabelDisplay="auto"
                    onChange={(_, v) => setLocalParams(p => ({ ...p, minScore: v as number }))}
                  />
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          disabled={!localFile}
          onClick={() => localFile && onStart(localFile, localParams)}
        >
          Empezar Análisis Inteligente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
