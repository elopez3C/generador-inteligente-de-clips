import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import TranscriptionModePanel from '../components/TranscriptionModePanel';
import VideoModePanel from '../components/VideoModePanel';
import ManualClipDialog from '../components/ManualClipDialog';
import CapCutEditor from '../components/CapCutEditor';
import TranscriptClipCreator from '../components/TranscriptClipCreator';
import ParamsDrawer from '../components/ParamsDrawer';
import { MOCK_TRANSCRIPT } from '../mockData';
import { Clip, AnalysisParams, WorkspacePhase, WorkspaceMode } from '../types';
import { parseDuration } from '../utils';

interface WorkspaceScreenProps {
  phase: WorkspacePhase;
  clips: Clip[];
  params: AnalysisParams;
  videoName: string;
  videoDuration: string;
  isSaved: boolean;
  onClipsChange: (clips: Clip[]) => void;
  onParamsChange: (p: AnalysisParams) => void;
  onReAnalyze: (p: AnalysisParams) => void;
  onSave: () => void;
  onDeleteClip: (id: string) => void;
  onGoToLibrary: () => void;
  onNewVideo: () => void;
}

const ANALYSIS_STEPS_INITIAL = [
  'Extrayendo audio',
  'Transcribiendo con Whisper',
  'Analizando con Gemini 2.5 Pro',
  'Identificando clips virales',
];

const ANALYSIS_STEPS_REANALYSIS = [
  'Transcripción guardada (reutilizada)',
  'Analizando con Gemini 2.5 Pro',
  'Aplicando nuevos criterios',
  'Identificando clips virales',
];

