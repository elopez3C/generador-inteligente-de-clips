import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Clip } from '../types';

interface ManualClipDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (clip: Clip) => void;
  nextNumber: number;
  initialStart?: { startM: number; startS: number };
}

const ManualClipDialog: React.FC<ManualClipDialogProps> = ({
  open, onClose, onSave, nextNumber, initialStart,
}) => {
  const [title, setTitle] = useState('');
  const [startM, setStartM] = useState(0);
  const [startS, setStartS] = useState(0);
  const [endM, setEndM] = useState(0);
  const [endS, setEndS] = useState(30);

  useEffect(() => {
    if (open) {
      setTitle('');
      if (initialStart) {
        setStartM(initialStart.startM);
        setStartS(initialStart.startS);
        let eS = initialStart.startS + 30;
        let eM = initialStart.startM;
        if (eS >= 60) { eM += 1; eS -= 60; }
        setEndM(eM);
        setEndS(eS);
      } else {
        setStartM(0); setStartS(0); setEndM(0); setEndS(30);
      }
    }
  }, [open, initialStart]);

  const duration = (endM * 60 + endS) - (startM * 60 + startS);
  const isValid = duration > 0;

  const handleSave = () => {
    const clip: Clip = {
      id: `manual-${Date.now()}`,
      number: nextNumber,
      title: title.trim() || `Clip Manual #${nextNumber}`,
      score: 0,
      hook: 'Clip definido manualmente.',
      category: 'Manual',
      startMinutes: startM, startSeconds: startS,
      endMinutes: endM, endSeconds: endS,
      justification: 'Creado manualmente desde la transcripción.',
      selected: true,
      isManual: true,
    };
    onSave(clip);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Nuevo Clip Manual
        <IconButton onClick={onClose} size="small"
          sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 0.5 }}>
          <TextField
            fullWidth label="Título del clip"
            placeholder="Ej: Introducción del producto"
            value={title} onChange={e => setTitle(e.target.value)}
          />

          <Grid container spacing={2}>
            <Grid size={6}>
              <Typography variant="overline" display="block" sx={{ mb: 0.5 }}>Inicio</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TextField
                  type="number" size="small" label="Min"
                  value={startM} onChange={e => setStartM(Math.max(0, parseInt(e.target.value) || 0))}
                  inputProps={{ min: 0 }} sx={{ width: 70 }}
                />
                <Typography fontWeight="bold">:</Typography>
                <TextField
                  type="number" size="small" label="Seg"
                  value={startS} onChange={e => setStartS(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  inputProps={{ min: 0, max: 59 }} sx={{ width: 70 }}
                />
              </Stack>
            </Grid>
            <Grid size={6}>
              <Typography variant="overline" display="block" sx={{ mb: 0.5 }}>Fin</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TextField
                  type="number" size="small" label="Min"
                  value={endM} onChange={e => setEndM(Math.max(0, parseInt(e.target.value) || 0))}
                  inputProps={{ min: 0 }} sx={{ width: 70 }}
                />
                <Typography fontWeight="bold">:</Typography>
                <TextField
                  type="number" size="small" label="Seg"
                  value={endS} onChange={e => setEndS(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  inputProps={{ min: 0, max: 59 }} sx={{ width: 70 }}
                />
              </Stack>
            </Grid>
          </Grid>

          <Alert severity={isValid ? 'info' : 'error'} sx={{ py: 0.5 }}>
            {isValid ? `Duración: ${duration} segundos` : 'El tiempo de fin debe ser mayor que el inicio'}
          </Alert>

          <Alert severity="info" icon={false} sx={{ py: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>
            Usa la pestaña de Transcripción para encontrar los tiempos exactos.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={!isValid}>
          Añadir clip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualClipDialog;
