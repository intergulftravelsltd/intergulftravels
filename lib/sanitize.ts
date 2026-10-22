import sanitize from 'sanitize-html';

/* ------------------------------------------------------------------ *
 *  Server-side HTML sanitiser for admin-authored content (blog posts).
 *  sanitize-html is pure JavaScript, so it runs in a Vercel function
 *  without a DOM emulation (the previous jsdom-based sanitiser failed to
 *  load there). The allowlist mirrors DOMPurify's defaults: ordinary
 *  article markup, images and media, no scripts, forms or iframes.
 * ------------------------------------------------------------------ */

const ALLOWED_TAGS = [
  ...sanitize.defaults.allowedTags,
  'img',
  'picture',
  'source',
  'video',
  'audio',
  'details',
  'summary',
  'del',
  'ins',
];

const OPTIONS: sanitize.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    '*': ['class', 'id', 'style', 'title', 'lang', 'dir'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading'],
    source: ['src', 'srcset', 'sizes', 'type', 'media'],
    video: ['src', 'poster', 'controls', 'width', 'height', 'muted', 'loop', 'playsinline'],
    audio: ['src', 'controls', 'loop'],
    td: ['colspan', 'rowspan', 'align'],
    th: ['colspan', 'rowspan', 'align', 'scope'],
    ol: ['start', 'type', 'reversed'],
    time: ['datetime'],
    details: ['open'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
    source: ['http', 'https', 'data'],
  },
  allowedSchemesAppliedToAttributes: ['href', 'src', 'cite', 'poster'],
  allowProtocolRelative: false,
  transformTags: {
    // Links that open a new tab must not hand the opener to the target page.
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') attribs.rel = 'noopener noreferrer';
      return { tagName, attribs };
    },
  },
};

/** Returns `html` with anything outside the article allowlist removed. */
export function sanitizeHtml(html: string | null | undefined): string {
  return sanitize(html ?? '', OPTIONS);
}
