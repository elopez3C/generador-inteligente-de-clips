import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WorkspaceScreen from './screens/WorkspaceScreen';
import LibraryScreen from './screens/LibraryScreen';
import ConfirmDialog from './components/ConfirmDialog';
import UploadDialog from './components/UploadDialog';
import { Screen, WorkspacePhase, Clip, AnalysisParams, FileData, LibraryFolder } from './types';
import { MOCK_ANALYSIS_CLIPS, MOCK_LIBRARY_CLIPS } from './mockData';
import { parseDuration } from './utils';

const DEFAULT_PARAMS: AnalysisParams = {
  minScore: 7.5, durationMin: 30, durationMax: 60,
  maxClips: '5-7', numClips: 5, style: 'Informativo', socialFocus: 'TikTok', keywords: '',
  avgDuration: null,
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.LIBRARY);
  const [phase, setPhase] = useState<WorkspacePhase>('analyzing');
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [params, setParams] = useState<AnalysisParams>(DEFAULT_PARAMS);
  const [clips, setClips] = useState<Clip[]>([]);
  const [generatedClips, setGeneratedClips] = useState<Clip[]>(MOCK_LIBRARY_CLIPS);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [initialProject, setInitialProject] = useState<string | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);

  // Leave-workspace confirmation
  const [leaveTarget, setLeaveTarget] = useState<Screen | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaveIntentIsUpload, setLeaveIntentIsUpload] = useState(false);

  const hasActiveSession = clips.length > 0;
  const hasUnsavedWork = hasActiveSession && !isSaved;

  // ── Navigation ──────────────────────────────────────────────────────────────

  const navigateTo = (target: Screen) => {
    if (screen === Screen.WORKSPACE && hasUnsavedWork && target !== Screen.WORKSPACE) {
      setLeaveTarget(target);
      setLeaveConfirmOpen(true);
    } else {
      setScreen(target);
    }
  };

  const confirmLeave = () => {
    setLeaveConfirmOpen(false);
    if (leaveIntentIsUpload) {
      setLeaveIntentIsUpload(false);
      setLeaveTarget(null);
      setSelectedFile(null);
      setClips([]);
      setPhase('analyzing');
      setScreen(Screen.LIBRARY);
      setUploadOpen(true);
    } else {
      if (leaveTarget !== null) setScreen(leaveTarget);
      setLeaveTarget(null);
    }
  };

  // ── Upload dialog ────────────────────────────────────────────────────────────

  const handleOpenUpload = () => {
    if (screen === Screen.WORKSPACE && hasUnsavedWork) {
      setLeaveIntentIsUpload(true);
      setLeaveConfirmOpen(true);
    } else {
      setUploadOpen(true);
    }
  };

  // ── Flow handlers ────────────────────────────────────────────────────────────

  const handleStart = (file: FileData, newParams: AnalysisParams) => {
    setSelectedFile(file);
    setParams(newParams);
    setClips([]);
    setPhase('analyzing');
    setUploadOpen(false);
    setScreen(Screen.WORKSPACE);
    setIsSaved(false);

    setTimeout(() => {
      const analysisClips = MOCK_ANALYSIS_CLIPS.map(c => ({ ...c, sourceVideoName: file.name }));
      setClips(analysisClips);
      setPhase('ready');

      // Auto-save all clips to library and navigate to project detail
      const newClips = analysisClips.map(c => ({
        ...c,
        isNew: true,
        selected: false,
        processedAt: Date.now(),
        platform: newParams.socialFocus,
        style: newParams.style,
        sourceDuration: file.duration,
      }));
      setGeneratedClips(prev => [
        ...prev.map(c => ({ ...c, isNew: false })),
        ...newClips,
      ]);
      setIsSaved(true);
      setInitialProject(file.name);
      setScreen(Screen.LIBRARY);
    }, 3200);
  };

  const handleSave = () => {
    const selected = clips.filter(c => c.selected);
    if (selected.length === 0) return;
    const newClips = selected.map(c => ({
      ...c,
      isNew: true,
      selected: false,
      processedAt: Date.now(),
      platform: params.socialFocus,
      style: params.style,
      sourceDuration: selectedFile?.duration,
    }));
    setGeneratedClips(prev => [
      ...prev.map(c => ({ ...c, isNew: false })),
      ...newClips,
    ]);
    setIsSaved(true);
    setInitialProject(selectedFile?.name ?? null);
    setScreen(Screen.LIBRARY);
  };

  const handleDeleteWorkspaceClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
    setIsSaved(false);
  };

  const handleReAnalyze = (newParams: AnalysisParams) => {
    setParams(newParams);
    setPhase('reanalyzing');
    setTimeout(() => {
      setClips(prev => prev.map(c => ({ ...c, selected: false })));
      setPhase('ready');
    }, 2600);
  };

  const handleNewVideo = () => handleOpenUpload();

  const handleGoToLibrary = () => navigateTo(Screen.LIBRARY);

  const handleResumeSession = () => {
    setScreen(Screen.WORKSPACE);
  };

  const handleDeleteClip = (id: string) => {
    setGeneratedClips(prev => prev.filter(c => c.id !== id));
  };

  const handleOpenProjectInWorkspace = (projectName: string) => {
    const projectClips = generatedClips.filter(c => c.sourceVideoName === projectName);
    const ref = projectClips[0];
    setSelectedFile({ name: projectName, size: 0, duration: ref?.sourceDuration ?? '0:00' });
    setClips(projectClips.map(c => ({ ...c, selected: false })));
    setPhase('ready');
    setScreen(Screen.WORKSPACE);
  };

  const handleReAnalyzeProject = (projectName: string, newParams: AnalysisParams) => {
    setParams(newParams);
    // Mock re-analysis: replace project clips with new mock data after a delay
    const ref = generatedClips.find(c => c.sourceVideoName === projectName);
    const sourceDuration = ref?.sourceDuration;
    setTimeout(() => {
      const newClips = MOCK_ANALYSIS_CLIPS.map(c => ({
        ...c,
        id: `reanalysis-${Date.now()}-${c.id}`,
        sourceVideoName: projectName,
        isNew: true,
        selected: false,
        processedAt: Date.now(),
        platform: newParams.socialFocus,
        style: newParams.style,
        sourceDuration,
      }));
      setGeneratedClips(prev => [
        ...prev.filter(c => c.sourceVideoName !== projectName).map(c => ({ ...c, isNew: false })),
        ...newClips,
      ]);
    }, 2000);
  };

  const handleAddManualClip = (projectName: string, clip: Clip) => {
    const ref = generatedClips.find(c => c.sourceVideoName === projectName);
    setGeneratedClips(prev => [
      ...prev.map(c => ({ ...c, isNew: false })),
      {
        ...clip,
        sourceVideoName: projectName,
        isNew: true,
        processedAt: Date.now(),
        platform: ref?.platform,
        style: ref?.style,
        sourceDuration: ref?.sourceDuration,
      },
    ]);
  };

  const handleUpdateClip = (updatedClip: Clip) => {
    setGeneratedClips(prev => prev.map(c => c.id === updatedClip.id ? updatedClip : c));
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="sticky">
        <Toolbar>
          {/* Logo */}
          <IconButton edge="start" onClick={() => navigateTo(Screen.LIBRARY)} sx={{ mr: 1, borderRadius: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <AutoAwesomeIcon sx={{ fontSize: 18 }} />
            </Avatar>
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ mr: 3, cursor: 'pointer' }}
            onClick={() => navigateTo(Screen.LIBRARY)}>
            AI Clip Master
          </Typography>

          {/* Active session pill — visible from any screen */}
          {hasActiveSession && screen !== Screen.WORKSPACE && (
            <Chip
              size="small"
              label={`Análisis: ${selectedFile?.name ?? 'video.mp4'}`}
              color="primary"
              variant="outlined"
              onClick={handleResumeSession}
              sx={{
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                },
                maxWidth: 240,
                mr: 2,
                cursor: 'pointer',
              }}
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Primary action */}
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenUpload} size="small">
            Nuevo análisis
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {screen === Screen.WORKSPACE && (
          <WorkspaceScreen
            phase={phase}
            clips={clips}
            params={params}
            videoName={selectedFile?.name ?? 'video.mp4'}
            videoDuration={selectedFile?.duration ?? '0:00'}
            isSaved={isSaved}
            onClipsChange={(newClips) => { setClips(newClips); setIsSaved(false); }}
            onParamsChange={setParams}
            onReAnalyze={handleReAnalyze}
            onSave={handleSave}
            onDeleteClip={handleDeleteWorkspaceClip}
            onGoToLibrary={handleGoToLibrary}
            onNewVideo={handleNewVideo}
          />
        )}

        {screen === Screen.LIBRARY && (
          <LibraryScreen
            clips={generatedClips}
            activeVideoName={selectedFile?.name}
            hasActiveSession={hasActiveSession}
            onResumeActiveSession={handleResumeSession}
            onNewAnalysis={handleOpenUpload}
            onDeleteClip={handleDeleteClip}
            onOpenInWorkspace={handleOpenProjectInWorkspace}
            folders={folders}
            onFoldersChange={setFolders}
            initialSelectedProject={initialProject}
            onProjectViewed={() => setInitialProject(null)}
            onRenameClip={(id, newTitle) => {
              setGeneratedClips(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
            }}
            onRenameProject={(oldName, newName) => {
              setGeneratedClips(prev => prev.map(c =>
                c.sourceVideoName === oldName ? { ...c, sourceVideoName: newName } : c
              ));
              setFolders(prev => prev.map(f => ({
                ...f,
                projectNames: f.projectNames.map(p => p === oldName ? newName : p),
              })));
            }}
            params={params}
            onReAnalyze={handleReAnalyzeProject}
            onAddManualClip={handleAddManualClip}
            onUpdateClip={handleUpdateClip}
          />
        )}
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ py: 3, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.disabled">
          © {new Date().getFullYear()} AI Clip Master · Potenciado por Gemini 2.5 Pro
        </Typography>
      </Box>

      {/* Upload dialog */}
      <UploadDialog
        open={uploadOpen}
        initialParams={params}
        onClose={() => setUploadOpen(false)}
        onStart={handleStart}
      />

      {/* Leave workspace confirmation */}
      <ConfirmDialog
        open={leaveConfirmOpen}
        title="¿Abandonar el análisis actual?"
        description="Tienes clips sin guardar. Si sales, se perderán. Usa el botón 'Guardar' para conservarlos en la biblioteca."
        confirmLabel="Salir igualmente"
        confirmColor="warning"
        onConfirm={confirmLeave}
        onCancel={() => { setLeaveConfirmOpen(false); setLeaveTarget(null); setLeaveIntentIsUpload(false); }}
      />
    </Box>
  );
};

export default App;
