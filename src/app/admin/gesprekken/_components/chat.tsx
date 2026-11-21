'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { cn } from 'cn';
import { Bot, Calendar, CalendarCheck, CircleHelp, Euro, Inbox, Mail, MessageCircle, MessageSquare, MessageSquareText, Package, Phone, Receipt, type LucideIcon, UserRoundX, Wrench } from 'lucide-react';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

import { useIsMobile } from '@/hooks/use-mobile';
import { usePreviewLanguage } from '../../PreviewLanguage';
import type { Conversation } from '../ConversationConsole';

import { ChatConversationList } from './chat-conversation-list';
import { ChatProfileDetails } from './chat-profile-details';
import { ChatThread } from './chat-thread';
import { groupOf } from './data';
import { inboxOf, TOPIC_LABEL, topicOf, type Topic } from './topics';

export type View = 'inbox' | 'today' | 'unassigned' | 'appointment';
export type Channel = 'phone' | 'whatsapp' | 'email' | 'form' | 'webchat' | 'sms' | 'unknown';

/** Channels with their own menu entry. Anything else (old 'unknown' rows, a new source) lands under "Overig", never nowhere. */
const KNOWN: ReadonlySet<string> = new Set(['phone', 'whatsapp', 'email', 'form', 'webchat', 'sms']);
const channelOf = (c: Conversation): Channel => (KNOWN.has(c.channel) ? (c.channel as Channel) : 'unknown');

const channelColor: Partial<Record<Channel,string>> = {
  whatsapp:'bg-emerald-50 text-emerald-900 border-emerald-200', email:'bg-violet-50 text-violet-900 border-violet-200',
  phone:'bg-blue-50 text-blue-900 border-blue-200', webchat:'bg-orange-50 text-orange-900 border-orange-200',
};

function subscribeToReadState(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener('crm-transcript-opened', notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('crm-transcript-opened', notify);
  };
}

