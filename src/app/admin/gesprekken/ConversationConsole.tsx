'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone, MessageCircle, HelpCircle, MapPin, Car, ArrowLeft,
  Wrench, Inbox, ChevronDown, UserPlus, CalendarPlus, Sparkles,
} from 'lucide-react';
import { waLink } from '@/lib/whatsapp';
import styles from './gesprekken.module.css';

export interface Conversation {
  id: string;
  channel: string;
  phone: string | null;
  phoneKey: string | null;
  outcome: string | null;
  durationSecs: number | null;
  summary: string | null;
  turns: { role: 'agent' | 'user'; message: string }[];
  createdAt: string;
  lead: {
    id: string;
    name: string | null;
    car: string | null;
    service: string | null;
    postcode: string | null;
    status: string | null;
    createdAt: string;
  } | null;
  job: {
    id: string;
    date: string | null;
    slot: string | null;
    status: string | null;
    service: string | null;
    car: string | null;
    city: string | null;
  } | null;
}

const CHANNEL = {
  phone: { label: 'Telefoon', Icon: Phone },
  whatsapp: { label: 'WhatsApp', Icon: MessageCircle },
  sms: { label: 'SMS', Icon: MessageCircle },
  unknown: { label: 'Onbekend', Icon: HelpCircle },
} as const;

const channelOf = (c: string) => CHANNEL[c as keyof typeof CHANNEL] ?? CHANNEL.unknown;

const duration = (s: number | null) =>
  s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : null;

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', ...opts });

const time = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit' });
const dayStamp = (iso: string) => fmt(iso, { day: 'numeric', month: 'short' });

/** Initials for the avatar: a name if we have one, otherwise the last digits. */
function initials(c: Conversation): string {
  const name = c.lead?.name?.trim();
  if (name) {
    return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  }
  const digits = (c.phone ?? '').replace(/\D/g, '');
  return digits ? digits.slice(-2) : '··';
}

function dayGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000
  );
  if (days <= 0) return 'Vandaag';
  if (days === 1) return 'Gisteren';
  if (days < 7) return 'Deze week';
  return 'Eerder';
}

const ORDER = ['Vandaag', 'Gisteren', 'Deze week', 'Eerder'];

const OUTCOME_LABEL: Record<string, string> = {
  success: 'Gelukt',
  failure: 'Mislukt',
  unknown: 'Onbekend',
};

const toneOf = (outcome: string | null) =>
  outcome === 'success' ? styles.ok : outcome === 'failure' ? styles.bad : styles.neutral;

/** One event on the journey rail. */
interface JourneyEvent {
  at: string;
  kind: 'lead' | 'conversation' | 'job';
  title: string;
  detail: string | null;
  chip: string | null;
  chipTone: string;
  note: string | null;
  conversationId?: string;
}

/**
 * The conversations console.
 *
 * Three panes: which conversation, the conversation itself, and who this
 * person is across everything else we hold. The third is what makes it a CRM
 * screen rather than a log viewer — a transcript says what was said, but the
 * thing that decides whether to call back is that this number filed a lead at
 * 14:02 and already has a job on Thursday.
 *
 * The journey rail is built from records, not from a stored event log: the
 * lead's created_at, every conversation on the same E.164 number, and the
 * job's scheduled date, merged and sorted. That means it can never drift out
 * of step with the rows it describes.
 *
 * Deliberately absent, though the references show them: a lead score, a
 * sentiment reading, and AI-generated suggestions. Nothing in this system
 * computes any of the three, and a number on a card is read as measurement no
 * matter what label sits above it. What is shown instead — outcome, duration,
 * channel, summary — is what ElevenLabs actually reports.
 */
