import { tagsOf } from './topics';
import type { Conversation } from '../ConversationConsole';

const tone = (tag:string) => /^(spoed|dringend|urgent)$/.test(tag) ? 'bg-rose-100 text-rose-900' : /^(bijmaken|programmeren|reparatie|retour|vervangen)$/.test(tag) ? 'bg-violet-100 text-violet-900' : /^(sleutel|transponder|afstandsbediening|smartkey)$/.test(tag) ? 'bg-teal-100 text-teal-900' : 'bg-blue-100 text-blue-900';
export function ConversationTags({ conversation }: { conversation: Conversation }) {
  return <span className="flex flex-wrap gap-1">{tagsOf(conversation).map((tag) =>
    <span key={tag} className={'rounded-full px-2 py-0.5 text-xs font-medium ' + tone(tag)}>#{tag}</span>)}</span>;
}
