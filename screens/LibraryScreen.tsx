import React, { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FolderIcon from '@mui/icons-material/Folder';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ConfirmDialog from '../components/ConfirmDialog';
import MockVideoPlayer from '../components/MockVideoPlayer';
import ParamsDrawer from '../components/ParamsDrawer';
import CapCutEditor from '../components/CapCutEditor';
import ClipEditorDialog from '../components/ClipEditorDialog';
import { Clip, AnalysisParams, LibraryFolder } from '../types';
import { parseDuration } from '../utils';
import { MOCK_TRANSCRIPT } from '../mockData';

interface LibraryScreenProps {
  clips: Clip[];
  activeVideoName?: string;
  hasActiveSession: boolean;
  onResumeActiveSession: () => void;
  onNewAnalysis: () => void;
  onDeleteClip: (id: string) => void;
  onOpenInWorkspace?: (projectName: string) => void;
  folders: LibraryFolder[];
  onFoldersChange: (folders: LibraryFolder[]) => void;
  onRenameClip?: (id: string, newTitle: string) => void;
  onRenameProject?: (oldName: string, newName: string) => void;
  initialSelectedProject?: string | null;
  onProjectViewed?: () => void;
  onReAnalyze?: (projectName: string, params: AnalysisParams) => void;
  params?: AnalysisParams;
  onAddManualClip?: (projectName: string, clip: Clip) => void;
  onUpdateClip?: (clip: Clip) => void;
}

type DateFilter = 'all' | 'week' | 'month';

const fmt = (m: number, s: number) => `${m}:${s.toString().padStart(2, '0')}`;

// Relative date formatter
const relativeDate = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} mes${months !== 1 ? 'es' : ''}`;
  return `Hace más de un año`;
};

// Download clip metadata as .txt
const downloadClipMetadata = (clip: Clip) => {
  const lines = [
    `Título: ${clip.title}`,
    `Hook: ${clip.hook}`,
    `Categoría: ${clip.category}`,
    `Score: ${clip.score}`,
    `Timestamps: ${fmt(clip.startMinutes, clip.startSeconds)} — ${fmt(clip.endMinutes, clip.endSeconds)}`,
    `Duración: ${(clip.endMinutes * 60 + clip.endSeconds) - (clip.startMinutes * 60 + clip.startSeconds)}s`,
    clip.justification ? `\nJustificación IA:\n${clip.justification}` : '',
    clip.sourceVideoName ? `\nVideo fuente: ${clip.sourceVideoName}` : '',
    clip.platform ? `Plataforma: ${clip.platform}` : '',
    clip.style ? `Estilo: ${clip.style}` : '',
    clip.suggestedCaption ? `\n--- Copy para publicar ---\nCaption:\n${clip.suggestedCaption}` : '',
    clip.suggestedHashtags?.length ? `\nHashtags: ${clip.suggestedHashtags.join(' ')}` : '',
    clip.suggestedCTA ? `CTA: ${clip.suggestedCTA}` : '',
  ].filter(Boolean).join('\n');

  const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${clip.title.replace(/[^a-zA-Z0-9áéíóúñü ]/gi, '').trim().replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const LibraryScreen: React.FC<LibraryScreenProps> = ({
  clips, activeVideoName, hasActiveSession,
  onResumeActiveSession, onNewAnalysis, onDeleteClip, onOpenInWorkspace,
  folders, onFoldersChange, onRenameClip, onRenameProject,
  initialSelectedProject, onProjectViewed,
  onReAnalyze, params: externalParams, onAddManualClip, onUpdateClip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(initialSelectedProject ?? null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ clipId: string; title: string } | null>(null);
  const [snackMessage, setSnackMessage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Folder management
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveToFolderProject, setMoveToFolderProject] = useState<string | null>(null);

  // Inline editing
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [editProjectValue, setEditProjectValue] = useState('');
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editClipValue, setEditClipValue] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderValue, setEditFolderValue] = useState('');

  // Per-clip editing / regeneration / manual clip
  const [paramsDrawerOpen, setParamsDrawerOpen] = useState(false);
  const [capCutEditorOpen, setCapCutEditorOpen] = useState(false);
  const [clipEditorClip, setClipEditorClip] = useState<Clip | null>(null);

  // Clear the one-shot signal on mount so parent resets
  useEffect(() => {
    if (initialSelectedProject) {
      onProjectViewed?.();
    }
  }, []);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: LibraryFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      projectNames: [],
    };
    onFoldersChange([...folders, folder]);
    setNewFolderName('');
    setCreateFolderOpen(false);
  };

  const handleMoveToFolder = (folderId: string | null) => {
    if (!moveToFolderProject) return;
    // Remove from all folders first
    const updated = folders.map(f => ({
      ...f,
      projectNames: f.projectNames.filter(p => p !== moveToFolderProject),
    }));
    // Add to target folder
    if (folderId) {
      const idx = updated.findIndex(f => f.id === folderId);
      if (idx >= 0) updated[idx].projectNames.push(moveToFolderProject);
    }
    onFoldersChange(updated);
    setMoveToFolderProject(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    onFoldersChange(folders.filter(f => f.id !== folderId));
  };

  const handleStartEditProject = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectName(name);
    setEditProjectValue(name);
  };

  const handleSaveProjectName = () => {
    if (editingProjectName && editProjectValue.trim() && onRenameProject) {
      onRenameProject(editingProjectName, editProjectValue.trim());
      if (selectedProject === editingProjectName) setSelectedProject(editProjectValue.trim());
    }
    setEditingProjectName(null);
  };

  const handleStartEditClip = (id: string, title: string) => {
    setEditingClipId(id);
    setEditClipValue(title);
  };

  const handleSaveClipName = () => {
    if (editingClipId && editClipValue.trim() && onRenameClip) {
      onRenameClip(editingClipId, editClipValue.trim());
    }
    setEditingClipId(null);
  };

  const handleStartEditFolder = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(id);
    setEditFolderValue(name);
  };

  const handleSaveFolder = () => {
    if (editingFolderId && editFolderValue.trim()) {
      onFoldersChange(folders.map(f =>
        f.id === editingFolderId ? { ...f, name: editFolderValue.trim() } : f
      ));
    }
    setEditingFolderId(null);
  };

  // Projects assigned to folders
  const assignedProjects = new Set(folders.flatMap(f => f.projectNames));

  // Group clips by source video (projects)
  const projects = useMemo(() => {
    const groups: Record<string, Clip[]> = {};
    clips.forEach(c => {
      const key = c.sourceVideoName ?? 'Sin fuente';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return groups;
  }, [clips]);

  // Filter projects by search + date, sort by most recent first
  const filteredProjects = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const monthMs = 30 * 24 * 60 * 60 * 1000;

    return Object.entries(projects)
      .filter(([videoName, videoClips]) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const nameMatch = videoName.toLowerCase().includes(q);
          const clipMatch = videoClips.some(c =>
            c.title.toLowerCase().includes(q) ||
            c.hook.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
          );
          if (!nameMatch && !clipMatch) return false;
        }
        if (dateFilter !== 'all') {
          const cutoff = dateFilter === 'week' ? now - weekMs : now - monthMs;
          const mostRecent = Math.max(...videoClips.map(c => c.processedAt ?? 0));
          if (mostRecent < cutoff) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aRecent = Math.max(...a[1].map(c => c.processedAt ?? 0));
        const bRecent = Math.max(...b[1].map(c => c.processedAt ?? 0));
        return bRecent - aRecent;
      });
  }, [projects, searchQuery, dateFilter]);

  const projectClips = selectedProject ? (projects[selectedProject] ?? []) : [];

  // Category filter for detail view
  const projectCategories = useMemo(() => {
    const cats = new Set(projectClips.map(c => c.category));
    return Array.from(cats).sort();
  }, [projectClips]);

  const visibleClips = useMemo(() => {
    if (!categoryFilter) return projectClips;
    return projectClips.filter(c => c.category === categoryFilter);
  }, [projectClips, categoryFilter]);

  // Project context (from first clip that has the fields)
  const projectContext = useMemo(() => {
    const ref = projectClips.find(c => c.platform || c.style || c.sourceDuration);
    return ref ? { platform: ref.platform, style: ref.style, sourceDuration: ref.sourceDuration } : null;
  }, [projectClips]);

  // Copy hook
  const handleCopyHook = (hook: string) => {
    navigator.clipboard.writeText(hook).then(() => {
      setSnackMessage('Hook copiado al portapapeles');
    });
  };

  // Delete with confirmation
  const handleDeleteRequest = (clipId: string, title: string) => {
    setDeleteConfirm({ clipId, title });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onDeleteClip(deleteConfirm.clipId);
      setDeleteConfirm(null);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (clips.length === 0 && !hasActiveSession) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', textAlign: 'center', py: 12, px: 2 }}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.100', color: 'grey.400', mx: 'auto', mb: 3 }}>
          <VideoFileIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Biblioteca vacía</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Aún no has generado ningún clip. Los que generes aparecerán aquí organizados por video.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onNewAnalysis} size="large">
          Empezar ahora
        </Button>
      </Box>
    );
  }

  // ── Project detail view ──────────────────────────────────────────────────────
  if (selectedProject) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
        {/* Back button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => { setSelectedProject(null); setCategoryFilter(null); }}
          sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}
        >
          Volver
        </Button>

        {/* Project header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
            <VideoFileIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {editingProjectName === selectedProject ? (
              <TextField
                size="small" autoFocus fullWidth
                value={editProjectValue}
                onChange={e => setEditProjectValue(e.target.value)}
                onBlur={handleSaveProjectName}
                onKeyDown={e => e.key === 'Enter' && handleSaveProjectName()}
                sx={{ mb: 0.5 }}
              />
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" fontWeight={700} noWrap>{selectedProject}</Typography>
                <IconButton size="small" onClick={(e) => handleStartEditProject(selectedProject, e)}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            )}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">
                {projectClips.length} clip{projectClips.length !== 1 ? 's' : ''}
              </Typography>
              {projectContext?.sourceDuration && (
                <Typography variant="body2" color="text.secondary">
                  · Duración: {projectContext.sourceDuration}
                </Typography>
              )}
              {projectContext?.platform && (
                <Chip label={projectContext.platform} size="small" variant="outlined" />
              )}
              {projectContext?.style && (
                <Chip label={projectContext.style} size="small" variant="outlined" />
              )}
            </Stack>
          </Box>
          {onAddManualClip && (
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setCapCutEditorOpen(true)}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Clip manual
            </Button>
          )}
          {onReAnalyze && externalParams && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setParamsDrawerOpen(true)}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Regenerar nuevos clips
            </Button>
          )}
        </Stack>

        {/* Category filter chips */}
        {projectCategories.length > 1 && (
          <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
            <Chip
              label="Todos"
              size="small"
              variant={categoryFilter === null ? 'filled' : 'outlined'}
              color={categoryFilter === null ? 'primary' : 'default'}
              onClick={() => setCategoryFilter(null)}
            />
            {projectCategories.map(cat => (
              <Chip
                key={cat}
                label={cat}
                size="small"
                variant={categoryFilter === cat ? 'filled' : 'outlined'}
                color={categoryFilter === cat ? 'primary' : 'default'}
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              />
            ))}
          </Stack>
        )}

        {/* Clip cards grid */}
        <Grid container spacing={3}>
          {visibleClips.map(clip => {
            const duration = (clip.endMinutes * 60 + clip.endSeconds) - (clip.startMinutes * 60 + clip.startSeconds);
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={clip.id}>
                <Card
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderColor: 'primary.light' } }}
                  onClick={() => onUpdateClip && setClipEditorClip(clip)}
                >
                  {/* Mini video preview */}
                  <Box sx={{ position: 'relative' }}>
                    <MockVideoPlayer
                      currentTime={clip.startMinutes * 60 + clip.startSeconds}
                      totalDuration={clip.sourceDuration ? parseDuration(clip.sourceDuration) : duration}
                      clipRange={{ start: clip.startMinutes * 60 + clip.startSeconds, end: clip.endMinutes * 60 + clip.endSeconds }}
                      onSeek={() => {}}
                      readOnly
                      thumbnail={clip.thumbnail}
                      isVertical={clip.isVertical}
                    />
                    {/* Duration badge */}
                    <Chip
                      label={`${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`}
                      size="small"
                      sx={{
                        position: 'absolute', bottom: 8, right: 8,
                        bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                        fontWeight: 600, fontSize: '0.7rem',
                        zIndex: 1,
                      }}
                    />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pb: '12px !important' }}>
                    {/* Timestamp + chips */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {fmt(clip.startMinutes, clip.startSeconds)} — {fmt(clip.endMinutes, clip.endSeconds)}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        {clip.isManual && <Chip label="Manual" size="small" color="warning" variant="outlined" />}
                        {clip.isNew && <Chip label="Nuevo" size="small" color="primary" />}
                      </Stack>
                    </Stack>

                    {/* Title (click to edit) */}
                    {editingClipId === clip.id ? (
                      <TextField
                        size="small" fullWidth autoFocus
                        value={editClipValue}
                        onChange={e => setEditClipValue(e.target.value)}
                        onBlur={handleSaveClipName}
                        onKeyDown={e => e.key === 'Enter' && handleSaveClipName()}
                        sx={{ mb: 0.5 }}
                      />
                    ) : (
                      <Typography
                        variant="subtitle1" fontWeight={600} noWrap
                        onClick={e => { e.stopPropagation(); handleStartEditClip(clip.id, clip.title); }}
                        sx={{ mb: 0.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                      >
                        {clip.title}
                      </Typography>
                    )}

                    {/* Hook */}
                    <Typography
                      variant="body2" color="text.secondary"
                      sx={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontStyle: 'italic', mb: 1,
                      }}
                    >
                      &ldquo;{clip.hook}&rdquo;
                    </Typography>

                    {/* Publishing copy section */}
                    {(clip.suggestedCaption || clip.suggestedHashtags?.length || clip.suggestedCTA) && (
                      <Accordion
                        disableGutters
                        elevation={0}
                        sx={{
                          mb: 1,
                          '&:before': { display: 'none' },
                          bgcolor: 'transparent',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                          sx={{ minHeight: 28, px: 0, '& .MuiAccordionSummary-content': { my: 0.25 } }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.7rem' }}>
                            Copy para publicar
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                          <Stack spacing={1.5}>
                            {clip.suggestedCaption && (
                              <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', color: 'text.secondary' }}>CAPTION</Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => { navigator.clipboard.writeText(clip.suggestedCaption!); setSnackMessage('Caption copiado'); }}
                                    sx={{ p: 0.25 }}
                                  >
                                    <ContentCopyIcon sx={{ fontSize: 12 }} />
                                  </IconButton>
                                </Stack>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'pre-line' }}>
                                  {clip.suggestedCaption}
                                </Typography>
                              </Box>
                            )}
                            {clip.suggestedHashtags && clip.suggestedHashtags.length > 0 && (
                              <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', color: 'text.secondary' }}>HASHTAGS</Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => { navigator.clipboard.writeText(clip.suggestedHashtags!.join(' ')); setSnackMessage('Hashtags copiados'); }}
                                    sx={{ p: 0.25 }}
                                  >
                                    <ContentCopyIcon sx={{ fontSize: 12 }} />
                                  </IconButton>
                                </Stack>
                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                  {clip.suggestedHashtags.map(tag => (
                                    <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                            {clip.suggestedCTA && (
                              <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', color: 'text.secondary' }}>CTA</Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => { navigator.clipboard.writeText(clip.suggestedCTA!); setSnackMessage('CTA copiado'); }}
                                    sx={{ p: 0.25 }}
                                  >
                                    <ContentCopyIcon sx={{ fontSize: 12 }} />
                                  </IconButton>
                                </Stack>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500 }}>
                                  {clip.suggestedCTA}
                                </Typography>
                              </Box>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ContentCopyIcon sx={{ fontSize: 12 }} />}
                              onClick={() => {
                                const parts = [
                                  clip.suggestedCaption,
                                  '',
                                  clip.suggestedHashtags?.join(' '),
                                  '',
                                  clip.suggestedCTA,
                                ].filter(Boolean).join('\n');
                                navigator.clipboard.writeText(parts);
                                setSnackMessage('Copy completo copiado');
                              }}
                              sx={{ fontSize: '0.65rem', py: 0.25 }}
                            >
                              Copiar todo
                            </Button>
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Actions */}
                    <Stack direction="row" spacing={0.5} sx={{ mt: 'auto' }} onClick={e => e.stopPropagation()}>
                      <Button
                        size="small" color="error" startIcon={<DeleteOutlineIcon />}
                        onClick={() => handleDeleteRequest(clip.id, clip.title)}
                        sx={{ pl: 0 }}
                      >
                        Eliminar
                      </Button>
                      <Box sx={{ flexGrow: 1 }} />
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadClipMetadata(clip)}
                        sx={{ px: 0.5, color: 'text.primary' }}
                      >
                        Descargar
                      </Button>
                      {onUpdateClip && (
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => setClipEditorClip(clip)}
                          sx={{ pr: 0, color: 'text.primary' }}
                        >
                          Editar
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          open={deleteConfirm !== null}
          title="¿Eliminar este clip?"
          description={`Se eliminará "${deleteConfirm?.title ?? ''}" de tu biblioteca. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          confirmColor="error"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />

        {/* Snackbar for copy feedback */}
        <Snackbar
          open={!!snackMessage}
          autoHideDuration={2000}
          onClose={() => setSnackMessage('')}
          message={snackMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />

        {/* ParamsDrawer for regeneration */}
        {onReAnalyze && externalParams && (
          <ParamsDrawer
            open={paramsDrawerOpen}
            onClose={() => setParamsDrawerOpen(false)}
            onReAnalyze={(newParams) => {
              onReAnalyze(selectedProject, newParams);
              setParamsDrawerOpen(false);
            }}
            initialParams={externalParams}
          />
        )}

        {/* CapCutEditor for manual clip creation */}
        {onAddManualClip && (
          <CapCutEditor
            open={capCutEditorOpen}
            onClose={() => setCapCutEditorOpen(false)}
            onSave={(clip) => {
              onAddManualClip(selectedProject, clip);
              setCapCutEditorOpen(false);
            }}
            totalDuration={projectContext?.sourceDuration ? parseDuration(projectContext.sourceDuration) : 600}
            nextNumber={projectClips.length + 1}
            transcriptGroups={MOCK_TRANSCRIPT}
          />
        )}

        {/* ClipEditorDialog for per-clip editing */}
        {onUpdateClip && (
          <ClipEditorDialog
            open={clipEditorClip !== null}
            clip={clipEditorClip}
            totalDuration={projectContext?.sourceDuration ? parseDuration(projectContext.sourceDuration) : 600}
            transcriptGroups={MOCK_TRANSCRIPT}
            onClose={() => setClipEditorClip(null)}
            onSave={(updatedClip) => {
              onUpdateClip(updatedClip);
              setClipEditorClip(null);
            }}
          />
        )}
      </Box>
    );
  }

  // ── Folder detail view ──────────────────────────────────────────────────────
  if (selectedFolder) {
    const folder = folders.find(f => f.id === selectedFolder);
    if (!folder) { setSelectedFolder(null); return null; }

    const folderProjects = filteredProjects.filter(([name]) => folder.projectNames.includes(name));

    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setSelectedFolder(null)}
          sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}
        >
          Volver
        </Button>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: 48, height: 48 }}>
            <FolderIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            {editingFolderId === folder.id ? (
              <TextField
                size="small" autoFocus
                value={editFolderValue}
                onChange={e => setEditFolderValue(e.target.value)}
                onBlur={handleSaveFolder}
                onKeyDown={e => e.key === 'Enter' && handleSaveFolder()}
              />
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" fontWeight={700}>{folder.name}</Typography>
                <IconButton size="small" onClick={(e) => handleStartEditFolder(folder.id, folder.name, e)}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            )}
            <Typography variant="body2" color="text.secondary">
              {folder.projectNames.length} proyecto{folder.projectNames.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Button
            variant="outlined" color="error" size="small"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => { handleDeleteFolder(folder.id); setSelectedFolder(null); }}
          >
            Eliminar carpeta
          </Button>
        </Stack>

        {folderProjects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Esta carpeta está vacía. Mueve proyectos aquí desde la lista principal.
            </Typography>
          </Box>
        ) : (
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {folderProjects.map(([videoName, videoClips], idx) => {
              const mostRecent = Math.max(...videoClips.map(c => c.processedAt ?? 0));
              return (
                <React.Fragment key={videoName}>
                  {idx > 0 && <Divider />}
                  <Box
                    onClick={() => setSelectedProject(videoName)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      px: 2, py: 1.5, cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }}>
                      <VideoFileIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>{videoName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {videoClips.length} clip{videoClips.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    {mostRecent > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {relativeDate(mostRecent)}
                      </Typography>
                    )}
                    <ChevronRightIcon sx={{ color: 'text.disabled' }} />
                  </Box>
                </React.Fragment>
              );
            })}
          </Card>
        )}
      </Box>
    );
  }

  // ── Project list view (homepage) ─────────────────────────────────────────────

  // Separate into folder projects and unassigned
  const unassignedProjects = filteredProjects.filter(([name]) => !assignedProjects.has(name));
  const folderList = folders.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.projectNames.some(p => p.toLowerCase().includes(q));
  });

  const ProjectRow = ({ videoName, videoClips, showMove }: { videoName: string; videoClips: Clip[]; showMove?: boolean }) => {
    const mostRecent = Math.max(...videoClips.map(c => c.processedAt ?? 0));
    return (
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          px: 2, py: 1.5, cursor: 'pointer',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar
          sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }}
          onClick={() => setSelectedProject(videoName)}
        >
          <VideoFileIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }} onClick={() => setSelectedProject(videoName)}>
          {editingProjectName === videoName ? (
            <TextField
              size="small" autoFocus fullWidth
              value={editProjectValue}
              onChange={e => setEditProjectValue(e.target.value)}
              onBlur={handleSaveProjectName}
              onKeyDown={e => e.key === 'Enter' && handleSaveProjectName()}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <Typography variant="body2" fontWeight={500} noWrap>{videoName}</Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {videoClips.length} clip{videoClips.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Stack
          direction="row" spacing={0.5} className="project-actions"
          sx={{ flexShrink: 0, minWidth: 64, justifyContent: 'flex-end' }}
        >
          <Tooltip title="Renombrar">
            <IconButton size="small" onClick={(e) => handleStartEditProject(videoName, e)}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mover a carpeta">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setMoveToFolderProject(videoName); }}
              sx={{ visibility: showMove === false ? 'hidden' : 'visible' }}
            >
              <DriveFileMoveIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
        {mostRecent > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {relativeDate(mostRecent)}
          </Typography>
        )}
        <ChevronRightIcon
          sx={{ color: 'text.disabled', cursor: 'pointer' }}
          onClick={() => setSelectedProject(videoName)}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Tu Biblioteca</Typography>
          <Typography variant="body2" color="text.secondary">
            Historial completo de clips generados
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<CreateNewFolderIcon />} onClick={() => setCreateFolderOpen(true)}>
            Nueva carpeta
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onNewAnalysis}>
            Nuevo análisis
          </Button>
        </Stack>
      </Stack>

      {/* Active session callout */}
      {hasActiveSession && (
        <Alert severity="info" sx={{ mb: 3 }}
          action={
            <Button size="small" color="inherit" onClick={onResumeActiveSession}>
              Reanudar análisis
            </Button>
          }
        >
          Análisis en curso: <strong>{activeVideoName ?? 'video.mp4'}</strong>
        </Alert>
      )}

      {/* Filters row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
        <TextField
          placeholder="Buscar proyectos o clips..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: { sm: 400 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          exclusive
          value={dateFilter}
          onChange={(_, v) => v && setDateFilter(v)}
          size="small"
        >
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="week">Última semana</ToggleButton>
          <ToggleButton value="month">Último mes</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Folders */}
      {folderList.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Carpetas
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {folderList.map((folder, idx) => (
              <React.Fragment key={folder.id}>
                {idx > 0 && <Divider />}
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    px: 2, py: 1.5, cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: 40, height: 40 }}
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <FolderIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }} onClick={() => setSelectedFolder(folder.id)}>
                    {editingFolderId === folder.id ? (
                      <TextField
                        size="small" autoFocus fullWidth
                        value={editFolderValue}
                        onChange={e => setEditFolderValue(e.target.value)}
                        onBlur={handleSaveFolder}
                        onKeyDown={e => e.key === 'Enter' && handleSaveFolder()}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <Typography variant="body2" fontWeight={500}>{folder.name}</Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {folder.projectNames.length} proyecto{folder.projectNames.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Stack
                    direction="row" spacing={0.5} className="folder-actions"
                    sx={{ flexShrink: 0 }}
                  >
                    <Tooltip title="Renombrar carpeta">
                      <IconButton size="small" onClick={(e) => handleStartEditFolder(folder.id, folder.name, e)}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar carpeta">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                        <DeleteOutlineIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <ChevronRightIcon sx={{ color: 'text.disabled' }} onClick={() => setSelectedFolder(folder.id)} />
                </Box>
              </React.Fragment>
            ))}
          </Card>
        </Box>
      )}

      {/* Unassigned Projects */}
      <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {folderList.length > 0 ? 'Proyectos sin carpeta' : 'Proyectos'}
      </Typography>
      {unassignedProjects.length === 0 && filteredProjects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            No se encontraron proyectos
          </Typography>
          {searchQuery && (
            <Button size="small" sx={{ mt: 1 }} onClick={() => setSearchQuery('')}>
              Limpiar búsqueda
            </Button>
          )}
        </Box>
      ) : unassignedProjects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Todos los proyectos están organizados en carpetas
          </Typography>
        </Box>
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {unassignedProjects.map(([videoName, videoClips], idx) => (
            <React.Fragment key={videoName}>
              {idx > 0 && <Divider />}
              <ProjectRow videoName={videoName} videoClips={videoClips} />
            </React.Fragment>
          ))}
        </Card>
      )}

      {/* Create folder dialog */}
      <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nueva carpeta</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth
            placeholder="Nombre de la carpeta..."
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move to folder dialog */}
      <Dialog open={moveToFolderProject !== null} onClose={() => setMoveToFolderProject(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Mover a carpeta</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List>
            <ListItemButton onClick={() => handleMoveToFolder(null)}>
              <ListItemIcon><VideoFileIcon /></ListItemIcon>
              <ListItemText primary="Sin carpeta" secondary="Quitar de carpeta" />
            </ListItemButton>
            {folders.map(f => (
              <ListItemButton key={f.id} onClick={() => handleMoveToFolder(f.id)}>
                <ListItemIcon><FolderIcon sx={{ color: 'warning.main' }} /></ListItemIcon>
                <ListItemText primary={f.name} secondary={`${f.projectNames.length} proyectos`} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveToFolderProject(null)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LibraryScreen;