function AnalyzingOverlay({ phase }: { phase: WorkspacePhase }) {
  const steps = phase === 'reanalyzing' ? ANALYSIS_STEPS_REANALYSIS : ANALYSIS_STEPS_INITIAL;
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const total = phase === 'reanalyzing' ? 2500 : 3000;
    const interval = 80;
    const steps_ = total / interval;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setProgress(Math.min(Math.round((current / steps_) * 100), 99));
      if (current >= steps_) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [phase]);

  const completedCount = Math.floor((progress / 100) * steps.length);

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        bgcolor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ maxWidth: 420, width: '100%', px: 3 }}>
        <Stack spacing={3} alignItems="center">
          <Stack spacing={1} alignItems="center" width="100%">
            <Typography variant="h6" fontWeight={700} textAlign="center">
              {phase === 'reanalyzing' ? 'Re-analizando...' : 'Analizando tu contenido'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {phase === 'reanalyzing'
                ? 'Reutilizando transcripción. Sin costo adicional.'
                : 'Gemini 2.5 Pro está procesando tu archivo...'}
            </Typography>
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                {progress}% completado
              </Typography>
            </Box>
          </Stack>

          <Card sx={{ width: '100%' }}>
            <CardContent sx={{ py: 1.5 }}>
              <List disablePadding>
                {steps.map((step, i) => {
                  const done = i < completedCount;
                  const active = i === completedCount;
                  return (
                    <ListItem key={i} sx={{ py: 0.75, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {done
                          ? <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                          : active
                          ? <CircularProgress size={16} thickness={5} />
                          : <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary={step}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: active ? 600 : 400,
                          color: done ? 'text.primary' : active ? 'text.primary' : 'text.disabled',
                          fontSize: '0.8rem',
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}

function ClipsSkeleton() {
  return (
    <Stack spacing={2}>
      {[1, 2, 3].map(i => (
        <Box key={i} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="rounded" width={44} height={24} sx={{ ml: 'auto' }} />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Skeleton variant="rounded" width={120} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  phase, clips, params, videoName, videoDuration, isSaved,
  onClipsChange, onParamsChange, onReAnalyze,
  onSave, onDeleteClip, onGoToLibrary, onNewVideo,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('video');
  const [paramsOpen, setParamsOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInitialTime, setManualInitialTime] = useState<{ startM: number; startS: number } | undefined>();
  const [capCutOpen, setCapCutOpen] = useState(false);
  const [transcriptCreatorOpen, setTranscriptCreatorOpen] = useState(false);

  const isAnalyzing = phase === 'analyzing' || phase === 'reanalyzing';
  const selectedClips = clips.filter(c => c.selected);
  const selectedCount = selectedClips.length;

  const totalSelectedDuration = selectedClips.reduce((acc, c) => {
    return acc + (c.endMinutes * 60 + c.endSeconds) - (c.startMinutes * 60 + c.startSeconds);
  }, 0);

  const videoDurationSeconds = parseDuration(videoDuration);

  const handleAddManual = (clip: Clip) => {
    onClipsChange([...clips, { ...clip, sourceVideoName: videoName }]);
  };

  const handleOpenManualClip = () => {
    if (workspaceMode === 'video') {
      setCapCutOpen(true);
    } else {
      setTranscriptCreatorOpen(true);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* Analyzing overlay (inline, not full-screen) */}
      {isAnalyzing && <AnalyzingOverlay phase={phase} />}

      {/* Centered mode toggle */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, py: 1.5, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          exclusive
          value={workspaceMode}
          onChange={(_, v) => v && setWorkspaceMode(v as WorkspaceMode)}
          size="small"
          sx={{
            bgcolor: 'grey.100',
            borderRadius: 3,
            p: 0.5,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: '20px !important',
              px: 2.5,
              py: 0.75,
              textTransform: 'none',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
              },
            },
          }}
        >
          <ToggleButton value="transcription">
            <DescriptionIcon sx={{ fontSize: 16, mr: 0.75 }} />
            <Typography variant="body2" fontWeight={600}>Transcripción</Typography>
          </ToggleButton>
          <ToggleButton value="video">
            <OndemandVideoIcon sx={{ fontSize: 16, mr: 0.75 }} />
            <Typography variant="body2" fontWeight={600}>Video</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Main content area */}
      {workspaceMode === 'transcription' ? (
        /* Transcription Mode */
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <TranscriptionModePanel
            clips={clips}
            onClipsChange={onClipsChange}
            groups={MOCK_TRANSCRIPT}
            onOpenManualDialog={() => { setManualInitialTime(undefined); setManualOpen(true); }}
          />
        </Box>
      ) : (
        /* Video Mode */
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <VideoModePanel
            clips={clips}
            onClipsChange={onClipsChange}
            totalDuration={videoDurationSeconds}
            videoName={videoName}
            onOpenManualDialog={() => { setManualInitialTime(undefined); setManualOpen(true); }}
          />
        </Box>
      )}

      {/* Sticky bottom bar — hidden during analysis */}
      {!isAnalyzing && <Paper
        elevation={4}
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
          borderTop: '1px solid', borderColor: 'divider',
          borderRadius: 0,
          px: 3, py: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
              <Typography variant="subtitle2">
                {selectedCount > 0 ? `${selectedCount} seleccionados` : 'Sin selección'}
              </Typography>
              {selectedCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  · ~{Math.floor(totalSelectedDuration / 60)}m {totalSelectedDuration % 60}s
                </Typography>
              )}
            </Stack>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined" size="small" startIcon={<TuneIcon />}
            onClick={() => setParamsOpen(true)}
          >
            Re-analizar
          </Button>
          <Button
            variant="outlined" size="small" startIcon={<AddIcon />}
            onClick={handleOpenManualClip}
          >
            Clip manual
          </Button>
          <Button
            variant="outlined" size="small"
            startIcon={<SaveIcon />}
            disabled={selectedCount === 0 || isSaved}
            onClick={onSave}
            color={isSaved ? 'success' : 'primary'}
          >
            {isSaved ? 'Guardado' : 'Guardar'}
          </Button>
        </Stack>
      </Paper>}

      {/* Dialogs & Drawers */}
      <ParamsDrawer
        open={paramsOpen}
        onClose={() => setParamsOpen(false)}
        onReAnalyze={p => { onParamsChange(p); onReAnalyze(p); }}
        initialParams={params}
      />
      <ManualClipDialog
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSave={handleAddManual}
        nextNumber={clips.length + 1}
        initialStart={manualInitialTime}
      />
      <CapCutEditor
        open={capCutOpen}
        onClose={() => setCapCutOpen(false)}
        onSave={handleAddManual}
        totalDuration={videoDurationSeconds}
        nextNumber={clips.length + 1}
        transcriptGroups={MOCK_TRANSCRIPT}
      />
      <TranscriptClipCreator
        open={transcriptCreatorOpen}
        onClose={() => setTranscriptCreatorOpen(false)}
        onSave={handleAddManual}
        groups={MOCK_TRANSCRIPT}
        nextNumber={clips.length + 1}
      />
    </Box>
  );
};

export default WorkspaceScreen;
