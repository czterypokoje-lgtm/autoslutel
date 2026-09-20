'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, HelpCircle, Clock, MapPin, Car, ArrowLeft, Wrench, Inbox } from 'lucide-react';
import { waLink } from '@/lib/whatsapp';
import styles from './gesprekken.module.css';

export interface Conversation {
  id: string;
  channel: string;
  phone: string | null;
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

function channelOf(channel: string) {
  return CHANNEL[channel as keyof typeof CHANNEL] ?? CHANNEL.unknown;
}

function duration(secs: number | null) {
  if (!secs) return null;
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function when(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam',
  });
}

function time(iso: string) {
  return new Date(iso).toLocaleTimeString('nl-NL', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam',
  });
}

/** Calendar days between then and now, so "vandaag" is a date change, not 24h. */
function dayGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const days = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000
  );
  if (days <= 0) return 'Vandaag';
  if (days === 1) return 'Gisteren';
  if (days < 7) return 'Deze week';
  return 'Eerder';
}

const ORDER = ['Vandaag', 'Gisteren', 'Deze week', 'Eerder'];

/**
 * The conversations console.
 *
 * Three panes on a desktop — pick, read, act — collapsing to one at a time on
 * a phone, where a list and a transcript side by side would give each about
 * 180px.
 *
 * The right-hand pane is the point of the screen. A transcript tells you what
 * was said; what decides whether to call back is whether this number already
 * has a lead sitting at `new` or a job in tomorrow's agenda. Both are matched
 * on the server and rendered here, and when there is no match it says so
 * plainly rather than showing an empty frame that looks like a loading bug.
 */
export default function ConversationConsole({ conversations }: { conversations: Conversation[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const selected = conversations.find((c) => c.id === selectedId) ?? conversations[0];

  const groups = ORDER.map((name) => ({
    name,
    items: conversations.filter((c) => dayGroup(c.createdAt) === name),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={`${styles.console} ${selected ? styles.hasSelection : ''}`}>
      {/* ── pane 1: the list ── */}
      <aside className={styles.listPane}>
        {groups.map((group) => (
          <section key={group.name} className={styles.group}>
            <h2 className={styles.groupHead}>
              {group.name}
              <span className={styles.groupCount}>{group.items.length}</span>
            </h2>

            {group.items.map((c) => {
              const { label, Icon } = channelOf(c.channel);
              const active = c.id === selected?.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`${styles.listItem} ${active ? styles.listItemActive : ''}`}
                  aria-current={active}
                >
                  <span className={`${styles.avatar} ${styles[`ch_${c.channel}`] ?? ''}`} aria-hidden>
                    <Icon size={15} />
                  </span>

                  <span className={styles.listBody}>
                    <span className={styles.listTop}>
                      <span className={styles.listName}>
                        {c.lead?.name || c.phone || label}
                      </span>
                      <span className={styles.listTime}>{time(c.createdAt)}</span>
                    </span>
                    <span className={styles.listSnippet}>
                      {c.summary ?? `${c.turns.length} berichten`}
                    </span>
                    <span className={styles.listTags}>
                      {c.outcome && (
                        <span className={`${styles.dot} ${c.outcome === 'success' ? styles.ok : c.outcome === 'failure' ? styles.bad : styles.neutral}`} />
                      )}
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
        ))}
      </aside>

      {selected && (
        <>
          {/* ── pane 2: the conversation ── */}
          <main className={styles.threadPane}>
            <header className={styles.threadHead}>
              <button
                type="button"
                className={styles.back}
                onClick={() => setSelectedId(null)}
                aria-label="Terug naar de lijst"
              >
                <ArrowLeft size={16} />
              </button>

              <div className={styles.threadWho}>
                <div className={styles.threadName}>{selected.lead?.name || selected.phone || 'Onbekende beller'}</div>
                <div className={styles.threadMeta}>
                  {channelOf(selected.channel).label}
                  {' · '}{when(selected.createdAt)}
                  {duration(selected.durationSecs) ? ` · ${duration(selected.durationSecs)}` : ''}
                </div>
              </div>

              {selected.outcome && (
                <span className={`${styles.outcome} ${selected.outcome === 'success' ? styles.ok : selected.outcome === 'failure' ? styles.bad : styles.neutral}`}>
                  {selected.outcome === 'success' ? 'Gelukt' : selected.outcome === 'failure' ? 'Mislukt' : selected.outcome}
                </span>
              )}
            </header>

            {selected.summary && (
              <div className={styles.summary}>
                <span className={styles.summaryLabel}>Samenvatting</span>
                {selected.summary}
              </div>
            )}

            <div className={styles.turns}>
              {selected.turns.length === 0 ? (
                <p className={styles.noTurns}>Geen transcript bij dit gesprek.</p>
              ) : (
                selected.turns.map((turn, i) => (
                  <div key={i} className={turn.role === 'agent' ? styles.turnAgent : styles.turnUser}>
                    <span className={styles.turnWho}>{turn.role === 'agent' ? 'Assistent' : 'Klant'}</span>
                    <p className={styles.bubble}>{turn.message}</p>
                  </div>
                ))
              )}
            </div>
          </main>

          {/* ── pane 3: who this is, and what to do ── */}
          <aside className={styles.contextPane}>
            <section className={styles.ctxCard}>
              <h3 className={styles.ctxHead}>Beller</h3>
              <div className={styles.ctxNumber}>{selected.phone ?? 'Geen nummer meegestuurd'}</div>

              {selected.phone && (
                <div className={styles.actions}>
                  <a className={styles.btnPrimary} href={`tel:${selected.phone}`}>
                    <Phone size={15} /> Bellen
                  </a>
                  {waLink(selected.phone, '') && (
                    <a
                      className={styles.btn}
                      href={waLink(selected.phone, '') as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                  )}
                </div>
              )}
            </section>

            <section className={styles.ctxCard}>
              <h3 className={styles.ctxHead}>Lead</h3>
              {selected.lead ? (
                <>
                  <div className={styles.ctxRow}><Car size={14} /> {selected.lead.car ?? 'auto onbekend'}</div>
                  <div className={styles.ctxRow}><Wrench size={14} /> {selected.lead.service ?? 'dienst onbekend'}</div>
                  <div className={styles.ctxRow}><MapPin size={14} /> {selected.lead.postcode ?? 'geen postcode'}</div>
                  <div className={styles.ctxRow}><Clock size={14} /> aangemaakt {when(selected.lead.createdAt)}</div>
                  <div className={styles.ctxStatus}>{selected.lead.status}</div>
                  <Link className={styles.btn} href="/admin/leads">
                    <Inbox size={15} /> Open in leads
                  </Link>
                </>
              ) : (
                /* An honest blank. This number has never filled in a form —
                   which is itself the useful fact, not a missing panel. */
                <p className={styles.ctxEmpty}>Dit nummer staat niet bij de leads.</p>
              )}
            </section>

            <section className={styles.ctxCard}>
              <h3 className={styles.ctxHead}>Klus</h3>
              {selected.job ? (
                <>
                  <div className={styles.ctxRow}><Clock size={14} /> {selected.job.date} {selected.job.slot ?? ''}</div>
                  <div className={styles.ctxRow}><Car size={14} /> {selected.job.car ?? 'auto onbekend'}</div>
                  <div className={styles.ctxRow}><MapPin size={14} /> {selected.job.city ?? 'plaats onbekend'}</div>
                  <div className={styles.ctxStatus}>{selected.job.status}</div>
                  <Link className={styles.btn} href={`/admin/jobs/${selected.job.id}`}>
                    <Wrench size={15} /> Open klus
                  </Link>
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
