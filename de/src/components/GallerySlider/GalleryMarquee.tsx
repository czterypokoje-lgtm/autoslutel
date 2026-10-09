import React from 'react';
import Image from 'next/image';
import styles from './GalleryMarquee.module.css';

export interface MarqueeImage {
  src: string;
  caption: string;
  width: number;
  height: number;
}

/**
 * The gallery as two rows of photos sliding past each other, edge to edge, on
 * a solid brand band.
 *
 * The old slider was a scroll-snap strip: on a phone it showed one photo at a
 * time and only moved if you dragged it, so a visitor who scrolled straight
 * past saw a single job rather than sixty. This moves on its own, bleeds off
 * both edges, and reads as "we do this every day" in the second and a half
 * somebody actually looks at it.
 *
 * Two rows travelling in opposite directions rather than one: opposite motion
 * is what stops the eye, and it halves how long a row must be before the loop
 * repeats.
 *
 * WHY TILES ARE NOT ALL THE SAME SIZE
 *
 * Every row is one fixed height and each photo takes the width its own aspect
 * ratio asks for — a portrait shot of a key stays narrow, a wide driveway shot
 * stays wide. Cropping them all to a single 4:3 box is what made the first
 * attempt read as a grid of identical cards sliding past rather than a wall of
 * real jobs. It costs nothing: the dimensions are already in the config,
 * measured off the actual files.
 *
 * WHY THE LIST IS CAPPED
 *
 * There are sixty gallery photos. Rendering all of them, in two rows, each
 * doubled for the seamless loop, is well over two hundred <img> elements on a
 * section most visitors never reach. The cap keeps it to PER_ROW * 4 and the
 * rest stay on /galerij, which is the page that exists to show all of them.
 */

/** Tiles per row before the loop repeats. */
const PER_ROW = 10;

export default function GalleryMarquee({
  images,
  title,
  subtitle,
}: {
  images: MarqueeImage[];
  title?: string;
  subtitle?: string;
}) {
  if (!images || images.length === 0) return null;

  const pool = images.slice(0, PER_ROW * 2);
  const rowA = pool.filter((_, i) => i % 2 === 0);
  const rowB = pool.filter((_, i) => i % 2 === 1);

  /*
   * A row that does not overflow the screen cannot loop — it would slide away
   * and leave a gap. With very few photos we repeat the row until it is long
   * enough, so this behaves whether it is handed sixty images or three.
   */
  const fill = (row: MarqueeImage[]) => {
    if (row.length === 0) return row;
    const out = [...row];
    while (out.length < 6) out.push(...row);
    return out;
  };

  return (
    <div className={styles.band}>
      {(title || subtitle) && (
        <div className={styles.head}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}

      <div className={styles.viewport}>
        <Row images={fill(rowA)} />
        {rowB.length > 0 && <Row images={fill(rowB)} reverse />}
      </div>
    </div>
  );
}

function Row({ images, reverse = false }: { images: MarqueeImage[]; reverse?: boolean }) {
  return (
    <div className={styles.row}>
      {/*
       * The track holds the list twice and travels exactly -50%, so the moment
       * the first copy leaves the screen the second is pixel-identical to where
       * it started and the jump back is invisible.
       *
       * The clone is aria-hidden with an empty alt: it is the same photograph,
       * and repeating sixty alt strings would both lie to a screen reader about
       * how many photos exist and undo this page's alt-text cleanup.
       */}
      <ul className={`${styles.track} ${reverse ? styles.reverse : ''}`}>
        {images.map((img, i) => (
          <Tile key={`a-${i}`} img={img} />
        ))}
        {images.map((img, i) => (
          <Tile key={`b-${i}`} img={img} clone />
        ))}
      </ul>
    </div>
  );
}

function Tile({ img, clone = false }: { img: MarqueeImage; clone?: boolean }) {
  return (
    <li
      className={styles.tile}
      aria-hidden={clone || undefined}
      /* The one thing that has to be inline: the width is per-photograph. */
      style={{ aspectRatio: `${img.width} / ${img.height}` }}
    >
      <Image
        src={img.src}
        alt={clone ? '' : img.caption}
        width={img.width}
        height={img.height}
        sizes="(max-width: 640px) 260px, 420px"
        className={styles.image}
        loading="lazy"
        quality={70}
      />
    </li>
  );
}
