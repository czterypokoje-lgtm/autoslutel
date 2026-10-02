'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Mail, MessageCircle, Camera, ThumbsUp, Phone, MessageSquare,
  MapPin, Car, Wrench, Inbox, ChevronDown, ArrowLeft, Send,
  Sparkles, UserPlus, CalendarPlus, Link2, Check, Paperclip,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { waLink } from '@/lib/whatsapp';
import {
  CHANNEL_LABELS, conversationInitial, isPhoneChannel, type InboxChannel,
} from '@/lib/berichten';
import {
  replyToConversation, setConversationAi, assignConversationToMe,
  setConversationState, linkConversationToLead, markRead,
} from './actions';
import styles from '../gesprekken/gesprekken.module.css';
import own from './berichten.module.css';

export interface Thread {
  id: string;
  channel: InboxChannel;
  externalId: string;
  displayName: string | null;
  subject: string | null;
  state: string;
  aiEnabled: boolean;
  assigned: boolean;
  unread: boolean;
  snippet: string | null;
  lastMessageAt: string;
  createdAt: string;
  lead: {
    id: string;
    name: string | null;
    phone: string | null;
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

interface Attachment {
  url: string;
  name?: string | null;
  type?: string | null;
}

interface Message {
  id: string;
  direction: 'in' | 'out';
  author: 'customer' | 'ai' | 'human';
  body: string | null;
  attachments: Attachment[] | null;
  error: string | null;
  created_at: string;
}

/** The one field this component reads off a realtime INSERT. */
interface InsertPayload {
  new: Message & { conversation_id: string };
}

/*
 * lucide-react dropped its brand glyphs, so there is no Instagram or Facebook
 * icon to use. A camera and a thumbs-up stand in — every one of these sits
 * next to its name from CHANNEL_LABELS, so the icon is doing recognition, not
 * identification.
 */
const CHANNEL_ICON: Record<InboxChannel, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  instagram: Camera,
  messenger: ThumbsUp,
  phone: Phone,
  sms: MessageSquare,
};

const AUTHOR_LABEL: Record<Message['author'], string> = {
  customer: 'Klant',
  ai: 'Assistent',
  human: 'Kantoor',
};

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', ...opts });

const time = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit' });
const dayStamp = (iso: string) => fmt(iso, { day: 'numeric', month: 'short' });

function dayGroup(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime()) / 86400000,
  );
  if (days <= 0) return 'Vandaag';
  if (days === 1) return 'Gisteren';
  if (days < 7) return 'Deze week';
  return 'Eerder';
}

const ORDER = ['Vandaag', 'Gisteren', 'Deze week', 'Eerder'];

interface JourneyEvent {
  at: string;
  kind: 'lead' | 'message' | 'job';
  title: string;
  detail: string | null;
  chip: string | null;
}

/**
 * Het postvak.
 *
 * Built out of the two screens this CRM already had rather than a third
 * invention: the three panes, the day-grouped list and the journey rail come
 * from the conversations console, and the thread, the realtime subscription
 * and the composer come from the technicians' chat. Both stylesheets are
 * reused too — `gesprekken.module.css` does the layout, and this screen's own
 * module holds only what neither had: the channel colours, the composer, and
 * the assistant toggle.
 *
 * Messages are fetched per thread when it is opened, not shipped with the
 * page. One ended WhatsApp conversation is twenty transcript turns; a hundred
 * threads is thousands of rows for the one somebody is reading.
 */
