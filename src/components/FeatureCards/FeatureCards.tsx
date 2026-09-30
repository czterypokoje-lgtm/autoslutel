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
};

export default function FeatureCards({ title, subtitle, features }: FeatureCardsProps) {
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
              <h3 className={styles.title}>{feature.title}</h3>
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
        <VideoEmbed heading="Zo werkt het — in 40 seconden" caption={false} />
      </div>
    </section>
  );
}
