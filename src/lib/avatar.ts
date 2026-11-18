/** Generate a colorful initials avatar SVG.
 *  Accepts a name/username and returns a data URI SVG.
 *  Colours are derived from the name hash so the same name always gets the same avatar.
 */

const COLOR_PALETTE = [
  '#FF5A36', // coral
  '#FF8438', // amber
  '#FFAE19', // yellow
  '#22C55E', // green
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#FACC15', // lime
  '#A855F7', // violet
];

export function getInitialsAvatar(dataUrl: string): string {
  // If a data URI is already provided, return it as-is
  if (dataUriStarts(dataUrl)) return dataUrl;
  return dataUrl;
}

function dataUriStarts(url: string): boolean {
  return url.startsWith('data:');
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function rgbFromHash(hash: number): [number, number, number] {
  // Use high bits to pick colors from palette
  const paletteIndex = Math.abs(hash) % COLOR_PALETTE.length;
  const color = COLOR_PALETTE[paletteIndex];
  // Parse hex to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return [r, g, b];
}

export function initialsAvatarSvg(
  text: string,
  size = 80,
  padding = 12
): string {
  // Extract initials (first letter of each name part)
  const words = text.split(/\s+/).filter(Boolean);
  const initials = words
    .map((w) => w[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');

  if (!initials) return '';

  const [r, g, b] = rgbFromHash(hashString(text));
  const fillColor = `rgb(${r}, ${g}, ${b})`;

  const width = size + padding * 2;
  const height = size + padding * 2;

  // Build an SVG with rounded rect background + initials text
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
         xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${padding}" ry="${padding}"
            fill="${fillColor}" />
      <text x="${padding + size / 2}" y="${padding + size / 2 + 5}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="${size * 0.6}px"
            font-weight="bold"
            fill="white">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8;base64,${btoa(svg)}`;
}

/** Resolve an avatar URL: use the provided url, or fall back to an initials avatar. */
export function resolveAvatarUrl(avatarUrl: string, fallbackName: string): string {
  if (!avatarUrl || avatarUrl.trim() === '') {
    return initialsAvatarSvg(fallbackName || 'CreatHive');
  }
  // If it's already a data URI, return as-is
  if (avatarUrl.startsWith('data:')) return avatarUrl;
  // Otherwise return the url as-is (Supabase storage URL, Cloudinary URL, etc.)
  return avatarUrl;
}