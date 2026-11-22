'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { invoiceDay, invoiceToday, PAYMENT_REMINDER_DAYS, PAYMENT_TERM_DAYS } from '@/lib/invoiceDue';
import { Card, PageHead, Table, ui } from '../_ui';
import { usePreviewLanguage } from '../PreviewLanguage';
import helpStyles from '../voorraad/keyforcars.module.css';
import styles from './bank.module.css';

type Text = readonly [nl: string, en: string];
const views = {
  verwacht: {
    title: 'Verwachte betalingen',
    intro: ['Zie welke klantbetalingen binnenkort worden verwacht of al te laat zijn.', 'See which customer payments are coming up or overdue.'],
    steps: [
      ['De vervaldatum is de factuurdatum plus ' + PAYMENT_TERM_DAYS + ' kalenderdagen.', 'The due date is the invoice date plus ' + PAYMENT_TERM_DAYS + ' calendar days.'],
      ['Je ziet een herinnering vanaf ' + PAYMENT_REMINDER_DAYS + ' dagen voor de vervaldatum. Te late facturen blijven zichtbaar tot de betaling is geregistreerd.', 'A reminder appears ' + PAYMENT_REMINDER_DAYS + ' days before the due date. Overdue invoices stay visible until payment is recorded.'],
      ['Open de factuur om de betaalstatus te controleren. De herinnering wordt alleen in het panel getoond.', 'Open the invoice to check its payment status. Reminders appear inside the panel.'],
    ],
  },
  rekeningen: {
    title: 'Financiële rekeningen',
    intro: ['Controleer je saldo en open de bijbehorende banktransacties.', 'Check your balance and open the related transactions.'],
    steps: [
      ['Controleer de rekening en de verbindingsstatus. Deze rekening bevat oefengegevens.', 'Check the account and its connection status. This account contains practice data.'],
      ['Open Banktransacties om bij- en afschrijvingen te controleren. Het saldo bevat ook het beginsaldo.', 'Open Transactions to review deposits and withdrawals. The balance includes the opening balance.'],
      ['Bij een live koppeling geeft een beheerder toestemming bij de bank. De provider levert daarna nieuwe transacties aan.', 'For a live connection, an administrator grants permission at the bank. The provider then supplies new transactions.'],
    ],
  },
  transacties: {
    title: 'Banktransacties',
    intro: ['Koppel ontvangen bedragen aan facturen en boek uitgaven in een categorie.', 'Match incoming payments to invoices and categorize expenses.'],
    steps: [
      ['Bekijk de voorgestelde match. Vergelijk factuurreferentie, bedrag en valuta voordat je bevestigt.', 'Review the suggested match. Compare the invoice reference, amount, and currency before confirming.'],
      ['Bevestig de match. De openstaande factuur daalt met het ontvangen bedrag. Bij een deelbetaling blijft het restbedrag open.', 'Confirm the match. The amount due falls by the payment amount. A partial payment leaves the remaining balance outstanding.'],
      ['Verwerk een afschrijving onder de passende categorie. Gebruik Ongedaan Maken om een eerdere verwerking te herstellen.', 'Assign a withdrawal to the appropriate expense category. Use Undo to reverse a prior match or categorization.'],
    ],
  },
  betalingen: {
    title: 'Betalingen',
    intro: ['Volg per factuur wat is ontvangen en wat nog openstaat.', 'Track how much has been received and how much each invoice still owes.'],
    steps: [
      ['Filter op Openstaand of Betaald. Deels betaalde facturen blijven zichtbaar onder Openstaand.', 'Filter by Outstanding or Paid. Partially paid invoices still appear under Outstanding.'],
      ['Ga naar Banktransacties om een ontvangen bedrag te koppelen. Kom hier terug om het aangepaste saldo te zien.', 'Go to Transactions to match an incoming payment. Return here to see the updated balance.'],
      ['Een match verwerkt een betaling die al is ontvangen. Deze oefening verstuurt geen betaalopdracht.', 'Matching records a payment already received. This demo does not send a payment instruction.'],
    ],
  },
} satisfies Record<string, { title: string; intro: Text; steps: Text[] }>;

const movements = [
  { id: 'full', name: ['Klantbetaling · KFC-TEST-001', 'Customer payment · KFC-TEST-001'], cents: 12100, invoice: 'KFC-TEST-001' },
  { id: 'partial', name: ['Klantbetaling · KFC-TEST-003', 'Customer payment · KFC-TEST-003'], cents: 4000, invoice: 'KFC-TEST-003' },
  { id: 'shipping', name: ['Verzendkosten', 'Shipping expense'], cents: -1250, invoice: null },
] as const;
const invoices = [
  { ref: 'KFC-TEST-001', total: 12100, received: 0, days: 2, customer: 'Garage Demo' },
  { ref: 'KFC-TEST-002', total: 8470, received: 8470, days: -2, customer: 'Auto Demo' },
  { ref: 'KFC-TEST-003', total: 10000, received: 0, days: 9, customer: 'Werkplaats Demo' },
  { ref: 'KFC-TEST-004', total: 5800, received: 0, days: -4, customer: 'Service Demo' },
];
const key = 'keyforcars-bank-demo-v1';

