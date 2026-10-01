import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './ui.module.css';

/**
 * The CRM's building blocks.
 *
 * A page composes these instead of writing its own stylesheet. That is the
 * whole point: eleven pages had each grown their own CSS, and three of them
 * were built on a light palette that rendered as white cards floating in a
 * near-black app. A page with no <Card> of its own has to import this one.
 *
 * Everything here is a server component — no 'use client'. A client page can
 * still use them; a server page importing a client module could not.
 */

const join = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/* ── page ────────────────────────────────────────────────────────────── */

export function PageHead({
  title,
  sub,
  actions,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.head}>
      <div className={styles.headText}>
        <h1 className={styles.title}>{title}</h1>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

/** A heading inside a page, with room for an icon. */
export function SectionHead({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h2 className={styles.section}>
      {icon}
      {children}
    </h2>
  );
}

/* ── surfaces ────────────────────────────────────────────────────────── */

export function Card({
  children,
  padded = false,
  className,
}: {
  children: ReactNode;
  /** Cards holding rows are not padded; cards holding prose are. */
  padded?: boolean;
  className?: string;
}) {
  return <div className={join(styles.card, padded && styles.cardPad, className)}>{children}</div>;
}

export function CardHead({ children }: { children: ReactNode }) {
  return (
    <div className={styles.cardHead}>
      <h3 className={styles.cardTitle}>{children}</h3>
    </div>
  );
}

/* ── the list row, used by every list in the CRM ─────────────────────── */

export function Row({
  title,
  note,
  meta,
  actions,
  href,
}: {
  title: ReactNode;
  /** The identifier under the name: an article code, a slug, a plate. */
  note?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  href?: string;
}) {
  const heading = href ? (
    <a className={styles.rowTitle} href={href}>
      {title}
    </a>
  ) : (
    <span className={styles.rowTitle}>{title}</span>
  );

  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <div className={styles.rowTitleLine}>
          {heading}
          {note && <span className={styles.rowNote}>{note}</span>}
        </div>
        {meta && <div className={styles.rowMeta}>{meta}</div>}
      </div>
      {actions && <div className={styles.rowActions}>{actions}</div>}
    </div>
  );
}

/* ── the number that is the point of a screen ────────────────────────── */

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.stats}>{children}</div>;
}

export function Stat({
  label,
  value,
  foot,
  icon,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  foot?: ReactNode;
  icon?: ReactNode;
  /** Colours the icon only. The number itself stays ink — a figure that turns
      red is a figure people stop reading as a figure. */
  tone?: 'ok' | 'warn' | 'stop' | 'info';
}) {
  const toneClass =
    tone === 'ok' ? styles.badgeOk
    : tone === 'warn' ? styles.badgeWarn
    : tone === 'stop' ? styles.badgeStop
    : tone === 'info' ? styles.badgeInfo
    : undefined;

  return (
    <div className={styles.stat}>
      <div className={styles.statTop}>
        {label}
        {icon && <span className={join(styles.statIcon, toneClass)}>{icon}</span>}
      </div>
      <div className={styles.statValue}>{value}</div>
      {foot && <div className={styles.statFoot}>{foot}</div>}
    </div>
  );
}

/* ── small parts ─────────────────────────────────────────────────────── */

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'ok' | 'warn' | 'stop' | 'info';
}) {
  const toneClass =
    tone === 'ok' ? styles.badgeOk
    : tone === 'warn' ? styles.badgeWarn
    : tone === 'stop' ? styles.badgeStop
    : tone === 'info' ? styles.badgeInfo
    : undefined;
  return <span className={join(styles.badge, toneClass)}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}

export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'ok' | 'bad' | 'info';
}) {
  const toneClass =
    tone === 'ok' ? styles.noticeOk : tone === 'bad' ? styles.noticeBad : styles.noticeInfo;
  return <p className={join(styles.notice, toneClass)}>{children}</p>;
}

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ── tiles (dashboard, quick start, tools) ────────────────────────────── */

/** Small capitals above a group of tiles. */
export function Label({ children }: { children: ReactNode }) {
  return <p className={styles.label}>{children}</p>;
}

export function TileGrid({ children }: { children: ReactNode }) {
  return <div className={styles.tileGrid}>{children}</div>;
}

type TileTone = 'navy' | 'accent' | 'blue';
type IconTone = 'ok' | 'warn' | 'stop' | 'steel' | 'ai';

/**
 * One clickable tile: icon, title, one line of explanation.
 * `big` + `tone` gives the coloured Quick start tile.
 */
export function Tile({
  href,
  icon,
  title,
  sub,
  big = false,
  tone,
  iconTone,
  ai = false,
}: {
  href: string;
  icon: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  big?: boolean;
  tone?: TileTone;
  iconTone?: IconTone;
  ai?: boolean;
}) {
  const toneClass =
    tone === 'navy' ? styles.toneNavy : tone === 'accent' ? styles.toneAccent : tone === 'blue' ? styles.toneBlue : null;
  const iconClass =
    iconTone === 'ok'
      ? styles.iconOk
      : iconTone === 'warn'
        ? styles.iconWarn
        : iconTone === 'stop'
          ? styles.iconStop
          : iconTone === 'steel'
            ? styles.iconSteel
            : iconTone === 'ai'
              ? styles.iconAi
              : null;
  return (
    <Link href={href} className={join(styles.tile, big && styles.tileBig, toneClass, ai && styles.tileAi)}>
      <span className={join(styles.tileIcon, iconClass)} aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className={styles.tileTitle}>{title}</span>
        {sub && <span className={styles.tileSub}>{sub}</span>}
      </span>
    </Link>
  );
}

/** "Hoe werkt het?" — numbered steps in a fold, closed by default. */
export function HelpSteps({ steps, open = false }: { steps: ReactNode[]; open?: boolean }) {
  return (
    <details className={styles.help} open={open}>
      <summary>Hoe werkt het?</summary>
      <ol className={styles.helpSteps}>
        {steps.map((step, i) => (
          <li key={i}>
            <span className={styles.helpNum}>{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

/** The class names, for the places that need a bare element rather than a component. */
export const ui = styles;