export function Chat({ conversations: all, now, operator }: { operator:string; conversations: Conversation[]; now: number }) {
  const { t } = usePreviewLanguage();
  const [kind, setKind] = useState<ReturnType<typeof inboxOf>>('leads');
  const conversations = useMemo(() => all.filter(c => inboxOf(c) === kind), [all,kind]);
  const [view, setView] = useState<View>('inbox');
  const [channel, setChannel] = useState<Channel | null>('whatsapp');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [selected, setSelected] = useState<string | null>(conversations[0]?.id ?? null);

  /*
   * Suppliers and robots (Shopify bills, Google notices) are not customers:
   * they stay out of every view until "Systeem & leverancier" is picked, so
   * Postvak IN is only people who need an answer.
   */
  const topics = useMemo(() => new Map(conversations.map((c) => [c.id, topicOf(c)])), [conversations]);
  const pool = conversations;
  const [showContact, setShowContact] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const [sessionReads, setSessionReads] = useState<string[]>([]);
  const [openedThreads,setOpenedThreads] = useState<string[]>([]);
  const readKey = 'crm-read-transcripts:' + operator;
  const savedReads = useSyncExternalStore(subscribeToReadState, () => {
    try { return localStorage.getItem(readKey) || '[]'; } catch { return '[]'; }
  }, () => '[]');
  const seenCalls = useMemo(() => {
    let stored: unknown;
    try { stored = JSON.parse(savedReads); } catch { stored = []; }
    return new Set([...sessionReads, ...(Array.isArray(stored) ? stored.filter(id => typeof id === 'string') : [])]);
  }, [sessionReads, savedReads]);
  async function openConversation(c: Conversation) {
    setSelected(c.id); setShowThread(true);
    if (c.thread?.unread) {
      const response = await fetch('/api/admin/inbox',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({threadId:c.thread.id,action:'read'})}).catch(()=>null);
      if(response?.ok) setOpenedThreads(ids=>[...ids,c.id]);
    } else if (!c.thread) {
      const next = [...new Set([...seenCalls,c.id])];
      setSessionReads(next);
      try {localStorage.setItem(readKey,JSON.stringify(next)); window.dispatchEvent(new Event('crm-transcript-opened'));} catch { /* Keep session state when storage is unavailable. */ }
    }
  }
  const isMobile = useIsMobile();

  const visible = useMemo(() => pool.filter((c) =>
    (view === 'inbox' || (view === 'today' && groupOf(c.createdAt, now) === 'Vandaag') || (view === 'unassigned' && !c.lead) || (view === 'appointment' && !!c.job))
    && (!channel || channelOf(c) === channel)
    && (!topic || topics.get(c.id) === topic)), [pool, view, channel, topic, topics, now]);

  const topicItems: { id: Topic; title: string; icon: LucideIcon }[] = [
    { id: 'aanvraag', title: t('Prijsaanvragen'), icon: Euro },
    { id: 'bestelling', title: t('Bestellingen'), icon: Package },
    { id: 'afspraak', title: t('Afspraken'), icon: CalendarCheck },
    { id: 'service', title: t('Service & klachten'), icon: Wrench },
    { id: 'retour', title: t('Retour'), icon: Receipt },
  ];

  const active = visible.find((c) => c.id === selected) ?? visible[0] ?? null;

  const navItems: { id: View; title: string; icon: LucideIcon; label?: number }[] = [
    { id: 'inbox', title: t('Postvak IN'), icon: Inbox },
    { id: 'today', title: t('Vandaag'), icon: Calendar },
    { id: 'unassigned', title: t('Zonder lead'), icon: UserRoundX },
    { id: 'appointment', title: t('Met afspraak'), icon: Calendar },
  ];
  /* Phone = the ElevenLabs agent's calls; WhatsApp, e-mail and forms = the inbox (0105). */
  const channelItems: { id: Channel; title: string; icon: LucideIcon;  }[] = [
    { id: 'phone', title: t('Telefoon'), icon: Phone },
    { id: 'whatsapp', title: 'WhatsApp chatbot', icon: MessageCircle },
    { id: 'email', title: t('E-mail'), icon: Mail },
    { id: 'form', title: t('Websiteformulier'), icon: MessageSquareText },
    { id: 'webchat', title: 'Website chatbot', icon: Bot },
    ...(all.some(c => channelOf(c) === 'sms') ? [{ id: 'sms' as const, title: 'SMS', icon: MessageSquare }] : []),
    ...(all.some(c => channelOf(c) === 'unknown') ? [{ id: 'unknown' as const, title: t('Overig'), icon: CircleHelp }] : []),
  ];

  return (
    <>
      <header className={cn("mb-4",showThread && "max-md:hidden")}><h1 className="text-2xl font-semibold">{t('Gesprekken')}</h1></header>
      <nav aria-label={t('Kanalen')} className={cn("mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4",showThread && "max-md:hidden")}>
        {channelItems.filter(item => item.id in channelColor).map(item => {
          const rows = all.filter(c => channelOf(c) === item.id);
          const unread = rows.filter(c => c.thread ? c.thread.unread > 0 && !openedThreads.includes(c.id) : !seenCalls.has(c.id)).length;
          return <button title={t('Recente gesprekken. Geopende agenttranscripten worden op dit apparaat bijgehouden.')} key={item.id} data-channel={item.id} aria-pressed={channel === item.id}
            className={cn('rounded-xl border p-3 text-left transition-shadow aria-pressed:ring-2 aria-pressed:ring-current',channelColor[item.id])}
            onClick={() => {setChannel(item.id);setView('inbox');setTopic(null);setShowThread(false);setShowContact(false);}}>
            <span className="flex items-center gap-2 text-sm font-semibold"><item.icon size={20}/>{item.title}</span>
            <span className="mt-2 block text-xs">{rows.length} {t(rows.length === 1 ? 'gesprek' : 'gesprekken')} · {unread} {t('ongelezen')}</span>
          </button>;
        })}
      </nav>
      <div className={cn("mb-3 flex flex-wrap items-center gap-2",showThread && "max-md:hidden")}>
        {(['leads','webshop','overig','systeem'] as const).map(key => <button key={key} aria-pressed={kind === key} className="rounded-lg border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground" onClick={() => {setKind(key);setTopic(null);setView('inbox');setShowThread(false);setShowContact(false);}}>{t(({leads:'Leads',webshop:'Webshop',overig:'Overig',systeem:'Systeem'})[key])}</button>)}
        <details className="relative"><summary className="cursor-pointer rounded-lg border px-3 py-2 text-sm">{t('Filters')}</summary><div className="absolute z-20 mt-1 grid min-w-44 gap-2 rounded-xl border bg-card p-3 shadow-lg"><select aria-label={t('Weergave')} className="rounded-lg border p-2 text-sm" value={view} onChange={e=>setView(e.target.value as View)}>{navItems.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <select aria-label={t('Kanalen')} value={channel ?? ''} onChange={e=>{setChannel((e.target.value || null) as Channel | null);setShowThread(false);}} className="rounded border p-2 text-sm"><option value="">{t('Alle kanalen')}</option>{channelItems.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></div></details>
        {kind !== 'systeem' && <div className="flex flex-wrap gap-1">{topicItems.map(item=><button key={item.id} aria-pressed={topic === item.id} className="rounded-full border px-2 py-1 text-xs aria-pressed:bg-accent" onClick={()=>{setTopic(topic === item.id ? null : item.id);setShowThread(false);}}>{t(TOPIC_LABEL[item.id])}</button>)}</div>}
      </div>
      <div
        className="bg-card grid h-[calc(100svh-5.5rem)] min-w-0 overflow-hidden rounded-xl border shadow-sm transition-[grid-template-columns] duration-300 ease-out *:min-h-0 *:min-w-0 md:h-[calc(100svh-6.5rem)] md:grid-cols-[minmax(17rem,35%)_minmax(0,1fr)]"
      >
        <ChatConversationList
          conversations={visible}
          selectedId={active?.id ?? null}
          now={now}
          title={(topic && topicItems.find((n) => n.id === topic)?.title) || (navItems.find((n) => n.id === view)?.title ?? t('Postvak IN'))}
          className={cn('md:border-r', showThread && 'max-md:hidden')}
          onSelectConversation={openConversation}
        />
        {active ? (
          <ChatThread key={active.id}
            conversation={active}
            now={now}
            showBackButton={isMobile}
            onBack={() => setShowThread(false)}
            onOpenContact={() => setShowContact(true)}
            className={cn(!showThread && 'max-md:hidden')}
          />
        ) : (
          <div className={cn('text-muted-foreground grid place-items-center text-sm', !showThread && 'max-md:hidden')}>{t('Geen gesprekken in deze weergave.')}</div>
        )}

      </div>

      {active && (
        <Sheet open={showContact} onOpenChange={setShowContact}>
          <SheetContent side="right" className="w-80 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">{t('Klantgegevens')}</SheetTitle>
            <SheetDescription className="sr-only">{t('Lead en afspraak bij dit gesprek')}</SheetDescription>
            <ChatProfileDetails conversation={active} onClose={() => setShowContact(false)} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
