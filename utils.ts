import { Clip } from './types';

/** Generate EDL (CMX 3600) file content from clips */
export function generateEDL(clips: Clip[], projectName: string): string {
  const safeName = projectName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_áéíóúñüÁÉÍÓÚÑÜ ]/g, '_');
  const lines: string[] = [
    `TITLE: ${safeName}`,
    'FCM: NON-DROP FRAME',
    '',
  ];

  clips.forEach((clip, i) => {
    const num = String(i + 1).padStart(3, '0');
    const startSec = clip.startMinutes * 60 + clip.startSeconds;
    const endSec = clip.endMinutes * 60 + clip.endSeconds;
    const toTC = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}:00`;
    };
    const srcIn = toTC(startSec);
    const srcOut = toTC(endSec);
    lines.push(`${num}  AX       V     C        ${srcIn} ${srcOut} ${srcIn} ${srcOut}`);
    lines.push(`* FROM CLIP NAME: ${clip.title}`);
    lines.push(`* COMMENT: Score ${clip.score} | ${clip.category}`);
    lines.push('');
  });

  return lines.join('\n');
}

/** Parse "MM:SS" or "H:MM:SS" to total seconds */
export function parseDuration(str: string): number {
  if (!str) return 0;
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/** Format total seconds to "M:SS" (or "H:MM:SS" if >= 1 hour) */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
