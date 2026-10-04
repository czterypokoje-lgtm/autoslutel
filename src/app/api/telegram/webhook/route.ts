import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  sendTelegram,
  answerTelegramCallback,
  editTelegramMessage,
  sendTelegramExpense,
  downloadTelegramFile,
  sendTelegramBidOffer,
  sendTelegramMenu,
  sendTelegramOfficeMenu,
  sendTelegramLead,
  sendTelegramBidToOffice,
  editToSlotChoice,
  editToDayChoice,
  dayLabel,
  BID_SLOTS,
} from '@/lib/telegram';
import { parseExpenseCaption, readAmount, EXPENSE_CATEGORIES } from '@/lib/expenseCaption';
import { SCENARIO_INFO, scenarioFromLabel, type Scenario } from '@/lib/scenarios';
import { priceFor, type PricedCoverageRow } from '@/lib/capability';

export const dynamic = 'force-dynamic';
/** Buffer and the storage upload below are Node, not edge. */
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** 12 MB, the cap the `facturen` bucket itself enforces (0020_invoice_storage.sql). */
const MAX_BYTES = 12 * 1024 * 1024;

/**
 * "Today" as the Netherlands sees it. A receipt photographed at half past
 * midnight is still that night's fuel, and toISOString() would book it on the
 * day before.
 */
const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

interface TelegramUpdate {
  message?: {
    chat?: { id?: number | string };
    text?: string;
    caption?: string;
    photo?: Array<{ file_id: string; file_size?: number }>;
    document?: { file_id: string; file_size?: number };
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id?: number; chat?: { id?: number | string } };
  };
}

/** `/start <technician_id>` — the deep link from Mijn profiel, connecting this chat. */
async function handleTechnicianStart(chatId: number | string, technicianId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('technicians')
    .update({ telegram_chat_id: String(chatId) })
    .eq('id', technicianId);
  if (error) {
    console.error('Telegram chat id link failed:', error.message);
    return;
  }
  await sendTelegram(
    String(chatId),
    'Gekoppeld! U ontvangt hier voortaan meldingen van Autosleutel24.\n\n' + HELP
  );
}

/** `/start admin_<user_id>` — the same connect link, from an office user's Mijn profiel instead. */
async function handleAdminStart(chatId: number | string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('admin_telegram')
    .upsert({ user_id: userId, telegram_chat_id: String(chatId) }, { onConflict: 'user_id' });
  if (error) {
    console.error('Telegram admin chat id link failed:', error.message);
    return;
  }
  await sendTelegram(String(chatId), 'Gekoppeld! U ontvangt hier voortaan meldingen van Autosleutel24.');
}

/** Same wording as OfferList.tsx's own respond() — one set of outcomes, two surfaces. */
const CALLBACK_OUTCOME: Record<string, string> = {
  geaccepteerd: '✅ Klus geaccepteerd — u vindt hem bij Vandaag.',
  afgewezen: '❌ Klus geweigerd.',
  al_vergeven: 'Net te laat — een collega was er eerder bij.',
  verlopen: 'Dit aanbod is verlopen.',
  niet_gevonden: 'Dit aanbod bestaat niet meer of is al beantwoord.',
  geen_monteur: 'Uw Telegram is niet aan een monteur gekoppeld.',
};

/**
 * "Accepteren"/"Weigeren" tapped on a job-offer message. Answers the tap
 * (Telegram shows a spinner on the button until this happens) and rewrites
 * the message so the buttons don't sit there answerable a second time.
 */
