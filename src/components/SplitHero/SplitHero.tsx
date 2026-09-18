import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';
import styles from './SplitHero.module.css';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * The light three-area hero the home page uses, as one component.
 *
 * Home and the service landing pages had two different heroes: home a white
 * split with the kenteken wizard beside a photo, the service pages a dark
 * navy band with a single row of fields. Somebody arriving on
 * /diensten/autosleutel-bijmaken from an ad met a different site from the one
 * they would have met on the home page, and every future change to the hero
 * had to be made twice or drift.
 *
 * The layout is deliberately three areas rather than two columns. On a phone
 * they stack in reading order — heading, photo, form — so the photo earns its
 * place before the form asks for anything. From 992px up it becomes a grid
 * where the heading sits above the form in the left column and the photo
 * spans both rows on the right, which is what keeps the form beside the image
 * instead of far below it.
 */
export default function SplitHero({
  crumbs,
  titleTop,
  titleAccent,
  lead,
  image,
  children,
}: {
  /** Breadcrumb trail. Omitted on the home page, which is the root. */
  crumbs?: Crumb[];
  titleTop: React.ReactNode;
  /** The second line, in orange. */
  titleAccent?: React.ReactNode;
  lead: React.ReactNode;
  image: { src: string; alt: string };
  /** The wizard or form. Anything, so a page can supply its own. */
  children: React.ReactNode;
}) {
  return (
    <section className={styles.heroSplit}>
      <div className={styles.heroSplitInner}>
        <div className={styles.heroTopContent}>
          {crumbs && crumbs.length > 0 && (
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb.label}>
                  {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                  {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
                </React.Fragment>
              ))}
            </nav>
          )}

          <div className={styles.badgeWrap}>
            <HeroTrustBadge />
          </div>

          <h1>
            {titleTop}
            {titleAccent && (
              <>
                <br />
                <span className={styles.accent}>{titleAccent}</span>
              </>
            )}
          </h1>

          <p className={styles.heroSplitLead}>{lead}</p>
        </div>

        <div className={styles.heroImageContent}>
          <Image
            src={image.src}
            alt={image.alt}
            width={800}
            height={450}
            className={styles.heroImage}
            priority
            quality={80}
            sizes="(max-width: 992px) 100vw, 50vw"
          />
        </div>

        <div className={styles.heroBottomContent}>{children}</div>
      </div>
    </section>
  );
}
