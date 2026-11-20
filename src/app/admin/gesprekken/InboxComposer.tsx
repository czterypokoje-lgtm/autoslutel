'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { waLink } from '@/lib/whatsapp';
import type { Conversation } from './ConversationConsole';

type ThreadInfo = NonNullable<Conversation['thread']>;

const MODE_LABEL: Record<ThreadInfo['aiMode'], string> = {
  off: 'Assistent uit',
  draft: 'Assistent maakt concept',
  auto: 'Assistent antwoordt zelf',
};

/**
 * Reply box for an inbox thread. Used by both looks of the screen. The text
 * starts as the assistant's latest draft when there is one; sending as a
 * person is the takeover — the server drops 'auto' on the thread by itself.
 */
export default function InboxComposer({ thread, phone }: { thread: ThreadInfo; phone: string | null }) {
  const router = useRouter();
  const [text, setText] = React.useState(thread.draft ?? '');
  const [mode, setMode] = React.useState<ThreadInfo['aiMode']>(thread.aiMode);
  const [status, setStatus] = React.useState(thread.status);
  const [busy, setBusy] = React.useState<null | 'send' | 'draft' | 'mode' | 'status'>(null);
  const [note, setNote] = React.useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  async function call(body: Record<string, unknown>, kind: NonNullable<typeof busy>) {
    setBusy(kind);
    setNote(null);
    try {
      const res = await fetch('/api/admin/inbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId: thread.id, ...body }) });
      const json = (await res.json().catch(() => ({}))) as { error?: string; draft?: { reply: string; needsHuman: boolean; reason: string } };
      if (!res.ok) {
        setNote({ tone: 'bad', text: json.error ?? 'Mislukt' });
        return null;
      }
      return json;
    } finally {
      setBusy(null);
    }
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const ok = await call({ action: 'send', text: text.trim() }, 'send');
    if (ok) {
      setText('');
      if (mode === 'auto') setMode('draft');
      setNote({ tone: 'ok', text: thread.canReply === 'email' ? 'E-mail verstuurd.' : 'WhatsApp verstuurd.' });
      router.refresh();
    }
  };
  const draft = async () => {
    const json = await call({ action: 'draft' }, 'draft');
    if (json?.draft) {
      if (json.draft.reply) setText(json.draft.reply);
      setNote({ tone: json.draft.needsHuman ? 'bad' : 'ok', text: json.draft.reason || (json.draft.reply ? 'Concept klaar — lees na en verstuur.' : 'Geen antwoord voorgesteld.') });
      router.refresh();
    }
  };
  const changeMode = async (next: ThreadInfo['aiMode']) => {
    const prev = mode;
    setMode(next);
    const ok = await call({ action: 'mode', mode: next }, 'mode');
    if (!ok) setMode(prev);
  };
  const toggleStatus = async () => {
    const next = status === 'open' ? 'closed' : 'open';
    const ok = await call({ action: 'status', status: next }, 'status');
    if (ok) {
      setStatus(next);
      router.refresh();
    }
  };

  const blocked =
    !thread.canReply
      ? 'Geen e-mailadres of WhatsApp-nummer bij dit gesprek.'
      : thread.canReply === 'whatsapp' && !thread.windowOpen
        ? 'WhatsApp laat alleen een antwoord toe binnen 24 uur na het laatste bericht van de klant.'
        : null;
  const wa = phone ? waLink(phone, text) : null;

  return (
    <form onSubmit={send} className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">
          {thread.canReply === 'email' ? `Antwoord per e-mail${thread.email ? ` aan ${thread.email}` : ''}` : thread.canReply === 'whatsapp' ? 'Antwoord via WhatsApp' : 'Alleen lezen'}
        </span>
        <select
          aria-label="Assistent"
          className="border-input bg-background ml-auto h-7 rounded-md border px-2 text-xs"
          value={mode}
          disabled={busy !== null}
          onChange={(e) => changeMode(e.target.value as ThreadInfo['aiMode'])}
        >
          {(Object.keys(MODE_LABEL) as ThreadInfo['aiMode'][]).map((m) => (
            <option key={m} value={m}>{MODE_LABEL[m]}</option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={busy !== null} onClick={toggleStatus}>
          {status === 'open' ? 'Sluiten' : 'Heropenen'}
        </Button>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={blocked ?? (thread.canReply === 'email' ? 'Schrijf een e-mail…' : 'Schrijf een WhatsApp-bericht…')}
        disabled={busy === 'send'}
        rows={thread.canReply === 'email' ? 6 : 3}
        className="min-h-20 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={draft}>
          <Sparkles className="size-3.5" /> {busy === 'draft' ? 'Even denken…' : 'AI-concept'}
        </Button>
        {blocked && wa && text.trim() && (
          <a className="text-xs underline" href={wa} target="_blank" rel="noopener noreferrer">Open in WhatsApp op je telefoon</a>
        )}
        {note && <span className={note.tone === 'bad' ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>{note.text}</span>}
        <Button type="submit" size="sm" className="ml-auto" disabled={busy !== null || !!blocked || !text.trim()}>
          <Send className="size-3.5" /> {busy === 'send' ? 'Versturen…' : 'Verstuur'}
        </Button>
      </div>
    </form>
  );
}
