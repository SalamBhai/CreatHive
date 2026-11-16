'use client';

import React from 'react';
import { CreativePiece } from '@/lib/types';
import { AudioPlayerCard } from '../media/AudioPlayerCard';
import { VideoReelCard } from '../media/VideoReelCard';
import { ImageGalleryCard } from '../media/ImageGalleryCard';
import { PoetryCard } from '../media/PoetryCard';

interface PieceRendererProps {
  piece: CreativePiece;
}

export function PieceRenderer({ piece }: PieceRendererProps) {
  switch (piece.mediaType) {
    case 'AUDIO':
      return <AudioPlayerCard piece={piece} />;
    case 'VIDEO':
      return <VideoReelCard piece={piece} />;
    case 'TEXT':
      return <PoetryCard piece={piece} />;
    case 'IMAGE_GALLERY':
    default:
      return <ImageGalleryCard piece={piece} />;
  }
}