async function handleOfferCallback(query: NonNullable<TelegramUpdate['callback_query']>) {
  const match = /^(accept|decline):([0-9a-f-]{36})$/i.exec(query.data ?? '');
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;

  if (!match || chatId === undefined || messageId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('crm_respond_to_offer_telegram', {
    p_offer_id: match[2],
    p_chat_id: String(chatId),
    p_accept: match[1] === 'accept',
  });

  if (error) console.error('Telegram offer response failed:', error.message);
  const outcome = error ? 'Bijwerken mislukt.' : (CALLBACK_OUTCOME[String(data)] ?? String(data));

  await answerTelegramCallback(query.id, outcome);
  await editTelegramMessage(chatId, messageId, outcome);
}

/* ── Bonnen en facturen ───────────────────────────────────────────────────── */

const HELP =
  'Stuur een foto van uw bon of factuur, met het bedrag in het bijschrift — ' +
  'bijvoorbeeld "35,20 benzine". Geen bijschrift? Dan vraag ik er daarna om.';

const NOT_LINKED =
  'Deze chat hoort nog bij geen monteur. Open Mijn profiel in de CRM en tik op ' +
  '"Telegram koppelen".';

/**
 * A bon arriving over Telegram files an ordinary `expenses` row — the same
 * table the Uitgaven page reads and the same approval it waits for, so there
 * is one expense record and not a Telegram-shaped copy beside it.
 *
 * Deliberately not `purchase_invoices`: that one exists to turn invoice lines
 * into stock in a van, which needs a person ticking lines off a list. That
 * belongs in Mijn bus, where the list can be shown. A chat can carry the cost;
 * it cannot carry the parts.
 */
async function technicianFor(supabase: SupabaseClient, chatId: number | string) {
  const { data } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle();
  return data as { id: string; name: string } | null;
}

/** Every office user who connected their Telegram gets the approval buttons. */
async function announceExpense(
  supabase: SupabaseClient,
  expense: { id: string; amount: number; category: string; description: string; is_reimbursable: boolean },
  technicianName: string
) {
  const { data: recipients, error } = await supabase
    .from('admin_telegram')
    .select('telegram_chat_id');
  if (error) {
    console.error('Reading admin_telegram failed:', error.message);
    return;
  }

  const text = [
    `🧾 Nieuwe uitgave van ${technicianName}`,
    `${MONEY.format(expense.amount)} · ${EXPENSE_CATEGORIES[expense.category] ?? expense.category}`,
    expense.description,
    expense.is_reimbursable ? 'Declaratie — zelf voorgeschoten.' : 'Zakelijk betaald.',
    'De bon staat bij Uitgaven in de CRM.',
  ].join('\n');

  for (const recipient of recipients ?? []) {
    await sendTelegramExpense(recipient.telegram_chat_id, text, expense.id);
  }
}

/**
 * A photo or a PDF sent to the bot.
 *
 * The file is stored before the row is written and the row keeps its path,
 * so an expense never exists without the proof behind it. Without a readable
 * amount the row is still filed — at zero, waiting — because the photo is the
 * part that is gone forever if it is not kept now; the number can be typed a
 * second later.
 */
async function handleReceipt(
  chatId: number | string,
  fileId: string,
  fileSize: number | undefined,
  caption: string | undefined
) {
  const supabase = createSupabaseAdminClient();

  const technician = await technicianFor(supabase, chatId);
  if (!technician) {
    await sendTelegram(String(chatId), NOT_LINKED);
    return;
  }

  if (fileSize && fileSize > MAX_BYTES) {
    await sendTelegram(String(chatId), 'Dit bestand is groter dan 12 MB. Stuur een foto in plaats van een scan.');
    return;
  }

  const file = await downloadTelegramFile(fileId);
  if (!file) {
    await sendTelegram(String(chatId), 'Dit bestand kon ik niet verwerken. Stuur een foto of een PDF.');
    return;
  }

  /* `<technician_id>/<uuid>.<ext>`, the path the facturen policies read: the
     first folder is the owner, so this monteur can open their own bon back. */
  const objectPath = `${technician.id}/${crypto.randomUUID()}.${file.extension}`;
  const { error: storeError } = await supabase.storage
    .from('facturen')
    .upload(objectPath, file.bytes, { contentType: file.mimeType, upsert: false });

  if (storeError) {
    console.error('Telegram receipt upload failed:', storeError.message);
    await sendTelegram(String(chatId), 'Opslaan van de bon mislukte. Probeer het nog een keer.');
    return;
  }

  const parsed = parseExpenseCaption(caption);
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      category: parsed.category,
      description: parsed.description,
      amount: parsed.amount ?? 0,
      date_incurred: today(),
      technician_id: technician.id,
      is_reimbursable: parsed.isReimbursable,
      receipt_url: objectPath,
      status: 'pending',
    })
    .select('id, amount, category, description, is_reimbursable')
    .single();

  if (error || !expense) {
    console.error('Telegram expense insert failed:', error?.message);
    await sendTelegram(String(chatId), 'De bon is opgeslagen, maar vastleggen mislukte. Meld dit even op kantoor.');
    return;
  }

  if (parsed.amount === null) {
    await sendTelegram(
      String(chatId),
      `📸 Bon ontvangen (${EXPENSE_CATEGORIES[parsed.category]}). Wat was het bedrag? ` +
        'Stuur alleen het bedrag, bijvoorbeeld 35,20.'
    );
    return;
  }

  await sendTelegram(
    String(chatId),
    `✅ ${MONEY.format(expense.amount)} · ${EXPENSE_CATEGORIES[expense.category]} genoteerd. ` +
      'Het kantoor keurt hem goed.'
  );
  await announceExpense(supabase, expense, technician.name);
}

/**
 * A bare amount, answering the question asked above.
 *
 * Fills the newest bon this monteur left at zero, and only one from the last
 * day: a number typed a week later is a new conversation, not a late answer.
 * Returns false when there was nothing to fill, so the caller can fall back
 * to the help text instead of swallowing the message.
 */
async function handleAmountReply(chatId: number | string, text: string): Promise<boolean> {
  const amount = readAmount(text);
  if (amount === null) return false;

  const supabase = createSupabaseAdminClient();
  const technician = await technicianFor(supabase, chatId);
  if (!technician) return false;

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: waiting } = await supabase
    .from('expenses')
    .select('id')
    .eq('technician_id', technician.id)
    .eq('status', 'pending')
    .eq('amount', 0)
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!waiting) return false;

  const { data: expense, error } = await supabase
    .from('expenses')
    .update({ amount })
    .eq('id', waiting.id)
    .select('id, amount, category, description, is_reimbursable')
    .single();

  if (error || !expense) {
    console.error('Telegram expense amount update failed:', error?.message);
    await sendTelegram(String(chatId), 'Het bedrag vastleggen mislukte. Probeer het nog een keer.');
    return true;
  }

  await sendTelegram(
    String(chatId),
    `✅ ${MONEY.format(expense.amount)} · ${EXPENSE_CATEGORIES[expense.category]} genoteerd. ` +
      'Het kantoor keurt hem goed.'
  );
  await announceExpense(supabase, expense, technician.name);
  return true;
}

