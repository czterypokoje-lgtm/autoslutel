'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SITE_CONFIG } from '@/config/site.config';
import { VIDEO } from './video';
import styles from './VideoEmbed.module.css';

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
  const [playing, setPlaying] = useState(false);

  /*
   * Ohne Video kein Abschnitt.
   *
   * VIDEO ist null, solange es kein deutsch gesprochenes Video gibt — siehe
   * ./video.ts. Die Seiten, die diese Komponente einbinden (die Preisseite und
   * FeatureCards), zeigen den Block dann gar nicht, statt eine Überschrift über
   * einem leeren Rahmen oder einem niederländischen Player zu rendern.
   */
  if (!VIDEO) return null;

  return (
    <>
      {heading ? (
        <h2 className={`${styles.heading} ${headingClassName ?? ''}`}>{heading}</h2>
      ) : null}

      <div className={styles.frame}>
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${VIDEO.id}?rel=0&modestbranding=1&autoplay=1`}
            title={VIDEO.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          /*
           * A poster and a play button, not the player.
           *
           * The iframe used to render on load behind loading="lazy", which
           * produced the two things it was least supposed to: a black
           * rectangle while roughly 700KB of YouTube JavaScript arrived, and
           * a late arrival at that, because lazy defers until the frame is
           * near the viewport — and this block now sits one screen below the
           * hero, which is exactly where "near" starts to fight you.
           *
           * The poster is one optimised image from our own origin, marked
           * priority so it is fetched with the page rather than after it. The
           * player is built only when somebody presses play, and then with
           * autoplay so the press is the only one needed.
           *
           * youtube-nocookie still sets nothing until that press, which keeps
           * the embed out of the consent banner's way.
           */
          <button
            type="button"
            className={styles.poster}
            onClick={() => setPlaying(true)}
            aria-label={`Video abspielen: ${VIDEO.name}`}
          >
            <Image
              src={VIDEO.poster}
              alt=""
              fill
              priority
              sizes="(max-width: 960px) 100vw, 960px"
              style={{ objectFit: 'cover' }}
            />
            <span className={styles.play} aria-hidden="true">
              <svg viewBox="0 0 68 48" width="68" height="48" focusable="false">
                <path
                  className={styles.playBg}
                  d="M66.52 7.74a8.57 8.57 0 0 0-6-6C55.2.24 34 .24 34 .24s-21.2 0-26.52 1.5a8.57 8.57 0 0 0-6 6A89.3 89.3 0 0 0 0 24a89.3 89.3 0 0 0 1.48 16.26 8.57 8.57 0 0 0 6 6C12.8 47.76 34 47.76 34 47.76s21.2 0 26.52-1.5a8.57 8.57 0 0 0 6-6A89.3 89.3 0 0 0 68 24a89.3 89.3 0 0 0-1.48-16.26z"
                />
                <path d="M45 24 27 14v20" fill="#fff" />
              </svg>
            </span>
          </button>
        )}
      </div>

      {caption ? (
        <p className={styles.caption}>
          Ein echter Auftrag, ein echtes Fahrzeug, keine Animation. Rufen Sie{' '}
          <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a> an, wenn Sie gerade neben
          Ihrem Auto stehen.
        </p>
      ) : null}
    </>
  );
}
