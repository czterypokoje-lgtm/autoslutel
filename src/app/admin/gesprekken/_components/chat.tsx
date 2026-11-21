'use client';

import { type CSSProperties, useMemo, useState } from 'react';
import { cn } from 'cn';
import { Bot, Calendar, CalendarCheck, CircleHelp, Euro, Inbox, Mail, MessageCircle, MessageSquare, MessageSquareText, Package, Phone, Receipt, type LucideIcon, UserRoundX, Wrench } from 'lucide-react';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useIsLg } from '@/hooks/use-lg';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreviewLanguage } from '../../PreviewLanguage';
import type { Conversation } from '../ConversationConsole';

import { ChatConversationList } from './chat-conversation-list';
import { ChatProfileDetails } from './chat-profile-details';
import { ChatThread } from './chat-thread';
import { groupOf } from './data';
import { topicOf, type Topic } from './topics';

export type View = 'inbox' | 'today' | 'unassigned' | 'appointment';
export type Channel = 'phone' | 'whatsapp' | 'email' | 'form' | 'webchat' | 'sms' | 'unknown';

/** Channels with their own menu entry. Anything else (old 'unknown' rows, a new source) lands under "Overig", never nowhere. */
const KNOWN: ReadonlySet<string> = new Set(['phone', 'whatsapp', 'email', 'form', 'webchat', 'sms']);
const channelOf = (c: Conversation): Channel => (KNOWN.has(c.channel) ? (c.channel as Channel) : 'unknown');

