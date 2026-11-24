/** Derive display-size URLs from a stored Cloudinary URL. The original stays
 *  untouched in storage; Cloudinary generates and caches the derivative. */
export function cloudinaryImageUrl(url: string | undefined, width: number): string {
  if (!url) return '';
  const marker = '/image/upload/';
  const index = url.indexOf(marker);
  if (index < 0) return url; // Unsplash, local paths, etc.

  const head = url.slice(0, index + marker.length);
  let tail = url.slice(index + marker.length);
  // Replace a transform segment if one already exists, otherwise keep the
  // version/publicId path intact.
  if (/^(f_|q_|w_|c_|e_|h_)/.test(tail)) tail = tail.replace(/^[^/]+\//, '');
  return `${head}f_auto,q_auto,w_${width}/${tail}`;
}

/** Convenience for gallery strips and thumbnails. */
export const thumbnailUrl = (url?: string) => cloudinaryImageUrl(url, 160);
