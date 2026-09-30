import { SITE_CONFIG } from '@/config/site.config';

/*
 * The video's facts, and its schema, in a module with no client boundary.
 *
 * VideoEmbed.tsx is a client component because the poster has to become a
 * player when someone presses it. A value exported from a "use client" module
 * reaches a server component as a client reference rather than the object, so
 * the page that renders this schema got `undefined` and the build failed with
 * "dangerouslySetInnerHTML must be in the form {__html: ...}". The data lives
 * here instead, where both sides can read it.
 *
 * uploadDate and duration are read off YouTube rather than guessed; they are
 * what a VideoObject needs to be eligible for a video result.
 */
export const VIDEO = {
  id: 'LTlKCZnjzH4',
  name: 'Autosleutel Kwijt? Zo Regel Je Snel een Nieuwe Autosleutel',
  uploadDate: '2026-09-29',
  duration: 'PT40S',
  description:
    'Uw autosleutel kwijt? In veertig seconden ziet u hoe wij op locatie een nieuwe sleutel maken en programmeren, wat het kost en hoe snel wij er zijn.',
  /* YouTube's own still, re-encoded and served from our origin. */
  poster: '/images/video/autosleutel-kwijt-uitleg.jpg',
} as const;

/*
 * VideoObject belongs on ONE page, and that page is /autosleutel-kwijt.
 *
 * Google indexes a video from its "watch page" — the page whose primary
 * purpose is that video — and explicitly lists a page where the video merely
 * complements the text as NOT a watch page. Declaring it on every page that
 * embeds this would win the same single video result and fill the video
 * indexing report with "isn't on a watch page" rows.
 *
 * The embed still earns its keep elsewhere: a non-watch page carrying the
 * video stays eligible for a text result with a video badge, and repeat
 * embeds of one video are not a duplicate-content problem. So the video
 * travels everywhere and the markup stays home.
 */
export const videoSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: VIDEO.name,
  description: VIDEO.description,
  thumbnailUrl: [`https://i.ytimg.com/vi/${VIDEO.id}/maxresdefault.jpg`],
  uploadDate: VIDEO.uploadDate,
  duration: VIDEO.duration,
  embedUrl: `https://www.youtube.com/embed/${VIDEO.id}`,
  contentUrl: `https://www.youtube.com/watch?v=${VIDEO.id}`,
  publisher: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
};
