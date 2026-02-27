import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { Clip } from '../types';

type ClipStatus = 'pending' | 'processing' | 'completed';

const SlideUp = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface GenerationDialogProps {
  open: boolean;
  clips: Clip[];
  onComplete: () => void;
}

const GenerationDialog: React.FC<GenerationDialogProps> = ({ open, clips, onComplete }) => {
  const [statuses, setStatuses] = useState<Record<string, ClipStatus>>({});
  const [globalProgress, setGlobalProgress] = useState(0);

  useEffect(() => {
    if (!open || clips.length === 0) return;

    const init: Record<string, ClipStatus> = {};
    clips.forEach(c => { init[c.id] = 'pending'; });
    setStatuses(init);
    setGlobalProgress(0);

    let idx = 0;

    const processNext = () => {
      if (idx >= clips.length) {
        setTimeout(onComplete, 800);
        return;
      }
      const id = clips[idx].id;
      setStatuses(prev => ({ ...prev, [id]: 'processing' }));

      setTimeout(() => {
        setStatuses(prev => ({ ...prev, [id]: 'completed' }));
        setGlobalProgress(Math.round(((idx + 1) / clips.length) * 100));
        idx++;
        setTimeout(processNext, 400);
      }, 1400);
    };

    const start = setTimeout(processNext, 300);
    return () => clearTimeout(start);
  }, [open]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog
      open={open}
      fullScreen
      TransitionComponent={SlideUp}
      PaperProps={{ sx: { borderRadius: 0, bgcolor: 'background.default' } }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 6 }}>
        <Stack alignItems="center" spacing={2}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate" value={globalProgress}
              size={64} thickness={4} color="primary"
            />
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography variant="subtitle2" fontWeight={700}>{globalProgress}%</Typography>
            </Box>
          </Box>
          <Typography variant="h5" fontWeight={700}>
            Generando clips seleccionados
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 480 }}>
            <LinearProgress variant="determinate" value={globalProgress} />
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ maxWidth: 560, mx: 'auto', width: '100%' }}>
        <List disablePadding>
          {clips.map(clip => {
            const status = statuses[clip.id] ?? 'pending';
            return (
              <ListItem
                key={clip.id}
                sx={{
                  mb: 1, borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid', borderColor: 'divider',
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary', fontWeight: 700 }}>
                    #{clip.number}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={clip.title}
                  secondary={clip.category}
                  primaryTypographyProps={{ variant: 'subtitle2', noWrap: true }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {status === 'completed' && (
                  <Chip size="small" label="Completado" color="success"
                    icon={<CheckCircleIcon />} sx={{ fontWeight: 600 }} />
                )}
                {status === 'processing' && (
                  <Chip size="small" label="Renderizando..." color="warning"
                    icon={<CircularProgress size={12} color="inherit" />} sx={{ fontWeight: 600 }} />
                )}
                {status === 'pending' && (
                  <Chip size="small" label="En cola" variant="outlined" sx={{ color: 'text.disabled' }} />
                )}
              </ListItem>
            );
          })}
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          No cierres esta pestaña durante el proceso.
        </Alert>
      </DialogContent>
    </Dialog>
  );
};

export default GenerationDialog;
