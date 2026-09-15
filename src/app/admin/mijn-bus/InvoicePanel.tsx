'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, FileText, Loader2, Plus, Upload, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { ui, Card, CardHead, Badge, Empty, Notice } from '../_ui';
import styles from './invoicePanel.module.css';

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

  async function openFile(path: string) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.storage.from('facturen').createSignedUrl(path, 60);
    if (error || !data) {
      setNotice({ text: 'Kon het bestand niet openen.', tone: 'bad' });
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
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

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,text/csv,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,.xlsx,image/jpeg,image/png,image/webp,image/heic,image/heif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = '';
        }}
      />

      {/*
        A small box, not a banner. Uploading an invoice is something a monteur
        does once a fortnight; the stock above is what they open this page for,
        so the entry point is a strip at the foot of it rather than a card
        competing with the thing they came to read.
      */}
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={busy}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-3)',
          width: '100%',
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-3)',
          border: '1px dashed var(--crm-rule2)',
          borderRadius: 'var(--crm-r)',
          background: 'transparent',
          color: 'var(--crm-muted)',
          font: 'inherit',
          fontSize: 'var(--fs-sm)',
          textAlign: 'left',
          cursor: busy ? 'default' : 'pointer',
        }}
      >
        {busy ? <Loader2 size={16} /> : <Upload size={16} strokeWidth={1.9} />}
        <span style={{ color: 'var(--crm-text)', fontWeight: 500 }}>
          {busy ? 'Bezig met lezen…' : 'Factuur toevoegen'}
        </span>
        <span style={{ marginLeft: 'auto' }}>PDF, CSV, Excel of foto · tot 12 MB</span>
      </button>

      <Card>
        {invoices.length === 0 && (
          <Empty>
            Nog geen facturen. Een PDF, CSV of Excel wordt uitgelezen; van een foto bewaren we het
            bewijs. Niets komt in uw voorraad voordat u het heeft aangevinkt.
          </Empty>
        )}

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
                  {/*
                    The bucket is private, so there is no URL to link to — a
                    signed one is minted here and lasts a minute. That is the
                    point: an invoice link should not survive in a browser
                    history.
                  */}
                  <button className={ui.btn} onClick={() => openFile(invoice.file_url)} disabled={busy}>
                    Bekijken
                  </button>
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
                  <div className={styles.desktopTable}>
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

                  {/*
                    * The same lines, one card each — every field the table
                    * shows, stacked instead of squeezed sideways, and the
                    * confirm toggle sized for a thumb instead of a table
                    * cell.
                    */}
                  <div className={styles.cards}>
                    {invoice.lines.map((line) => (
                      <div
                        key={line.id}
                        className={`${styles.lineCard} ${line.confirmed ? styles.lineCardConfirmed : ''}`}
                      >
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${line.confirmed ? styles.toggleBtnOn : ''}`}
                          onClick={() => toggle(line)}
                          disabled={done || busy}
                          aria-label={line.confirmed ? 'Uitvinken' : 'Aanvinken'}
                        >
                          {line.confirmed ? <Check size={17} strokeWidth={2.4} /> : <Plus size={17} />}
                        </button>

                        <div className={styles.lineCardMain}>
                          <span className={styles.lineCardDesc}>{line.description}</span>
                          <div className={styles.lineCardMeta}>
                            {line.article_code && <span>{line.article_code}</span>}
                            <span>{Number(line.quantity)}×</span>
                            <span className={styles.lineCardPrice}>
                              {line.unit_price == null
                                ? '—'
                                : `€ ${Number(line.unit_price).toFixed(2).replace('.', ',')}`}
                            </span>
                            {line.matched_slug ? (
                              <Badge tone="ok">uit onze catalogus</Badge>
                            ) : (
                              <Badge>eigen omschrijving</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
