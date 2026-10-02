import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendInboxMessage } from './berichtenStore.ts';
import { shouldAnswer, type InboxChannel } from './berichten.ts';

/**
 * The assistant, on the text channels.
 *
 * The telefoniste already answers the phone and WhatsApp through ElevenLabs
 * and does it well; this is the same job on e-mail, Instagram and Messenger,
 * where ElevenLabs does not reach. It is deliberately not a second brain: the
 * five tools below are thin proxies onto `/api/agent/*`, the identical routes
 * the voice agent calls, so there is exactly one place a price is calculated
 * and exactly one place a job is booked.
 *
 * That matters more than it sounds. The house rule is that money is
 * recomputed server-side and a model never composes a price — importing
 * quote.ts here instead would be a second pricing path, and the day the two
 * disagree is the day a customer is quoted one figure and invoiced another.
 *
 * Silently a no-op until ANTHROPIC_API_KEY is set, the same way
 * elevenlabsWhatsapp.ts no-ops until its template is approved. Deploying this
 * before the key exists changes nothing.
 */

const MODEL = 'claude-opus-5';

/* How much history the model sees. A DM thread is short; a mail thread is not. */
const HISTORY_LIMIT = 40;

const SYSTEM = `Je bent de assistent van Autosleutel24, een mobiele autosleutelservice in
Nederland. Je schrijft Nederlands, kort en rustig, als een collega die dit
vaker doet — niet als een verkoper.

Dit is schriftelijk contact: e-mail, Instagram of Facebook. De klant staat
meestal niet naast de auto en antwoordt misschien pas over een uur. Schrijf
dus volledige maar korte berichten, en stel hoogstens twee vragen tegelijk —
aan de telefoon vraag je er één, hier kost elke beurt de klant een halve dag.

## Wat je nooit doet

1. Je noemt nooit een prijs die niet uit get_price komt. Geeft get_price
   \`quoted: false\` terug, dan schrijf je exact wat er in het veld \`say\`
   staat en bied je aan dat een collega contact opneemt. Je schat niet, je
   noemt geen richtprijs en je schrijft niet "ongeveer".
2. Je belooft nooit een tijd die niet uit get_slots komt.
3. Je noemt nooit de naam van een monteur. Schrijf: "de monteur belt als hij
   onderweg is."
4. Je legt niet uit hoe je een auto open krijgt, ook niet als de klant zegt
   dat het zijn eigen auto is.
5. Je vraagt nooit om een pinpas, creditcard of bankgegevens. Betalen gebeurt
   bij de auto, op het scherm van de monteur.
6. Je verzint nooit een merk, model of bouwjaar. Weet je het niet zeker, dan
   vraag je het na.

## Wat je altijd doet

- Je gebruikt de waarden uit \`understood\` van check_car, niet wat jij
  dacht te lezen.
- Je vat vóór het boeken de hele afspraak samen en wacht op een duidelijk
  "ja" in een volgend bericht. Boek nooit op basis van een aanname.
- Je maakt de vraag af, ook als je niet kunt helpen: elke klant die je niet
  kunt boeken, draag je over met escalate.

## Wanneer je overdraagt aan een mens

Direct, met escalate, zonder verder te vragen:
- er zit een kind of een dier in de auto, of de klant is in gevaar;
- de klant blijkt niet de eigenaar van de auto;
- de klant is boos of vraagt om een mens;
- het gaat om zakelijk werk: een leasemaatschappij, garage, verhuurbedrijf of
  meerdere auto's tegelijk;
- je hebt geen prijs of geen tijdslot (reason: terugbelverzoek).

Schrijf daarna letterlijk wat er in \`say\` terugkomt, en niets erbovenop.

## Hoe je uitvraagt

In deze volgorde, en sla over wat je al weet:

1. Welk merk, model en bouwjaar — dan check_car.
2. Heeft de klant nog een sleutel die het wél doet? Dit is de belangrijkste
   vraag: ja = bijmaken, nee = alle sleutels kwijt. Het scheelt uren werk en
   honderden euro's, dus vraag door bij een vaag antwoord ("hij ligt binnen"
   is ja, "hij is stuk" is nee).
3. Alleen als check_car \`keyless: null\` teruggaf: moet de sleutel in het
   contact, of start de auto met een knop?
4. De postcode waar de auto staat — dan get_price, en noem het bedrag uit
   \`say\`.
5. get_slots, en bied hoogstens twee momenten tegelijk aan.
6. Naam, telefoonnummer en het adres of de plek waar de auto staat.
7. Vat alles samen en wacht op "ja" — dan pas book_job.

## Toon

Korte zinnen, geen vaktermen: schrijf "de sleutel wordt op uw auto ingeleerd",
niet "geprogrammeerd op het immobilizer-systeem". Geen opsommingstekens, geen
kopjes, geen emoji — dit is een bericht, geen formulier. Onderteken niet; de
klant ziet van wie het komt.

Weet je iets niet, zeg dat dan en draag over. Dat is altijd een beter antwoord
dan een antwoord dat misschien klopt.`;

