/** Search utility for creators and pieces.
 *  Supports searching by tag, discipline, and creator name.
 *  Works with both mock data (local) and real data (Supabase).
 */

import type { CreativeProfile, CreativePiece, CreativeDiscipline } from '@/lib/types';

export interface SearchOptions {
  query?: string;     // Free-text search term
  discipline?: CreativeDiscipline; // Filter by CreativeDiscipline
  creator?: string;   // Filter by username/displayName
}

/** Search through profiles by name or tags */
export function searchProfiles(
  profiles: Record<string, CreativeProfile>,
  options: SearchOptions
): CreativeProfile[] {
  const results: CreativeProfile[] = [];
  const query = (options.query || '').toLowerCase();

  for (const [, profile] of Object.entries(profiles)) {
    // Check discipline match - profiles have 'disciplines' (plural)
    const matchesDiscipline =
      !options.discipline ||
      profile.disciplines.some((d) => d === options.discipline);

    const matchesCreator =
      !options.creator ||
      profile.username.toLowerCase().includes(options.creator.toLowerCase()) ||
      (profile.displayName &&
        profile.displayName.toLowerCase().includes(options.creator.toLowerCase()));

    // Check free-text query match in bio or tagline
    const textMatch =
      (!query ||
        (profile.bio && profile.bio.toLowerCase().includes(query)) ||
        (profile.tagline && profile.tagline.toLowerCase().includes(query)));

    if (matchesDiscipline && matchesCreator && textMatch) {
      results.push(profile);
    }
  }
  return results;
}

/** Search through pieces by title, subtitle, discipline, or tags */
export function searchPieces(
  pieces: CreativePiece[],
  options: SearchOptions
): CreativePiece[] {
  const results: CreativePiece[] = [];
  const query = (options.query || '').toLowerCase();

  for (const piece of pieces) {
    const matchesDiscipline =
      !options.discipline || piece.discipline === options.discipline;
    const matchesCreator =
      !options.creator || piece.creativeId === options.creator;

    // Check tag match - pieces have a 'tags' array
    const tagMatch = piece.tags?.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes(query));

    // Check free-text query match in title, subtitle, or contextNote
    const textMatch =
      !query ||
      piece.title.toLowerCase().includes(query) ||
      (piece.subtitle && piece.subtitle.toLowerCase().includes(query)) ||
      (piece.contextNote && piece.contextNote.toLowerCase().includes(query));

    if (matchesDiscipline && matchesCreator && (tagMatch || textMatch)) {
      results.push(piece);
    }
  }
  return results;
}