/**
 * "Goedkeuren"/"Afwijzen" tapped on an expense message.
 *
 * Two guards, both real: the tap must come from a chat that is in
 * admin_telegram — a technician's chat can never approve their own spending —
 * and the update only matches a row that is still `pending`, so a second tap
 * on an old message changes nothing.
 */
async function handleExpenseCallback(query: NonNullable<TelegramUpdate['callback_query']>) {
  const match = /^(exp_ok|exp_no):([0-9a-f-]{36})$/i.exec(query.data ?? '');
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;

  if (!match || chatId === undefined || messageId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data: officer } = await supabase
    .from('admin_telegram')
    .select('user_id')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle();

  if (!officer) {
    await answerTelegramCallback(query.id, 'Alleen het kantoor keurt uitgaven goed.');
    return;
  }

  const approved = match[1]!.toLowerCase() === 'exp_ok';
  const { data: expense, error } = await supabase
    .from('expenses')
    .update({ status: approved ? 'approved' : 'rejected', approved_by: officer.user_id })
    .eq('id', match[2])
    .eq('status', 'pending')
    .select('id, amount, category, technician_id')
    .maybeSingle();

  if (error) console.error('Telegram expense decision failed:', error.message);

  const outcome = error
    ? 'Bijwerken mislukt.'
    : !expense
      ? 'Deze uitgave is al beantwoord.'
      : `${approved ? '✅ Goedgekeurd' : '❌ Afgewezen'} — ${MONEY.format(expense.amount)} · ` +
        `${EXPENSE_CATEGORIES[expense.category] ?? expense.category}`;

  await answerTelegramCallback(query.id, approved ? 'Goedgekeurd' : 'Afgewezen');
  await editTelegramMessage(chatId, messageId, outcome);

  if (!expense?.technician_id) return;

  const { data: technician } = await supabase
    .from('technicians')
    .select('telegram_chat_id')
    .eq('id', expense.technician_id)
    .maybeSingle();

  await sendTelegram(
    technician?.telegram_chat_id,
    `${approved ? '✅' : '❌'} Uw uitgave van ${MONEY.format(expense.amount)} ` +
      `(${EXPENSE_CATEGORIES[expense.category] ?? expense.category}) is ` +
      `${approved ? 'goedgekeurd' : 'afgewezen'}.`
  );
}


/* ── Bieden op een klus ─────────────────────────────────────────────────── */

const MONEY_EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** `today + n` in Amsterdam, as a plain date. */
function dayPlus(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(now);
}

/** The offer, but only if it is still this technician's to answer. */
async function openOfferFor(
  supabase: SupabaseClient,
  offerId: string,
  chatId: number | string
) {
  const technician = await technicianFor(supabase, chatId);
  if (!technician) return { technician: null, offer: null };

  const { data: offer } = await supabase
    .from('job_offers')
    .select('id, job_id, technician_id, expires_at, response, bid_date, bid_start, bid_end')
    .eq('id', offerId)
    .eq('technician_id', technician.id)
    .is('response', null)
    .maybeSingle();

  return { technician, offer };
}

/** A one-line description of the work, for the chat. */
async function jobLine(supabase: SupabaseClient, jobId: string): Promise<string> {
  const { data: job } = await supabase
    .from('jobs')
    .select('city, car_make, car_model, scenario, service_type')
    .eq('id', jobId)
    .maybeSingle();
  if (!job) return 'Klus';
  const car = [job.car_make, job.car_model].filter(Boolean).join(' ');
  const what = job.scenario
    ? (SCENARIO_INFO[job.scenario as Scenario]?.label ?? job.scenario)
    : (job.service_type ?? 'Klus');
  return [what, car, job.city].filter(Boolean).join(' · ');
}

