'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { toWebp } from '@/lib/toWebp';
import { sendMessage } from '../actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../../PreviewLanguage';

interface Message {
  id: string;
  channel_id: string;
  technician_id: string | null;
  user_id: string | null;
  parent_id: string | null;
  content: string;
  attachment_url: string | null;
  created_at: string;
  technicians?: { name: string } | null;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  target_make: string | null;
}

interface InsertPayload {
  new: Message;
}

/**
 * Studio restyle of ChatClient: same realtime subscription and the same
 * sendMessage()/upload calls — only the markup changes, onto shadcn
 * Avatar/Input/Button.
 */
export default function StudioChatClient({ channel, initialMessages }: { channel: Channel; initialMessages: Message[] }) {
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supabase] = useState(() => createSupabaseBrowserClient());

  const messages = useMemo(() => {
    const merged = [...initialMessages];
    for (const live of liveMessages) {
      if (!merged.some((m) => m.id === live.id)) merged.push(live);
    }
    return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [initialMessages, liveMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  useEffect(() => {
    const channelSub = supabase
      .channel(`room:${channel.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channel.id}` },
        (payload: InsertPayload) => {
          const newMsg = payload.new;
          if (newMsg.parent_id) return;

          supabase
            .from('chat_messages')
            .select('*, technicians:technician_id(name)')
            .eq('id', newMsg.id)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error('Kon nieuw bericht niet ophalen:', error.message);
                return;
              }
              if (!data) return;
              setLiveMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [channel.id, supabase]);

  function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.previewUrl);
    setPendingPhoto({ file, previewUrl: URL.createObjectURL(file) });
  }

  function clearPendingPhoto() {
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.previewUrl);
    setPendingPhoto(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!input.trim() && !pendingPhoto) || sending) return;

    setSending(true);
    try {
      let attachmentUrl: string | null = null;
      if (pendingPhoto) {
        setUploadingPhoto(true);
        const webp = await toWebp(pendingPhoto.file).catch(() => pendingPhoto.file);
        const response = await fetch(`/api/admin/netwerk/chat/upload?channel=${channel.id}`, {
          method: 'POST',
          headers: { 'Content-Type': webp.type },
          body: webp,
        });
        const body = await response.json();
        setUploadingPhoto(false);
        if (!response.ok) throw new Error(body?.error ?? 'Uploaden mislukt');
        attachmentUrl = body.url;
      }

      await sendMessage(channel.id, input.trim(), null, attachmentUrl);
      setInput('');
      clearPendingPhoto();
    } catch (err) {
      console.error(err);
      alert('Verzenden mislukt');
    } finally {
      setSending(false);
      setUploadingPhoto(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <span className="text-muted-foreground">#</span>
        <span className="font-medium">{channel.name}</span>
        {channel.type === 'make' && (
          <span className="text-muted-foreground text-xs">
            <PreviewText>{`• Alleen monteurs met ${channel.target_make} dekking`}</PreviewText>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {messages.map((m) => {
            const senderName = m.technician_id ? m.technicians?.name || 'Monteur' : m.user_id ? 'Kantoor' : 'Systeem';
            return (
              <div key={m.id} className="flex items-start gap-3">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">{senderName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{senderName}</span>
                    <span className="text-muted-foreground text-xs">{formatTime(m.created_at)}</span>
                  </div>
                  {m.content && <div className="text-sm whitespace-pre-wrap">{m.content}</div>}
                  {m.attachment_url && (
                    <a href={m.attachment_url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- chat attachments are remote, already sized */}
                      <img className="mt-1 max-h-60 max-w-60 rounded-lg border" src={m.attachment_url} alt="Bijlage" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form className="flex shrink-0 flex-col gap-2 border-t p-3" onSubmit={handleSend}>
        {pendingPhoto && (
          <div className="flex items-center gap-2 rounded-lg border p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={pendingPhoto.previewUrl} alt="" className="size-10 rounded object-cover" />
            <span className="text-muted-foreground flex-1 text-xs"><PreviewText>{uploadingPhoto ? 'Uploaden…' : 'Foto klaar om te versturen'}</PreviewText></span>
            <Button type="button" size="sm" variant="outline" onClick={clearPendingPhoto} disabled={sending}>
              <PreviewText>Verwijderen</PreviewText>
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickPhoto} className="hidden" />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            aria-label="Foto bijvoegen"
            title="Foto bijvoegen"
          >
            <Paperclip className="size-4" />
          </Button>
          <Input
            placeholder={`Bericht in #${channel.name}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
        </div>
      </form>
    </div>
  );
}
