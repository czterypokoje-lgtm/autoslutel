import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readWinst, num } from '@/lib/winst';

export const dynamic = 'force-dynamic';
/** xlsx is a Node library; it cannot run on the edge runtime. */
export const runtime = 'nodejs';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Winst & verbruik as a real spreadsheet.
 *
 * Five sheets rather than one, because the four breakdowns have different
 * column shapes and stacking them into one sheet with blank separator rows is
 * how you get a file nobody can sort or pivot.
 *
 * `xlsx` was already a dependency — the purchase-invoice reader uses it to
 * parse supplier spreadsheets (api/admin/invoice). This is the same library
 * pointed the other way, so the download costs no new package.
 *
 * The numbers come from readWinst(), the same function the screen renders, so
 * the file can never quietly disagree with the page it was downloaded from.
 */
export async function GET(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const url = new URL(request.url);
  const from = url.searchParams.get('van') ?? '';
  const to = url.searchParams.get('tot') ?? '';
  if (!DATE.test(from) || !DATE.test(to)) {
    return NextResponse.json({ error: 'Ongeldige periode' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const data = await readWinst(supabase, from, to);
  if ('error' in data) {
    return NextResponse.json({ error: data.error }, { status: 500 });
  }

  const { utils, write } = await import('xlsx');
  const book = utils.book_new();

  const totals = [
    { Post: 'Omzet', Bedrag: data.revenue },
    { Post: 'Onderdelen', Bedrag: -data.parts },
    { Post: 'Brandstof', Bedrag: -data.fuel },
    { Post: 'Overige kosten', Bedrag: -data.other },
    { Post: 'Blijft over', Bedrag: data.margin },
    { Post: '', Bedrag: '' },
    { Post: 'Klussen', Bedrag: data.jobs.length },
    { Post: 'Werkdagen', Bedrag: data.workdays },
    { Post: 'Omzet per klus', Bedrag: data.jobs.length ? data.revenue / data.jobs.length : '' },
    { Post: 'Omzet per werkdag', Bedrag: data.workdays ? data.revenue / data.workdays : '' },
    /* Blank, not zero, when there are too few measured jobs to mean anything. */
    { Post: 'Omzet per uur', Bedrag: data.perHour ?? '' },
    { Post: '', Bedrag: '' },
    { Post: 'Klussen zonder prijs', Bedrag: data.gaps.price },
    { Post: 'Klussen zonder stad', Bedrag: data.gaps.city },
    { Post: 'Klussen zonder gemeten brandstof', Bedrag: data.gaps.fuel },
    { Post: 'Klussen zonder materiaalregels', Bedrag: data.gaps.parts },
    { Post: 'Klussen zonder bruikbare tijden', Bedrag: data.gaps.times },
  ];
  utils.book_append_sheet(book, utils.json_to_sheet(totals), 'Totaal');

  const breakdown = (
    rows: { label: string; count: number; value: number }[],
    nameColumn: string
  ) =>
    rows.map((row) => ({
      [nameColumn]: row.label,
      Klussen: row.count,
      'Blijft over': row.value,
      'Per klus': row.count ? row.value / row.count : '',
    }));

  utils.book_append_sheet(book, utils.json_to_sheet(breakdown(data.byCity, 'Stad')), 'Per stad');
  utils.book_append_sheet(book, utils.json_to_sheet(breakdown(data.byMake, 'Merk')), 'Per merk');
  utils.book_append_sheet(
    book,
    utils.json_to_sheet(breakdown(data.byScenario, 'Soort werk')),
    'Per soort werk'
  );
  utils.book_append_sheet(
    book,
    utils.json_to_sheet(breakdown(data.byTechnician, 'Monteur')),
    'Per monteur'
  );

  utils.book_append_sheet(
    book,
    utils.json_to_sheet(
      data.byProduct.map((row) => ({
        Onderdeel: row.label,
        Stuks: num(data.productUnits.get(row.label)),
        Klussen: row.count,
        Inkoopwaarde: row.value,
      }))
    ),
    'Verbruik'
  );

  /* One row per job, so anything the summaries flatten can still be checked. */
  utils.book_append_sheet(
    book,
    utils.json_to_sheet(
      data.jobs.map((job) => ({
        Datum: (job.completed_at ?? job.scheduled_date ?? '').slice(0, 10),
        Stad: job.city ?? '',
        Merk: job.car_make ?? '',
        Omzet: job.final_price ?? '',
        Onderdelen: job.cost_materials ?? '',
        Brandstof: job.cost_travel ?? '',
        Km: job.travel_km ?? '',
        'Blijft over': job.gross_margin ?? '',
      }))
    ),
    'Klussen'
  );

  const buffer = write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="winst-${from}_${to}.xlsx"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