export default function ConversationConsole({ conversations }: { conversations: Conversation[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const groups = ORDER.map((name) => ({
    name,
    items: conversations.filter((c) => dayGroup(c.createdAt) === name),
  })).filter((g) => g.items.length > 0);

  /* Every conversation this number has had, newest first. */
  const sameCaller = selected
    ? conversations.filter((c) =>
        selected.phoneKey ? c.phoneKey === selected.phoneKey : c.id === selected.id
      )
    : [];

  const journey: JourneyEvent[] = selected
    ? [
        ...(selected.lead
          ? [{
              at: selected.lead.createdAt,
              kind: 'lead' as const,
              title: 'Lead aangemaakt',
              detail: selected.lead.service ?? null,
              chip: selected.lead.status,
              chipTone: styles.neutral,
              note: null,
            }]
          : []),
        ...sameCaller.map((c) => ({
          at: c.createdAt,
          kind: 'conversation' as const,
          title: channelOf(c.channel).label,
          detail: duration(c.durationSecs),
          chip: c.outcome ? OUTCOME_LABEL[c.outcome] ?? c.outcome : null,
          chipTone: toneOf(c.outcome),
          note: c.summary,
          conversationId: c.id,
        })),
        ...(selected.job?.date
          ? [{
              at: `${selected.job.date}T${selected.job.slot ?? '00:00'}:00`,
              kind: 'job' as const,
              title: 'Klus ingepland',
              detail: [selected.job.slot, selected.job.city].filter(Boolean).join(' · ') || null,
              chip: selected.job.status,
              chipTone: styles.neutral,
              note: null,
            }]
          : []),
      ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    : [];

  const title = selected ? selected.lead?.name || selected.phone || 'Onbekende beller' : '';

  return (
    <div className={`${styles.console} ${selected ? styles.hasSelection : ''}`}>
      {/* ── pane 1 ─────────────────────────────────────────────────────── */}
      <aside className={styles.listPane}>
        {groups.map((group) => {
          const isShut = collapsed[group.name];
          return (
            <section key={group.name} className={styles.group}>
              <button
                type="button"
                className={styles.groupHead}
                onClick={() => setCollapsed((c) => ({ ...c, [group.name]: !c[group.name] }))}
                aria-expanded={!isShut}
              >
                <span className={styles.groupName}>
                  {group.name}
                  <ChevronDown size={13} className={isShut ? styles.chevShut : styles.chev} />
                </span>
                <span className={styles.groupCount}>{group.items.length}</span>
              </button>

              {!isShut && group.items.map((c) => {
                const { label, Icon } = channelOf(c.channel);
                const active = c.id === selected?.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`${styles.listItem} ${active ? styles.listItemActive : ''}`}
                  >
                    <span className={`${styles.avatar} ${styles[`ch_${c.channel}`] ?? ''}`}>
                      {initials(c)}
                      <span className={styles.avatarBadge}><Icon size={9} /></span>
                    </span>

                    <span className={styles.listBody}>
                      <span className={styles.listTop}>
                        <span className={styles.listName}>{c.lead?.name || c.phone || label}</span>
                        <span className={styles.listTime}>{time(c.createdAt)}</span>
                      </span>

                      <span className={styles.listSnippet}>
                        {c.summary ?? `${c.turns.length} berichten`}
                      </span>

                      <span className={styles.listTags}>
                        <span className={`${styles.pipRail} ${toneOf(c.outcome)}`}>
                          <span className={styles.pip} />
                        </span>
                        <span className={styles.listMeta}>{label}</span>
                        {duration(c.durationSecs) && <span className={styles.listMeta}>{duration(c.durationSecs)}</span>}
                        {c.lead && <span className={styles.chipMini}>lead</span>}
                        {c.job && <span className={styles.chipMini}>klus</span>}
                      </span>
                    </span>
                  </button>
                );
              })}
            </section>
          );
        })}
      </aside>

      {selected && (
        <>
          {/* ── pane 2 ───────────────────────────────────────────────────── */}
          <main className={styles.threadPane}>
            <header className={styles.hero}>
              <button
                type="button"
                className={styles.back}
                onClick={() => setSelectedId(null)}
                aria-label="Terug naar de lijst"
              >
                <ArrowLeft size={16} />
              </button>

              <span className={`${styles.heroAvatar} ${styles[`ch_${selected.channel}`] ?? ''}`}>
                {initials(selected)}
              </span>

              <div className={styles.heroWho}>
                <h2 className={styles.heroName}>{title}</h2>
                <div className={styles.heroFacts}>
                  {selected.phone && <span><Phone size={12} /> {selected.phone}</span>}
                  {selected.lead?.postcode && <span><MapPin size={12} /> {selected.lead.postcode}</span>}
                  {selected.lead?.car && <span><Car size={12} /> {selected.lead.car}</span>}
                </div>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Kanaal</span>
                  <span className={styles.statValue}>{channelOf(selected.channel).label}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Duur</span>
                  <span className={styles.statValue}>{duration(selected.durationSecs) ?? '—'}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Uitkomst</span>
                  <span className={`${styles.statChip} ${toneOf(selected.outcome)}`}>
                    {selected.outcome ? OUTCOME_LABEL[selected.outcome] ?? selected.outcome : '—'}
                  </span>
                </div>
              </div>
            </header>

            {selected.summary && (
              <section className={styles.card}>
                <h3 className={styles.cardHead}>
                  <Sparkles size={14} /> Samenvatting van de assistent
                </h3>
                <p className={styles.summaryText}>{selected.summary}</p>
              </section>
            )}

            <section className={styles.card}>
              <h3 className={styles.cardHead}>
                <span className={styles.liveDot} />
                Transcript
                <span className={styles.cardCount}>{selected.turns.length} berichten</span>
              </h3>

              <div className={styles.turns}>
                {selected.turns.length === 0 ? (
                  <p className={styles.ctxEmpty}>Geen transcript bij dit gesprek.</p>
                ) : (
                  selected.turns.map((turn, i) => (
                    <div key={i} className={turn.role === 'agent' ? styles.rowAgent : styles.rowUser}>
                      <span className={turn.role === 'agent' ? styles.whoAgent : styles.whoUser}>
                        {turn.role === 'agent' ? 'Assistent' : 'Klant'}
                      </span>
                      <p className={styles.turnText}>{turn.message}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Actions that exist. No "Generate Quote" or "Escalate" button
                wired to nothing — every one of these goes somewhere real. */}
            <div className={styles.actionBar}>
              {selected.phone && (
                <a className={styles.pillPrimary} href={`tel:${selected.phone}`}>
                  <Phone size={14} /> Terugbellen
                </a>
              )}
              {selected.phone && waLink(selected.phone, '') && (
                <a className={styles.pill} href={waLink(selected.phone, '') as string} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {selected.lead ? (
                <Link className={styles.pill} href="/admin/leads"><Inbox size={14} /> Open lead</Link>
              ) : (
                <Link className={styles.pill} href="/admin/klanten"><UserPlus size={14} /> Klant aanmaken</Link>
              )}
              {selected.job ? (
                <Link className={styles.pill} href={`/admin/jobs/${selected.job.id}`}><Wrench size={14} /> Open klus</Link>
              ) : (
                <Link className={styles.pill} href="/admin/jobs/nieuw"><CalendarPlus size={14} /> Klus inplannen</Link>
              )}
            </div>
          </main>

          {/* ── pane 3 ───────────────────────────────────────────────────── */}
          <aside className={styles.contextPane}>
            <section className={styles.ctxCard}>
              <h3 className={styles.ctxHead}>Reis van deze klant</h3>
              <ol className={styles.journey}>
                {journey.map((event, i) => {
                  const Icon = event.kind === 'lead' ? Inbox : event.kind === 'job' ? Wrench
                    : channelOf(sameCaller.find((c) => c.id === event.conversationId)?.channel ?? 'unknown').Icon;
                  const isThis = event.conversationId === selected.id;
                  return (
                    <li key={i} className={`${styles.jEvent} ${isThis ? styles.jEventActive : ''}`}>
                      <span className={styles.jIcon}><Icon size={12} /></span>
                      <div className={styles.jBody}>
                        <div className={styles.jTop}>
                          <span className={styles.jTitle}>{event.title}</span>
                          {event.chip && <span className={`${styles.jChip} ${event.chipTone}`}>{event.chip}</span>}
                        </div>
                        <div className={styles.jWhen}>
                          {dayStamp(event.at)} · {time(event.at)}
                          {event.detail ? ` · ${event.detail}` : ''}
                        </div>
                        {event.note && isThis && <p className={styles.jNote}>{event.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {journey.length === 1 && (
                <p className={styles.ctxEmpty}>Eerste contact — verder nog niets bekend van dit nummer.</p>
              )}
            </section>

            <section className={styles.ctxCard}>
              <h3 className={styles.ctxHead}>Lead</h3>
              {selected.lead ? (
                <>
                  <div className={styles.ctxRow}><Car size={13} /> {selected.lead.car ?? 'auto onbekend'}</div>
                  <div className={styles.ctxRow}><Wrench size={13} /> {selected.lead.service ?? 'dienst onbekend'}</div>
                  <div className={styles.ctxRow}><MapPin size={13} /> {selected.lead.postcode ?? 'geen postcode'}</div>
                  <span className={styles.ctxStatus}>{selected.lead.status}</span>
                </>
              ) : (
                <p className={styles.ctxEmpty}>Dit nummer staat niet bij de leads.</p>
              )}
            </section>

            <section className={styles.ctxCard}>
              <h3 className={styles.ctxHead}>Klus</h3>
              {selected.job ? (
                <>
                  <div className={styles.ctxRow}><Wrench size={13} /> {selected.job.service ?? 'dienst onbekend'}</div>
                  <div className={styles.ctxRow}><Car size={13} /> {selected.job.car ?? 'auto onbekend'}</div>
                  <div className={styles.ctxRow}><MapPin size={13} /> {selected.job.city ?? 'plaats onbekend'}</div>
                  <span className={styles.ctxStatus}>{selected.job.status}</span>
                </>
              ) : (
                <p className={styles.ctxEmpty}>Geen klus op dit nummer.</p>
              )}
            </section>
          </aside>
        </>
      )}
    </div>
  );
}
