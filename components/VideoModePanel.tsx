import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MockVideoPlayer from './MockVideoPlayer';
import { Clip } from '../types';
import { parseDuration } from '../utils';

interface VideoModePanelProps {
  clips: Clip[];
  onClipsChange: (clips: Clip[]) => void;
  totalDuration: number;
  videoName: string;
  onOpenManualDialog: () => void;
}

const fmt = (m: number, s: number) => `${m}:${s.toString().padStart(2, '0')}`;

const VideoModePanel: React.FC<VideoModePanelProps> = ({
  clips, onClipsChange, totalDuration, videoName,
}) => {
  const handleToggleSelection = (id: string) => {
    onClipsChange(clips.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleCopyHook = (hook: string) => {
    navigator.clipboard.writeText(hook);
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: { xs: 2, md: 3 }, pb: 12 }}>
      <Grid container spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>
        {clips.map(clip => {
          const startSec = clip.startMinutes * 60 + clip.startSeconds;
          const endSec = clip.endMinutes * 60 + clip.endSeconds;
          const duration = endSec - startSec;

          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={clip.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderWidth: clip.selected ? 2 : 1,
                  borderColor: clip.selected ? 'primary.main' : 'divider',
                  transition: 'border-color 0.15s',
                }}
                variant="outlined"
              >
                {/* Video thumbnail */}
                <Box sx={{ height: 180, position: 'relative' }}>
                  <MockVideoPlayer
                    currentTime={startSec}
                    totalDuration={totalDuration}
                    clipRange={{ start: startSec, end: endSec }}
                    onSeek={() => {}}
                    readOnly
                  />
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
                    onChange={() => handleToggleSelection(clip.id)}
                    sx={{
                      position: 'absolute', top: 4, left: 4, zIndex: 1,
                      color: 'rgba(255,255,255,0.7)',
                      '&.Mui-checked': { color: 'primary.main' },
                      bgcolor: 'rgba(0,0,0,0.3)',
                      borderRadius: 1,
                      p: 0.5,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                    }}
                    size="small"
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pb: '12px !important' }}>
                  {/* Timestamp */}
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    {fmt(clip.startMinutes, clip.startSeconds)} — {fmt(clip.endMinutes, clip.endSeconds)}
                  </Typography>

                  {/* Title */}
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }} noWrap>
                    {clip.title}
                  </Typography>

                  {/* Hook with copy button */}
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
                        onClick={() => handleCopyHook(clip.hook)}
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
                      <Chip
                        label={`Score: ${clip.score}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {clip.isManual && <Chip label="Manual" size="small" color="warning" variant="outlined" />}
                  </Stack>

                  {/* AI Justification (collapsible) */}
                  {!clip.isManual && clip.justification && (
                    <Accordion
                      disableGutters
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mt: 'auto',
                        '&:before': { display: 'none' },
                      }}
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

                  {/* Delete */}
                  <Tooltip title="Eliminar clip">
                    <IconButton
                      size="small"
                      onClick={() => onClipsChange(clips.filter(c => c.id !== clip.id))}
                      sx={{ alignSelf: 'flex-start', mt: 'auto', color: 'error.light', '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default VideoModePanel;
