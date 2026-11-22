'use client';

import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import * as React from 'react';
import Link from 'next/link';
import { cn } from 'cn';
import { Printer, Tag, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ShopOrder } from '@/lib/kfcOrders';
import { LABEL_BATCH_MAX } from '@/lib/kfcLabels';
import { OrderLines, WHEN } from '../OrderParts';

/*
 * The pick list as a work board: orders grouped per day, filtered per shop
 * and state, selectable, with the label work done in bulk — "label maken
 * voor alles zonder label" and one print job for the whole batch, so the
 * 16:00 run is two clicks instead of one order at a time.
 */

type Status = 'all' | 'open' | 'picked' | 'short';
type LabelFilter = 'all' | 'none' | 'has';

const hasShort = (o: ShopOrder) => o.lines.some((l) => l.state === 'short');
const statusOf = (o: ShopOrder): Exclude<Status, 'all'> => (hasShort(o) ? 'short' : o.fulfilment === 'picked' ? 'picked' : 'open');

function dayKey(iso: string, now: number, english: boolean) {
  const d = new Date(iso); const today = new Date(now);
  const key = d.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' });
  if (key === today.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })) return english ? 'Today' : 'Vandaag';
  if (key === new Date(now - 864e5).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })) return english ? 'Yesterday' : 'Gisteren';
  return new Intl.DateTimeFormat(english ? 'en-GB' : 'nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' }).format(d);
}

