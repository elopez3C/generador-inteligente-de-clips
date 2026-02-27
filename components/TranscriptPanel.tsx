import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import SearchIcon from '@mui/icons-material/Search';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { TranscriptGroup, Clip } from '../types';

function normalizeText(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

interface TranscriptPanelProps {
  groups: TranscriptGroup[];
  highlightedClipIds: string[];
  onCreateClipFromLine: (time: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSaveInlineClip?: (clip: Clip) => void;
  nextClipNumber?: number;
}

interface SelectionPoint {
  time: string;
  groupIndex: number;
  lineIndex: number;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  groups, highlightedClipIds, onCreateClipFromLine, searchQuery, onSearchChange,
  onSaveInlineClip, nextClipNumber = 1,
}) => {
  const normQuery = normalizeText(searchQuery);

  const [selectionStart, setSelectionStart] = useState<SelectionPoint | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<SelectionPoint | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');

  const filteredGroups = groups
    .map(g => ({
      ...g,
      lines: g.lines.filter(l =>
        !normQuery ||
        normalizeText(l.text).includes(normQuery) ||
        normalizeText(g.speaker).includes(normQuery)
      ),
    }))
    .filter(g => g.lines.length > 0);

  // Build a flat index map for range checking
  const flatLines: { groupIndex: number; lineIndex: number; time: string }[] = [];
  filteredGroups.forEach((g, gi) => {
    g.lines.forEach((l, li) => {
      flatLines.push({ groupIndex: gi, lineIndex: li, time: l.time });
    });
  });

  const getFlatIndex = (gi: number, li: number) =>
    flatLines.findIndex(f => f.groupIndex === gi && f.lineIndex === li);

  const isInSelectionRange = (gi: number, li: number): boolean => {
    if (!selectionStart) return false;
    const startFlat = getFlatIndex(selectionStart.groupIndex, selectionStart.lineIndex);
    if (!selectionEnd) return getFlatIndex(gi, li) === startFlat;
    const endFlat = getFlatIndex(selectionEnd.groupIndex, selectionEnd.lineIndex);
    const currentFlat = getFlatIndex(gi, li);
    const lo = Math.min(startFlat, endFlat);
    const hi = Math.max(startFlat, endFlat);
    return currentFlat >= lo && currentFlat <= hi;
  };

  const handleCutClick = (time: string, gi: number, li: number) => {
    if (!onSaveInlineClip) {
      // Fallback to old behavior (open modal)
      onCreateClipFromLine(time);
      return;
    }

    if (!selectionStart) {
      // First click — set start
      setSelectionStart({ time, groupIndex: gi, lineIndex: li });
      setSelectionEnd(null);
      setInlineTitle('');
    } else if (!selectionEnd) {
      // Second click — set end
      setSelectionEnd({ time, groupIndex: gi, lineIndex: li });
    } else {
      // Already have both — restart
      setSelectionStart({ time, groupIndex: gi, lineIndex: li });
      setSelectionEnd(null);
      setInlineTitle('');
    }
  };

  const handleCancelSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setInlineTitle('');
  };

  const handleSaveInlineClip = () => {
    if (!selectionStart || !selectionEnd || !onSaveInlineClip) return;

    // Determine actual start/end (order-independent)
    const startTime = selectionStart.time <= selectionEnd.time ? selectionStart.time : selectionEnd.time;
    const endTime = selectionStart.time <= selectionEnd.time ? selectionEnd.time : selectionStart.time;

    const [startM, startS] = startTime.split(':').map(Number);
    // For end, add 30s as a reasonable default clip length from that point
    let [endM, endS] = endTime.split(':').map(Number);
    endS += 30;
    if (endS >= 60) { endM += 1; endS -= 60; }

    const clip: Clip = {
      id: `manual-${Date.now()}`,
      number: nextClipNumber,
      title: inlineTitle.trim() || `Clip Manual #${nextClipNumber}`,
      score: 0,
      hook: 'Clip definido manualmente.',
      category: 'Manual',
      startMinutes: startM,
      startSeconds: startS,
      endMinutes: endM,
      endSeconds: endS,
      justification: 'Creado manualmente desde la transcripción.',
      selected: true,
      isManual: true,
    };

    onSaveInlineClip(clip);
    handleCancelSelection();
  };

  const showInlineForm = selectionStart !== null && selectionEnd !== null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Transcripción</Typography>
        <TextField
          size="small" fullWidth placeholder="Filtrar por palabra..."
          value={searchQuery} onChange={e => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        {/* Selection hint */}
        {selectionStart && !selectionEnd && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Chip label={`Inicio: ${selectionStart.time}`} size="small" color="success" />
            <Typography variant="caption" color="text.secondary">
              Haz click en otra línea para marcar el fin
            </Typography>
            <IconButton size="small" onClick={handleCancelSelection}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>
        )}
      </Box>

      {/* Transcript content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {filteredGroups.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
            Sin resultados para "{searchQuery}"
          </Typography>
        ) : (
          <Stack spacing={3}>
            {filteredGroups.map((group, gi) => (
              <Box key={gi}>
                {/* Speaker header */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Avatar
                    sx={{
                      width: 30, height: 30, fontSize: 12, fontWeight: 700,
                      bgcolor: group.speakerColor === 'primary' ? 'primary.main' : 'secondary.main',
                    }}
                  >
                    {group.speaker.charAt(group.speaker.length - 1)}
                  </Avatar>
                  <Typography variant="overline" color="text.secondary">
                    {group.speaker}
                  </Typography>
                </Stack>

                {/* Lines */}
                <Stack spacing={0.5} sx={{ pl: 5.5 }}>
                  {group.lines.map((line, li) => {
                    const isHighlighted = !!line.clipId && highlightedClipIds.includes(line.clipId);
                    const inRange = isInSelectionRange(gi, li);
                    return (
                      <Box
                        key={li}
                        className="transcript-line"
                        sx={{
                          display: 'flex', alignItems: 'flex-start', gap: 1.5,
                          p: 1, borderRadius: 2, cursor: 'default',
                          bgcolor: inRange ? 'success.light' : isHighlighted ? 'primary.light' : 'transparent',
                          borderLeft: inRange ? '3px solid' : isHighlighted ? '3px solid' : '3px solid transparent',
                          borderColor: inRange ? 'success.main' : isHighlighted ? 'primary.main' : 'transparent',
                          transition: 'background-color 0.15s',
                          '&:hover': { bgcolor: inRange ? 'success.light' : isHighlighted ? 'primary.light' : 'grey.50' },
                          '&:hover .cut-btn': { opacity: 1 },
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 36, pt: 0.1, flexShrink: 0 }}
                        >
                          {line.time}
                        </Typography>
                        <Typography variant="body2" sx={{ flexGrow: 1, lineHeight: 1.6 }}>
                          {line.text}
                          {line.clipId && (
                            <Chip
                              size="small"
                              label={`IA #${line.clipId}`}
                              color="primary"
                              sx={{ ml: 1, fontSize: '0.65rem', height: 18, verticalAlign: 'middle' }}
                            />
                          )}
                        </Typography>
                        <Tooltip title={selectionStart && !selectionEnd ? 'Marcar fin del clip' : 'Marcar inicio del clip'}>
                          <IconButton
                            size="small"
                            className="cut-btn"
                            onClick={() => handleCutClick(line.time, gi, li)}
                            sx={{
                              opacity: selectionStart ? 0.8 : 0,
                              transition: 'opacity 0.15s',
                              flexShrink: 0,
                              color: selectionStart && !selectionEnd ? 'success.main' : undefined,
                            }}
                          >
                            <ContentCutIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  })}
                </Stack>

                {/* Inline clip form — show after the group that contains the selection end */}
                {showInlineForm && selectionEnd && selectionEnd.groupIndex === gi && (
                  <Paper
                    variant="outlined"
                    sx={{
                      ml: 5.5, mt: 1.5, p: 2,
                      borderColor: 'success.main',
                      borderRadius: 2,
                      bgcolor: 'success.light',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      Nuevo clip manual
                    </Typography>
                    <TextField
                      size="small" fullWidth
                      placeholder={`Clip Manual #${nextClipNumber}`}
                      value={inlineTitle}
                      onChange={e => setInlineTitle(e.target.value)}
                      sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small" variant="outlined"
                        label={`${selectionStart!.time <= selectionEnd.time ? selectionStart!.time : selectionEnd.time} → ${selectionStart!.time <= selectionEnd.time ? selectionEnd.time : selectionStart!.time}`}
                      />
                      <Box sx={{ flexGrow: 1 }} />
                      <Button size="small" onClick={handleCancelSelection} startIcon={<CloseIcon />}>
                        Cancelar
                      </Button>
                      <Button size="small" variant="contained" color="success" onClick={handleSaveInlineClip} startIcon={<CheckIcon />}>
                        Guardar
                      </Button>
                    </Stack>
                  </Paper>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default TranscriptPanel;