export function Chat({ conversations, now }: { conversations: Conversation[]; now: number }) {
  const { t } = usePreviewLanguage();
  const [view, setView] = useState<View>('inbox');
  const [channel, setChannel] = useState<Channel | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [selected, setSelected] = useState<string | null>(conversations[0]?.id ?? null);

  /*
   * Suppliers and robots (Shopify bills, Google notices) are not customers:
   * they stay out of every view until "Systeem & leverancier" is picked, so
   * Postvak IN is only people who need an answer.
   */
  const topics = useMemo(() => new Map(conversations.map((c) => [c.id, topicOf(c)])), [conversations]);
  const customers = useMemo(() => conversations.filter((c) => topics.get(c.id) !== 'systeem'), [conversations, topics]);
  const pool = topic === 'systeem' ? conversations : customers;
  const [showContact, setShowContact] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const isLg = useIsLg();
  const isMobile = useIsMobile();

  const counts = useMemo(() => ({
    inbox: customers.length,
    today: customers.filter((c) => groupOf(c.createdAt, now) === 'Vandaag').length,
    unassigned: customers.filter((c) => !c.lead).length,
    appointment: customers.filter((c) => c.job).length,
    aanvraag: conversations.filter((c) => topics.get(c.id) === 'aanvraag').length,
    bestelling: conversations.filter((c) => topics.get(c.id) === 'bestelling').length,
    afspraak: conversations.filter((c) => topics.get(c.id) === 'afspraak').length,
    service: conversations.filter((c) => topics.get(c.id) === 'service').length,
    systeem: conversations.filter((c) => topics.get(c.id) === 'systeem').length,
    phone: customers.filter((c) => channelOf(c) === 'phone').length,
    whatsapp: customers.filter((c) => channelOf(c) === 'whatsapp').length,
    email: customers.filter((c) => channelOf(c) === 'email').length,
    form: customers.filter((c) => channelOf(c) === 'form').length,
    webchat: customers.filter((c) => channelOf(c) === 'webchat').length,
    sms: customers.filter((c) => channelOf(c) === 'sms').length,
    unknown: customers.filter((c) => channelOf(c) === 'unknown').length,
  }), [conversations, customers, topics, now]);

  const visible = useMemo(() => pool.filter((c) =>
    (view === 'inbox' || (view === 'today' && groupOf(c.createdAt, now) === 'Vandaag') || (view === 'unassigned' && !c.lead) || (view === 'appointment' && !!c.job))
    && (!channel || channelOf(c) === channel)
    && (!topic || topics.get(c.id) === topic)), [pool, view, channel, topic, topics, now]);

  const topicItems: { id: Topic; title: string; icon: LucideIcon; label: number }[] = [
    { id: 'aanvraag', title: t('Prijsaanvragen'), icon: Euro, label: counts.aanvraag },
    { id: 'bestelling', title: t('Bestellingen'), icon: Package, label: counts.bestelling },
    { id: 'afspraak', title: t('Afspraken'), icon: CalendarCheck, label: counts.afspraak },
    { id: 'service', title: t('Service & klachten'), icon: Wrench, label: counts.service },
    { id: 'systeem', title: t('Systeem & leveranciers'), icon: Receipt, label: counts.systeem },
  ];

  const active = visible.find((c) => c.id === selected) ?? visible[0] ?? null;

  const navItems: { id: View; title: string; icon: LucideIcon; label?: number }[] = [
    { id: 'inbox', title: t('Postvak IN'), icon: Inbox, label: counts.inbox },
    { id: 'today', title: t('Vandaag'), icon: Calendar, label: counts.today },
    { id: 'unassigned', title: t('Zonder lead'), icon: UserRoundX, label: counts.unassigned },
    { id: 'appointment', title: t('Met afspraak'), icon: Calendar, label: counts.appointment },
  ];
  /* Phone = the ElevenLabs agent's calls; WhatsApp, e-mail and forms = the inbox (0105). */
  const channelItems: { id: Channel; title: string; icon: LucideIcon; label?: number; disabled?: boolean }[] = [
    { id: 'phone', title: t('Telefoon'), icon: Phone, label: counts.phone },
    { id: 'whatsapp', title: 'WhatsApp', icon: MessageCircle, label: counts.whatsapp },
    { id: 'email', title: t('E-mail'), icon: Mail, label: counts.email },
    { id: 'form', title: t('Websiteformulier'), icon: MessageSquareText, label: counts.form },
    { id: 'webchat', title: t('Webchat'), icon: Bot, label: counts.webchat },
    ...(counts.sms ? [{ id: 'sms' as const, title: 'SMS', icon: MessageSquare, label: counts.sms }] : []),
    ...(counts.unknown ? [{ id: 'unknown' as const, title: t('Overig'), icon: CircleHelp, label: counts.unknown }] : []),
  ];

  return (
    <>
      <div
        className="bg-card grid h-[calc(100svh-5.5rem)] min-w-0 overflow-hidden rounded-xl border shadow-sm transition-[grid-template-columns] duration-300 ease-out *:min-h-0 *:min-w-0 md:h-[calc(100svh-6.5rem)] md:grid-cols-[13rem_22.5rem_minmax(0,1fr)] lg:grid-cols-[13rem_22.5rem_minmax(0,1fr)_var(--profile-width)]"
        style={{ '--profile-width': showContact ? '20rem' : '0rem' } as CSSProperties}
      >
        <aside className="bg-sidebar hidden flex-col gap-2 overflow-y-auto border-r py-2 md:flex">
          <SidebarGroup>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton className="[&_svg]:size-3.5" size="sm" isActive={view === item.id} onClick={() => { setView(item.id); setShowThread(false); }}>
                    <item.icon />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                  {item.label !== undefined && <SidebarMenuBadge className="font-medium">{item.label}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="font-normal">{t('Onderwerp')}</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {topicItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    className="[&_svg]:size-3.5"
                    size="sm"
                    isActive={topic === item.id}
                    onClick={() => { setTopic(topic === item.id ? null : item.id); setShowThread(false); }}
                  >
                    <item.icon />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge className="font-medium">{item.label}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="font-normal">{t('Kanalen')}</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {channelItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    className={cn('[&_svg]:size-3.5', item.disabled && 'opacity-50')}
                    size="sm"
                    isActive={channel === item.id}
                    disabled={item.disabled}
                    tooltip={item.disabled ? t('Nog niet gekoppeld') : undefined}
                    onClick={() => setChannel(channel === item.id ? null : item.id)}
                  >
                    <item.icon />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge className="font-medium">{item.disabled ? '—' : item.label}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </aside>

        <ChatConversationList
          conversations={visible}
          selectedId={active?.id ?? null}
          now={now}
          title={(topic && topicItems.find((n) => n.id === topic)?.title) || (navItems.find((n) => n.id === view)?.title ?? t('Postvak IN'))}
          className={cn('md:border-r', showThread && 'max-md:hidden')}
          onSelectConversation={(c) => { setSelected(c.id); setShowThread(true); }}
        />
        {active ? (
          <ChatThread
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
        <div aria-hidden={!showContact} className={cn('hidden overflow-hidden border-l transition-colors duration-300 lg:block', !showContact && 'pointer-events-none border-l-transparent')}>
          <div className={cn('h-full w-80 transition-[opacity,transform] duration-300 ease-out', showContact ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0')}>
            {active && <ChatProfileDetails conversation={active} onClose={() => setShowContact(false)} />}
          </div>
        </div>
      </div>

      {!isLg && active && (
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
