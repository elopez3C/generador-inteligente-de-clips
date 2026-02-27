import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Avatar from '@mui/material/Avatar';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { Clip } from '../types';

type ClipCardMode = 'workspace' | 'library';

interface ClipCardProps {
  clip: Clip;
  mode: ClipCardMode;
  onToggleSelection?: (id: string) => void;
  onUpdateTimestamp?: (id: string, type: 'start' | 'end', delta: number) => void;
  onSetTimestamp?: (id: string, type: 'start' | 'end', minutes: number, seconds: number) => void;
  onDelete?: (id: string) => void;
  onDownload?: (clip: Clip) => void;
  onExpand?: (clip: Clip) => void;
}

const fmt = (m: number, s: number) => `${m}:${s.toString().padStart(2, '0')}`;

const ClipCard: React.FC<ClipCardProps> = ({
  clip, mode, onToggleSelection, onUpdateTimestamp, onSetTimestamp, onDelete, onDownload, onExpand,
}) => {
  const [editingTimestamp, setEditingTimestamp] = useState<'start' | 'end' | null>(null);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editSeconds, setEditSeconds] = useState(0);

  const duration = (clip.endMinutes * 60 + clip.endSeconds) - (clip.startMinutes * 60 + clip.startSeconds);
  const isValid = duration > 0;

  const startEditing = (type: 'start' | 'end') => {
    const m = type === 'start' ? clip.startMinutes : clip.endMinutes;
    const s = type === 'start' ? clip.startSeconds : clip.endSeconds;
    setEditMinutes(m);
    setEditSeconds(s);
    setEditingTimestamp(type);
  };

  const commitEdit = () => {
    if (!editingTimestamp || !onSetTimestamp) return;
    const clampedS = Math.min(59, Math.max(0, editSeconds));
    const clampedM = Math.max(0, editMinutes);
    onSetTimestamp(clip.id, editingTimestamp, clampedM, clampedS);
    setEditingTimestamp(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditingTimestamp(null);
  };

  if (mode === 'library') {
    return (
      <Card
        onClick={() => onExpand?.(clip)}
        sx={{
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: '0 4px 16px rgba(103,80,164,0.15)', borderColor: 'primary.light' },
        }}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
            <Avatar
              sx={{
                width: 36, height: 36, fontSize: 13, fontWeight: 700, flexShrink: 0,
                bgcolor: clip.isManual ? 'warning.light' : 'primary.main',
                color: clip.isManual ? 'warning.dark' : 'primary.contrastText',
              }}
            >
              {clip.isManual ? 'M' : clip.score}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="subtitle2" noWrap>{clip.title}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {clip.sourceVideoName ?? '—'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} sx={{ ml: 'auto', flexShrink: 0 }}>
              {onDownload && (
                <IconButton
                  size="small" color="default"
                  onClick={e => { e.stopPropagation(); onDownload(clip); }}
                  sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'primary.main' } }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  size="small" color="default"
                  onClick={e => { e.stopPropagation(); onDelete(clip.id); }}
                  sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary" fontStyle="italic"
            sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1.5 }}
          >
            "{clip.hook}"
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.disabled">
              {fmt(clip.startMinutes, clip.startSeconds)} — {fmt(clip.endMinutes, clip.endSeconds)}
            </Typography>
            <Chip label={clip.category} size="small" variant="outlined" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Workspace mode
  return (
    <Card
      variant="outlined"
      sx={{
        opacity: clip.selected ? 1 : 0.55,
        borderColor: clip.selected ? 'primary.main' : 'divider',
        borderWidth: clip.selected ? 2 : 1,
        transition: 'all 0.2s',
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        {/* Header row */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Checkbox
            checked={clip.selected}
            onChange={() => onToggleSelection?.(clip.id)}
            sx={{ p: 0.5 }}
            color="primary"
          />
          <Avatar
            sx={{
              width: 32, height: 32, fontSize: 11, fontWeight: 700, flexShrink: 0,
              bgcolor: clip.isManual ? 'warning.light' : 'grey.100',
              color: clip.isManual ? 'warning.dark' : 'text.secondary',
            }}
          >
            {clip.isManual ? <ContentCutIcon sx={{ fontSize: 14 }} /> : `#${clip.number}`}
          </Avatar>
          <Typography variant="subtitle2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {clip.title}
          </Typography>
          {!clip.isManual && (
            <Chip
              size="small" label={clip.score}
              color={clip.score >= 9 ? 'primary' : 'default'}
              sx={{ fontWeight: 700, minWidth: 44 }}
            />
          )}
          {clip.isManual && <Chip size="small" label="Manual" color="warning" variant="outlined" />}
          {onDelete && (
            <IconButton size="small" onClick={() => onDelete(clip.id)}
              sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {/* Timestamp editor */}
        <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ mt: 2 }} flexWrap="wrap">
          {(['start', 'end'] as const).map(type => {
            const m = type === 'start' ? clip.startMinutes : clip.endMinutes;
            const s = type === 'start' ? clip.startSeconds : clip.endSeconds;
            const isEditing = editingTimestamp === type;
            return (
              <Box key={type}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  {type === 'start' ? 'Inicio' : 'Fin'}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconButton size="small"
                    onClick={() => onUpdateTimestamp?.(clip.id, type, -5)}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                  >
                    <RemoveIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  {isEditing && onSetTimestamp ? (
                    <Stack direction="row" alignItems="center" spacing={0.25}>
                      <TextField
                        size="small" type="number"
                        value={editMinutes}
                        onChange={e => setEditMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        onKeyDown={handleKeyDown}
                        onBlur={commitEdit}
                        autoFocus
                        inputProps={{ min: 0, style: { textAlign: 'center', width: 32, padding: '4px 2px' } }}
                        sx={{ width: 44 }}
                      />
                      <Typography fontWeight="bold" sx={{ fontSize: '0.875rem' }}>:</Typography>
                      <TextField
                        size="small" type="number"
                        value={editSeconds}
                        onChange={e => setEditSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                        onKeyDown={handleKeyDown}
                        onBlur={commitEdit}
                        inputProps={{ min: 0, max: 59, style: { textAlign: 'center', width: 32, padding: '4px 2px' } }}
                        sx={{ width: 44 }}
                      />
                    </Stack>
                  ) : (
                    <Box
                      onClick={() => onSetTimestamp && startEditing(type)}
                      sx={{
                        px: 1.5, py: 0.5, border: '1px solid', borderColor: 'divider',
                        borderRadius: 2, minWidth: 60, textAlign: 'center',
                        fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem', fontWeight: 600,
                        cursor: onSetTimestamp ? 'pointer' : 'default',
                        '&:hover': onSetTimestamp ? { borderColor: 'primary.main', bgcolor: 'primary.light' } : {},
                        transition: 'all 0.15s',
                      }}
                    >
                      {fmt(m, s)}
                    </Box>
                  )}
                  <IconButton size="small"
                    onClick={() => onUpdateTimestamp?.(clip.id, type, 5)}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                  >
                    <AddIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Stack>
              </Box>
            );
          })}
          <Chip
            label={isValid ? `${duration}s` : 'Inválido'}
            color={isValid ? 'primary' : 'error'}
            size="small"
            sx={{ fontWeight: 700, ml: 'auto' }}
          />
        </Stack>

        {/* AI detail accordion */}
        {!clip.isManual && (
          <Accordion sx={{ mt: 1.5 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}>
              <Typography variant="caption" color="text.secondary">
                Ver análisis IA
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      GANCHO SUGERIDO
                    </Typography>
                    <Typography variant="body2" fontStyle="italic">"{clip.hook}"</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      CATEGORÍA
                    </Typography>
                    <Chip label={clip.category} size="small" />
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="caption" color="primary" display="block" sx={{ mb: 0.5 }}>
                      JUSTIFICACIÓN IA
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{clip.justification}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default ClipCard;
