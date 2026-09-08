'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

export default function ChatClient({
  channel,
  initialMessages,
  userId,
}: {
  channel: any;
  initialMessages: Message[];
  userId: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowserClient();

  // Sync state with server-provided messages to handle fallback/refresh
  useEffect(() => {
    // Merge server messages into our state in case Realtime missed them
    setMessages(prev => {
      const merged = [...prev];
      for (const im of initialMessages) {
        if (!merged.some(m => m.id === im.id)) {
          merged.push(im);
        }
      }
      return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  useEffect(() => {
    console.log('Subscribing to channel room:', channel.id);
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
        (payload: any) => {
          console.log('Realtime payload received:', payload);
          const newMsg = payload.new as Message;
          if (!newMsg.parent_id) {
            // Fetch joined data
            supabase
              .from('chat_messages')
              .select('*, technicians:technician_id(name)')
              .eq('id', newMsg.id)
              .single()
              .then(({ data, error }: { data: any, error: any }) => {
                if (error) console.error('Fetch error:', error);
                if (data) {
                  setMessages((prev) => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data as Message];
                  });
                }
              });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });

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
      // Force Next.js to re-fetch Server Components (including our page.tsx)
      router.refresh();
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
