'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from 'cn';
import { ArrowLeft, Copy, ExternalLink, MessageCircle, MoreHorizontal, PhoneCall, Send, UserRound } from 'lucide-react';

import { Avatar, AvatarBadge, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent, BubbleGroup } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';
import { Marker, MarkerContent } from '@/components/ui/marker';
import { Message, MessageAvatar, MessageContent, MessageFooter } from '@/components/ui/message';
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from '@/components/ui/message-scroller';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getInitials } from '@/lib/utils';
import { waLink } from '@/lib/whatsapp';
import { usePreviewLanguage } from '../../PreviewLanguage';
import type { Conversation } from '../ConversationConsole';

import { CHANNEL_LABEL, clock, displayName, duration, longDate, OUTCOME_LABEL } from './data';

export function ChatThread({ conversation, showBackButton, onBack, onOpenContact, className }: {
  conversation: Conversation;
  now: number;
  showBackButton?: boolean;
  onBack?: () => void;
  onOpenContact?: () => void;
  className?: string;
}) {
  const { t } = usePreviewLanguage();
  const name = displayName(conversation);
  const sub = [t(CHANNEL_LABEL[conversation.channel] ?? conversation.channel), duration(conversation.durationSecs), conversation.outcome ? t(OUTCOME_LABEL[conversation.outcome] ?? conversation.outcome) : null].filter(Boolean).join(' · ');
  const wa = waLink(conversation.phone, `Goedendag${conversation.lead?.name ? ` ${conversation.lead.name.split(' ')[0]}` : ''}, hier KeyForCars. `);

  return (
    <div className={cn('flex h-full flex-col py-3', className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label={t('Terug naar gesprekken')} onClick={onBack}>
                <ArrowLeft />
              </Button>
            )}
            <Avatar className="size-8">
              <AvatarFallback className="bg-background text-foreground">{getInitials(name).slice(0, 2)}</AvatarFallback>
              {conversation.job && <AvatarBadge className="bg-green-600 dark:bg-green-800" />}
            </Avatar>
            <div>
              <div className="text-sm font-medium">{name}</div>
              <div className="text-muted-foreground text-xs leading-3">{sub}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {conversation.phone && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={t('Bellen')} asChild><a href={`tel:${conversation.phone}`}><PhoneCall /></a></Button>
                </TooltipTrigger>
                <TooltipContent>{t('Bellen')}</TooltipContent>
              </Tooltip>
            )}
            {wa && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="WhatsApp" asChild><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /></a></Button>
                </TooltipTrigger>
                <TooltipContent>WhatsApp</TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={t('Meer acties')}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={onOpenContact}>
                    <UserRound />
                    {t('Klantgegevens')}
                  </DropdownMenuItem>
                  {conversation.phone && (
                    <DropdownMenuItem onSelect={() => navigator.clipboard?.writeText(conversation.phone!)}>
                      <Copy />
                      {t('Nummer kopiëren')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={conversation.lead ? `/admin/leads/lijst?q=${encodeURIComponent(conversation.phone ?? '')}&dagen=all` : `/admin/leads/lijst?q=${encodeURIComponent(conversation.phone ?? '')}&dagen=all`}>
                      <ExternalLink />
                      {conversation.lead ? t('Lead openen') : t('Zoek in leads')}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator />
      </div>

      <MessageScrollerProvider autoScroll>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-6 px-2 py-8">
              <Marker variant="separator">
                <MarkerContent>{longDate(conversation.createdAt)} · {clock(conversation.createdAt)}</MarkerContent>
              </Marker>

              {conversation.summary && (
                <p className="text-muted-foreground mx-auto max-w-prose text-center text-xs leading-relaxed">{conversation.summary}</p>
              )}

              {conversation.turns.length === 0 && (
                <p className="text-muted-foreground text-center text-sm">{t('Geen transcript bij dit gesprek.')}</p>
              )}

              {conversation.turns.map((turn, index) => {
                const isOutbound = turn.role === 'agent';
                const align = isOutbound ? 'end' : 'start';
                const senderName = isOutbound ? 'KeyForCars assistent' : name;
                return (
                  <MessageScrollerItem key={index} messageId={String(index)} scrollAnchor={isOutbound}>
                    <Message align={align}>
                      <MessageAvatar>
                        <Avatar>
                          <AvatarFallback className={cn('bg-muted text-foreground text-xs', isOutbound && 'bg-primary text-primary-foreground')}>
                            {getInitials(senderName).slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </MessageAvatar>
                      <MessageContent>
                        <BubbleGroup>
                          <Bubble variant={isOutbound ? 'default' : 'muted'} align={align}>
                            <BubbleContent>{turn.message}</BubbleContent>
                          </Bubble>
                        </BubbleGroup>
                        <MessageFooter>{isOutbound ? t('Assistent') : t('Klant')}</MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="px-2">
        <Tabs defaultValue="reply" className="gap-0 rounded-md border">
          <TabsList variant="line" className="w-full justify-start gap-2 border-b px-3 group-data-horizontal/tabs:h-10 **:data-[slot=tabs-trigger]:border-x-0 **:data-[slot=tabs-trigger]:px-6">
            <TabsTrigger value="reply" className="flex-none px-1">{t('Antwoord')}</TabsTrigger>
            <TabsTrigger value="note" className="flex-none px-1">{t('Interne notitie')}</TabsTrigger>
          </TabsList>

          <TabsContent value="reply" className="m-0">
            <ReplyComposer phone={conversation.phone} placeholder={conversation.phone ? t('Typ een WhatsApp-bericht… (opent in WhatsApp)') : t('Geen nummer bij dit gesprek.')} />
          </TabsContent>
          <TabsContent value="note" className="m-0">
            <NoteComposer leadId={conversation.lead?.id ?? null} placeholder={conversation.lead ? t('Schrijf een interne notitie bij deze lead…') : t('Geen lead gekoppeld aan dit nummer; notities horen bij een lead.')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* Replies leave through WhatsApp (wa.me) — the CRM has no send API of its own yet. */
function ReplyComposer({ phone, placeholder }: { phone: string | null; placeholder: string }) {
  const [text, setText] = React.useState('');
  const href = waLink(phone, text);
  return (
    <form className="w-full" onSubmit={(event) => { event.preventDefault(); if (href) { window.open(href, '_blank', 'noopener'); setText(''); } }}>
      <Composer value={text} onChange={setText} placeholder={placeholder} disabled={!phone}>
        <InputGroupButton type="submit" variant="default" size="icon-sm" className="ml-auto" disabled={!href || !text.trim()}>
          <Send />
          <span className="sr-only">Verstuur via WhatsApp</span>
        </InputGroupButton>
      </Composer>
    </form>
  );
}

function NoteComposer({ leadId, placeholder }: { leadId: string | null; placeholder: string }) {
  const [text, setText] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!leadId || !text.trim()) return;
    setState('busy');
    const res = await fetch(`/api/admin/leads/${leadId}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text.trim() }) }).catch(() => null);
    if (res?.ok) { setText(''); setState('saved'); } else setState('error');
  }
  return (
    <form className="w-full" onSubmit={submit}>
      <Composer value={text} onChange={(v) => { setText(v); setState('idle'); }} placeholder={placeholder} disabled={!leadId}>
        {state === 'saved' && <span className="text-muted-foreground text-xs">Notitie opgeslagen bij de lead.</span>}
        {state === 'error' && <span className="text-destructive text-xs">Opslaan mislukt.</span>}
        <InputGroupButton type="submit" variant="default" size="icon-sm" className="ml-auto" disabled={!leadId || !text.trim() || state === 'busy'}>
          <Send />
          <span className="sr-only">Notitie opslaan</span>
        </InputGroupButton>
      </Composer>
    </form>
  );
}

function Composer({ value, onChange, placeholder, disabled, children }: { value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <InputGroup className="border-0 bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:bg-transparent">
      <InputGroupTextarea
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-14 px-3 py-2.5 text-sm ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:aria-invalid:ring-0"
      />
      <InputGroupAddon align="block-end">{children}</InputGroupAddon>
    </InputGroup>
  );
}
