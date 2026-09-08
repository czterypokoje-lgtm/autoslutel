'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, FileText, Loader2, Plus, Upload, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { ui, Card, CardHead, Badge, Empty, Notice } from '../_ui';

export interface InvoiceLineRow {
  id: string;
  description: string;
  article_code: string | null;
  quantity: number;
  unit_price: number | null;
  matched_slug: string | null;
  confirmed: boolean;
}

export interface InvoiceRow {
  id: string;
  supplier: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  file_url: string;
  status: string;
  created_at: string;
  lines: InvoiceLineRow[];
}

/**
 * Purchase invoices, and the stock they propose.
 *
 * The rule the whole screen is built on: **reading proposes, a person
 * confirms.** Nothing is pre-ticked, not even a line matched on an exact
 * article number, because the value of this feature is that somebody looked. A
 * misread that silently adds stock ends with a technician driving to a job for
 * a part that is not in the van — which is the failure the van-stock feature
 * exists to prevent in the first place.
 */
export default function InvoicePanel({ invoices }: { invoices: InvoiceRow[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null);
  const [open, setOpen] = useState<string | null>(invoices.find((i) => i.status === 'gelezen')?.id ?? null);

  async function upload(file: File) {
    setBusy(true);
    setNotice(null);

    const body = new FormData();
    body.append('file', file);

    const response = await fetch('/api/admin/invoice', { method: 'POST', body }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setBusy(false);

    if (!response?.ok) {
      setNotice({ text: result?.error ?? 'Uploaden mislukt.', tone: 'bad' });
      return;
    }
    setNotice({ text: result.say, tone: 'ok' });
    setOpen(result.id);
    router.refresh();
  }

  /** Ticking a line is a write of its own, so a half-checked list survives a reload. */
  async function toggle(line: InvoiceLineRow) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('purchase_invoice_lines')
      .update({ confirmed: !line.confirmed })
      .eq('id', line.id);
    if (error) setNotice({ text: error.message, tone: 'bad' });
    router.refresh();
  }

  async function confirm(invoiceId: string) {
    setBusy(true);
    setNotice(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc('crm_confirm_invoice', { p_invoice: invoiceId });
    setBusy(false);

    if (error) {
      setNotice({
        text: /function|does not exist/i.test(error.message)
          ? 'Voer supabase/migrations/0019_purchase_invoices.sql uit.'
          : error.message,
        tone: 'bad',
      });
      return;
    }

    const outcome = String(data);
    const said: Record<string, string> = {
      niet_gevonden: 'Deze factuur bestaat niet meer.',
      niet_uw_factuur: 'Dit is niet uw factuur.',
      al_verwerkt: 'Deze factuur is al verwerkt.',
      niets_aangevinkt: 'Vink eerst aan welke regels kloppen.',
    };
    setNotice(
      outcome.startsWith('ok:')
        ? { text: `${outcome.slice(3)} artikel(en) bijgeschreven in uw bus.`, tone: 'ok' }
        : { text: said[outcome] ?? 'Verwerken mislukt.', tone: 'bad' }
    );
    router.refresh();
  }

  return (
    <>
      <h2 className={ui.section}>
        <FileText size={16} strokeWidth={1.9} />
        Inkoopfacturen
      </h2>
      <p className={ui.sub} style={{ marginBottom: 'var(--sp-3)' }}>
        Koopt u ergens onderdelen? Upload de factuur — een PDF wordt uitgelezen, van een foto
        bewaren we het bewijs en typt u de regels erbij. Niets komt in uw voorraad voordat u het
        heeft aangevinkt.
      </p>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = '';
        }}
      />

      <Card>
        <div className={ui.row}>
          <div className={ui.rowMain}>
            <div className={ui.rowTitleLine}>
              <span className={ui.rowTitle}>Factuur toevoegen</span>
            </div>
            <div className={ui.rowMeta}>
              <span className={ui.hint}>PDF of foto, tot 12 MB</span>
            </div>
          </div>
          <div className={ui.rowActions}>
            <button
              className={`${ui.btn} ${ui.btnPrimary}`}
              onClick={() => fileInput.current?.click()}
              disabled={busy}
            >
              {busy ? <Loader2 size={15} className="spin" /> : <Upload size={15} strokeWidth={2} />}
              {busy ? 'Bezig…' : 'Uploaden'}
            </button>
          </div>
        </div>

        {invoices.length === 0 && <Empty>Nog geen facturen geüpload.</Empty>}

        {invoices.map((invoice) => {
          const ticked = invoice.lines.filter((l) => l.confirmed).length;
          const done = invoice.status === 'verwerkt';
          const expanded = open === invoice.id;

          return (
            <div key={invoice.id}>
              <div className={ui.row}>
                <div className={ui.rowMain}>
                  <div className={ui.rowTitleLine}>
                    <button
                      className={ui.rowTitle}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
                      onClick={() => setOpen(expanded ? null : invoice.id)}
                    >
                      {invoice.supplier ?? 'Onbekende leverancier'}
                    </button>
                    {invoice.invoice_number && (
                      <span className={ui.rowNote}>{invoice.invoice_number}</span>
                    )}
                  </div>
                  <div className={ui.rowMeta}>
                    <Badge tone={done ? 'ok' : invoice.status === 'gelezen' ? 'warn' : undefined}>
                      {done ? 'verwerkt' : invoice.status === 'gelezen' ? 'te controleren' : 'nieuw'}
                    </Badge>
                    <Badge>{invoice.lines.length} regel(s)</Badge>
                    {!done && ticked > 0 && <Badge tone="info">{ticked} aangevinkt</Badge>}
                    <span className={ui.hint}>
                      {invoice.invoice_date ?? new Date(invoice.created_at).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>
                <div className={ui.rowActions}>
                  <a className={ui.btn} href={invoice.file_url} target="_blank" rel="noopener noreferrer">
                    Bekijken
                  </a>
                  {!done && (
                    <button
                      className={`${ui.btn} ${ui.btnPrimary}`}
                      onClick={() => confirm(invoice.id)}
                      disabled={busy || ticked === 0}
                      title={ticked === 0 ? 'Vink eerst regels aan' : undefined}
                    >
                      <Check size={15} strokeWidth={2.2} />
                      In voorraad
                    </button>
                  )}
                </div>
              </div>

              {expanded && invoice.lines.length > 0 && (
                <div style={{ borderBottom: '1px solid var(--crm-rule)' }}>
                  <table className={ui.table}>
                    <thead>
                      <tr>
                        <th style={{ width: 44 }} />
                        <th>Omschrijving</th>
                        <th>Artikelnr.</th>
                        <th className={ui.numeric}>Aantal</th>
                        <th className={ui.numeric}>Stukprijs</th>
                        <th>Herkend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line) => (
                        <tr key={line.id}>
                          <td>
                            <button
                              className={`${ui.btn} ${ui.btnIcon}`}
                              onClick={() => toggle(line)}
                              disabled={done || busy}
                              aria-label={line.confirmed ? 'Uitvinken' : 'Aanvinken'}
                              style={
                                line.confirmed
                                  ? { borderColor: 'var(--crm-ok)', color: 'var(--crm-ok)' }
                                  : undefined
                              }
                            >
                              {line.confirmed ? <Check size={15} strokeWidth={2.4} /> : <Plus size={15} />}
                            </button>
                          </td>
                          <td style={{ color: 'var(--crm-ink)' }}>{line.description}</td>
                          <td className={ui.rowNote}>{line.article_code ?? '—'}</td>
                          <td className={ui.numeric}>{Number(line.quantity)}</td>
                          <td className={ui.numeric}>
                            {line.unit_price == null
                              ? '—'
                              : `€ ${Number(line.unit_price).toFixed(2).replace('.', ',')}`}
                          </td>
                          <td>
                            {line.matched_slug ? (
                              <Badge tone="ok">uit onze catalogus</Badge>
                            ) : (
                              <Badge>eigen omschrijving</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {expanded && invoice.lines.length === 0 && (
                <Empty>
                  Er kon geen tekst uit dit bestand gelezen worden. Voeg de artikelen hierboven
                  handmatig toe aan uw bus.
                </Empty>
              )}
            </div>
          );
        })}
      </Card>
    </>
  );
}