function subscribe(refresh: () => void) {
  window.addEventListener('storage', refresh);
  window.addEventListener(key, refresh);
  return () => {
    window.removeEventListener('storage', refresh);
    window.removeEventListener(key, refresh);
  };
}

function read() {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}

type Expected = { id?: string; ref: string; customer: string; dueDate: string; cents: number };

export default function BankPreview({ view, expected }: { view: keyof typeof views; expected?: Expected[] | null }) {
  const { english, t } = usePreviewLanguage();
  const copy = (value: Text) => value[english ? 1 : 0];
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState<Text>();
  const saved = useSyncExternalStore(subscribe, read, () => '');
  const processed = new Set(saved.split(','));
  const receivedFor = (invoice: typeof invoices[number]) => movements.reduce((sum, move) =>
    move.invoice === invoice.ref && processed.has(move.id) ? sum + move.cents : sum, invoice.received);
  const today = invoiceDay(invoiceToday());
  const dates = new Intl.DateTimeFormat(english ? 'en-GB' : 'nl-NL', { dateStyle: 'medium', timeZone: 'UTC' });
  const schedule = view === 'verwacht' ? (expected ?? invoices.map(invoice => ({
    ref: invoice.ref,
    customer: invoice.customer,
    dueDate: new Date((today + invoice.days) * 86_400_000).toISOString().slice(0, 10),
    cents: invoice.total - receivedFor(invoice),
  } as Expected))).filter(invoice => invoice.cents > 0).map(invoice => ({
    ...invoice, days: invoiceDay(invoice.dueDate) - today,
  })).sort((a, b) => a.days - b.days) : [];
  const soon = schedule.filter(invoice => invoice.days >= 0 && invoice.days <= PAYMENT_REMINDER_DAYS).length;
  const overdue = schedule.filter(invoice => invoice.days < 0).length;
  const money = (cents: number) => new Intl.NumberFormat(english ? 'en-IE' : 'nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  const { title, intro, steps } = views[view];
  const bankLink = (route: keyof typeof views, label: Text) => <Link className={ui.btn} href={'/admin/bank/' + route}>{copy(label)}</Link>;
  function update(id: typeof movements[number]['id'], confirm: boolean) {
    const latest = new Set(read().split(',').filter(Boolean));
    if (confirm) latest.add(id);
    else latest.delete(id);
    try {
      localStorage.setItem(key, [...latest].join(','));
      window.dispatchEvent(new Event(key));
      setNotice(confirm ? ['Verwerking opgeslagen.', 'Processing saved.'] : ['Verwerking ongedaan gemaakt.', 'Processing undone.']);
    } catch {
      setNotice(['Opslaan is niet beschikbaar in deze browser.', 'Saving is unavailable in this browser.']);
    }
  }
  function table(headers: Text[], rows: ReactNode[]) {
    return <Card><Table head={headers.map(label => <th key={label[0]} scope="col">{copy(label)}</th>)}>
      {rows.length ? rows : <tr><td colSpan={headers.length}>{copy(['Geen resultaten voor dit filter.', 'No results for this filter.'])}</td></tr>}
    </Table></Card>;
  }

  return (
    <section>
      <PageHead title={t(title)} sub={copy(intro)} actions={
        <details className={helpStyles.stockHelp}>
          <summary aria-label={copy(['Uitleg over ' + title, 'Help for ' + t(title)])}><span aria-hidden="true">?</span></summary>
          <dl><div><dt>{copy(['Zo Werkt Het', 'How It Works'])}</dt><dd><ol className={styles.steps}>{steps.map(step => <li key={step[0]}>{copy(step)}</li>)}</ol></dd></div></dl>
        </details>
      } />
      {expected === undefined && <p className={styles.banner}>{copy(['Oefenomgeving · Fictieve gegevens. Verwerkingen worden alleen in deze browser bewaard.', 'Practice mode · Sample data. Changes are saved only in this browser.'])}</p>}
      {notice && <p role="status">{copy(notice)}</p>}
      {view === 'verwacht' && (expected === null ? <p role="alert">{copy(['Facturen konden niet worden geladen. Vernieuw de pagina om opnieuw te proberen.', 'Invoices could not be loaded. Refresh the page to retry.'])}</p> : <>
        {(soon > 0 || overdue > 0) && <p className={styles.banner} aria-live="polite">{copy([
          `${soon} binnen ${PAYMENT_REMINDER_DAYS} dagen · ${overdue} te laat`,
          `${soon} due within ${PAYMENT_REMINDER_DAYS} days · ${overdue} overdue`,
        ])}</p>}
        <label className={styles.filter}>{copy(['Vervaldatum', 'Due Date'])}
          <select value={filter} onChange={event => setFilter(event.target.value)}>
            <option value="all">{copy(['Alle Openstaande Facturen', 'All Outstanding Invoices'])}</option>
            <option value="soon">{copy(['Binnenkort', 'Due Soon'])}</option>
            <option value="late">{copy(['Te Laat', 'Overdue'])}</option>
          </select>
        </label>
        {table([['Factuur', 'Invoice'], ['Klant', 'Customer'], ['Vervaldatum', 'Due Date'], ['Openstaand', 'Outstanding'], ['Status', 'Status']],
          schedule.filter(invoice => filter === 'soon' ? invoice.days >= 0 && invoice.days <= PAYMENT_REMINDER_DAYS : filter === 'late' ? invoice.days < 0 : true)
            .map(invoice => <tr key={invoice.id ?? invoice.ref}>
              <td>{invoice.id ? <Link href={'/admin/facturen/' + invoice.id}>{invoice.ref}</Link> : invoice.ref}</td>
              <td>{invoice.customer}</td><td>{dates.format(new Date(invoice.dueDate))}</td><td>{money(invoice.cents)}</td>
              <td>{copy(invoice.days < 0 ? ['Te Laat', 'Overdue'] : invoice.days === 0 ? ['Vandaag', 'Due Today'] : invoice.days <= PAYMENT_REMINDER_DAYS ? ['Binnenkort', 'Due Soon'] : ['Gepland', 'Scheduled'])}</td>
            </tr>))}
      </>)}
      {view === 'rekeningen' && <>
        {table([['Rekening', 'Account'], ['Saldo', 'Balance'], ['Verbinding', 'Connection']], [
          <tr key="demo"><td>{copy(['Zakelijke Rekening (Demo)', 'Business Account (Demo)'])}</td><td>{money(97250 + movements.reduce((sum, move) => sum + move.cents, 0))}</td><td>{copy(['Niet Gekoppeld', 'Not Connected'])}</td></tr>,
        ])}
        <p>{bankLink('transacties', ['Bekijk Transacties', 'View Transactions'])}</p>
      </>}
      {view === 'transacties' && <>
        {table([['Omschrijving', 'Description'], ['Bedrag', 'Amount'], ['Afstemming', 'Reconciliation'], ['Actie', 'Action']],
          movements.map(move => {
            const done = processed.has(move.id);
            const status: Text = move.invoice
              ? (done ? ['Gekoppeld aan ' + move.invoice, 'Matched to ' + move.invoice] : ['Voorgestelde match · ' + move.invoice, 'Suggested match · ' + move.invoice])
              : (done ? ['Categorie · Verzendkosten', 'Category · Shipping Expenses'] : ['Categorievoorstel · Verzendkosten', 'Suggested category · Shipping Expenses']);
            const action: Text = done ? ['Ongedaan Maken', 'Undo'] : move.invoice ? ['Bevestig Match', 'Confirm Match'] : ['Boek Uitgave', 'Categorize Expense'];
            return <tr key={move.id}><td>{copy(move.name)}</td><td>{money(move.cents)}</td><td>{copy(status)}</td><td>
              <button type="button" className={ui.btn} aria-label={copy(action) + ' · ' + copy(move.name)} onClick={() => update(move.id, !done)}>{copy(action)}</button>
            </td></tr>;
          }))}
        <p>{bankLink('betalingen', ['Bekijk Betalingen', 'View Payments'])}</p>
      </>}
      {view === 'betalingen' && <>
        <label className={styles.filter}>{copy(['Betaalstatus', 'Payment Status'])}
          <select value={filter} onChange={event => setFilter(event.target.value)}>
            <option value="all">{copy(['Alles', 'All'])}</option>
            <option value="open">{copy(['Openstaand', 'Outstanding'])}</option>
            <option value="paid">{copy(['Betaald', 'Paid'])}</option>
          </select>
        </label>
        {table([['Factuur', 'Invoice'], ['Totaal', 'Total'], ['Ontvangen', 'Received'], ['Openstaand', 'Outstanding'], ['Status', 'Status']],
          invoices.flatMap(invoice => {
            const received = receivedFor(invoice);
            const due = invoice.total - received;
            if ((filter === 'open' && !due) || (filter === 'paid' && due)) return [];
            return <tr key={invoice.ref}><td>{invoice.ref}</td><td>{money(invoice.total)}</td><td>{money(received)}</td><td>{money(due)}</td><td>{copy(!due ? ['Betaald', 'Paid'] : received ? ['Deels Betaald', 'Partially Paid'] : ['Openstaand', 'Outstanding'])}</td></tr>;
          }))}
        <p>{bankLink('transacties', ['Ga Naar Transacties', 'Go to Transactions'])}</p>
        <p>{bankLink('verwacht', ['Bekijk Verwachte Betalingen', 'View Expected Payments'])}</p>
      </>}
    </section>
  );
}
