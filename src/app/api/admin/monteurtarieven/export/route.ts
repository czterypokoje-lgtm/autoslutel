import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readTechnicianRates, yearLabel } from '@/lib/technicianRates';

export const dynamic = 'force-dynamic';
/** xlsx is a Node library; it cannot run on the edge runtime. */
export const runtime = 'nodejs';

/**
 * The rates on screen, as a spreadsheet.
 *
 * Reads through the same function the page does and honours the same filters,
 * so the file is whatever was being looked at — an export that silently
 * returns everything is how two people end up comparing different numbers and
 * each believing they have "the list".
 */
export async function GET(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const url = new URL(request.url);

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { rows, error } = await readTechnicianRates(supabase, {
    q: url.searchParams.get('q') ?? undefined,
    technicianId: url.searchParams.get('monteur') ?? undefined,
    scenario: url.searchParams.get('dienst') ?? undefined,
  });

  if (error) return NextResponse.json({ error }, { status: 500 });

  const { utils, write } = await import('xlsx');
  const book = utils.book_new();

  utils.book_append_sheet(
    book,
    utils.json_to_sheet(
      rows.map((row) => ({
        Monteur: row.technician,
        Merk: row.make,
        Model: row.model ?? '(alle modellen)',
        Jaren: yearLabel(row.fromYear, row.toYear),
        Werk: row.scenarioLabel,
        Sleutel: row.keyless === null ? 'beide' : row.keyless ? 'keyless' : 'met baard',
        /* Blank, not 0: "doet hij niet" and "gratis" are different answers. */
        Tarief: row.excluded ? '' : (row.price ?? ''),
        Opmerking: row.excluded ? 'doet deze auto niet' : row.price === null ? 'geen prijs ingevuld' : '',
      }))
    ),
    'Tarieven'
  );

  /* One row per car and work, with every technician's price beside it — the
     comparison, which is the reason anybody opens this file. */
  const byCar = new Map<string, Record<string, string | number>>();
  const people = [...new Set(rows.map((row) => row.technician))].sort();
  for (const row of rows) {
    if (row.excluded || row.price === null) continue;
    const key = `${row.make}|${row.model ?? ''}|${row.scenarioLabel}|${yearLabel(row.fromYear, row.toYear)}`;
    const entry = byCar.get(key) ?? {
      Merk: row.make,
      Model: row.model ?? '(alle modellen)',
      Jaren: yearLabel(row.fromYear, row.toYear),
      Werk: row.scenarioLabel,
    };
    entry[row.technician] = row.price;
    byCar.set(key, entry);
  }

  utils.book_append_sheet(
    book,
    utils.json_to_sheet(
      [...byCar.values()].map((entry) => {
        const filled: Record<string, string | number> = { ...entry };
        for (const person of people) if (!(person in filled)) filled[person] = '';
        return filled;
      })
    ),
    'Vergelijking'
  );

  const buffer = write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="monteurtarieven-${today}.xlsx"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
