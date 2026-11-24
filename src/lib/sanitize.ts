import DOMPurify from 'dompurify';

/**
 * Sanitize user-authored rich text before it reaches dangerouslySetInnerHTML.
 * Allows the formatting our WYSIWYG produces; strips scripts, event handlers,
 * javascript: URLs and other injection vectors.
 */
const ALLOWED_TAGS = [
  'p', 'h2', 'h3', 'blockquote', 'figure', 'figcaption', 'img', 'video', 'iframe',
  'div', 'a', 'hr', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'br', 'span',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'controls', 'poster', 'allowfullscreen',
  'target', 'rel', 'width', 'height', 'data-story-image', 'style',
];

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return ''; // client-only render path
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

/** Plain text for card excerpts and script drawers, derived from the single
 *  WYSIWYG body so creators only write once. Line breaks are preserved. */
export function plainTextFromHtml(html?: string): string {
  if (!html || typeof window === 'undefined') return '';
  const holder = document.createElement('div');
  holder.innerHTML = sanitizeHtml(html);
  holder.querySelectorAll('p, h2, h3, blockquote, li, figcaption').forEach((node) => {
    node.appendChild(document.createTextNode('\n'));
  });
  holder.querySelectorAll('br').forEach((node) => node.replaceWith(document.createTextNode('\n')));
  return (holder.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}
