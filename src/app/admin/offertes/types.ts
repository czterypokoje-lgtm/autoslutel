import type { Scenario } from '@/lib/scenarios';

/**
 * Local mirror of the `lead_quotes` / `crm_report_quotes` contract
 * (docs/lead-quotes.md §3.1). Deliberately not imported from
 * src/lib/leadQuotes.ts — another change writes that file in parallel.
 */

export const CHANNELS = ['whatsapp', 'phone', 'form', 'agent', 'crm'] as const;
export type Channel = (typeof CHANNELS)[number];

export const OUTCOMES = ['open', 'won', 'lost', 'no_reply'] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const LOST_REASONS = ['te_duur', 'concurrent', 'geen_reactie', 'zelf_opgelost', 'niet_mogelijk', 'anders'] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const LINK_STATES = ['linked', 'unlinked', 'ambiguous'] as const;
export type LinkState = (typeof LINK_STATES)[number];

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  phone: 'Telefoon',
  form: 'Formulier',
  agent: 'Agent',
  crm: 'CRM',
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  open: 'Open',
  won: 'Gewonnen',
  lost: 'Verloren',
  no_reply: 'Geen reactie',
};

export const LOST_REASON_LABEL: Record<LostReason, string> = {
  te_duur: 'Te duur',
  concurrent: 'Concurrent',
  geen_reactie: 'Geen reactie',
  zelf_opgelost: 'Zelf opgelost',
  niet_mogelijk: 'Niet mogelijk',
  anders: 'Anders',
};

export const WHEN = new Intl.DateTimeFormat('nl-NL', {
  timeZone: 'Europe/Amsterdam',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** A row in "Te beoordelen": status = 'proposed'. */
export interface ProposedQuote {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  scenario: Scenario | null;
  quoted_price: number;
  quoted_at: string;
  channel: Channel;
  evidence_quote: string | null;
  link_state: LinkState;
}

/** A row in "Open offertes": status = 'confirmed', outcome = 'open'. */
export interface OpenQuote {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  scenario: Scenario | null;
  quoted_price: number;
  quoted_at: string;
  channel: Channel;
}
