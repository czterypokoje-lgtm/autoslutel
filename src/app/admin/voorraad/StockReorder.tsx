'use client';

import { useState } from 'react';
import { ClipboardCopy, PackageSearch, ShoppingCart } from 'lucide-react';
import { REORDER_DEFAULTS, reorderAdvice, type ReorderStatus, type StockArticle, type StockState } from '@/lib/keyforcarsStock';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './keyforcars.module.css';
import { BRAND } from '@/config/install';

const STATUS: Record<ReorderStatus, { label: string; className: string }> = {
  order: { label: 'Nu bestellen', className: 'statusOrder' },
  uncounted: { label: 'Verkocht, nooit geteld', className: 'statusUncounted' },
  soon: { label: 'Binnenkort bestellen', className: 'statusSoon' },
  dead: { label: 'Geen verbruik (90 dagen)', className: 'statusDead' },
  ok: { label: 'Op voorraad', className: 'statusOk' },
};

/**
 * "What do I order today?" — the question the stock screen did not answer.
 * Lead time and cover are the office's own settings; everything else comes
 * from what was counted, sold and issued.
 */
export default function StockReorder({ state, catalog, incoming = {} }: { state: StockState; catalog: StockArticle[]; incoming?: Record<string, number> }) {
  const { t, english } = usePreviewLanguage();
  const [drafting, setDrafting] = useState(false);
  const demoMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  const [settings, setSettings] = useState(REORDER_DEFAULTS);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const articles = new Map(catalog.map((article) => [article.id, article]));
  const lines = reorderAdvice(state, new Date(), settings, incoming);
  const locale = english ? 'en-GB' : 'nl-NL';
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const toOrder = lines.filter((line) => line.suggest > 0);
  const orderValue = toOrder.reduce((sum, line) => sum + line.suggest * (line.unitCostCents ?? 0), 0);
  const unpriced = toOrder.filter((line) => line.unitCostCents === null).length;
  const drift = lines.filter((line) => line.shelf !== null && line.expected !== null && line.shelf !== line.expected);
  const count = (status: ReorderStatus) => lines.filter((line) => line.status === status).length;
  const visible = showAll ? lines : lines.filter((line) => line.status !== 'ok');

  function copyOrderList() {
    const text = [`${BRAND.name} · ${t('Bestellijst')} ${new Date().toLocaleDateString(locale)}`,
      ...toOrder.map((line) => {
        const article = articles.get(line.article);
        return `${line.suggest}× ${article?.sku || line.article} · ${article?.name || line.article}`;
      })].join('\n');
    void navigator.clipboard?.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); });
  }

  const setting = (key: keyof typeof settings, label: string, min: number, max: number) => (
    <label>{t(label)}<input type="number" min={min} max={max} step={1} value={settings[key]}
      onChange={(event) => {
        const value = Number(event.target.value);
        if (Number.isInteger(value) && value >= min && value <= max) setSettings({ ...settings, [key]: value });
      }} /></label>
  );

  return (
    <section className={`${styles.panel} ${styles.reorder}`} aria-labelledby="stock-reorder-title" id="bestelvoorstel">
      <div className={styles.reportToolbar}>
        <div className={styles.sectionHeading}>
          <ShoppingCart size={20} aria-hidden="true" /><h2 id="stock-reorder-title">{t('Bestelvoorstel')}</h2>
          <small>{t('Wat moet ik vandaag bestellen?')}</small>
        </div>
        <button type="button" className={styles.primary} disabled={!toOrder.length} onClick={copyOrderList}>
          <ClipboardCopy size={15} aria-hidden="true" /> {t(copied ? 'Gekopieerd' : 'Kopieer bestellijst')}
        </button>
          {!demoMode && toOrder.length > 0 && <button type="button" className={styles.secondary} disabled={drafting} onClick={async () => {
            setDrafting(true);
            const response = await fetch('/api/admin/inkoop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
              action: 'create', supplier: t('Bestelvoorstel'), note: `${t('Bestelvoorstel')} ${new Date().toLocaleDateString(locale)}`,
              lines: toOrder.map((line) => ({ article: line.article, quantity: line.suggest, unit_cost_cents: line.unitCostCents })),
            }) }).catch(() => null);
            setDrafting(false);
            if (response?.ok) window.location.href = '/admin/inkoop';
            else window.alert((await response?.json().catch(() => null))?.error ?? t('Inkooporder aanmaken mislukt.'));
          }}>{t('Maak inkooporder')}</button>}
      </div>

      <dl className={styles.reorderStats}>
        <div className={styles.statusOrder}><dt>{t('Nu bestellen')}</dt><dd>{count('order')}</dd></div>
        <div className={styles.statusSoon}><dt>{t('Binnenkort')}</dt><dd>{count('soon')}</dd></div>
        <div className={styles.statusUncounted}><dt>{t('Verkocht, nooit geteld')}</dt><dd>{count('uncounted')}</dd></div>
        <div><dt>{t('Geschatte bestelwaarde')}</dt><dd>{orderValue ? money.format(orderValue / 100) : '—'}</dd></div>
      </dl>
      {unpriced > 0 && <p className={styles.muted}>{unpriced} {t('regels zonder inkoopprijs: boek een ontvangst met bedrag om de waarde te zien.')}</p>}
      {drift.length > 0 && <p className={styles.reorderWarning}>
        <PackageSearch size={16} aria-hidden="true" />
        <span><strong>{drift.length} {t(drift.length === 1 ? 'artikel' : 'artikelen')}</strong> {t('waar de plank meer toont dan er nog is: verkopen zonder locatie halen niets van de bak af. Tel deze opnieuw.')}</span>
      </p>}

      <div className={styles.archiveControls}>
        {setting('leadDays', 'Levertijd leverancier (dagen)', 0, 120)}
        {setting('safetyDays', 'Veiligheidsmarge (dagen)', 0, 60)}
        {setting('coverDays', 'Bestellen voor (dagen)', 1, 180)}
        {setting('windowDays', 'Verbruik over (dagen)', 7, 365)}
      </div>

      {visible.length ? <ul className={styles.reorderList}>{visible.map((line) => {
        const article = articles.get(line.article);
        const status = STATUS[line.status];
        return <li key={line.article}>
          {article?.image ? <img src={article.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className={styles.reorderBlank} />}
          <div className={styles.reorderBody}>
            <strong>{article?.name || line.article}</strong>
            <small>{article?.sku || line.article}</small>
            <span className={styles.reorderFacts}>
              <span>{t('Plank')} <b>{line.shelf ?? '—'}</b></span>
              <span className={line.shelf !== null && line.expected !== line.shelf ? styles.reorderDrift : ''}>{t('Verwacht')} <b>{line.expected ?? '—'}</b></span>
              <span>{t('Verbruik')} <b>{number.format(line.perDay)}</b>/{t('dag')}</span>
              <span>{t('Genoeg voor')} <b>{line.coverDays === null ? '—' : `${Math.floor(line.coverDays)} ${t('dagen')}`}</b></span>
              <span>{t('Bestelpunt')} <b>{line.reorderPoint}</b></span>
            </span>
          </div>
          <div className={styles.reorderAction}>
            <span className={`${styles.reorderStatus} ${styles[status.className]}`}>{t(status.label)}</span>
            {line.suggest > 0 && <strong>{t('Bestel')} {line.suggest} {t('st.')}</strong>}
            {line.suggest > 0 && line.unitCostCents !== null && <small>{money.format(line.suggest * line.unitCostCents / 100)}</small>}
          </div>
        </li>;
      })}</ul> : <p className={styles.muted}>{t(lines.length ? 'Alles is op voorraad voor de gekozen periode.' : 'Nog geen tellingen of verkopen om een voorstel op te baseren.')}</p>}
      {lines.some((line) => line.status === 'ok') && <button type="button" className={styles.secondary} onClick={() => setShowAll(!showAll)}>
        {t(showAll ? 'Alleen actie tonen' : 'Ook artikelen op voorraad tonen')}
      </button>}
      <p className={styles.muted}>{t('Verwacht = laatste telling plus verkopen, uitgiftes en ontvangsten zonder locatie sinds die telling. Bestelpunt = verbruik tijdens levertijd en veiligheidsmarge, minimaal de minimumvoorraad.')}</p>
    </section>
  );
}
