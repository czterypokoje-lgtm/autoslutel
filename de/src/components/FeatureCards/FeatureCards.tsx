"use client";

import React, { useRef, useState, useEffect } from 'react';
import styles from './FeatureCards.module.css';
import Link from 'next/link';
import VideoEmbed from '@/components/VideoEmbed/VideoEmbed';

export type FeatureCardProps = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
};

type FeatureCardsProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  features: FeatureCardProps[];
  /**
   * Heading level of each card's title. Defaults to h3, which is right under
   * a section title. Pass 'h2' where the cards follow the H1 with no H2 above
   * them, so the outline does not jump from H1 to H3.
   */
  cardTitleAs?: 'h2' | 'h3';
  /** Heading above the embedded video. Pages pass one with their own keyword so it is not the same H2 on every page. */
  videoHeading?: string;
};

export default function FeatureCards({ title, subtitle, features, cardTitleAs: CardTitle = 'h3', videoHeading = 'Zo werkt het — in 40 seconden' }: FeatureCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveIndex(index);
  };

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth'
    });
  };

  return (
    <section className={styles.sectionWrapper}>
      {(title || subtitle) && (
        <div className={styles.headerContainer}>
          {title && <h2 className={styles.headerTitle}>{title}</h2>}
          {subtitle && <h3 className={styles.headerSubtitle}>{subtitle}</h3>}
        </div>
      )}

      <div className={styles.tabsContainer}>

        <div className={styles.navArrows}>
          <button className={styles.arrowBtn} onClick={() => scrollTo(Math.max(0, activeIndex - 1))}>{'<'}</button>
          <button className={styles.arrowBtn} onClick={() => scrollTo(Math.min(features.length - 1, activeIndex + 1))}>{'>'}</button>
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.scrollContainer} ref={scrollRef} onScroll={handleScroll}>
          {features.map((feature, i) => (
            <div key={feature.id} className={styles.card}>
              <div className={styles.iconWrapper}>
                {feature.icon}
              </div>
              <CardTitle className={styles.title}>{feature.title}</CardTitle>
              <p className={styles.description}>{feature.description}</p>
              {feature.linkText && feature.linkUrl && (
                <div className={styles.linkWrapper}>
                  <Link href={feature.linkUrl} className={styles.link}>
                    {feature.linkText}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/*
        * The video, directly under the cards -- one screen below the hero,
        * where someone is still deciding whether to call rather than three
        * scrolls down where only the already-convinced arrive.
        *
        * Deliberately without VideoObject markup. Google indexes a video from
        * its watch page -- the page whose primary purpose is the video -- and
        * names a page where the video complements the text as explicitly not
        * one. Marking this up on every page that renders these cards would
        * win the same single video result and fill the video indexing report
        * with "isn't on a watch page" rows. A non-watch page keeps its text
        * result with a video badge either way, and Google states repeat
        * embeds of one video are not a duplicate-content problem. So the
        * video travels and the markup stays on /autosleutel-kwijt.
        */}
      <div className={styles.videoWrapper}>
        <VideoEmbed heading={videoHeading} caption={false} />
      </div>
    </section>
  );
}
