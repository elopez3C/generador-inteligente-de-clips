import React, { useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { Clip } from '../types';
import { formatDuration } from '../utils';

interface ClipTimelineProps {
  totalDuration: number;
  clips: Clip[];
  currentTime: number;
  selectedClipId?: string;
  onSeek: (time: number) => void;
  onSelectClip?: (id: string) => void;
}

const clipToSeconds = (c: Clip) => ({
  start: c.startMinutes * 60 + c.startSeconds,
  end: c.endMinutes * 60 + c.endSeconds,
});

const ClipTimeline: React.FC<ClipTimelineProps> = ({
  totalDuration, clips, currentTime, selectedClipId, onSeek, onSelectClip,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || totalDuration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onSeek(pct * totalDuration);
  };

  const playheadPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <Box sx={{ px: 2, py: 1 }}>
      {/* Time labels */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatDuration(0)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {formatDuration(currentTime)}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatDuration(totalDuration)}
        </Typography>
      </Box>

      {/* Track */}
      <Box
        ref={trackRef}
        onClick={handleTrackClick}
        sx={{
          position: 'relative',
          height: 48,
          bgcolor: 'grey.200',
          borderRadius: 1.5,
          cursor: 'pointer',
          overflow: 'hidden',
          '&:hover': { bgcolor: 'grey.300' },
          transition: 'background-color 0.15s',
        }}
      >
        {/* Clip segments */}
        {clips.map(clip => {
          const { start, end } = clipToSeconds(clip);
          if (totalDuration <= 0) return null;
          const leftPct = (start / totalDuration) * 100;
          const widthPct = ((end - start) / totalDuration) * 100;
          const isSelected = clip.id === selectedClipId;
          return (
            <Tooltip key={clip.id} title={`${clip.title} (${formatDuration(start)} — ${formatDuration(end)})`}>
              <Box
                onClick={e => {
                  e.stopPropagation();
                  onSelectClip?.(clip.id);
                  onSeek(start);
                }}
                sx={{
                  position: 'absolute',
                  top: 4, bottom: 4,
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 0.5)}%`,
                  bgcolor: clip.isManual ? 'warning.main' : 'primary.main',
                  opacity: isSelected ? 1 : 0.7,
                  borderRadius: 1,
                  border: isSelected ? '2px solid' : 'none',
                  borderColor: isSelected ? 'common.white' : undefined,
                  boxShadow: isSelected ? '0 0 8px rgba(103,80,164,0.4)' : undefined,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s, box-shadow 0.15s',
                  '&:hover': { opacity: 1 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  px: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {clip.title}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}

        {/* Playhead */}
        <Box
          sx={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${playheadPct}%`,
            width: 2,
            bgcolor: 'error.main',
            zIndex: 2,
            pointerEvents: 'none',
            transition: 'left 0.1s',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -4,
              left: -4,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'error.main',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default ClipTimeline;
