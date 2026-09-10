'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import styles from './chat.module.css';
import { sendMessage } from '../actions';

interface Message {
  id: string;
  channel_id: string;
  technician_id: string | null;
  user_id: string | null;
  parent_id: string | null;
  content: string;
  created_at: string;
  technicians?: { name: string } | null;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  target_make: string | null;
}

/** The one field this component actually reads off a realtime INSERT. */
interface InsertPayload {
  new: Message;
}

export default function ChatClient({
  channel,
  initialMessages,
}: {
  channel: Channel;
  initialMessages: Message[];
}) {
  /*
   * Messages the socket has delivered since mount, kept separate from the
   * server's own list rather than merged into one state. Merging into a
   * single `messages` state meant syncing it back to `initialMessages`
   * inside a useEffect on every prop change — a second render for something
   * that render could already compute. This is that computation instead:
   * pure, derived, no effect needed to keep it honest.
   */
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  /*
   * Created once, not on every render. createSupabaseBrowserClient() builds
   * a brand new client each call — fine for the one-off sign-in/sign-out use
   * it was written for, wrong for something a persistent realtime
   * subscription depends on. Without this, every re-render (any message
   * arriving is one) produced a new client, and since the effect below has
   * that client in its dependency array, the whole subscription tore down
   * and reconnected on every single message — the socket never actually
   * stayed connected long enough to be reliable.
   */
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload: InsertPayload) => {
          const newMsg = payload.new;
          if (newMsg.parent_id) return;

          // The raw row has no joined technician name yet — one extra read
          // to get the sender's name, same shape as the server's own query.
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(channel.id, input.trim(), null);
      setInput('');
      /*
       * No router.refresh() here on purpose. The insert this just made
       * broadcasts over the same realtime subscription every other viewer
       * gets it through — the sender is not special-cased by Postgres's
       * replication, so it arrives the same way within milliseconds.
       * Refreshing forced a full re-fetch of this page *and* the layout's
       * server/channel sidebar queries just to show one line of text.
       */
    } catch (err) {
      console.error(err);
      alert('Verzenden mislukt');
    } finally {
      setSending(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <span className={styles.hash}>#</span>
        <span className={styles.title}>{channel.name}</span>
        {channel.type === 'make' && <span className={styles.topic}>• Alleen monteurs met {channel.target_make} dekking</span>}
      </div>

      <div className={styles.messages}>
        {messages.map((m) => {
          const senderName = m.technician_id
            ? (m.technicians?.name || 'Monteur')
            : (m.user_id ? 'Kantoor' : 'Systeem');
          return (
            <div key={m.id} className={styles.message}>
              <div className={styles.avatar}>
                {senderName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className={styles.meta}>
                  <span className={styles.sender}>{senderName}</span>
                  <span className={styles.time}>{formatTime(m.created_at)}</span>
                </div>
                <div className={styles.content}>{m.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <input
          className={styles.input}
          placeholder={`Bericht in #${channel.name}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
      </form>
    </div>
  );
}
