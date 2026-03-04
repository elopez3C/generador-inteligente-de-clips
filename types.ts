export enum Screen {
  WORKSPACE,
  LIBRARY,
}

export type WorkspaceMode = 'transcription' | 'video';

export type WorkspacePhase = 'analyzing' | 'ready' | 'reanalyzing';

export interface Clip {
  id: string;
  number: number;
  title: string;
  score: number;
  hook: string;
  category: string;
  startMinutes: number;
  startSeconds: number;
  endMinutes: number;
  endSeconds: number;
  justification: string;
  selected: boolean;
  isManual?: boolean;
  isNew?: boolean;
  sourceVideoName?: string;
  processedAt?: number;
  platform?: SocialFocus;
  style?: ClipStyle;
  sourceDuration?: string;
  thumbnail?: string;
  isVertical?: boolean;
  suggestedCaption?: string;
  suggestedHashtags?: string[];
  suggestedCTA?: string;
  tags?: string[];
  duplicatedFrom?: string;
}

export type ClipStyle = 'Educativo' | 'Entretenimiento' | 'Informativo' | 'Inspiracional' | 'Ventas';
export type SocialFocus = 'TikTok' | 'YouTube Shorts' | 'LinkedIn' | 'Instagram Reels';

export interface AnalysisParams {
  minScore: number;
  durationMin: number;
  durationMax: number;
  maxClips: '3-5' | '5-7' | '8-10';
  numClips: number;
  style: ClipStyle;
  socialFocus: SocialFocus;
  avgDuration: number | null;
  keywords: string;
}

export const PLATFORM_PRESETS: Record<SocialFocus, { durationMin: number; durationMax: number; avgDuration: number }> = {
  'TikTok': { durationMin: 15, durationMax: 45, avgDuration: 30 },
  'YouTube Shorts': { durationMin: 30, durationMax: 55, avgDuration: 45 },
  'Instagram Reels': { durationMin: 15, durationMax: 30, avgDuration: 20 },
  'LinkedIn': { durationMin: 30, durationMax: 90, avgDuration: 60 },
};

export interface LibraryFolder {
  id: string;
  name: string;
  projectNames: string[];
}

export interface FileData {
  name: string;
  size: number;
  duration: string;
}

export interface TranscriptLine {
  time: string;
  text: string;
  clipId?: string;
}

export interface TranscriptGroup {
  speaker: string;
  speakerColor: 'primary' | 'secondary';
  lines: TranscriptLine[];
}
