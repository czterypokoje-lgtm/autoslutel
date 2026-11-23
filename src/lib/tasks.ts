import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, amsterdamParts, amsterdamToUtc } from './amsterdamTime.ts';

/**
 * The owner's task list, on the crm_tasks table from 0049.
 *
 * Two callers, one set of rules: the office screen (cookie-bound client, RLS
 * decides) and the owner's voice agent (service-role client, the route
 * decides). Both pass their own client in, so nothing here chooses privilege.
 */

export const TASK_SELECT = 'id, description, task_type, due_at, completed_at, lead_id, job_id, source, created_at';

export interface Task {
  id: string;
  description: string;
  task_type: string;
  due_at: string;
  completed_at: string | null;
  lead_id: string | null;
  job_id: string | null;
  source: 'crm' | 'agent';
  created_at: string;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_TIME = '09:00';
const TODAY = new Set(['vandaag', 'today', 'bugün', 'bugun']);
const TOMORROW = new Set(['morgen', 'tomorrow', 'yarın', 'yarin']);

/**
 * What the agent or a form says about "when", turned into an instant.
 *
 * Accepts an ISO timestamp, `YYYY-MM-DD`, `YYYY-MM-DD HH:mm` (Amsterdam
 * time), or the words today/tomorrow in Dutch, English and Turkish with an
 * optional `HH:mm`. A date without a time means 09:00. Anything else is null,
 * never a guess: a task on the wrong day is worse than a question back.
 */
export function parseDue(value: unknown, now: Date = new Date()): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  if (!text) return null;

  const words = text.match(/^([a-zğüşıöç]+)(?:\s+(\d{1,2}:\d{2}))?$/);
  if (words) {
    const [, word, time] = words;
    const today = amsterdamParts(now).day;
    const day = TODAY.has(word) ? today : TOMORROW.has(word) ? addDays(today, 1) : null;
    return day ? amsterdamToUtc(day, pad(time ?? DEFAULT_TIME)) : null;
  }

  const local = text.match(/^(\d{4}-\d{2}-\d{2})(?:[ t](\d{1,2}:\d{2}))?$/);
  if (local) return amsterdamToUtc(local[1], pad(local[2] ?? DEFAULT_TIME));

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const pad = (time: string) => (time.length === 4 ? `0${time}` : time);

export async function listTasks(db: SupabaseClient, opts: { open?: boolean; limit?: number } = {}): Promise<Task[]> {
  const { open = true, limit = 50 } = opts;
  let query = db.from('crm_tasks').select(TASK_SELECT).limit(limit);
  query = open
    ? query.is('completed_at', null).order('due_at', { ascending: true })
    : query.not('completed_at', 'is', null).order('completed_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export interface NewTask {
  description: string;
  due_at: Date;
  task_type?: string;
  lead_id?: string | null;
  job_id?: string | null;
  created_by?: string | null;
  source: 'crm' | 'agent';
}

export async function addTask(db: SupabaseClient, input: NewTask): Promise<Task> {
  const { data, error } = await db
    .from('crm_tasks')
    .insert({
      description: input.description,
      due_at: input.due_at.toISOString(),
      task_type: input.task_type ?? 'algemeen',
      lead_id: input.lead_id ?? null,
      job_id: input.job_id ?? null,
      created_by: input.created_by ?? null,
      source: input.source,
      assigned_to: input.created_by ?? null,
    })
    .select(TASK_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as Task;
}

export async function completeTask(db: SupabaseClient, id: string, done: boolean): Promise<void> {
  const { error } = await db
    .from('crm_tasks')
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeTask(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from('crm_tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** "di 24 nov 09:30" — the way the office reads a due date. */
export const dueLabel = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', {
    timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
