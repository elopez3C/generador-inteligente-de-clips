import React from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Clip } from '../types';

const CLIP_COLOR = '#7c5cbf';

interface ProjectTimelineProps {
  clips: Clip[];
  totalDuration: number; // in seconds
  onClipClick?: (clip: Clip) => void;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ clips, totalDuration, onClipClick }) => {
  if (totalDuration <= 0 || clips.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
        Timeline del video
      </Typography>
      <Box
        sx={{
          position: 'relative',
          height: 32,
          bgcolor: 'grey.100',
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {clips.map((clip, i) => {
          const startSec = clip.startMinutes * 60 + clip.startSeconds;
          const endSec = clip.endMinutes * 60 + clip.endSeconds;
          const left = (startSec / totalDuration) * 100;
          const width = Math.max(((endSec - startSec) / totalDuration) * 100, 0.5);
          const duration = endSec - startSec;

          return (
            <Tooltip
              key={clip.id}
              title={
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'white' }}>{clip.title}</Typography>
                  <Typography variant="caption" sx={{ color: 'white' }}>Score: {clip.score} | {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</Typography>
                </Box>
              }
              arrow
            >
              <Box
                onClick={() => onClipClick?.(clip)}
                sx={{
                  position: 'absolute',
                  top: 2,
                  bottom: 2,
                  left: `${left}%`,
                  width: `${width}%`,
                  bgcolor: CLIP_COLOR,
                  borderRadius: 0.5,
                  cursor: onClipClick ? 'pointer' : 'default',
                  opacity: 0.85,
                  transition: 'opacity 0.15s, transform 0.15s',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scaleY(1.15)',
                    zIndex: 1,
                  },
                  minWidth: 4,
                }}
              />
            </Tooltip>
          );
        })}

        {/* Time markers */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const sec = Math.round(totalDuration * pct);
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return (
            <Typography
              key={pct}
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 1,
                left: `${pct * 100}%`,
                transform: pct === 1 ? 'translateX(-100%)' : pct > 0 ? 'translateX(-50%)' : undefined,
                fontSize: '0.55rem',
                color: 'text.disabled',
                pointerEvents: 'none',
                lineHeight: 1,
              }}
            >
              {m}:{String(s).padStart(2, '0')}
            </Typography>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProjectTimeline;
