/** Media URL helpers shared by the Studio form and the public renderers. */

export type MediaProvider = 'youtube' | 'vimeo' | 'direct' | 'unknown';

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

export function getMediaProvider(url?: string): MediaProvider {
  if (!url) return 'unknown';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (YOUTUBE_HOSTS.has(host)) return 'youtube';
    if (VIMEO_HOSTS.has(host)) return 'vimeo';
    return 'direct';
  } catch {
    return 'unknown';
  }
}

/** Convert an allowlisted share URL into an embeddable URL, or null. */
export function toEmbedUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (YOUTUBE_HOSTS.has(host)) {
      let id = parsed.searchParams.get('v');
      if (!id && host === 'youtu.be') id = parsed.pathname.slice(1);
      if (!id) {
        const parts = parsed.pathname.split('/').filter(Boolean);
        const maybeId = parts.find((p) => ['embed', 'shorts', 'live'].includes(parts[parts.indexOf(p) - 1] || ''));
        id = maybeId || (parts[1] === 'embed' || parts[1] === 'shorts' ? parts[2] : '') || '';
      }
      if (!id || !/^[\w-]{6,}$/.test(id)) return null;
      return `https://www.youtube-nocookie.com/embed/${id}`;
    }

    if (VIMEO_HOSTS.has(host)) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (!id || !/^\d+$/.test(id)) return null;
      return `https://player.vimeo.com/video/${id}`;
    }

    return null;
  } catch {
    return null;
  }
}

export const ALLOWED_EMBED_HOSTS = 'YouTube, YouTu.be, Vimeo';