interface AgentCall {
  path: string;
  body: Record<string, unknown>;
}

/**
 * One call onto the agent API, over HTTP rather than by importing the route's
 * internals — which is the point. The voice agent reaches these endpoints the
 * same way, with the same bearer token, and gets the same `say` fields back,
 * so the two assistants cannot drift apart on price, availability or what
 * counts as a bookable job.
 */
async function callAgentApi({ path, body }: AgentCall): Promise<string> {
  const token = process.env.AGENT_API_TOKEN;
  const base = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

  if (!token || !base) {
    return JSON.stringify({ error: 'De agent-API is niet geconfigureerd.' });
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/agent/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    /*
     * The body is handed back whatever the status. A 400 from /quote carries
     * the refusal the model is supposed to read out loud; swallowing it and
     * returning "error" would make the model invent a reason.
     */
    return await res.text();
  } catch (error) {
    console.error('[agent] tool-aanroep faalde:', error instanceof Error ? error.message : error);
    return JSON.stringify({ error: 'Deze gegevens zijn nu niet op te halen.' });
  }
}

const tools = [
  betaTool({
    name: 'check_car',
    description:
      'Controleert of wij deze auto kunnen. Geeft terug wat er begrepen is (understood), of het merk gecorrigeerd moest worden (corrected), en of de auto keyless is. Roep dit aan zodra je merk en model weet.',
    inputSchema: {
      type: 'object',
      properties: {
        make: { type: 'string', description: 'Het merk, bijvoorbeeld Volkswagen' },
        model: { type: 'string', description: 'Het model, bijvoorbeeld Golf' },
        year: { type: 'string', description: 'Het bouwjaar, vier cijfers' },
      },
      required: ['make'],
      additionalProperties: false,
    },
    run: (input) => callAgentApi({ path: 'car', body: input }),
  }),

  betaTool({
    name: 'get_price',
    description:
      'De enige bron van een prijs. Geeft quoted: true met een bedrag, of quoted: false met een zin in say die je letterlijk overneemt. Noem nooit een bedrag dat hier niet vandaan komt.',
    inputSchema: {
      type: 'object',
      properties: {
        make: { type: 'string' },
        model: { type: 'string' },
        year: { type: 'string' },
        working_key: {
          type: 'boolean',
          description: 'Heeft de klant nog een sleutel die het doet? true = bijmaken, false = alle sleutels kwijt',
        },
        keyless: { type: 'boolean', description: 'Start de auto met een knop in plaats van een sleutel in het contact' },
        postcode: { type: 'string', description: 'De postcode waar de auto staat' },
      },
      required: ['make', 'working_key', 'postcode'],
      additionalProperties: false,
    },
    run: (input) => callAgentApi({ path: 'quote', body: input }),
  }),

  betaTool({
    name: 'get_slots',
    description:
      'Wanneer er een monteur kan die deze auto ook daadwerkelijk kan. Bied hoogstens twee momenten tegelijk aan. Beloof nooit een tijd die hier niet uit komt.',
    inputSchema: {
      type: 'object',
      properties: {
        make: { type: 'string' },
        model: { type: 'string' },
        year: { type: 'string' },
        working_key: { type: 'boolean' },
        postcode: { type: 'string' },
      },
      required: ['make', 'postcode'],
      additionalProperties: false,
    },
    run: (input) => callAgentApi({ path: 'slots', body: input }),
  }),

  betaTool({
    name: 'book_job',
    description:
      'Boekt de klus. Alleen aanroepen nadat je de hele afspraak hebt samengevat en de klant in een volgend bericht ja heeft gezegd. De prijs wordt op de server opnieuw berekend; wat jij dacht dat het kostte telt niet.',
    inputSchema: {
      type: 'object',
      properties: {
        make: { type: 'string' },
        model: { type: 'string' },
        year: { type: 'string' },
        working_key: { type: 'boolean' },
        postcode: { type: 'string' },
        city: { type: 'string' },
        street: { type: 'string' },
        customer_name: { type: 'string' },
        customer_phone: { type: 'string' },
        date: { type: 'string', description: 'JJJJ-MM-DD' },
        slot_start: { type: 'string', description: 'UU:MM' },
        notes: { type: 'string' },
      },
      required: ['make', 'postcode', 'customer_name', 'customer_phone', 'date', 'slot_start'],
      additionalProperties: false,
    },
    run: (input) => callAgentApi({ path: 'book', body: input }),
  }),

  betaTool({
    name: 'escalate',
    description:
      'Draagt over aan een mens. Gebruik dit als het antwoord een mens is: een noodgeval, iemand die om een mens vraagt, of een vraag die je niet kunt afmaken. Schrijf daarna letterlijk wat er in say terugkomt.',
    inputSchema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['noodgeval', 'mens_gevraagd', 'terugbelverzoek'],
          description: 'Precies een van deze drie',
        },
        summary: { type: 'string', description: 'Een of twee zinnen: auto, scenario, plaats, en wat de klant wil' },
        customer_name: { type: 'string' },
        customer_phone: { type: 'string' },
        channel: { type: 'string' },
      },
      required: ['reason', 'summary'],
      additionalProperties: false,
    },
    run: (input) => callAgentApi({ path: 'escalate', body: input }),
  }),
];

