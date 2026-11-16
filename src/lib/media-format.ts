import type { CreativeDiscipline, MediaType } from './types';

/** Every niche has a natural media format. The Studio derives it automatically. */
export const NICHE_MEDIA: Record<CreativeDiscipline, MediaType> = {
  SPOKEN_WORD: 'AUDIO',
  MUSIC: 'AUDIO',
  POETRY: 'TEXT',
  DANCE: 'VIDEO',
  MOTION_ANIMATION: 'VIDEO',
  UIUX_DESIGN: 'IMAGE_GALLERY',
  TECH_IMAGERY: 'IMAGE_GALLERY',
  GRAPHIC_DESIGN: 'IMAGE_GALLERY',
  OTHER: 'IMAGE_GALLERY',
};

export const MEDIA_LABELS: Record<MediaType, string> = {
  AUDIO: 'Audio stream / Spoken word',
  VIDEO: 'Video reel / Performance',
  TEXT: 'Long-form post / Article',
  IMAGE_GALLERY: 'Image gallery / UI mockups',
};

export const mediaTypeForNiche = (discipline: CreativeDiscipline): MediaType =>
  NICHE_MEDIA[discipline] || 'IMAGE_GALLERY';
