'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUp, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePreviewLanguage } from './PreviewLanguage';

type Message = { side: 'staff' | 'bot'; text: string; href?: string; lang: 'en' | 'nl' };

export function StaffChat({ office }: { office: boolean }) {
  const { english } = usePreviewLanguage();
  const l = (en: string, nl: string) => english ? en : nl;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const history = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [messages, busy]);

  function close() { setOpen(false); toggle.current?.focus(); }
  async function send(message: string) {
    if (!message.trim() || busy) return;
    const lang = english ? 'en' : 'nl';
    setDraft('');
    setMessages((items) => [...items, { side: 'staff', text: message.trim(), lang }]);
    setBusy(true);
    let answer: { text: string; href?: string };
    try {
      const response = await fetch('/api/admin/kfc-staff-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, language: lang,
          // Only turns from the current panel language, so an EN/NL switch starts a clean context.
          history: messages.filter((item) => item.lang === lang).slice(-6)
            .map(({ side, text }) => ({ role: side === 'staff' ? 'user' : 'assistant', content: text.slice(0, 500), lang })),
        }),
      });
      if (!response.ok) throw Error('Staff assistant unavailable');
      answer = await response.json();
    } catch {
      answer = { text: l('Could not reach the assistant. Try again.', 'De assistent is niet bereikbaar. Probeer opnieuw.') };
    } finally { setBusy(false); }
    setMessages((items) => [...items, { side: 'bot', ...answer, lang }]);
  }

  const examples = [
    l('Order #79214', 'Bestelling #79214'),
    l('Stock for SKU ALRC02', 'Voorraad voor SKU ALRC02'),
    ...(office ? [l('Summarize the latest conversation', 'Vat het laatste gesprek samen'), l('Draft a support email', 'Maak een conceptmail')] : []),
  ];

  return <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
    {open && <section className="absolute right-0 bottom-16 flex h-[min(570px,calc(100dvh-100px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl"
      aria-label={l('Staff Assistant', 'Teamassistent')} onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">{l('Staff Assistant', 'Teamassistent')}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={close} aria-label={l('Close chat', 'Chat sluiten')}><X className="size-4" /></Button>
      </header>
      <div ref={history} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" role="log" aria-live="polite">
        {messages.length === 0 && <div className="grid gap-2">
          <p className="text-sm">{l('What can I help you find?', 'Waarmee kan ik je helpen?')}</p>
          {examples.map((message) => <Button key={message} type="button" variant="outline" className="h-auto w-fit whitespace-normal text-left" onClick={() => void send(message)}>{message}</Button>)}
        </div>}
        {messages.map((message, index) => <div key={index} className={'max-w-[90%] rounded-xl p-3 text-sm whitespace-pre-wrap ' +
          (message.side === 'staff' ? 'self-end bg-primary text-primary-foreground' : 'self-start bg-muted')}>
          {message.text}
          {message.href?.startsWith('/admin/') && <Link className="mt-2 block underline" href={message.href}>{l('Open in CRM', 'Open in CRM')}</Link>}
        </div>)}
        {busy && <p className="text-muted-foreground text-sm">{l('Looking up…', 'Bezig met opzoeken…')}</p>}
      </div>
      <form className="flex items-center gap-2 border-t p-3" onSubmit={(event: FormEvent) => { event.preventDefault(); void send(draft); }}>
        <input ref={input} className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" maxLength={600} value={draft}
          onChange={(event) => setDraft(event.target.value)} placeholder={l('Write a message…', 'Schrijf een bericht…')} aria-label={l('Message', 'Bericht')} />
        <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label={l('Send message', 'Bericht versturen')}><ArrowUp className="size-4" /></Button>
      </form>
    </section>}
    <Button ref={toggle} type="button" size="icon" className="size-12 rounded-full shadow-lg" aria-expanded={open}
      aria-label={open ? l('Close staff assistant', 'Teamassistent sluiten') : l('Open staff assistant', 'Teamassistent openen')}
      onClick={() => open ? close() : setOpen(true)}>{open ? <X className="size-5" /> : <MessageCircle className="size-5" />}</Button>
  </div>;
}