async function post(body: unknown, signal?: AbortSignal): Promise<{ error?: string; label_url?: string; order?: ShopOrder }> {
  const r = await fetch('/api/admin/kfc-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }).catch(() => null);
  const data = await r?.json().catch(() => null);
  return r?.ok ? (data ?? {}) : { error: data?.error ?? 'Mislukt.' };
}

export function PickBoard({ orders: fromServer, now }: { orders: ShopOrder[]; now: number }) {
  const { english, t } = usePreviewLanguage();
  const [patched, setPatched] = React.useState<Record<string, ShopOrder>>({}); // orders the API handed back, over the server render
  const abort = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => abort.current?.abort(), []); // leaving the page stops the bulk run
  const [shop, setShop] = React.useState<string>('all');
  const [status, setStatus] = React.useState<Status>('all');
  const [label, setLabel] = React.useState<LabelFilter>('all');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [progress, setProgress] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);

  const orders = React.useMemo(() => fromServer.map((o) => patched[o.id] ?? o).filter((o) => o.fulfilment !== 'shipped'), [fromServer, patched]); // shipped leaves the board
  const shops = React.useMemo(() => Array.from(new Set(orders.map((o) => o.shop))).sort(), [orders]);
  const visible = orders.filter((o) =>
    (shop === 'all' || o.shop === shop) && (status === 'all' || statusOf(o) === status) && (label === 'all' || (label === 'none' ? !o.label_url : !!o.label_url)));
  const groups = visible.reduce<{ day: string; orders: ShopOrder[] }[]>((acc, o) => {
    const day = dayKey(o.created_at, now, english);
    const g = acc.find((x) => x.day === day);
    if (g) g.orders.push(o); else acc.push({ day, orders: [o] });
    return acc;
  }, []);
  const selectedOrders = orders.filter((o) => selected.has(o.id));
  const target = selectedOrders.length ? selectedOrders : visible;
  const withoutLabel = target.filter((o) => !o.label_url);
  const count = (f: (o: ShopOrder) => boolean) => orders.filter(f).length;

  function toggle(id: string, on: boolean) { setSelected((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; }); }
  const apply = React.useCallback((order: ShopOrder) => setPatched((p) => ({ ...p, [order.id]: order })), []);

  /* Three at a time (createLabel is idempotent); returns the ids that have a label afterwards. */
  async function makeLabels(batch: ShopOrder[]): Promise<Set<string>> {
    const labelled = new Set<string>();
    if (batch.length > LABEL_BATCH_MAX) {
      setProgress(`${batch.length} labels in één keer gaat niet; maximaal ${LABEL_BATCH_MAX}. Selecteer een kleinere groep of filter per shop.`);
      return labelled;
    }
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setProgress(`0 van ${batch.length} labels gemaakt…`);
    const failed: string[] = [];
    let next = 0, done = 0;
    const worker = async () => {
      while (next < batch.length && !controller.signal.aborted) {
        const order = batch[next++];
        const r = await post({ action: 'label', id: order.id }, controller.signal);
        if (controller.signal.aborted) return;
        if (r.error) failed.push(`#${order.number}: ${r.error}`);
        else if (r.order) { apply(r.order); if (r.order.label_url) labelled.add(r.order.id); }
        setProgress(`${++done} van ${batch.length} labels gemaakt…`);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    if (controller.signal.aborted) return labelled;
    setBusy(false);
    setProgress(failed.length ? `${labelled.size} labels gemaakt, ${failed.length} mislukt: ${failed.join(' · ')}` : `${batch.length} labels gemaakt.`);
    return labelled;
  }
  function printLabels(batch: ShopOrder[]) {
    if (batch.length > LABEL_BATCH_MAX) { setProgress(`${batch.length} labels in één keer printen gaat niet; maximaal ${LABEL_BATCH_MAX}. Selecteer een kleinere groep of filter per shop.`); return; }
    if (batch.length) window.open(`/admin/bestellingen/labels?ids=${batch.map((o) => o.id).join(',')}`, '_blank', 'noopener');
  }
  async function patPat() {
    const batch = target;
    const labelled = await makeLabels(batch.filter((o) => !o.label_url));
    printLabels(batch.filter((o) => !!o.label_url || labelled.has(o.id))); // only what really has a label
  }

  // 44 px tall on phones: these are tapped with a thumb in the warehouse.
  const chip = (on: boolean) => cn('min-h-11 rounded-md px-2.5 py-1 text-sm whitespace-nowrap transition-colors sm:min-h-0', on ? 'bg-primary text-primary-foreground' : 'hover:bg-muted');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1">
          <button type="button" aria-pressed={shop === 'all'} className={chip(shop === 'all')} onClick={() => setShop('all')}><PreviewText>{"Alle shops"}</PreviewText></button>
          {shops.map((s) => <button key={s} type="button" aria-pressed={shop === s} className={chip(shop === s)} onClick={() => setShop(s)}>{s} <span className="opacity-70">{count((o) => o.shop === s)}</span></button>)}
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1">
          {([['all', 'Alles'], ['open', 'Te picken'], ['picked', 'Gepickt'], ['short', 'Tekort']] as [Status, string][]).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={status === k} className={chip(status === k)} onClick={() => setStatus(k)}>{t(l)} {k !== 'all' && <span className="opacity-70">{count((o) => statusOf(o) === k)}</span>}</button>
          ))}
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1">
          {([['all', 'Alle labels'], ['none', 'Zonder label'], ['has', 'Met label']] as [LabelFilter, string][]).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={label === k} className={chip(label === k)} onClick={() => setLabel(k)}>{t(l)} {k !== 'all' && <span className="opacity-70">{count((o) => (k === 'none' ? !o.label_url : !!o.label_url))}</span>}</button>
          ))}
        </div>
      </div>

      <div className="bg-card sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border p-2 shadow-xs">
        <label className="flex items-center gap-2 px-1 text-sm">
          <Checkbox checked={visible.length > 0 && visible.every((o) => selected.has(o.id))} onCheckedChange={(v) => setSelected(v ? new Set(visible.map((o) => o.id)) : new Set())} aria-label={t("Alles zichtbaar selecteren")} />
          {selected.size ? `${selected.size} ${t("geselecteerd")}` : `${visible.length} ${t("zichtbaar")}`}
        </label>
        <span className="text-muted-foreground text-sm">· {withoutLabel.length} <PreviewText>{"zonder label"}</PreviewText></span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={busy || withoutLabel.length === 0} onClick={() => makeLabels(withoutLabel)}>
            <Tag data-icon="inline-start" /> {t("Labels maken")} ({withoutLabel.length})
          </Button>
          <Button size="sm" variant="outline" disabled={busy || target.every((o) => !o.label_url)} onClick={() => printLabels(target.filter((o) => !!o.label_url))}>
            <Printer data-icon="inline-start" /> Print labels ({target.filter((o) => !!o.label_url).length})
          </Button>
          <Button size="sm" disabled={busy || target.length === 0} onClick={patPat} title={t("Labels maken voor alles zonder label en daarna alles in één keer printen")}>
            <Zap data-icon="inline-start" /> {t("Alles labelen + printen")} ({target.length})
          </Button>
        </div>
        {progress && <p className="text-muted-foreground w-full px-1 text-xs">{progress}</p>}
      </div>

      {visible.length === 0 && <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm"><PreviewText>{"Niets te picken in deze selectie."}</PreviewText></p>}

      {groups.map((group) => (
        <section key={group.day} className="flex flex-col gap-4">
          <h2 className="text-muted-foreground flex items-baseline gap-2 text-sm font-medium capitalize">{group.day} <span className="text-xs font-normal">· {group.orders.length} {t(group.orders.length === 1 ? 'bestelling' : 'bestellingen')}</span></h2>
          {group.orders.map((order) => (
            <div key={order.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <Checkbox checked={selected.has(order.id)} onCheckedChange={(v) => toggle(order.id, !!v)} aria-label={`${t("Selecteer")} #${order.number}`} />
                <Link href={`/admin/bestellingen/${order.id}`} className="text-lg font-semibold underline-offset-4 hover:underline">#{order.number}</Link>
                <span className="text-muted-foreground text-sm">{order.shop} · {english ? new Date(order.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }) : WHEN.format(new Date(order.created_at))} · {order.country}</span>
                {order.label_url && <span className="text-muted-foreground text-xs">label {order.carrier === 'eigen' ? t('eigen') : order.carrier}{order.tracking_code && ` · ${order.tracking_code}`}</span>}
              </div>
              <OrderLines order={order} canAct onOrder={apply} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
