import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { AdMatch, MatchStatus } from './opsAdMatches';

/** The owner's daily view of WhatsApp chats and ad clicks. Internal, never for customers. */

const LABEL: Record<MatchStatus, string> = {
  koppelbaar: 'Klaar om te koppelen',
  al_gekoppeld: 'Al gekoppeld',
  wacht_op_job: 'Wacht op job',
  meerdere_jobs: 'Meerdere jobs, kies zelf',
  geen_klikid: 'Geen klik-id',
  onbekende_code: 'Code niet gevonden',
};

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const INK = rgb(0.1, 0.1, 0.12);
const DIM = rgb(0.42, 0.42, 0.46);

export async function buildAdReportPdf(
  matches: AdMatch[],
  counts: Record<MatchStatus, number>,
  date: string
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Advertentie-rapport ${date}`);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const left = 50;
  let page = pdf.addPage([595, 842]);
  let y = 792;
  const put = (text: string, x: number, size = 10, font = regular, color = INK) =>
    page.drawText(text, { x, y, size, font, color });

  put(`Advertentie-rapport ${date}`, left, 16, bold);
  y -= 18;
  put('Intern. Niet doorsturen.', left, 10, regular, DIM);
  y -= 30;

  put(`WhatsApp-gesprekken met code: ${matches.length}`, left, 11, bold);
  y -= 20;
  for (const status of Object.keys(LABEL) as MatchStatus[]) {
    put(LABEL[status], left);
    put(String(counts[status]), 260);
    y -= 15;
  }
  y -= 18;

  const header = () => {
    put('Code', left, 9, bold);
    put('Datum', 100, 9, bold);
    put('Tel.', 170, 9, bold);
    put('Status', 215, 9, bold);
    put('Job', 380, 9, bold);
    put('Waarde', 480, 9, bold);
    y -= 15;
  };
  header();

  for (const m of [...matches].sort((a, b) => b.at.localeCompare(a.at))) {
    if (y < 60) {
      page = pdf.addPage([595, 842]);
      y = 792;
      header();
    }
    put(m.ref, left, 9);
    put(m.at.slice(0, 10), 100, 9);
    put(`..${m.phoneEnd}`, 170, 9);
    put(LABEL[m.status], 215, 9);
    put(m.jobStatus ?? '-', 380, 9);
    put(m.value === null ? '-' : MONEY.format(m.value), 480, 9);
    y -= 14;
  }

  return pdf.save();
}
