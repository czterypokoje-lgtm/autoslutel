import { PreviewText } from '../PreviewLanguage';
import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './ui.module.css';
import { STUDIO_UI } from '@/config/install';
import { Card as ShadCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as ShadBadge } from '@/components/ui/badge';
import { Table as ShadTable, TableBody, TableHeader, TableRow } from '@/components/ui/table';

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
 *
 * Two renderings, same props: with STUDIO_UI the blocks are the shadcn
 * primitives the rebuilt screens use, so every page that still composes this
 * kit looks like the rest of the Studio shell; without it they are the
 * original CSS-module markup, byte for byte, so the old look is untouched.
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
  const heading = typeof title === 'string' ? <PreviewText>{title}</PreviewText> : title;
  const subline = sub && (typeof sub === 'string' ? <PreviewText>{sub}</PreviewText> : sub);
  if (STUDIO_UI) {
    return (
      <div className="kfc-neutral flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight">{heading}</h1>
          {subline && <p className="text-muted-foreground text-sm">{subline}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    );
  }
  return (
    <div className={styles.head}>
      <div className={styles.headText}>
        <h1 className={styles.title}>{heading}</h1>
        {sub && <p className={styles.sub}>{subline}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

/** A heading inside a page, with room for an icon. */
export function SectionHead({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  if (STUDIO_UI) {
    return (
      <h2 className="kfc-neutral flex items-center gap-2 text-lg font-semibold tracking-tight">
        {icon}
        {children}
      </h2>
    );
  }
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
  if (STUDIO_UI) {
    return <ShadCard className={join('kfc-neutral gap-0 py-0', padded && 'px-5 py-5', className)}>{children}</ShadCard>;
  }
  return <div className={join(styles.card, padded && styles.cardPad, className)}>{children}</div>;
}

export function CardHead({ children }: { children: ReactNode }) {
  if (STUDIO_UI) {
    return (
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="text-base">{children}</CardTitle>
      </CardHeader>
    );
  }
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
  if (STUDIO_UI) {
    const heading = href ? (
      <a className="font-medium underline-offset-4 hover:underline" href={href}>{title}</a>
    ) : (
      <span className="font-medium">{title}</span>
    );
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 last:border-b-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            {heading}
            {note && <span className="text-muted-foreground text-xs">{note}</span>}
          </div>
          {meta && <div className="text-muted-foreground mt-0.5 text-sm">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    );
  }
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
  if (STUDIO_UI) return <div data-stat-grid className="kfc-neutral grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3 xl:grid-cols-4">{children}</div>;
  return <div className={styles.stats}>{children}</div>;
}

const TONE_TEXT = { ok: 'text-emerald-600', warn: 'text-amber-600', stop: 'text-red-600', info: 'text-sky-600' } as const;

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
  const footNode = foot && (typeof foot === 'string' ? <PreviewText>{foot}</PreviewText> : foot);
  if (STUDIO_UI) {
    return (
      <ShadCard data-stat-card className="min-w-0 gap-1 border-t-2 border-t-slate-300 py-4">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
          <CardDescription>{label}</CardDescription>
          {icon && <span className={join('[&>svg]:size-4', tone && TONE_TEXT[tone])} aria-hidden="true">{icon}</span>}
        </CardHeader>
        <CardContent className="px-4">
          <div data-stat-value className="break-words text-xl font-semibold tabular-nums tracking-tight lg:text-2xl">{value}</div>
          {footNode && <div className="text-muted-foreground mt-1 text-xs">{footNode}</div>}
        </CardContent>
      </ShadCard>
    );
  }
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
      {foot && <div className={styles.statFoot}>{footNode}</div>}
    </div>
  );
}

/* ── small parts ─────────────────────────────────────────────────────── */

const TONE_BADGE = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  stop: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
} as const;

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'ok' | 'warn' | 'stop' | 'info';
}) {
  if (STUDIO_UI) {
    return <ShadBadge variant="outline" className={join('kfc-neutral', tone && TONE_BADGE[tone])}>{children}</ShadBadge>;
  }
  const toneClass =
    tone === 'ok' ? styles.badgeOk
    : tone === 'warn' ? styles.badgeWarn
    : tone === 'stop' ? styles.badgeStop
    : tone === 'info' ? styles.badgeInfo
    : undefined;
  return <span className={join(styles.badge, toneClass)}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  if (STUDIO_UI) {
    return <div className="kfc-neutral text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">{children}</div>;
  }
  return <div className={styles.empty}>{children}</div>;
}

