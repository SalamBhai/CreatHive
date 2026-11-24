/** Derive display-size URLs from a stored Cloudinary URL. The original stays
 *  untouched in storage; Cloudinary generates and caches the derivative. */
export function cloudinaryImageUrl(
  url: string | undefined,
  width: number,
  options: { trim?: boolean } = {}
): string {
  if (!url) return '';
  const marker = '/image/upload/';
  const index = url.indexOf(marker);
  if (index < 0) return url; // Unsplash, local paths, etc.

  const head = url.slice(0, index + marker.length);
  let tail = url.slice(index + marker.length);
  // Replace a transform segment if one already exists, otherwise keep the
  // version/publicId path intact.
  if (/^(f_|q_|w_|c_|e_|h_)/.test(tail)) tail = tail.replace(/^[^/]+\//, '');
  const transform = options.trim
    ? `f_auto,q_auto,e_trim,w_${width}`
    : `f_auto,q_auto,w_${width}`;
  return `${head}${transform}/${tail}`;
}

/** Thumbnails for gallery/PDF strips — trimmed to drop flat white margins. */
export const thumbnailUrl = (url?: string) => cloudinaryImageUrl(url, 160, { trim: true });