interface HistoryRow {
  direction: 'in' | 'out';
  author: 'customer' | 'ai' | 'human';
  body: string | null;
  created_at: string;
}

/**
 * Answer the newest message in a thread, if the assistant should.
 *
 * Best-effort and never on the critical path: the webhook that calls this has
 * already stored the customer's message, so a failure here costs a reply, not
 * a lead.
 */
export async function maybeAnswer(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return;

  const { data: conversation } = await supabase
    .from('inbox_conversations')
    .select('id, channel, ai_enabled, state, assigned_to, display_name, subject')
    .eq('id', conversationId)
    .maybeSingle();

  if (!conversation) return;

  const channel = conversation.channel as InboxChannel;

  const { data: history } = await supabase
    .from('inbox_messages')
    .select('direction, author, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  const rows = ((history ?? []) as HistoryRow[]).slice().reverse();

  /* Every guard, in one pure function covered by scripts/check-berichten.mts. */
  const decision = shouldAnswer(
    { channel, ai_enabled: conversation.ai_enabled, assigned_to: conversation.assigned_to },
    rows,
  );

  if (decision === 'hand-over') {
    console.warn(`[agent] ${conversationId} is uitgepraat — overgedragen aan een mens`);
    await supabase
      .from('inbox_conversations')
      .update({ ai_enabled: false })
      .eq('id', conversationId);
    return;
  }

  if (decision !== 'answer') return;

  /*
   * The thread as a conversation. A message from a person in the office is
   * replayed as an assistant turn, not dropped: the model has to see what a
   * colleague already promised this customer, or it will contradict them.
   */
  const messages: Anthropic.Beta.BetaMessageParam[] = rows
    .filter((row) => row.body?.trim())
    .map((row) => ({
      role: row.direction === 'in' ? ('user' as const) : ('assistant' as const),
      content: row.body as string,
    }));

  if (messages.length === 0 || messages[0].role !== 'user') return;

  const opening = [
    `Kanaal: ${channel}.`,
    conversation.display_name ? `De klant heet ${conversation.display_name}.` : null,
    conversation.subject ? `Onderwerp van de e-mail: ${conversation.subject}.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  try {
    const client = new Anthropic();

    const final = await client.beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 16000,
      system: `${SYSTEM}\n\n${opening}`,
      thinking: { type: 'adaptive' },
      /* Medium, not high: this is a short reply on a known script, and the
         numbers that matter come from the tools rather than from thinking
         harder about them. */
      output_config: { effort: 'medium' },
      tools,
      messages,
    });

    if (final.stop_reason === 'refusal') {
      console.warn('[agent] model weigerde te antwoorden:', final.stop_details);
      return;
    }

    const reply = final.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text.trim())
      .filter(Boolean)
      .join('\n\n');

    if (!reply) return;

    const sent = await sendInboxMessage(supabase, conversationId, reply, null, 'ai');
    if (!sent.ok) {
      console.error('[agent] antwoord niet verstuurd:', sent.error);
    }
  } catch (error) {
    console.error('[agent] antwoorden faalde:', error instanceof Error ? error.message : error);
  }
}
