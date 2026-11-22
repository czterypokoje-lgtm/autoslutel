'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePreviewLanguage } from '../PreviewLanguage';
import { deleteBotConversation } from './actions';

export function DeleteConversation({ id }: { id: string }) {
  const { english } = usePreviewLanguage();
  const question = english
    ? 'Permanently delete this conversation from the CRM? The ElevenLabs copy will remain.'
    : 'Dit gesprek definitief verwijderen uit het CRM? De kopie in ElevenLabs blijft behouden.';

  return <form action={deleteBotConversation} onSubmit={(event) => {
    if (!window.confirm(question)) event.preventDefault();
  }}>
    <input type="hidden" name="conversation_id" value={id} />
    <Button variant="outline" size="sm" className="text-destructive">
      <Trash2 aria-hidden /> {english ? 'Delete from CRM' : 'Verwijder uit CRM'}
    </Button>
  </form>;
}
