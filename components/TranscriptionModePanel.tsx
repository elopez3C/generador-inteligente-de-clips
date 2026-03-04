import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import { Clip, TranscriptGroup } from '../types';

interface TranscriptionModePanelProps {
  clips: Clip[];
  onClipsChange: (clips: Clip[]) => void;
  groups: TranscriptGroup[];
  onOpenManualDialog: () => void;
}

const fmt = (m: number, s: number) => `${m}:${s.toString().padStart(2, '0')}`;

function timeToMinSec(timeStr: string): { m: number; s: number } {
  const parts = timeStr.split(':').map(Number);
  return { m: parts[0], s: parts[1] ?? 0 };
}

const TranscriptionModePanel: React.FC<TranscriptionModePanelProps> = ({
  clips, onClipsChange, groups, onOpenManualDialog,
}) => {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [editingStart, setEditingStart] = useState<string>('');
  const [editingEnd, setEditingEnd] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedClip = clips.find(c => c.id === selectedClipId) ?? null;

  // When a clip is selected, populate editing fields
  useEffect(() => {
    if (selectedClip) {
      setEditingStart(fmt(selectedClip.startMinutes, selectedClip.startSeconds));
      setEditingEnd(fmt(selectedClip.endMinutes, selectedClip.endSeconds));
    }
  }, [selectedClipId]);

  // Scroll to the relevant transcript section when a clip is selected
  useEffect(() => {
    if (selectedClip && scrollRef.current) {
      const clipStartStr = fmt(selectedClip.startMinutes, selectedClip.startSeconds);
      const el = scrollRef.current.querySelector(`[data-time="${clipStartStr}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedClipId]);

  const handleToggleSelection = (id: string) => {
    onClipsChange(clips.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleCopyHook = (hook: string) => {
    navigator.clipboard.writeText(hook);
  };

  const handleSelectClip = (id: string) => {
    setSelectedClipId(id);
  };

  const handleBack = () => {
    setSelectedClipId(null);
  };

  const handleSaveTimestamps = () => {
    if (!selectedClip) return;
    const startParts = editingStart.split(':').map(Number);
    const endParts = editingEnd.split(':').map(Number);
    if (startParts.length < 2 || endParts.length < 2) return;

    onClipsChange(clips.map(c => {
      if (c.id !== selectedClip.id) return c;
      return {
        ...c,
        startMinutes: startParts[0],
        startSeconds: startParts[1],
        endMinutes: endParts[0],
        endSeconds: endParts[1],
      };
    }));
  };

  const handleLineClickForStart = (time: string) => {
    setEditingStart(time);
  };

  const handleLineClickForEnd = (time: string) => {
    setEditingEnd(time);
  };

  // Determine which transcript lines are in range of the selected clip
  const isLineInClipRange = (lineTime: string): 'start' | 'end' | 'in' | null => {
    if (!selectedClip) return null;
    const clipStart = fmt(selectedClip.startMinutes, selectedClip.startSeconds);
    const clipEnd = fmt(selectedClip.endMinutes, selectedClip.endSeconds);
    // Use editing values for highlight
    const effStart = editingStart || clipStart;
    const effEnd = editingEnd || clipEnd;

    if (lineTime === effStart && lineTime === effEnd) return 'start';
    if (lineTime === effStart) return 'start';
    if (lineTime === effEnd) return 'end';
    if (lineTime > effStart && lineTime < effEnd) return 'in';
    return null;
  };

  // Filter transcript groups to show context around selected clip
  const getContextGroups = (): TranscriptGroup[] => {
    if (!selectedClip) return [];
    const clipStartSec = selectedClip.startMinutes * 60 + selectedClip.startSeconds;
    const clipEndSec = selectedClip.endMinutes * 60 + selectedClip.endSeconds;
    // Show 2 minutes of context before and after
    const contextBefore = 120;
    const contextAfter = 120;
    const rangeStart = clipStartSec - contextBefore;
    const rangeEnd = clipEndSec + contextAfter;

    return groups
      .map(g => ({
        ...g,
        lines: g.lines.filter(l => {
          const { m, s } = timeToMinSec(l.time);
          const sec = m * 60 + s;
          return sec >= rangeStart && sec <= rangeEnd;
        }),
      }))
      .filter(g => g.lines.length > 0);
  };

  // ── Clip Detail View (transcript around clip) ──
  if (selectedClip) {
    const contextGroups = getContextGroups();

    return (
      <Box sx={{ height: '100%', overflowY: 'auto', p: { xs: 2, md: 3 }, pb: 12 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          {/* Back button + clip info */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <IconButton onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {selectedClip.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedClip.category} {!selectedClip.isManual && `· Score: ${selectedClip.score}`}
              </Typography>
            </Box>
            <Checkbox
              checked={selectedClip.selected}
              onChange={() => handleToggleSelection(selectedClip.id)}
            />
          </Stack>

          {/* Timestamp editor */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label="INICIO" size="small" color="success" icon={<FlagIcon />} />
                <TextField
                  size="small"
                  value={editingStart}
                  onChange={e => setEditingStart(e.target.value)}
                  sx={{ width: 90 }}
                  inputProps={{ style: { fontVariantNumeric: 'tabular-nums', textAlign: 'center' } }}
                />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label="FIN" size="small" color="error" icon={<FlagIcon />} />
                <TextField
                  size="small"
                  value={editingEnd}
                  onChange={e => setEditingEnd(e.target.value)}
                  sx={{ width: 90 }}
                  inputProps={{ style: { fontVariantNumeric: 'tabular-nums', textAlign: 'center' } }}
                />
              </Stack>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleSaveTimestamps}
              >
                Aplicar
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                Haz click en una frase para cambiar inicio/fin
              </Typography>
            </Stack>
          </Paper>

          {/* Transcript context */}
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Transcripción del clip
                </Typography>
              </Stack>
            </Box>
            <Box ref={scrollRef} sx={{ maxHeight: 500, overflowY: 'auto', p: 2 }}>
              <Stack spacing={2.5}>
                {contextGroups.map((group, gi) => (
                  <Box key={gi}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar
                        sx={{
                          width: 28, height: 28, fontSize: 11, fontWeight: 700,
                          bgcolor: group.speakerColor === 'primary' ? 'primary.main' : 'secondary.main',
                        }}
                      >
                        {group.speaker.charAt(group.speaker.length - 1)}
                      </Avatar>
                      <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {group.speaker}
                      </Typography>
                    </Stack>

                    <Stack spacing={0.25} sx={{ pl: 5 }}>
                      {group.lines.map((line, li) => {
                        const rangeStatus = isLineInClipRange(line.time);
                        const isInRange = rangeStatus !== null;
                        const isStartLine = rangeStatus === 'start';
                        const isEndLine = rangeStatus === 'end';

                        return (
                          <Box
                            key={li}
                            data-time={line.time}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1,
                              p: 1,
                              borderRadius: 1.5,
                              cursor: 'pointer',
                              bgcolor: isInRange ? 'rgba(76,175,80,0.08)' : 'transparent',
                              borderLeft: isStartLine
                                ? '3px solid'
                                : isEndLine
                                ? '3px solid'
                                : isInRange
                                ? '3px solid'
                                : '3px solid transparent',
                              borderColor: isStartLine
                                ? 'success.main'
                                : isEndLine
                                ? 'error.main'
                                : isInRange
                                ? 'rgba(76,175,80,0.3)'
                                : 'transparent',
                              transition: 'all 0.15s',
                              '&:hover': {
                                bgcolor: isInRange ? 'rgba(76,175,80,0.12)' : 'grey.100',
                              },
                            }}
                          >
                            <Typography
                              variant="caption" color="text.disabled"
                              sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 36, pt: 0.15, flexShrink: 0 }}
                            >
                              {line.time}
                            </Typography>
                            <Typography variant="body2" sx={{ flexGrow: 1, lineHeight: 1.6 }}>
                              {line.text}
                            </Typography>
                            <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                              <Tooltip title="Establecer como inicio">
                                <IconButton
                                  size="small"
                                  onClick={() => handleLineClickForStart(line.time)}
                                  sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'success.main' } }}
                                >
                                  <FlagIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Establecer como fin">
                                <IconButton
                                  size="small"
                                  onClick={() => handleLineClickForEnd(line.time)}
                                  sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}
                                >
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                            {isStartLine && (
                              <Chip label="INICIO" size="small" color="success" sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20, flexShrink: 0 }} />
                            )}
                            {isEndLine && (
                              <Chip label="FIN" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20, flexShrink: 0 }} />
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>

          {/* Hook / Justification */}
          {selectedClip.hook && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                &ldquo;{selectedClip.hook}&rdquo;
              </Typography>
              {!selectedClip.isManual && selectedClip.justification && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {selectedClip.justification}
                </Typography>
              )}
            </Paper>
          )}
        </Box>
      </Box>
    );
  }

  // ── Clip Grid View ──
  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: { xs: 2, md: 3 }, pb: 12 }}>
      <Grid container spacing={2} sx={{ maxWidth: 1200, mx: 'auto' }}>
        {clips.map(clip => {
          const startStr = fmt(clip.startMinutes, clip.startSeconds);
          const endStr = fmt(clip.endMinutes, clip.endSeconds);
          const duration = (clip.endMinutes * 60 + clip.endSeconds) - (clip.startMinutes * 60 + clip.startSeconds);

          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={clip.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderWidth: clip.selected ? 2 : 1,
                  borderColor: clip.selected ? 'primary.main' : 'divider',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.light', boxShadow: 2 },
                }}
                variant="outlined"
                onClick={() => handleSelectClip(clip.id)}
              >
                {/* Transcript preview area */}
                <Box sx={{ height: 140, position: 'relative', bgcolor: 'grey.50', overflow: 'hidden', p: 1.5 }}>
                  {/* Mini transcript preview */}
                  <Stack spacing={0.25} sx={{ opacity: 0.7 }}>
                    {groups.flatMap(g => g.lines).filter(l => {
                      const { m, s } = timeToMinSec(l.time);
                      const sec = m * 60 + s;
                      const clipStart = clip.startMinutes * 60 + clip.startSeconds;
                      const clipEnd = clip.endMinutes * 60 + clip.endSeconds;
                      return sec >= clipStart && sec <= clipEnd;
                    }).slice(0, 4).map((line, i) => (
                      <Typography key={i} variant="caption" sx={{ lineHeight: 1.4, fontSize: '0.7rem' }} noWrap>
                        <Typography component="span" variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', mr: 0.5 }}>
                          {line.time}
                        </Typography>
                        {line.text}
                      </Typography>
                    ))}
                  </Stack>
                  {/* Duration badge */}
                  <Chip
                    label={`${duration}s`}
                    size="small"
                    sx={{
                      position: 'absolute', bottom: 8, right: 8,
                      bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                      fontWeight: 600, fontSize: '0.7rem',
                      zIndex: 1,
                    }}
                  />
                  {/* Selection checkbox */}
                  <Checkbox
                    checked={clip.selected}
                    onChange={(e) => { e.stopPropagation(); handleToggleSelection(clip.id); }}
                    onClick={e => e.stopPropagation()}
                    sx={{
                      position: 'absolute', top: 4, left: 4, zIndex: 1,
                      color: 'text.secondary',
                      '&.Mui-checked': { color: 'primary.main' },
                      bgcolor: 'rgba(255,255,255,0.8)',
                      borderRadius: 1,
                      p: 0.5,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                    }}
                    size="small"
                  />
                  {/* Edit overlay */}
                  <Box
                    sx={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0)',
                      transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: 'rgba(33,33,33,0.8)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.15s',
                        '.MuiCard-root:hover &': { opacity: 1 },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18, color: 'white' }} />
                    </Box>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pb: '12px !important' }}>
                  {/* Timestamp */}
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    {startStr} — {endStr}
                  </Typography>

                  {/* Title */}
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }} noWrap>
                    {clip.title}
                  </Typography>

                  {/* Hook with copy */}
                  <Stack direction="row" alignItems="flex-start" spacing={0.5} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="body2" color="text.secondary"
                      sx={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontStyle: 'italic', flexGrow: 1,
                      }}
                    >
                      &ldquo;{clip.hook}&rdquo;
                    </Typography>
                    <Tooltip title="Copiar hook">
                      <IconButton
                        size="small"
                        onClick={e => { e.stopPropagation(); handleCopyHook(clip.hook); }}
                        sx={{ mt: -0.5, flexShrink: 0 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  {/* Chips */}
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mb: 1.5 }}>
                    <Chip label={clip.category} size="small" />
                    {!clip.isManual && (
                      <Chip label={`Score: ${clip.score}`} size="small" color="primary" variant="outlined" />
                    )}
                    {clip.isManual && <Chip label="Manual" size="small" color="warning" variant="outlined" />}
                  </Stack>

                  {/* AI Justification */}
                  {!clip.isManual && clip.justification && (
                    <Accordion
                      disableGutters elevation={0}
                      sx={{
                        border: '1px solid', borderColor: 'divider', borderRadius: 1,
                        mt: 'auto', '&:before': { display: 'none' },
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                        sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}
                      >
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AutoAwesomeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          <Typography variant="caption" fontWeight={600} color="primary.main">
                            Justificación IA
                          </Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {clip.justification}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default TranscriptionModePanel;
