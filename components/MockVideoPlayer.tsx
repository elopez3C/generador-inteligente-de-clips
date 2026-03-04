import React, { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Forward5Icon from '@mui/icons-material/Forward5';
import Replay5Icon from '@mui/icons-material/Replay5';
import MovieIcon from '@mui/icons-material/Movie';
import { formatDuration } from '../utils';

interface MockVideoPlayerProps {
  currentTime: number;
  totalDuration: number;
  clipRange?: { start: number; end: number };
  onSeek: (time: number) => void;
  readOnly?: boolean;
  thumbnail?: string;
  isVertical?: boolean;
}

const MockVideoPlayer: React.FC<MockVideoPlayerProps> = ({
  currentTime, totalDuration, clipRange, onSeek, readOnly = false, thumbnail, isVertical = false,
}) => {
  const [playing, setPlaying] = useState(false);
  const [animTime, setAnimTime] = useState(clipRange?.start ?? currentTime);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset animTime when clipRange changes
  useEffect(() => {
    if (readOnly && clipRange) {
      setAnimTime(clipRange.start);
      setPlaying(false);
    }
  }, [readOnly, clipRange?.start, clipRange?.end]);

  // Animation loop for readOnly play
  useEffect(() => {
    if (!readOnly) return;
    if (playing && clipRange) {
      intervalRef.current = setInterval(() => {
        setAnimTime(prev => {
          const next = prev + 1;
          if (next >= clipRange.end) {
            setPlaying(false);
            return clipRange.start;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [readOnly, playing, clipRange]);

  const handleReadOnlyToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clipRange) return;
    setPlaying(p => {
      if (!p) setAnimTime(clipRange.start);
      return !p;
    });
  }, [clipRange]);

  const handlePlayPause = () => setPlaying(p => !p);
  const handleBack5 = () => onSeek(Math.max(0, currentTime - 5));
  const handleForward5 = () => onSeek(Math.min(totalDuration, currentTime + 5));

  const displayTime = readOnly ? animTime : currentTime;

  // Simulated waveform bars
  const waveBars = 40;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        bgcolor: 'grey.900',
        borderRadius: readOnly ? 0 : 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Thumbnail background */}
      {thumbnail && (
        <Box
          component="img"
          src={thumbnail}
          sx={{
            position: 'absolute',
            ...(isVertical ? {
              height: '100%',
              width: 'auto',
              left: '50%',
              transform: 'translateX(-50%)',
            } : {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }),
          }}
        />
      )}

      {/* Dark overlay for controls visibility */}
      {thumbnail && (
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.25)' }} />
      )}

      {/* Background waveform decoration (only when no thumbnail) */}
      {!thumbnail && (
        <Stack
          direction="row" spacing={0.25}
          sx={{
            position: 'absolute',
            bottom: readOnly ? '30%' : '35%',
            left: '10%', right: '10%',
            height: 40,
            alignItems: 'flex-end',
            opacity: 0.15,
          }}
        >
          {Array.from({ length: waveBars }).map((_, i) => {
            const h = 8 + Math.sin(i * 0.8) * 16 + Math.cos(i * 1.3) * 12;
            const progress = totalDuration > 0 ? displayTime / totalDuration : 0;
            const barProgress = i / waveBars;
            return (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: Math.max(4, h),
                  bgcolor: barProgress <= progress ? 'primary.main' : 'grey.500',
                  borderRadius: 0.5,
                  transition: 'background-color 0.3s',
                }}
              />
            );
          })}
        </Stack>
      )}

      {/* Center icon / play overlay for readOnly */}
      {readOnly ? (
        <IconButton
          onClick={handleReadOnlyToggle}
          sx={{
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.7)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
            width: 40, height: 40,
            transition: 'all 0.2s',
            zIndex: 1,
          }}
        >
          {playing ? <PauseIcon sx={{ fontSize: 22 }} /> : <PlayArrowIcon sx={{ fontSize: 22 }} />}
        </IconButton>
      ) : (
        <MovieIcon sx={{ fontSize: 48, color: 'grey.600', mb: 1 }} />
      )}

      {/* Clip range indicator (edit mode only) */}
      {clipRange && !readOnly && (
        <Chip
          size="small"
          label={`${formatDuration(clipRange.start)} — ${formatDuration(clipRange.end)}`}
          sx={{
            bgcolor: 'rgba(33,33,33,0.2)',
            color: 'primary.light',
            fontWeight: 600,
            fontSize: '0.75rem',
            mb: 1,
          }}
        />
      )}

      {/* Banner (edit mode only) */}
      {!readOnly && (
        <Typography variant="caption" sx={{ color: 'grey.600', mb: 2 }}>
          Vista previa disponible próximamente
        </Typography>
      )}

      {/* Controls (edit mode only) */}
      {!readOnly && (
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={handleBack5} sx={{ color: 'grey.400' }} size="small">
            <Replay5Icon />
          </IconButton>
          <IconButton
            onClick={handlePlayPause}
            sx={{
              color: 'white',
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              width: 44, height: 44,
            }}
          >
            {playing ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton onClick={handleForward5} sx={{ color: 'grey.400' }} size="small">
            <Forward5Icon />
          </IconButton>
        </Stack>
      )}

      {/* Timecode (edit mode only) */}
      {!readOnly && (
        <Typography
          variant="body2"
          sx={{
            color: 'grey.400',
            fontVariantNumeric: 'tabular-nums',
            mt: 1.5,
            fontWeight: 600,
          }}
        >
          {formatDuration(displayTime)} / {formatDuration(totalDuration)}
        </Typography>
      )}
    </Box>
  );
};

export default MockVideoPlayer;
