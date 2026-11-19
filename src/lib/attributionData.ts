import type { SupabaseClient } from '@supabase/supabase-js';
import { phoneKey, type AttrClick, type AttrLead, type AttrOtherJob } from './adAttribution.ts';

/**
 * The tables the matcher compares jobs with, read page by page (PostgREST cuts
 * a plain select at 1000 rows). Only rows that carry a click id are read (jobs:
 * also those with a lead), and only the columns the matcher uses. The phone
 * columns of leads, and call_clicks.chat_phone_key, are read to compare numbers
 * on the server and never leave it.
 */
const PAGE = 1000;
const MAX_ROWS = 10000;
const ANY_CLICK_ID = 'gclid.not.is.null,wbraid.not.is.null,gbraid.not.is.null';
const CLICK_COLUMNS = 'id, ref, created_at, claimed_by_job_id, gclid, wbraid, gbraid';

async function readPaged<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  sinceIso: string,
  filter: string = ANY_CLICK_ID
): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .or(filter)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { rows, error: error.message };
    rows.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < PAGE) break;
  }
  return { rows, error: null };
}

/**
 * call_clicks with a click id. Migration 0088 adds the two chat_phone columns;
 * until it has been run the read falls back to the old columns (said loudly in
 * the log), so the other rules keep working and only the code rule is off.
 */
async function readClicks(supabase: SupabaseClient, sinceIso: string) {
  const full = await readPaged<AttrClick>(
    supabase,
    'call_clicks',
    `${CLICK_COLUMNS}, chat_phone_key, chat_phone_conflict`,
    sinceIso
  );
  if (!full.error) return full;
  console.error('attribution: call_clicks read with chat_phone columns failed, retrying without (migration 0088 run?):', full.error);
  return readPaged<AttrClick>(supabase, 'call_clicks', CLICK_COLUMNS, sinceIso);
}

/** Leads, call clicks and other jobs' click ids, created since `sinceIso`. */
export async function loadAttributionPool(supabase: SupabaseClient, sinceIso: string) {
  const [leads, clicks, otherJobs] = await Promise.all([
    readPaged<AttrLead>(supabase, 'leads', 'id, phone, phone_e164, created_at, gclid, wbraid, gbraid', sinceIso),
    readClicks(supabase, sinceIso),
    /* Every job that carries a click id or a lead: the click ids a recovery must not hand out twice. */
    readPaged<AttrOtherJob>(supabase, 'jobs', 'id, lead_id, gclid, wbraid, gbraid', sinceIso, `${ANY_CLICK_ID},lead_id.not.is.null`),
  ]);
  return { leads: leads.rows, clicks: clicks.rows, otherJobs: otherJobs.rows, error: leads.error ?? clicks.error ?? otherJobs.error };
}

export interface ChatPhoneResult {
  /** Key written to a click that had none. */
  set: number;
  /** The click already held this same number. */
  same: number;
  /** The click held another number: now flagged as shared. */
  conflict: number;
  /** No click carries this code, or the number is too short to be a key. */
  skipped: number;
}

/**
 * Remembers which number sent a code. The first number wins and is never
 * overwritten; a second, different number flags the click as shared instead
 * (see migration 0088). Counts only come back, never a number.
 */
export async function recordChatPhones(
  supabase: SupabaseClient,
  pairs: readonly { ref: string; phone: string }[]
): Promise<ChatPhoneResult & { error: string | null }> {
  const result: ChatPhoneResult = { set: 0, same: 0, conflict: 0, skipped: 0 };
  const byRef = new Map<string, string>();
  for (const { ref, phone } of pairs) {
    const key = phoneKey(phone);
    if (!key) result.skipped++;
    else if (byRef.has(ref) && byRef.get(ref) !== key) byRef.set(ref, 'conflict'); /* the same batch names two numbers */
    else byRef.set(ref, key);
  }

  for (const [ref, key] of byRef) {
    if (key === 'conflict') {
      const { data, error } = await supabase.from('call_clicks').update({ chat_phone_conflict: true }).eq('ref', ref).select('id');
      if (error) return { ...result, error: error.message };
      if (data?.length) result.conflict++;
      else result.skipped++;
      continue;
    }
    /* Only a click that has no number yet takes this one. */
    const first = await supabase.from('call_clicks').update({ chat_phone_key: key }).eq('ref', ref).is('chat_phone_key', null).select('id');
    if (first.error) return { ...result, error: first.error.message };
    if (first.data?.length) {
      result.set++;
      continue;
    }
    const { data: current, error } = await supabase.from('call_clicks').select('chat_phone_key').eq('ref', ref).maybeSingle<{ chat_phone_key: string | null }>();
    if (error) return { ...result, error: error.message };
    if (!current) result.skipped++;
    else if (current.chat_phone_key === key) result.same++;
    else {
      const flagged = await supabase.from('call_clicks').update({ chat_phone_conflict: true }).eq('ref', ref);
      if (flagged.error) return { ...result, error: flagged.error.message };
      result.conflict++;
    }
  }
  return { ...result, error: null };
}
