'use client';

import { useMemo, useState } from 'react';
import { cn } from 'cn';
import { ChevronDown, MessageCircle, Phone, Search } from 'lucide-react';

import { Avatar, AvatarBadge, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInitials } from '@/lib/utils';
import { usePreviewLanguage } from '../../PreviewLanguage';
import type { Conversation } from '../ConversationConsole';

import { displayName, type Group, groupOf, previewOf, shortTime, subjectOf } from './data';

const GROUP_ORDER: Group[] = ['Vandaag', 'Gisteren', 'Eerder'];
type Outcome = 'all' | 'success' | 'failure';

export function ChatConversationList({ conversations, selectedId, now, title, onSelectConversation, className }: {
  conversations: Conversation[];
  selectedId: string | null;
  now: number;
  title: string;
  onSelectConversation: (conversation: Conversation) => void;
  className?: string;
}) {
  const { t } = usePreviewLanguage();
  const [outcome, setOutcome] = useState<Outcome>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) =>
      (outcome === 'all' || c.outcome === outcome)
      && (!q || [displayName(c), c.phone, c.summary, c.lead?.car, ...c.turns.map((x) => x.message)].some((s) => s?.toLowerCase().includes(q))));
  }, [conversations, outcome, query]);

  const groups = GROUP_ORDER.map((group) => ({ group, conversations: filtered.filter((c) => groupOf(c.createdAt, now) === group) })).filter((g) => g.conversations.length);
  const count = (o: Outcome) => (o === 'all' ? conversations.length : conversations.filter((c) => c.outcome === o).length);

  return (
    <div className={cn('flex h-full flex-col gap-3 pt-3', className)}>
      <div className="flex items-center justify-between gap-4 px-3 py-0.5">
        <h1 className="text-xl leading-none font-medium">{title}</h1>
      </div>
      <div className="px-3">
        <InputGroup className="h-7 w-full">
          <InputGroupInput className="h-7" placeholder={t('Zoek gesprekken…')} value={query} onChange={(e) => setQuery(e.target.value)} />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <Separator />

      <Tabs value={outcome} onValueChange={(v) => setOutcome(v as Outcome)}>
        <TabsList variant="line" className="w-full border-b px-0 **:data-[slot=tabs-trigger]:border-x-0">
          <TabsTrigger value="all">{t('Alle')} <span className="text-muted-foreground text-xs">({count('all')})</span></TabsTrigger>
          <TabsTrigger value="success">{t('Gelukt')} <span className="text-muted-foreground text-xs">({count('success')})</span></TabsTrigger>
          <TabsTrigger value="failure">{t('Mislukt')} <span className="text-muted-foreground text-xs">({count('failure')})</span></TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea type="hover" className="h-full min-h-0 flex-1 overflow-hidden [&_[data-orientation=vertical][data-slot=scroll-area-scrollbar]]:w-1.5">
          <div className="flex flex-col gap-3 pt-0">
            {groups.length === 0 && <p className="text-muted-foreground px-4 py-6 text-sm">{t('Geen gesprekken gevonden.')}</p>}
            {groups.map(({ group, conversations }) => (
              <Collapsible key={group} defaultOpen>
                <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between gap-1 px-3 py-2 text-xs font-medium [&[data-state=open]>svg]:rotate-180">
                  {t(group)}
                  <ChevronDown className="size-3 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-1 px-2">
                    {conversations.map((conversation) => {
                      const isSelected = selectedId === conversation.id;
                      const name = displayName(conversation);
                      const Icon = conversation.channel === 'whatsapp' ? MessageCircle : Phone;
                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          className={cn('w-full overflow-hidden rounded-lg px-2.5 py-2.5 text-left transition-colors ring-inset', isSelected ? 'bg-muted ring-border ring-1' : 'hover:bg-muted/75')}
                          onClick={(event) => { event.currentTarget.blur(); onSelectConversation(conversation); }}
                        >
                          <div className="flex min-w-0 items-start gap-2.5">
                            <Avatar className="shrink-0 **:data-[slot=avatar-badge]:size-2.5">
                              <AvatarFallback className={cn('text-foreground text-xs transition-colors duration-400', isSelected && 'bg-background/50')}>
                                {getInitials(name).slice(0, 2)}
                              </AvatarFallback>
                              {conversation.job && <AvatarBadge className="bg-green-600 dark:bg-green-800" />}
                            </Avatar>
                            <div className="w-0 flex-1 overflow-hidden">
                              <div className="flex w-full items-center justify-between gap-2">
                                <div className="truncate text-sm leading-5 font-medium">{name}</div>
                                <span className="text-muted-foreground text-xs leading-5 text-nowrap">{shortTime(conversation.createdAt, now)}</span>
                              </div>
                              <div className="flex min-w-0 items-end gap-2">
                                <div className="w-0 flex-1 overflow-hidden">
                                  <div className="text-foreground/90 truncate text-xs leading-4 font-medium">{subjectOf(conversation)}</div>
                                  <div className="text-muted-foreground truncate text-xs leading-4">{previewOf(conversation)}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="text-muted-foreground grid size-5 place-items-center"><Icon className="size-3 opacity-70" /></div>
                                  {conversation.outcome === 'failure' && (
                                    <div className="bg-destructive/90 text-primary-foreground grid size-5 place-items-center rounded-full text-xs">!</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
