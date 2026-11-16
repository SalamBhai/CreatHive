/** Normalisation + curation rules for creator-defined tags. */

export const MAX_TAGS = 8;
const MAX_LENGTH = 24;

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_LENGTH);
}

export function normalizeTags(input: string | string[], limit = MAX_TAGS): string[] {
  const raw = Array.isArray(input) ? input : input.split(',');
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    const tag = normalizeTag(item);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
      if (result.length >= limit) break;
    }
  }
  return result;
}
