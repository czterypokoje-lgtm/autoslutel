/**
 * WhatsApp chats beside the ad clicks they came from.
 *
 * Only an exact code counts. A wrong gclid sent to Google teaches Smart Bidding
 * to buy the wrong traffic, so a chat that fits more than one job is shown to a
 * person and never linked.
 */

export type MatchStatus =
  | 'koppelbaar'
  | 'al_gekoppeld'
  | 'wacht_op_job'
  | 'meerdere_jobs'
  | 'geen_klikid'
  | 'onbekende_code';

export interface ChatRef {
  ref: string;
  phone: string;
  at: string;
}

export interface ClickRow {
  ref: string | null;
  gclid: string | null;
  wbraid: string | null;
  gbraid: string | null;
  claimed_by_job_id: string | null;
}

export interface JobRow {
  id: string;
  status: string;
  customer_phone: string | null;
  final_price: number | string | null;
}

export interface AdMatch {
  ref: string;
  at: string;
  phoneEnd: string;
  status: MatchStatus;
  jobId: string | null;
  jobStatus: string | null;
  value: number | null;
}

const phoneKey = (value: string | null) => (value ?? '').replace(/\D/g, '').slice(-9);

export function matchChats(chats: ChatRef[], clicks: ClickRow[], jobs: JobRow[]): AdMatch[] {
  const byRef = new Map(clicks.map((c) => [c.ref, c]));

  return chats.map((chat) => {
    const click = byRef.get(chat.ref);
    const fits = jobs.filter((j) => phoneKey(j.customer_phone) === phoneKey(chat.phone));
    const claimed = click?.claimed_by_job_id ? jobs.find((j) => j.id === click.claimed_by_job_id) : undefined;
    const job = claimed ?? (fits.length === 1 ? fits[0] : undefined);

    let status: MatchStatus;
    if (!click) status = 'onbekende_code';
    else if (click.claimed_by_job_id) status = 'al_gekoppeld';
    else if (!click.gclid && !click.wbraid && !click.gbraid) status = 'geen_klikid';
    else if (fits.length > 1) status = 'meerdere_jobs';
    else if (fits.length === 1) status = 'koppelbaar';
    else status = 'wacht_op_job';

    return {
      ref: chat.ref,
      at: chat.at,
      phoneEnd: chat.phone.replace(/\D/g, '').slice(-4),
      status,
      jobId: job?.id ?? null,
      jobStatus: job?.status ?? null,
      value: job?.final_price === null || job?.final_price === undefined ? null : Number(job.final_price),
    };
  });
}

export function summarizeMatches(matches: AdMatch[]) {
  const counts: Record<MatchStatus, number> = {
    koppelbaar: 0,
    al_gekoppeld: 0,
    wacht_op_job: 0,
    meerdere_jobs: 0,
    geen_klikid: 0,
    onbekende_code: 0,
  };
  for (const m of matches) counts[m.status] += 1;
  return { total: matches.length, counts };
}