const TONE_NOTICE = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  bad: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
} as const;

export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'ok' | 'bad' | 'info';
}) {
  if (STUDIO_UI) {
    return <p className={join('kfc-neutral rounded-lg border px-4 py-3 text-sm', TONE_NOTICE[tone])}>{children}</p>;
  }
  const toneClass =
    tone === 'ok' ? styles.noticeOk : tone === 'bad' ? styles.noticeBad : styles.noticeInfo;
  return <p className={join(styles.notice, toneClass)}>{children}</p>;
}

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  if (STUDIO_UI) {
    return (
      <div className="kfc-neutral [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold">
        <ShadTable>
          <TableHeader>
            <TableRow>{head}</TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </ShadTable>
      </div>
    );
  }
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
  if (STUDIO_UI) return <p className="kfc-neutral text-muted-foreground text-xs font-semibold tracking-wider uppercase">{children}</p>;
  return <p className={styles.label}>{children}</p>;
}

export function TileGrid({ children }: { children: ReactNode }) {
  if (STUDIO_UI) return <div className="kfc-neutral grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
  return <div className={styles.tileGrid}>{children}</div>;
}

type TileTone = 'navy' | 'accent' | 'blue';
type IconTone = 'ok' | 'warn' | 'stop' | 'steel' | 'ai';

const TILE_TONE = {
  navy: 'bg-slate-900 text-white hover:bg-slate-800 [&_.tile-sub]:text-slate-300 [&_.tile-icon]:bg-white/10',
  accent: 'bg-primary text-primary-foreground hover:bg-primary/90 [&_.tile-sub]:text-primary-foreground/80 [&_.tile-icon]:bg-white/15',
  blue: 'bg-blue-600 text-white hover:bg-blue-500 [&_.tile-sub]:text-blue-100 [&_.tile-icon]:bg-white/15',
} as const;
const TILE_ICON = {
  ok: 'bg-emerald-50 text-emerald-600',
  warn: 'bg-amber-50 text-amber-600',
  stop: 'bg-red-50 text-red-600',
  steel: 'bg-slate-100 text-slate-600',
  ai: 'bg-violet-50 text-violet-600',
} as const;

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
  if (STUDIO_UI) {
    return (
      <Link
        href={href}
        className={join(
          'kfc-neutral bg-card text-card-foreground flex items-center gap-3 rounded-xl border p-4 shadow-xs transition-colors hover:bg-accent',
          big && 'py-5',
          tone && TILE_TONE[tone],
          ai && 'border-violet-200',
        )}
      >
        <span className={join('tile-icon flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted [&>svg]:size-5', iconTone && TILE_ICON[iconTone])} aria-hidden="true">
          {icon}
        </span>
        <span className="min-w-0">
          <span className={join('block font-semibold', big && 'text-lg')}>{title}</span>
          {sub && <span className="tile-sub text-muted-foreground block text-sm">{sub}</span>}
        </span>
      </Link>
    );
  }
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
  if (STUDIO_UI) {
    return (
      <details className="kfc-neutral text-muted-foreground rounded-lg border px-4 py-3 text-sm" open={open}>
        <summary className="text-foreground cursor-pointer font-medium">Hoe werkt het?</summary>
        <ol className="mt-3 flex flex-col gap-2">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="bg-muted text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </details>
    );
  }
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
