import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  sendTelegram,
  answerTelegramCallback,
  editTelegramMessage,
  sendTelegramExpense,
  downloadTelegramFile,
} from '@/lib/telegram';
import { parseExpenseCaption, readAmount, EXPENSE_CATEGORIES } from '@/lib/expenseCaption';

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
    if (/^exp_(ok|no):/i.test(body.callback_query.data ?? '')) {
      await handleExpenseCallback(body.callback_query);
    } else {
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
  } else if (text && !(await handleAmountReply(chatId, text))) {
    await sendTelegram(String(chatId), HELP);
  }

  // Telegram only cares about the 200 — it retries anything else.
  return NextResponse.json({ ok: true });
}
