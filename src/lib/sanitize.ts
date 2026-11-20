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