/** Day tapped: remember which, then ask the hour. */
async function handleBidDay(query: NonNullable<TelegramUpdate['callback_query']>, offerId: string, dayIndex: number) {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  if (chatId === undefined || messageId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { offer } = await openOfferFor(supabase, offerId, chatId);
  if (!offer) {
    await answerTelegramCallback(query.id, 'Dit aanbod is al beantwoord.');
    await editTelegramMessage(chatId, messageId, 'Dit aanbod is niet meer open.');
    return;
  }

  /* Written now so the next step needs no memory of its own: a row with a
     date and no price IS the state "waiting for a price". */
  await supabase.from('job_offers').update({ bid_date: dayPlus(dayIndex) }).eq('id', offerId);

  await answerTelegramCallback(query.id);
  await editToSlotChoice(chatId, messageId, offerId, dayLabel(dayIndex));
}

/**
 * What this technician already said this car costs, from mijn-vak.
 *
 * Null when they never priced it, when they excluded the car, or when the
 * job has no scenario — a Peugeot 107 is EUR 120 to copy a key and EUR 250
 * when every key is lost, and without knowing which, guessing is picking the
 * customer's price by coin toss.
 */
async function listPriceFor(
  supabase: SupabaseClient,
  technicianId: string,
  jobId: string
): Promise<number | null> {
  const { data: job } = await supabase
    .from('jobs')
    .select('car_make, car_model, car_year, scenario, service_type, keyless')
    .eq('id', jobId)
    .maybeSingle();
  if (!job?.car_make) return null;

  /* Same derivation as the offer route: most open jobs carry the scenario
     only in their service text, and both ends must read it the same way or a
     technician is quoted one price and offered another. */
  const scenario = (job.scenario as Scenario | null) ?? scenarioFromLabel(job.service_type);
  if (!scenario) return null;

  const { data: rows } = await supabase
    .from('technician_coverage')
    .select('technician_id, make, model, scenario, from_year, to_year, excluded, keyless, price')
    .eq('technician_id', technicianId);

  return priceFor(
    (rows ?? []) as PricedCoverageRow[],
    { make: job.car_make, model: job.car_model, year: job.car_year },
    scenario,
    job.keyless
  );
}

/** Writes the bid, tells the technician, tells the office. One path, two callers. */
async function completeBid(
  supabase: SupabaseClient,
  offerId: string,
  technician: { id: string; name: string },
  chatId: number | string,
  amount: number,
  fromList: boolean
): Promise<boolean> {
  const { data: offer, error } = await supabase
    .from('job_offers')
    .update({ bid_price: amount, bid_at: new Date().toISOString() })
    .eq('id', offerId)
    .is('bid_price', null)
    .select('id, job_id, bid_date, bid_start, bid_end')
    .maybeSingle();

  if (error || !offer) {
    if (error) console.error('Bid write failed:', error.message);
    return false;
  }

  const what = await jobLine(supabase, offer.job_id);
  const when = `${offer.bid_date} · ${String(offer.bid_start).slice(0, 5)}–${String(offer.bid_end).slice(0, 5)}`;

  await sendTelegram(
    String(chatId),
    `✅ Uw bod staat genoteerd.\n\n${what}\n${when}\n${MONEY_EUR.format(amount)}${fromList ? ' (uw tarief)' : ''}\n\nKantoor laat weten of de klus naar u gaat.`
  );

  const { data: recipients } = await supabase.from('admin_telegram').select('telegram_chat_id');
  for (const recipient of recipients ?? []) {
    await sendTelegram(
      recipient.telegram_chat_id,
      `💶 Bod van ${technician.name}\n${what}\n${when}\n${MONEY_EUR.format(amount)}${fromList ? ' (eigen tarief)' : ''}\n\nGunnen doet u bij Biedingen in de CRM.`
    );
  }
  return true;
}

/** Hour tapped: store the window and ask for the money. */
async function handleBidHour(query: NonNullable<TelegramUpdate['callback_query']>, offerId: string, slotIndex: number) {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  const slot = BID_SLOTS[slotIndex];
  if (chatId === undefined || messageId === undefined || !slot) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { offer } = await openOfferFor(supabase, offerId, chatId);
  if (!offer) {
    await answerTelegramCallback(query.id, 'Dit aanbod is al beantwoord.');
    return;
  }

  await supabase
    .from('job_offers')
    .update({ bid_start: slot[0], bid_end: slot[1] })
    .eq('id', offerId);

  const what = await jobLine(supabase, offer.job_id);
  await answerTelegramCallback(query.id);

  /*
   * If they already priced this car in mijn-vak, that is the bid. Asking
   * again would be asking the same person the same question twice and
   * inviting a different answer — and it is two more taps on a phone held in
   * one hand.
   */
  const technician = await technicianFor(supabase, chatId);
  const mine = technician ? await listPriceFor(supabase, technician.id, offer.job_id) : null;

  if (technician && mine !== null) {
    const done = await completeBid(supabase, offerId, technician, chatId, mine, true);
    if (done) {
      await editTelegramMessage(
        chatId,
        messageId,
        `${what}\n${offer.bid_date} · ${slot[0]}–${slot[1]}\n${MONEY_EUR.format(mine)} — uw eigen tarief`
      );
      return;
    }
  }

  await editTelegramMessage(
    chatId,
    messageId,
    `${what}\n${offer.bid_date} · ${slot[0]}–${slot[1]}\n\nWat vraagt u voor deze klus? Stuur alleen het bedrag, bijvoorbeeld 245.`
  );
}

/** Changed their mind about the day — back to the four buttons. */
async function handleBidBack(query: NonNullable<TelegramUpdate['callback_query']>, offerId: string) {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  if (chatId === undefined || messageId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { offer } = await openOfferFor(supabase, offerId, chatId);
  if (!offer) {
    await answerTelegramCallback(query.id, 'Dit aanbod is al beantwoord.');
    return;
  }

  /* Clear what was picked, so a half-filled row can never read as a bid
     waiting for a price. */
  await supabase
    .from('job_offers')
    .update({ bid_date: null, bid_start: null, bid_end: null })
    .eq('id', offerId);

  const what = await jobLine(supabase, offer.job_id);
  await answerTelegramCallback(query.id);
  await editToDayChoice(chatId, messageId, offerId, `${what}\n\nWanneer kunt u?`);
}

/** Passed. */
async function handleBidNo(query: NonNullable<TelegramUpdate['callback_query']>, offerId: string) {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  if (chatId === undefined || messageId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { offer } = await openOfferFor(supabase, offerId, chatId);
  if (offer) {
    await supabase
      .from('job_offers')
      .update({ response: 'declined', responded_at: new Date().toISOString() })
      .eq('id', offerId)
      .is('response', null);
  }
  await answerTelegramCallback(query.id, 'Doorgegeven.');
  await editTelegramMessage(chatId, messageId, '❌ U heeft deze klus laten lopen.');
}

/**
 * The amount, answering the question above.
 *
 * Found the same way a receipt's amount is: the one row this technician left
 * half-finished. No session table, and nothing to clean up when somebody
 * wanders off mid-conversation — an abandoned bid simply expires with its
 * offer.
 */
async function handleBidPrice(chatId: number | string, text: string): Promise<boolean> {
  const amount = readAmount(text);
  if (amount === null) return false;

  const supabase = createSupabaseAdminClient();
  const technician = await technicianFor(supabase, chatId);
  if (!technician) return false;

  const { data: waiting } = await supabase
    .from('job_offers')
    .select('id, job_id, bid_date, bid_start, bid_end')
    .eq('technician_id', technician.id)
    .is('response', null)
    .is('bid_price', null)
    .not('bid_date', 'is', null)
    .not('bid_start', 'is', null)
    .order('offered_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!waiting) return false;

  /* Same write, same confirmations as the automatic path — one function, so a
     typed bid and a bid from their own list can never report differently. */
  const done = await completeBid(supabase, waiting.id, technician, chatId, amount, false);
  if (!done) {
    await sendTelegram(String(chatId), 'Uw bod vastleggen mislukte. Probeer het nog een keer.');
  }
  return true;
}

/* ── Het menu ───────────────────────────────────────────────────────────── */

/**
 * Each menu button answers in the chat itself.
 *
 * Deliberately text, not links. A monteur with one hand on a door card is not
 * going to open a browser, find a login and wait for a page — if the answer
 * cannot arrive in the conversation they are already in, it may as well not
 * exist. The CRM link goes at the bottom for the things that genuinely need
 * a screen.
 */
async function handleMenuChoice(query: NonNullable<TelegramUpdate['callback_query']>, what: string) {
  const chatId = query.message?.chat?.id;
  if (chatId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const technician = await technicianFor(supabase, chatId);
  await answerTelegramCallback(query.id);

  if (!technician) {
    await sendTelegram(String(chatId), NOT_LINKED);
    return;
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

  if (what === 'jobs') {
    const { data } = await supabase
      .from('jobs')
      .select('scheduled_date, slot_start, slot_end, status, city, customer_name, car_make, car_model, quoted_price, final_price')
      .eq('technician_id', technician.id)
      .gte('scheduled_date', today)
      .order('scheduled_date')
      .order('slot_start')
      .limit(10);

    if (!data?.length) {
      await sendTelegram(String(chatId), '📋 Geen klussen gepland.');
      return;
    }
    const lines = data.map((job) => {
      const when = `${job.scheduled_date === today ? 'Vandaag' : job.scheduled_date} ${String(job.slot_start ?? '').slice(0, 5)}`;
      const who = job.customer_name?.trim() || [job.car_make, job.car_model].filter(Boolean).join(' ') || 'Klus';
      const price = job.final_price ?? job.quoted_price;
      return `${when} · ${who}${job.city ? ` · ${job.city}` : ''}${price ? ` · ${MONEY_EUR.format(Number(price))}` : ''} · ${job.status}`;
    });
    await sendTelegram(String(chatId), `📋 Uw klussen\n\n${lines.join('\n')}`);
    return;
  }

  if (what === 'offers') {
    const { data } = await supabase
      .from('job_offers')
      .select('id, job_id, expires_at, bid_price, bid_date')
      .eq('technician_id', technician.id)
      .is('response', null)
      .order('offered_at', { ascending: false })
      .limit(5);

    if (!data?.length) {
      await sendTelegram(String(chatId), '📨 Geen open aanbod.');
      return;
    }
    for (const offer of data) {
      const what2 = await jobLine(supabase, offer.job_id);
      if (offer.bid_price) {
        await sendTelegram(String(chatId), `📨 ${what2}\nUw bod: ${MONEY_EUR.format(Number(offer.bid_price))} op ${offer.bid_date}. Wachten op kantoor.`);
      } else {
        /* Still answerable, so it comes back with its buttons rather than as
           a line of text they cannot act on. */
        await sendTelegramBidOffer(String(chatId), `📨 ${what2}\n\nWanneer kunt u?`, offer.id);
      }
    }
    return;
  }

  if (what === 'saldo') {
    const { data } = await supabase
      .from('crm_technician_balance')
      .select('saldo, totaal_geind, totaal_afgedragen, totaal_uitbetaald')
      .eq('technician_id', technician.id)
      .maybeSingle();

    if (!data) {
      await sendTelegram(String(chatId), '💰 Nog geen mutaties op uw saldo.');
      return;
    }
    const saldo = Number(data.saldo ?? 0);
    /* Positive means the monteur is holding the company's money, which is the
       opposite of what "saldo" reads like. Say which way it runs. */
    const direction = saldo > 0 ? 'u moet nog afdragen' : saldo < 0 ? 'wij moeten u nog betalen' : 'niets openstaand';
    await sendTelegram(
      String(chatId),
      `💰 Saldo: ${MONEY_EUR.format(Math.abs(saldo))} — ${direction}\n\nGeïnd: ${MONEY_EUR.format(Number(data.totaal_geind ?? 0))}\nAfgedragen: ${MONEY_EUR.format(Number(data.totaal_afgedragen ?? 0))}\nUitbetaald: ${MONEY_EUR.format(Number(data.totaal_uitbetaald ?? 0))}`
    );
    return;
  }

  if (what === 'bus') {
    const { data } = await supabase
      .from('stock_items')
      .select('description, quantity, min_quantity, unit_cost')
      .eq('technician_id', technician.id)
      .order('description');

    if (!data?.length) {
      await sendTelegram(String(chatId), '📦 Niets geregistreerd in uw bus.');
      return;
    }
    const short = data.filter((row) => Number(row.quantity) <= 0 || (Number(row.min_quantity) > 0 && Number(row.quantity) <= Number(row.min_quantity)));
    const value = data.reduce((total, row) => total + Number(row.quantity) * Number(row.unit_cost ?? 0), 0);
    const lines = data.slice(0, 15).map((row) => `${row.quantity}× ${row.description}`);
    await sendTelegram(
      String(chatId),
      `📦 Uw bus — ${data.length} artikelen, waarde ${MONEY_EUR.format(value)}\n\n${lines.join('\n')}${data.length > 15 ? `\n… en ${data.length - 15} meer` : ''}${short.length ? `\n\n⚠️ Op of bijna op: ${short.map((s) => s.description).join(', ')}` : ''}`
    );
    return;
  }

  if (what === 'facturen') {
    const { data } = await supabase
      .from('purchase_invoices')
      .select('supplier, invoice_date, total_amount, status')
      .eq('technician_id', technician.id)
      .order('created_at', { ascending: false })
      .limit(8);

    if (!data?.length) {
      await sendTelegram(String(chatId), '🧾 Nog geen facturen. Stuur een foto of PDF van een leveranciersfactuur en ik zet hem klaar.');
      return;
    }
    const lines = data.map((inv) => `${inv.invoice_date ?? '—'} · ${inv.supplier ?? 'onbekend'} · ${inv.total_amount ? MONEY_EUR.format(Number(inv.total_amount)) : '—'} · ${inv.status}`);
    await sendTelegram(String(chatId), `🧾 Uw facturen\n\n${lines.join('\n')}`);
    return;
  }

  if (what === 'uitgaven') {
    const { data } = await supabase
      .from('expenses')
      .select('date_incurred, category, description, amount, status')
      .eq('technician_id', technician.id)
      .order('created_at', { ascending: false })
      .limit(8);

    if (!data?.length) {
      await sendTelegram(String(chatId), '💸 Nog geen uitgaven. Stuur een foto van een bon met het bedrag erbij.');
      return;
    }
    const open = data.filter((e) => e.status === 'pending').reduce((t, e) => t + Number(e.amount ?? 0), 0);
    const lines = data.map((e) => `${e.date_incurred} · ${EXPENSE_CATEGORIES[e.category] ?? e.category} · ${MONEY_EUR.format(Number(e.amount ?? 0))} · ${e.status}`);
    await sendTelegram(
      String(chatId),
      `💸 Uw uitgaven\n\n${lines.join('\n')}${open > 0 ? `\n\nNog goed te keuren: ${MONEY_EUR.format(open)}` : ''}`
    );
    return;
  }
}


/* ── Kantoor in Telegram ────────────────────────────────────────────────── */

/** The office user behind this chat, or null if it is not an office chat. */
async function officeFor(supabase: SupabaseClient, chatId: number | string) {
  const { data } = await supabase
    .from('admin_telegram')
    .select('user_id')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle();
  return data as { user_id: string } | null;
}

/** "✅ Gebeld" / "🚫 Geen klant" on a lead alert. */
async function handleLeadAction(
  query: NonNullable<TelegramUpdate['callback_query']>,
  leadId: string,
  reached: boolean
) {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  if (chatId === undefined || messageId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!(await officeFor(supabase, chatId))) {
    await answerTelegramCallback(query.id, 'Alleen kantoor kan dit.');
    return;
  }

  /*
   * first_contact_at only when it is still empty. It is the start of the
   * response-time metric (crm_report_response), and overwriting it on a
   * second call would quietly rewrite how fast this lead was answered.
   */
  const patch = reached
    ? { status: 'contacted', first_contact_at: new Date().toISOString() }
    : { status: 'rejected' };

  const { data: lead, error } = await supabase
    .from('leads')
    .update(reached ? patch : { status: 'rejected' })
    .eq('id', leadId)
    .select('id, name, phone, first_contact_at')
    .maybeSingle();

  if (error) console.error('Lead action failed:', error.message);

  const outcome = error
    ? 'Bijwerken mislukt.'
    : reached
      ? `✅ ${lead?.name?.trim() || 'Lead'} — gebeld`
      : `🚫 ${lead?.name?.trim() || 'Lead'} — geen klant`;

  await answerTelegramCallback(query.id, error ? 'Mislukt' : 'Bijgewerkt');
  await editTelegramMessage(chatId, messageId, outcome);
}

/** "✅ Gun deze klus" on a bid, from the office chat. */
async function handleAwardFromChat(
  query: NonNullable<TelegramUpdate['callback_query']>,
  offerId: string
) {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  if (chatId === undefined || messageId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  /*
   * The service-role key can award anything, so the question "may this
   * person" is answered here rather than in the database: is this chat one
   * the office connected itself?
   */
  if (!(await officeFor(supabase, chatId))) {
    await answerTelegramCallback(query.id, 'Alleen kantoor kan gunnen.');
    return;
  }

  const { data: before } = await supabase
    .from('job_offers')
    .select('job_id, technician_id, bid_price, bid_date, bid_start, technicians (name, telegram_chat_id)')
    .eq('id', offerId)
    .maybeSingle();

  const { data: outcome, error } = await supabase.rpc('crm_award_offer', { p_offer: offerId });

  if (error || outcome !== 'ok') {
    const why = error
      ? 'Gunnen mislukt.'
      : outcome === 'geen_toegang'
        ? 'Voer supabase/migrations/0068_award_from_telegram.sql uit.'
        : outcome === 'niet_gevonden'
          ? 'Dit bod is al beantwoord.'
          : String(outcome);
    if (error) console.error('Award from chat failed:', error.message);
    await answerTelegramCallback(query.id, why);
    return;
  }

  const tech = before?.technicians as unknown as { name: string; telegram_chat_id: string | null } | null;
  await answerTelegramCallback(query.id, 'Gegund');
  await editTelegramMessage(
    chatId,
    messageId,
    `✅ Gegund aan ${tech?.name ?? 'monteur'} — ${before?.bid_price ? MONEY_EUR.format(Number(before.bid_price)) : ''} op ${before?.bid_date}`
  );

  await sendTelegram(
    tech?.telegram_chat_id,
    `🎉 De klus is voor u.\n${before?.bid_date} · ${String(before?.bid_start ?? '').slice(0, 5)}\n\nU vindt hem bij Vandaag.`
  );

  /* Everyone who bid and lost, told now rather than left holding a slot. */
  const { data: losers } = await supabase
    .from('job_offers')
    .select('technicians (telegram_chat_id)')
    .eq('job_id', before?.job_id ?? '')
    .neq('id', offerId);
  for (const row of losers ?? []) {
    const t = row.technicians as unknown as { telegram_chat_id: string | null } | null;
    await sendTelegram(t?.telegram_chat_id, 'Deze klus is naar een collega gegaan. Bedankt voor het bieden.');
  }
}

/** The office menu's answers. */
async function handleOfficeChoice(query: NonNullable<TelegramUpdate['callback_query']>, what: string) {
  const chatId = query.message?.chat?.id;
  if (chatId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  await answerTelegramCallback(query.id);

  if (!(await officeFor(supabase, chatId))) {
    await sendTelegram(String(chatId), 'Deze chat is niet aan een kantoorgebruiker gekoppeld. Open Mijn profiel in de CRM en tik op "Telegram koppelen".');
    return;
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

  if (what === 'leads') {
    const { data } = await supabase
      .from('leads')
      .select('id, name, phone, brand, model, postcode, status, created_at, first_contact_at')
      .in('status', ['new', 'qualified'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (!data?.length) {
      await sendTelegram(String(chatId), '📥 Geen open leads.');
      return;
    }
    for (const lead of data) {
      const age = Math.floor((Date.now() - Date.parse(lead.created_at)) / 3600_000);
      const text = [
        `📥 ${lead.name?.trim() || 'Naam onbekend'}`,
        [lead.brand, lead.model].filter(Boolean).join(' ') || null,
        lead.phone ? `📞 ${lead.phone}` : null,
        lead.postcode ? `📍 ${lead.postcode}` : null,
        `${age}u geleden${lead.first_contact_at ? ' · al contact gehad' : ' · nog niet gebeld'}`,
      ]
        .filter(Boolean)
        .join('\n');
      await sendTelegramLead(String(chatId), text, lead.id);
    }
    return;
  }

  if (what === 'bids') {
    const { data } = await supabase
      .from('job_offers')
      .select('id, bid_price, bid_date, bid_start, bid_end, job_id, technicians (name)')
      .is('response', null)
      .not('bid_price', 'is', null)
      .order('bid_at', { ascending: true })
      .limit(8);

    if (!data?.length) {
      await sendTelegram(String(chatId), '💶 Geen open biedingen.');
      return;
    }
    for (const bid of data) {
      const tech = bid.technicians as unknown as { name: string } | null;
      const what2 = await jobLine(supabase, bid.job_id);
      await sendTelegramBidToOffice(
        String(chatId),
        `💶 ${tech?.name ?? 'Monteur'}\n${what2}\n${bid.bid_date} · ${String(bid.bid_start).slice(0, 5)}–${String(bid.bid_end).slice(0, 5)}\n${MONEY_EUR.format(Number(bid.bid_price))}`,
        bid.id
      );
    }
    return;
  }

  if (what === 'today') {
    const { data } = await supabase
      .from('jobs')
      .select('slot_start, status, city, customer_name, car_make, car_model, quoted_price, final_price, technicians (name)')
      .eq('scheduled_date', today)
      .order('slot_start');

    if (!data?.length) {
      await sendTelegram(String(chatId), '📋 Niets gepland vandaag.');
      return;
    }
    const lines = data.map((job) => {
      const tech = job.technicians as unknown as { name: string } | null;
      const who = job.customer_name?.trim() || [job.car_make, job.car_model].filter(Boolean).join(' ') || 'Klus';
      return `${String(job.slot_start ?? '').slice(0, 5)} ${who}${job.city ? ` · ${job.city}` : ''} · ${tech?.name?.split(' ')[0] ?? 'geen monteur'} · ${job.status}`;
    });
    await sendTelegram(String(chatId), `📋 Vandaag — ${data.length} klus(sen)\n\n${lines.join('\n')}`);
    return;
  }

  if (what === 'expenses') {
    const { data } = await supabase
      .from('expenses')
      .select('id, date_incurred, category, description, amount, technicians (name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(6);

    if (!data?.length) {
      await sendTelegram(String(chatId), '💸 Niets te keuren.');
      return;
    }
    for (const expense of data) {
      const tech = expense.technicians as unknown as { name: string } | null;
      await sendTelegramExpense(
        String(chatId),
        `💸 ${tech?.name ?? 'Kantoor'}\n${expense.date_incurred} · ${EXPENSE_CATEGORIES[expense.category] ?? expense.category}\n${expense.description}\n${MONEY_EUR.format(Number(expense.amount))}`,
        expense.id
      );
    }
    return;
  }

  if (what === 'figures') {
    const [{ data: jobs }, { data: leads }] = await Promise.all([
      supabase.from('jobs').select('status, final_price, quoted_price').eq('scheduled_date', today),
      supabase.from('leads').select('id, status').gte('created_at', `${today}T00:00:00`),
    ]);

    const done = (jobs ?? []).filter((j) => j.status === 'afgerond');
    const revenue = done.reduce((t, j) => t + Number(j.final_price ?? j.quoted_price ?? 0), 0);
    await sendTelegram(
      String(chatId),
      [
        `📊 Vandaag`,
        ``,
        `Klussen: ${done.length} afgerond van ${(jobs ?? []).length}`,
        `Omzet: ${MONEY_EUR.format(revenue)}`,
        `Leads binnen: ${(leads ?? []).length}`,
        `Nog niet gebeld: ${(leads ?? []).filter((l) => l.status === 'new').length}`,
      ].join('\n')
    );
  }
}

/**
 * Telegram calling us back, every time someone messages the bot or taps a
 * button on one of its messages.
 *
 * `X-Telegram-Bot-Api-Secret-Token` — set once via Telegram's `setWebhook`
 * `secret_token` param — is the only thing standing between this and anyone
 * on the internet posting a fake `/start` or offer response. No admin-client
 * write happens without it matching.
 */
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  let body: TelegramUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (body.callback_query) {
    const data = body.callback_query.data ?? '';
    const bid = /^(bd|bh|bn|bb):([0-9a-f-]{36})(?::(\d{1,2}))?$/i.exec(data);
    const menu = /^m:(\w+)$/.exec(data);

    const lead = /^ld_(ok|no):([0-9a-f-]{36})$/i.exec(data);
    const award = /^aw:([0-9a-f-]{36})$/i.exec(data);
    const office = /^o:(\w+)$/.exec(data);

    if (/^exp_(ok|no):/i.test(data)) {
      await handleExpenseCallback(body.callback_query);
    } else if (lead) {
      await handleLeadAction(body.callback_query, lead[2]!, lead[1]!.toLowerCase() === 'ok');
    } else if (award) {
      await handleAwardFromChat(body.callback_query, award[1]!);
    } else if (office) {
      await handleOfficeChoice(body.callback_query, office[1]!);
    } else if (menu) {
      await handleMenuChoice(body.callback_query, menu[1]!);
    } else if (bid) {
      const [, kind, offerId, index] = bid;
      if (kind === 'bd') await handleBidDay(body.callback_query, offerId!, Number(index ?? 0));
      else if (kind === 'bh') await handleBidHour(body.callback_query, offerId!, Number(index ?? 0));
      else if (kind === 'bn') await handleBidNo(body.callback_query, offerId!);
      else await handleBidBack(body.callback_query, offerId!);
    } else {
      /* The old straight accept/decline buttons, for offers sent before the
         bidding flow existed. */
      await handleOfferCallback(body.callback_query);
    }
    return NextResponse.json({ ok: true });
  }

  const message = body.message;
  const chatId = message?.chat?.id;
  if (chatId === undefined) return NextResponse.json({ ok: true });

  /* A bon or a faktura: the largest photo size Telegram offers, or the file. */
  const photo = message?.photo?.[message.photo.length - 1];
  const attachment = photo ?? message?.document;
  if (attachment) {
    await handleReceipt(chatId, attachment.file_id, attachment.file_size, message?.caption);
    return NextResponse.json({ ok: true });
  }

  const text = message?.text ?? '';
  const match = /^\/start(?:@\w+)?\s+(admin_)?([0-9a-f-]{36})/i.exec(text);

  if (match && UUID.test(match[2]!)) {
    if (match[1]) {
      await handleAdminStart(chatId, match[2]!);
    } else {
      await handleTechnicianStart(chatId, match[2]!);
    }
  } else if (/^\/menu|^\/start$|^menu$/i.test(text.trim())) {
    /*
     * The same word means two different things depending on who typed it.
     * A monteur asks "what is mine"; the office asks "what needs me", and
     * giving either of them the other's menu is worse than giving them none.
     */
    const supabase = createSupabaseAdminClient();
    if (await officeFor(supabase, chatId)) {
      await sendTelegramOfficeMenu(String(chatId));
    } else {
      await sendTelegramMenu(String(chatId));
    }
  } else if (text) {
    /*
     * A bare number can be two things, and the order matters: a bid is a
     * reply to a question the bot asked seconds ago, a receipt amount is a
     * reply to one it asked whenever the photo came in. Asked last, answered
     * first.
     */
    const handled = (await handleBidPrice(chatId, text)) || (await handleAmountReply(chatId, text));
    if (!handled) await sendTelegram(String(chatId), HELP);
  }

  // Telegram only cares about the 200 — it retries anything else.
  return NextResponse.json({ ok: true });
}
