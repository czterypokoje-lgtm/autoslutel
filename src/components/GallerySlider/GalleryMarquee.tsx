import React from 'react';
import Image from 'next/image';
import styles from './GalleryMarquee.module.css';
import type { GalleryImage } from './GallerySlider';

/**
 * The gallery as two rows of photos sliding past each other, edge to edge.
 *
 * The old slider was a scroll-snap strip: on a phone it showed one photo at a
 * time and only moved if you dragged it, so a visitor who scrolled straight
 * past saw a single job rather than sixty. This moves on its own, bleeds off
 * both edges, and reads as "we do this every day" in the second and a half
 * somebody actually looks at it.
 *
 * Two rows travelling in opposite directions rather than one: opposite motion
 * is what stops the eye and makes the section feel alive, and it halves how
 * long a row needs to be before the loop repeats.
 *
 * WHY THE LIST IS CAPPED
 *
 * There are sixty-one gallery photos. Rendering all of them, in two rows, each
 * doubled for the seamless loop, is well over two hundred <img> elements on the
 * home page — on a section most visitors never reach. The cap keeps it to
 * `perRow * 4` and the rest stay on /galerij, which is the page that exists to
 * show all of them.
 */

/** Tiles per row before the loop repeats. 10 ≈ 26s of travel at the speed below. */
const PER_ROW = 10;

export default function GalleryMarquee({
  images,
  title,
}: {
  images: GalleryImage[];
  title?: string;
}) {
  if (!images || images.length === 0) return null;

  const pool = images.slice(0, PER_ROW * 2);
  const rowA = pool.filter((_, i) => i % 2 === 0);
  const rowB = pool.filter((_, i) => i % 2 === 1);

  /*
   * A row that does not overflow cannot loop — it would slide away and leave a
   * gap. With very few photos we repeat the row itself until it is long enough,
   * so the component behaves whether it is handed sixty images or three.
   */
  const fill = (row: GalleryImage[]) => {
    if (row.length === 0) return row;
    const out = [...row];
    while (out.length < 6) out.push(...row);
    return out;
  };

  return (
    <div className={styles.wrap}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.viewport}>
        <Row images={fill(rowA)} />
        {rowB.length > 0 && <Row images={fill(rowB)} reverse />}
      </div>
    </div>
  );
}

function Row({ images, reverse = false }: { images: GalleryImage[]; reverse?: boolean }) {
  return (
    <div className={`${styles.row} ${reverse ? styles.reverse : ''}`}>
      {/*
       * The track holds the list twice and travels exactly -50%, so the moment
       * the first copy leaves the screen the second is pixel-identical to where
       * it started and the jump back is invisible.
       *
       * The clone is aria-hidden with empty alt: it is the same photograph, and
       * repeating sixty alt strings would both lie to a screen reader about how
       * many photos exist and undo the alt-text cleanup this page just had.
       */}
      <ul className={styles.track}>
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

function Tile({ img, clone = false }: { img: GalleryImage; clone?: boolean }) {
  return (
    <li className={styles.tile} aria-hidden={clone || undefined}>
      <Image
        src={img.src}
        alt={clone ? '' : img.caption}
        fill
        sizes="(max-width: 640px) 200px, 300px"
        className={styles.image}
        loading="lazy"
        quality={70}
      />
    </li>
  );
}