export default function BerichtenConsole({ threads }: { threads: Thread[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(threads[0]?.id ?? null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  /* Messages per thread, filled on open and appended to by the socket. */
  const [cache, setCache] = useState<Record<string, Message[]>>({});

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'bad' | 'ok'; text: string } | null>(null);

  const [linking, setLinking] = useState(false);
  const [leadInput, setLeadInput] = useState('');

  /*
   * Local changes laid over the server's own list. The actions that change a
   * thread revalidate the page, but the socket delivers a message long before
   * that round trip finishes, and a list that reorders a second late reads as
   * a bug.
   */
  const [overrides, setOverrides] = useState<Record<string, Partial<Thread>>>({});

  const bottomRef = useRef<HTMLDivElement>(null);

  /*
   * Created once, not per render. createSupabaseBrowserClient() builds a new
   * client on every call, and with the client in the effect's dependency array
   * that tore the subscription down and rebuilt it on every single message —
   * the same trap ChatClient documents falling into.
   */
  const [supabase] = useState(() => createSupabaseBrowserClient());

  const list = useMemo(
    () =>
      threads
        .map((thread) => ({ ...thread, ...overrides[thread.id] }))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
    [threads, overrides],
  );

  const selected = list.find((thread) => thread.id === selectedId) ?? null;
  const messages = selectedId ? cache[selectedId] ?? [] : [];

  /*
   * Derived, not stored. "We are loading" is exactly "a thread is open and
   * its messages are not in the cache yet" — holding that as its own state
   * meant setting it synchronously inside the effect below, which is the
   * cascading-render pattern React's own lint rule exists to catch.
   */
  const loadingThread = selectedId !== null && !cache[selectedId];

  /*
   * Fetch a thread the first time it is opened, and mark it read once its
   * messages are actually on screen.
   *
   * The `cancelled` guard is the same one the notes tab on a lead uses
   * (LeadsTable): clicking through three threads quickly fires three requests,
   * and without it the slowest response wins and overwrites the newest.
   */
  useEffect(() => {
    if (!selectedId || cache[selectedId]) return;
    const conversationId = selectedId;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/admin/inbox/${conversationId}/messages`);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(body?.error ?? 'Laden mislukt');

        setCache((prev) => ({ ...prev, [conversationId]: body.messages ?? [] }));
        setOverrides((prev) => ({
          ...prev,
          [conversationId]: { ...prev[conversationId], unread: false },
        }));
        void markRead(conversationId);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setNotice({ tone: 'bad', text: 'Kon de berichten van dit gesprek niet laden.' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, cache]);

  /* Picking a thread is a click, so the per-thread UI state is reset here
     rather than in an effect reacting to the click afterwards. */
  function selectThread(conversationId: string | null) {
    setSelectedId(conversationId);
    setNotice(null);
    setLinking(false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages.length, selectedId]);

  useEffect(() => {
    const subscription = supabase
      .channel('postvak')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inbox_messages' },
        (payload: InsertPayload) => {
          const message = payload.new;
          const conversationId = String(message.conversation_id);

          /* Only threads already open are appended; the rest are re-read when
             they are opened, which is the same work either way. */
          setCache((prev) => {
            const existing = prev[conversationId];
            if (!existing) return prev;
            if (existing.some((m) => m.id === message.id)) return prev;
            return { ...prev, [conversationId]: [...existing, message] };
          });

          setOverrides((prev) => ({
            ...prev,
            [conversationId]: {
              ...prev[conversationId],
              lastMessageAt: message.created_at,
              snippet: message.body?.slice(0, 160) ?? '[bijlage]',
              /* An inbound message makes it unread again — unless it is the
                 thread currently on screen, which is being read right now. */
              unread: message.direction === 'in' && conversationId !== selectedId,
            },
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase, selectedId]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !selectedId || sending) return;

    setSending(true);
    setNotice(null);
    try {
      const result = await replyToConversation(selectedId, text);
      if (!result.ok) {
        setNotice({ tone: 'bad', text: result.error });
        return;
      }
      setInput('');
      if (result.warning) setNotice({ tone: 'bad', text: result.warning });
      /*
       * No refresh. The insert broadcasts over the same subscription everyone
       * else receives it on, so it arrives here the same way within
       * milliseconds — the sender is not special-cased by replication.
       */
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'bad', text: 'Verzenden mislukt.' });
    } finally {
      setSending(false);
    }
  }

  async function toggleAi() {
    if (!selected) return;
    const next = !selected.aiEnabled;
    setOverrides((prev) => ({ ...prev, [selected.id]: { ...prev[selected.id], aiEnabled: next } }));
    const result = await setConversationAi(selected.id, next);
    if (!result.ok) {
      setOverrides((prev) => ({ ...prev, [selected.id]: { ...prev[selected.id], aiEnabled: !next } }));
      setNotice({ tone: 'bad', text: result.error ?? 'Omzetten mislukt.' });
    }
  }

  async function handleAssign() {
    if (!selected) return;
    setOverrides((prev) => ({ ...prev, [selected.id]: { ...prev[selected.id], assigned: true } }));
    const result = await assignConversationToMe(selected.id);
    if (!result.ok) {
      setOverrides((prev) => ({ ...prev, [selected.id]: { ...prev[selected.id], assigned: false } }));
      setNotice({ tone: 'bad', text: result.error ?? 'Toewijzen mislukt.' });
    }
  }

  async function handleClose() {
    if (!selected) return;
    const next = selected.state === 'closed' ? 'open' : 'closed';
    setOverrides((prev) => ({ ...prev, [selected.id]: { ...prev[selected.id], state: next } }));
    const result = await setConversationState(selected.id, next);
    if (!result.ok) setNotice({ tone: 'bad', text: result.error ?? 'Bijwerken mislukt.' });
  }

  async function handleLink(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const leadId = leadInput.trim();
    if (!leadId) return;

    const result = await linkConversationToLead(selected.id, leadId);
    if (!result.ok) {
      setNotice({ tone: 'bad', text: result.error ?? 'Koppelen mislukt.' });
      return;
    }
    setLinking(false);
    setLeadInput('');
    setNotice({ tone: 'ok', text: 'Lead gekoppeld. Vernieuw voor de volledige gegevens.' });
  }

  const groups = ORDER.map((name) => ({
    name,
    items: list.filter((thread) => dayGroup(thread.lastMessageAt) === name),
  })).filter((group) => group.items.length > 0);

  const journey: JourneyEvent[] = selected
    ? [
        ...(selected.lead
          ? [{
              at: selected.lead.createdAt,
              kind: 'lead' as const,
              title: 'Lead aangemaakt',
              detail: selected.lead.service ?? null,
              chip: selected.lead.status,
            }]
          : []),
        ...messages.map((message) => ({
          at: message.created_at,
          kind: 'message' as const,
          title: AUTHOR_LABEL[message.author],
          detail: message.body ? message.body.slice(0, 60) : '[bijlage]',
          chip: null,
        })),
        ...(selected.job?.date
          ? [{
              at: `${selected.job.date}T${selected.job.slot ?? '00:00'}:00`,
              kind: 'job' as const,
              title: 'Klus ingepland',
              detail: [selected.job.slot, selected.job.city].filter(Boolean).join(' · ') || null,
              chip: selected.job.status,
            }]
          : [])
      ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    : [];

  /* WhatsApp and phone are answered on a handset — see berichtenStore. */
  const replyable = selected ? selected.channel === 'email' : false;
  const phone = selected?.lead?.phone ?? (selected && isPhoneChannel(selected.channel) ? selected.externalId : null);
  const title = selected
    ? selected.displayName || selected.lead?.name || selected.externalId
    : '';

  return (
    <div className={`${styles.console} ${selected ? styles.hasSelection : ''}`}>
      {/* ── pane 1: which thread ──────────────────────────────────────── */}
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

              {!isShut && group.items.map((thread) => {
                const Icon = CHANNEL_ICON[thread.channel];
                const active = thread.id === selected?.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => selectThread(thread.id)}
                    className={`${styles.listItem} ${active ? styles.listItemActive : ''}`}
                  >
                    <span className={`${styles.avatar} ${own[`ch_${thread.channel}`] ?? ''}`}>
                      {conversationInitial(thread.displayName ?? thread.lead?.name ?? null, thread.externalId)}
                      <span className={styles.avatarBadge}><Icon size={9} /></span>
                    </span>

                    <span className={styles.listBody}>
                      <span className={styles.listTop}>
                        <span className={styles.listName}>
                          {thread.displayName || thread.lead?.name || thread.externalId}
                        </span>
                        <span className={styles.listTime}>{time(thread.lastMessageAt)}</span>
                      </span>

                      <span className={styles.listSnippet}>
                        {thread.snippet ?? thread.subject ?? 'Nog geen bericht'}
                      </span>

                      <span className={styles.listTags}>
                        {thread.unread && <span className={own.unreadDot} aria-label="Ongelezen" />}
                        <span className={styles.listMeta}>{CHANNEL_LABELS[thread.channel]}</span>
                        {thread.lead && <span className={styles.chipMini}>lead</span>}
                        {thread.job && <span className={styles.chipMini}>klus</span>}
                        {!thread.aiEnabled && <span className={styles.chipMini}>handmatig</span>}
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
          {/* ── pane 2: the thread ─────────────────────────────────────── */}
          <main className={styles.threadPane}>
            <header className={styles.hero}>
              <button
                type="button"
                className={styles.back}
                onClick={() => selectThread(null)}
                aria-label="Terug naar de lijst"
              >
                <ArrowLeft size={16} />
              </button>

              <span className={`${styles.heroAvatar} ${own[`ch_${selected.channel}`] ?? ''}`}>
                {conversationInitial(selected.displayName ?? selected.lead?.name ?? null, selected.externalId)}
              </span>

              <div className={styles.heroWho}>
                <h2 className={styles.heroName}>{title}</h2>
                <div className={styles.heroFacts}>
                  <span>{CHANNEL_LABELS[selected.channel]} · {selected.externalId}</span>
                  {selected.lead?.postcode && <span><MapPin size={12} /> {selected.lead.postcode}</span>}
                  {selected.lead?.car && <span><Car size={12} /> {selected.lead.car}</span>}
                </div>
              </div>

              <div className={own.heroActions}>
                {/*
                  * The handover, and the whole of it. Switched off, the
                  * assistant stops answering this thread and a person owns it;
                  * switched back on, it picks the thread up again.
                  */}
                <button
                  type="button"
                  onClick={toggleAi}
                  className={`${own.toggle} ${selected.aiEnabled ? own.toggleOn : ''}`}
                  aria-pressed={selected.aiEnabled}
                >
                  <Sparkles size={13} />
                  {selected.aiEnabled ? 'Assistent aan' : 'Ik doe dit zelf'}
                </button>

                <button
                  type="button"
                  onClick={handleAssign}
                  className={own.miniBtn}
                  disabled={selected.assigned}
                >
                  {selected.assigned ? <><Check size={13} /> Toegewezen</> : <><UserPlus size={13} /> Aan mij</>}
                </button>

                <button type="button" onClick={handleClose} className={own.miniBtn}>
                  {selected.state === 'closed' ? 'Heropenen' : 'Sluiten'}
                </button>
              </div>
            </header>

            {selected.subject && (
              <p className={own.subject}>{selected.subject}</p>
            )}

            <section className={styles.card}>
              <h3 className={styles.cardHead}>
                <span className={styles.liveDot} />
                Gesprek
                <span className={styles.cardCount}>
                  {loadingThread ? 'laden…' : `${messages.length} berichten`}
                </span>
              </h3>

              <div className={styles.turns}>
                {!loadingThread && messages.length === 0 && (
                  <p className={styles.ctxEmpty}>Nog geen berichten in dit gesprek.</p>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.direction === 'out' ? styles.rowAgent : styles.rowUser}
                  >
                    <span className={message.direction === 'out' ? styles.whoAgent : styles.whoUser}>
                      {AUTHOR_LABEL[message.author]} · {time(message.created_at)}
                    </span>

                    {message.body && <p className={styles.turnText}>{message.body}</p>}

                    {(message.attachments ?? []).map((file) => (
                      <a
                        key={file.url}
                        className={own.attachment}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Paperclip size={12} /> {file.name ?? 'bijlage'}
                      </a>
                    ))}

                    {message.error && <p className={own.sendError}>Niet bezorgd: {message.error}</p>}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </section>

            {notice && (
              <p className={notice.tone === 'bad' ? own.sendError : own.sendOk}>{notice.text}</p>
            )}

            {replyable ? (
              <form className={own.composer} onSubmit={handleSend}>
                <textarea
                  className={own.composerInput}
                  placeholder={`Antwoord aan ${selected.externalId}`}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    /* Cmd/Ctrl+Enter sends, the same as the notes box on a lead. */
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                      void handleSend(event);
                    }
                  }}
                  rows={3}
                  maxLength={4000}
                  disabled={sending}
                />
                <button type="submit" className={own.sendBtn} disabled={sending || !input.trim()}>
                  <Send size={14} /> {sending ? 'Versturen…' : 'Versturen'}
                </button>
              </form>
            ) : (
              <p className={own.notReplyable}>
                {isPhoneChannel(selected.channel)
                  ? 'WhatsApp en telefoon lopen via de assistent. Antwoord zelf met de WhatsApp-knop hieronder.'
                  : 'Dit kanaal is nog niet aangesloten — antwoorden kan zodra Meta de app heeft goedgekeurd.'}
              </p>
            )}

            <div className={styles.actionBar}>
              {phone && (
                <a className={styles.pillPrimary} href={`tel:${phone}`}>
                  <Phone size={14} /> Bellen
                </a>
              )}
              {phone && waLink(phone, '') && (
                <a className={styles.pill} href={waLink(phone, '') as string} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {selected.lead ? (
                <Link className={styles.pill} href="/admin/leads"><Inbox size={14} /> Open lead</Link>
              ) : (
                <button type="button" className={styles.pill} onClick={() => setLinking((v) => !v)}>
                  <Link2 size={14} /> Koppel aan lead
                </button>
              )}
              {selected.job ? (
                <Link className={styles.pill} href={`/admin/jobs/${selected.job.id}`}>
                  <Wrench size={14} /> Open klus
                </Link>
              ) : (
                <Link className={styles.pill} href="/admin/jobs/nieuw">
                  <CalendarPlus size={14} /> Klus inplannen
                </Link>
              )}
            </div>

            {linking && (
              <form className={own.linkForm} onSubmit={handleLink}>
                <label className={own.linkLabel} htmlFor="lead-id">
                  Lead-id uit /admin/leads
                </label>
                <input
                  id="lead-id"
                  className={own.linkInput}
                  value={leadInput}
                  onChange={(event) => setLeadInput(event.target.value)}
                  placeholder="bijv. 3f2a1b8c-…"
                />
                <button type="submit" className={own.sendBtn} disabled={!leadInput.trim()}>
                  Koppelen
                </button>
              </form>
            )}
          </main>

          {/* ── pane 3: who this is ────────────────────────────────────── */}
          <aside className={styles.contextPane}>
            <section className={styles.ctxCard}>
              <h3 className={styles.ctxHead}>Reis van deze klant</h3>
              <ol className={styles.journey}>
                {journey.map((event, i) => {
                  const Icon = event.kind === 'lead' ? Inbox
                    : event.kind === 'job' ? Wrench
                    : CHANNEL_ICON[selected.channel];
                  return (
                    <li key={`${event.at}-${i}`} className={styles.jEvent}>
                      <span className={styles.jIcon}><Icon size={12} /></span>
                      <div className={styles.jBody}>
                        <div className={styles.jTop}>
                          <span className={styles.jTitle}>{event.title}</span>
                          {event.chip && (
                            <span className={`${styles.jChip} ${styles.neutral}`}>{event.chip}</span>
                          )}
                        </div>
                        <div className={styles.jWhen}>
                          {dayStamp(event.at)} · {time(event.at)}
                          {event.detail ? ` · ${event.detail}` : ''}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {journey.length === 0 && (
                <p className={styles.ctxEmpty}>Eerste contact — verder nog niets bekend.</p>
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
                <p className={styles.ctxEmpty}>
                  {isPhoneChannel(selected.channel) || selected.channel === 'email'
                    ? 'Deze afzender staat niet bij de leads.'
                    : 'Instagram en Facebook geven geen nummer of adres — koppel de lead zelf.'}
                </p>
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
                <p className={styles.ctxEmpty}>Nog geen klus uit dit gesprek.</p>
              )}
            </section>
          </aside>
        </>
      )}
    </div>
  );
}
