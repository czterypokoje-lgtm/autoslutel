'use client';

import Link from 'next/link';
import { Calendar, Car, CheckCircle2, Clock, ExternalLink, MapPin, MessageCircle, MoreHorizontal, Phone, PhoneCall, Tag, Wrench, X } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInitials } from '@/lib/utils';
import { waLink } from '@/lib/whatsapp';
import { usePreviewLanguage } from '../../PreviewLanguage';
import type { Conversation } from '../ConversationConsole';

import { CHANNEL_LABEL, displayName, duration, longDate, OUTCOME_LABEL } from './data';

const LEAD_STATUS: Record<string, string> = { new: 'Nieuw', qualified: 'Gekwalificeerd', contacted: 'Gebeld', sold: 'Verkocht', rejected: 'Afgewezen', duplicate: 'Dubbel' };

function Row({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="ml-auto truncate text-sm">{children}</span>
    </div>
  );
}

export function ChatProfileDetails({ conversation, onClose }: { conversation: Conversation; onClose?: () => void }) {
  const { t } = usePreviewLanguage();
  const name = displayName(conversation);
  const { lead, job } = conversation;
  const wa = waLink(conversation.phone, '');

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="shrink-0">
          <AvatarFallback className="bg-background">{getInitials(name).slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate leading-5 font-medium">{name}</div>
          <div className="text-muted-foreground truncate text-xs">{lead ? t('Lead') : t('Nog geen lead bij dit nummer')}</div>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={t('Sluiten')} onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button size="icon-sm" variant="ghost" aria-label={t('Bellen')} asChild disabled={!conversation.phone}><a href={conversation.phone ? `tel:${conversation.phone}` : undefined}><PhoneCall className="size-3.5" /></a></Button>
        <Button size="icon-sm" variant="ghost" aria-label="WhatsApp" asChild><a href={wa ?? undefined} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" /></a></Button>
        <Button size="icon-sm" variant="ghost" aria-label={t('Leads')} asChild><Link href={`/admin/leads/lijst?q=${encodeURIComponent(conversation.phone ?? '')}&dagen=all`}><ExternalLink className="size-3.5" /></Link></Button>
        <Button size="icon-sm" variant="ghost" aria-label={t('Meer')} disabled><MoreHorizontal className="size-3.5" /></Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList variant="line" className="w-full justify-between border-b px-0 **:data-[slot=tabs-trigger]:flex-1">
          <TabsTrigger value="details">{t('Gegevens')}</TabsTrigger>
          <TabsTrigger value="activity" disabled>{t('Activiteit')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 text-sm">
          <Row icon={Phone} label={t('Telefoon')}>{conversation.phone ?? '—'}</Row>
          <Row icon={MessageCircle} label={t('Kanaal')}>{t(CHANNEL_LABEL[conversation.channel] ?? conversation.channel)}</Row>
          <Row icon={Clock} label={t('Duur')}>{duration(conversation.durationSecs) ?? '—'}</Row>
          <Row icon={CheckCircle2} label={t('Uitkomst')}>
            <Badge variant="secondary">{conversation.outcome ? t(OUTCOME_LABEL[conversation.outcome] ?? conversation.outcome) : '—'}</Badge>
          </Row>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 text-sm">
          <Row icon={Car} label={t('Auto')}>{lead?.car ?? '—'}</Row>
          <Row icon={Wrench} label={t('Dienst')}>{lead?.service ?? '—'}</Row>
          <Row icon={Tag} label={t('Leadstatus')}>{lead?.status ? <Badge variant="outline">{t(LEAD_STATUS[lead.status] ?? lead.status)}</Badge> : '—'}</Row>
          <Row icon={Calendar} label={t('Lead sinds')}>{lead ? longDate(lead.createdAt) : '—'}</Row>
          <Row icon={MapPin} label={t('Postcode')}>{lead?.postcode ?? '—'}</Row>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 text-sm">
          <Row icon={Calendar} label={t('Afspraak')}>{job?.date ? `${longDate(job.date)}${job.slot ? ` · ${job.slot}` : ''}` : t('Geen')}</Row>
          {job && <Row icon={Wrench} label={t('Klus')}>{[job.service, job.car].filter(Boolean).join(' · ') || '—'}</Row>}
          {job && <Row icon={MapPin} label={t('Plaats')}>{job.city ?? '—'}</Row>}
          {job?.status && <Row icon={CheckCircle2} label={t('Status')}><Badge variant="secondary">{job.status}</Badge></Row>}
        </div>
      </div>
    </div>
  );
}
