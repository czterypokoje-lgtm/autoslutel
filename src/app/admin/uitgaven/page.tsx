import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Badge, Empty, ui } from '../_ui';
import Link from 'next/link';
import { Plus, Building2, Wrench, Receipt } from 'lucide-react';
import x from './uitgaven.module.css';
import ExpenseActions from './ExpenseActions';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCaption';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Uitgaven | Autosleutel24',
};

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default async function UitgavenPage() {
  const user = await requireCrmUser('/admin/uitgaven');
  const supabase = await createSupabaseServerClient();
  const isOffice = user.role !== 'monteur';

  let query = supabase
    .from('expenses')
    .select('*, technician:technician_id(name), job:job_id(customer_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!isOffice) {
    const me = await supabase.from('technicians').select('id').eq('user_id', user.id).single();
    if (me.data) query = query.eq('technician_id', me.data.id);
  }

  const { data: expenses } = await query;

  /*
   * The `facturen` bucket is private on purpose — a bon carries a supplier, a
   * place and what somebody paid. One signed link per receipt, made here and
   * valid for the hour this page is likely to stay open, rather than a public
   * URL that would outlive the page in a browser history.
   */
  const paths = (expenses ?? []).map(e => e.receipt_url).filter(Boolean) as string[];
  const receipts = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('facturen').createSignedUrls(paths, 3600);
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) receipts.set(entry.path, entry.signedUrl);
    }
  }

  const STATUS: Record<string, { label: string; tone: 'ok' | 'warn' | 'stop' | 'info' }> = {
    pending: { label: 'Te keuren', tone: 'warn' },
    approved: { label: 'Goedgekeurd', tone: 'info' },
    paid: { label: 'Betaald', tone: 'ok' },
    rejected: { label: 'Afgewezen', tone: 'stop' },
  };
  const list = expenses ?? [];
  const sumOf = (st: string) => list.filter((e) => e.status === st).reduce((t, e) => t + Number(e.amount || 0), 0);
  const countOf = (st: string) => list.filter((e) => e.status === st).length;
  const shortDate = (iso: string) =>
    new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

  return (
    <>
      <PageHead
        title={isOffice ? 'Uitgaven' : 'Mijn uitgaven'}
        sub={
          isOffice
            ? 'Bonnetjes, abonnementen en declaraties. Keur goed of wijs af; bonnetjes van monteurs komen ook via Telegram binnen.'
            : 'Stuur je bonnetjes in en zie of ze zijn goedgekeurd en betaald. Een foto via Telegram werkt ook.'
        }
        actions={
          <Link href="/admin/uitgaven/nieuw" className={`${ui.btn} ${ui.btnPrimary}`}>
            <Plus size={16} />
            Nieuwe uitgave
          </Link>
        }
      />

      <div className={x.stats}>
        <div className={countOf('pending') ? x.statWarn : undefined}>
          <span>Te keuren</span>
          <b>{MONEY.format(sumOf('pending'))}</b>
          <small>{countOf('pending')} bonnetjes</small>
        </div>
        <div>
          <span>Goedgekeurd, nog te betalen</span>
          <b>{MONEY.format(sumOf('approved'))}</b>
          <small>{countOf('approved')} bonnetjes</small>
        </div>
        <div>
          <span>Betaald</span>
          <b>{MONEY.format(sumOf('paid'))}</b>
          <small>{countOf('paid')} bonnetjes</small>
        </div>
      </div>

      {!list.length ? (
        <Empty>Nog geen uitgaven geregistreerd.</Empty>
      ) : (
        <ul className={x.list}>
          {list.map((exp) => {
            const st = STATUS[exp.status] ?? { label: exp.status, tone: 'info' as const };
            return (
              <li key={exp.id} className={x.item}>
                <div className={x.itemMain}>
                  <div className={x.itemTop}>
                    <b>{EXPENSE_CATEGORIES[exp.category] || exp.category}</b>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {exp.is_reimbursable && <Badge>Declaratie</Badge>}
                  </div>
                  <div className={x.itemMeta}>
                    {shortDate(exp.date_incurred)} · {exp.description}
                  </div>
                  <div className={x.itemMeta}>
                    {exp.technician ? (
                      <span className={x.who}>
                        <Wrench size={14} /> {exp.technician.name}
                      </span>
                    ) : (
                      isOffice && (
                        <span className={x.who}>
                          <Building2 size={14} /> Kantoor
                        </span>
                      )
                    )}
                    {exp.receipt_url && receipts.has(exp.receipt_url) && (
                      <a href={receipts.get(exp.receipt_url)} target="_blank" rel="noopener noreferrer" className={x.receipt}>
                        <Receipt size={14} /> Bon bekijken
                      </a>
                    )}
                  </div>
                </div>
                <div className={x.itemRight}>
                  <span className={x.amount}>{MONEY.format(exp.amount)}</span>
                  {/* Whatever the status: an approved expense with a wrong
                      amount must still be correctable. */}
                  {isOffice && (
                    <ExpenseActions
                      expense={{
                        id: exp.id,
                        category: exp.category,
                        description: exp.description,
                        amount: exp.amount,
                        date_incurred: exp.date_incurred,
                        supplier_name: exp.supplier_name ?? null,
                        is_reimbursable: exp.is_reimbursable === true,
                        status: exp.status,
                      }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
