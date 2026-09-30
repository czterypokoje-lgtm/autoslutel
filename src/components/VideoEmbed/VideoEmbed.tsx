import { SITE_CONFIG } from '@/config/site.config';
import styles from './VideoEmbed.module.css';

/*
 * The explainer video, and the one place its facts live.
 *
 * uploadDate and duration are read off YouTube rather than guessed; they are
 * what a VideoObject needs to be eligible for a video result. thumbnailUrl
 * points at YouTube's own still so it cannot drift from the video.
 */
export const VIDEO = {
  id: 'LTlKCZnjzH4',
  name: 'Autosleutel Kwijt? Zo Regel Je Snel een Nieuwe Autosleutel',
  uploadDate: '2026-09-29',
  duration: 'PT40S',
  description:
    'Uw autosleutel kwijt? In veertig seconden ziet u hoe wij op locatie een nieuwe sleutel maken en programmeren, wat het kost en hoe snel wij er zijn.',
} as const;

/*
 * VideoObject belongs on ONE page, and that page is /autosleutel-kwijt.
 *
 * Google indexes a video from its "watch page" — the page whose primary
 * purpose is that video — and explicitly lists a blog post or product page
 * where the video merely complements the text as NOT a watch page. Declaring
 * VideoObject on all 96 pages that embed this would not produce 96 video
 * results; it would produce one, plus 95 "Video isn't on a watch page" rows
 * in the video indexing report, burying any real problem there.
 *
 * The embed still earns its keep on those 95: Google states a non-watch page
 * carrying the video stays eligible for a text result with a video badge, and
 * that multiple embeds of one video do not create a duplicate-content problem.
 * So the video travels everywhere and the markup stays home.
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

export default function VideoEmbed({
  heading,
  headingClassName,
  caption = true,
}: {
  heading?: string;
  headingClassName?: string;
  /** The line under the player. Pass false where a call to action already sits next to it. */
  caption?: boolean;
}) {
  return (
    <>
      {heading ? (
        <h2 className={`${styles.heading} ${headingClassName ?? ''}`}>{heading}</h2>
      ) : null}

      <div className={styles.frame}>
        {/*
          * youtube-nocookie sets nothing until the viewer presses play, which
          * keeps the embed out of the consent banner's way.
          *
          * loading="lazy" matters more than it looks: the YouTube player is
          * roughly 700KB of JavaScript, and every one of these sections sits
          * below the fold. Someone who calls from the hero never pays for it.
          */}
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${VIDEO.id}?rel=0&modestbranding=1`}
          title={VIDEO.name}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      {caption ? (
        <p className={styles.caption}>
          Onze eigen monteur, een echte auto, geen animatie. Bel{' '}
          <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a> als u nu naast uw auto
          staat.
        </p>
      ) : null}
    </>
  );
}
