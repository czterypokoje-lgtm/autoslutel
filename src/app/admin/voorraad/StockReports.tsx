import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, Camera, ChartNoAxesCombined, History, List, PieChart, Radio } from 'lucide-react';
import { STOCK_OPERATIONS, STOCK_TIME_ZONE, sampleSales, stockDate, stockMonthRange, stockPeriodReport, stockReports, type StockArticle, type StockMove, type StockState } from '@/lib/keyforcarsStock';
import styles from './keyforcars.module.css';
import { usePreviewLanguage } from '../PreviewLanguage';
import { Donut, RankedBars, chart } from '../_ui/charts';

const dateTime = new Intl.DateTimeFormat('nl-NL', { timeZone: STOCK_TIME_ZONE, dateStyle: 'short', timeStyle: 'short' });
const shortDate = (date: string) => date.split('-').reverse().join('-');
const reportViews = [
  { id: 'list', label: 'Lijst', Icon: List },
  { id: 'bars', label: 'Staafdiagram', Icon: BarChart3 },
  { id: 'donut', label: 'Ringdiagram', Icon: PieChart },
] as const;

export default function StockReports({ state, catalog, demo }: { state: StockState; catalog: StockArticle[]; demo: boolean }) {
  const { t, english } = usePreviewLanguage();
  const now = new Date();
  const today = stockDate(now);
  const [range, setRange] = useState<{ start: string; end: string }>();
  const [monthChoice, setMonthChoice] = useState('');
  const [view, setView] = useState<(typeof reportViews)[number]['id']>('list');
  const [draft, setDraft] = useState({ start: `${today.slice(0, 7)}-01`, end: today });
  const [scenario, setScenario] = useState<number>();
  const [expanded, setExpanded] = useState<string>();
  const moves = demo && scenario !== undefined
    ? [...sampleSales(catalog, scenario, now), ...state.moves.filter((move) => move.operation !== 'sale')]
    : state.moves;
  const reports = range
    ? [{ title: 'Gekozen periode', ...stockPeriodReport(moves, now, range.start, range.end) }]
    : stockReports(moves, now);
  const journal = range ? moves.filter((move) => {
    const day = stockDate(new Date(move.time));
    return day >= range.start && day <= range.end;
  }) : moves;
  const feed = state.moves.filter((move) => move.bot).slice(0, 5);
  const [visible, setVisible] = useState(8);
  const articles = new Map(catalog.map((article) => [article.id, article]));
  const money = new Intl.NumberFormat(english ? 'en-GB' : 'nl-NL', { style: 'currency', currency: 'EUR' });
  const monthLabel = new Intl.DateTimeFormat(english ? 'en-GB' : 'nl-NL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const monthCursor = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
  const firstMonth = state.moves.reduce((earliest, move) => {
    const month = stockDate(new Date(move.time)).slice(0, 7);
    return month < earliest ? month : earliest;
  }, today.slice(0, 7));
  const months = [];
  while (months.length < 12 || monthCursor.toISOString().slice(0, 7) >= firstMonth) {
    months.push({ value: monthCursor.toISOString().slice(0, 7), label: monthLabel.format(monthCursor) });
    monthCursor.setUTCMonth(monthCursor.getUTCMonth() - 1);
  }

  function movementRow(move: StockMove, index: number) {
    const article = articles.get(move.article);
    const Direction = move.delta < 0 ? ArrowUpRight : ArrowDownLeft;
    const quantityLabel = move.operation === 'sale' ? 'Verkocht aantal' : move.operation === 'count' ? 'Geteld aantal' : move.delta < 0 ? 'Afname' : 'Toename';
    const quantity = move.operation === 'count' ? move.after : Math.abs(move.delta);
    return <li key={move.id ?? move.bot?.eventId ?? `${move.time}/${index}`}>
      <span className={`${styles.moveIcon} ${move.delta < 0 ? styles.outflow : styles.inflow}`}><Direction size={17} aria-hidden="true" /></span>
      <div className={styles.moveBody}>
        <small>{t(STOCK_OPERATIONS[move.operation as keyof typeof STOCK_OPERATIONS])} · {article?.sku || move.article}</small>
        <strong>{article?.name || move.article}</strong>
        <span className={styles.moveLocation}>{move.shelf ? <><span>{t('Rallocatie')} <b>{move.shelf}</b></span><span>{t('Bak')} <b>{move.box}</b></span></> : t('Locatie niet opgegeven')}</span>
        {move.note && <span>{move.note}</span>}
        {move.amountCents !== undefined && <span>{t('Bedrag')} {money.format(move.amountCents / 100)}</span>}
        {move.photo && <a href={`/api/admin/voorraad-local?movement=${move.id}${demo ? '&demo=1' : ''}`} target="_blank" rel="noreferrer"><Camera size={14} aria-hidden="true" /> {t('Bewijsfoto')}</a>}
      </div>
      <div className={styles.moveMeta}>
        <dl className={styles.moveMetrics}>
          <div><dt>{t(quantityLabel)}</dt><dd>{quantity} {t('st.')}</dd></div>
          {move.operation !== 'count' && <div><dt>{t('Voorraad na boeking')}</dt><dd>{move.after === null ? t('Onbekend') : `${move.after} ${t('st.')}`}</dd></div>}
        </dl>
        <time dateTime={move.time}>{dateTime.format(new Date(move.time))}</time>
      </div>
    </li>;
  }
  return (
    <section className={styles.reports} aria-labelledby="stock-reports-title">
      <div className={styles.reportToolbar}>
        <div className={styles.sectionHeading}><ChartNoAxesCombined size={20} aria-hidden="true" /><h2 id="stock-reports-title">{t("Voorraadrapporten")}</h2></div>
        <div className={styles.reportViews} role="group" aria-label={t('Rapportweergave')}>
          {reportViews.map(({ id, label, Icon }) => <button key={id} className={styles.secondary} type="button" aria-pressed={view === id} onClick={() => setView(id)}><Icon size={15} aria-hidden="true" />{t(label)}</button>)}
        </div>
      </div>
      {demo && <div className={`${styles.panel} ${styles.archive}`}>
        <label>{t('Verkoopvoorbeeld')}<select value={scenario ?? ''} onChange={(event) => {
          setScenario(event.target.value === '' ? undefined : Number(event.target.value));
          setRange(undefined);
          setMonthChoice('');
          setExpanded(undefined);
          setVisible(8);
        }}>
          <option value="">{t('Bestaande voorbeeldgegevens')}</option>
          <option value="0">{t('Geen verkoop')}</option>
          <option value="100">{t('100 verschillende producten')}</option>
          <option value="1200">{t('1.200 verschillende producten')}</option>
        </select></label>
        {scenario !== undefined && <small className={styles.muted}>{t('Voorbeeldverkopen voor vandaag. Voorraad wordt niet gewijzigd.')}</small>}
      </div>}
      <form id="rapportarchief" className={`${styles.panel} ${styles.archive}`} onSubmit={(event) => {
        event.preventDefault();
        const dates = new FormData(event.currentTarget);
        const start = String(dates.get('from') ?? '');
        const end = String(dates.get('through') ?? '');
        if (start && end && start <= end && end <= today) { setRange({ start, end }); setVisible(8); }
      }}>
        <div className={styles.sectionHeading}><CalendarDays size={20} aria-hidden="true" /><h2>{t('Rapportarchief')}</h2>{demo && <small>{t('Voorbeeldgegevens')}</small>}</div>
        <div className={styles.archiveControls}>
          <label>{t('Kies maand')}<select value={monthChoice} onChange={(event) => {
            setMonthChoice(event.target.value);
            const month = stockMonthRange(event.target.value);
            if (month && month.start <= today) {
              const selected = { start: month.start, end: month.end > today ? today : month.end };
              setDraft(selected);
              setRange(selected);
              setVisible(8);
            }
          }}><option value="">—</option>{months.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>{t('Van')}<input name="from" type="date" required value={draft.start} max={draft.end || today} onChange={(event) => { setMonthChoice(''); setDraft({ ...draft, start: event.target.value }); }} /></label>
          <label>{t('Tot en met')}<input name="through" type="date" required value={draft.end} min={draft.start} max={today} onChange={(event) => { setMonthChoice(''); setDraft({ ...draft, end: event.target.value }); }} /></label>
          <button className={styles.primary}>{t('Toon rapport')}</button>
          {range && <button type="button" className={styles.secondary} onClick={() => { setRange(undefined); setMonthChoice(''); setVisible(8); }}>{t('Huidige periodes')}</button>}
        </div>
      </form>
      <div className={styles.reportGrid}>
        {reports.map((report) => {
          const namedSales = report.topSales.map(([id, value]) => {
            const article = articles.get(id);
            return { label: article ? `${article.sku || id} · ${article.name}` : id, value };
          });
          const remaining = report.sale - namedSales.reduce((sum, row) => sum + row.value, 0);
          const slices = remaining > 0 ? [...namedSales, { label: t('Overige producten'), value: remaining }] : namedSales;
          const formatQuantity = (value: number) => `${value} ${t('st.')}`;
          return (
          <section key={report.title} className={`${styles.panel} ${styles.reportCard}`}>
            <header className={styles.reportHero}>
              <div><h3>{t(report.title)}</h3>
                <small>{report.start === report.end ? shortDate(report.start) : `${shortDate(report.start)} – ${shortDate(report.end)}`}</small>
              </div>
              <CalendarDays size={18} aria-hidden="true" />
              <p><strong>{report.sale.toLocaleString(english ? 'en-GB' : 'nl-NL')}</strong> {t("verkocht")}</p>
              <small className={styles.soldVariety}>{report.rankedSales.length.toLocaleString(english ? 'en-GB' : 'nl-NL')} {t(report.rankedSales.length === 1 ? 'uniek artikel verkocht' : 'unieke artikelen verkocht')}</small>
            </header>
            <h4>{t("Meest verkocht")}</h4>
            {!namedSales.length ? <p className={styles.muted}>{t("Geen verkopen geregistreerd")}</p>
              : view === 'bars' ? <div className={`${styles.reportGraphic} ${chart.reportWideLabels}`}><RankedBars rows={namedSales} format={formatQuantity} /></div>
              : view === 'donut' ? <div className={`${styles.reportGraphic} ${chart.reportWideLabels}`}><Donut slices={slices} format={formatQuantity} showValues ariaLabel={t('Aandeel van verkochte aantallen')} /></div>
              : <ol className={styles.salesRank}>{report.topSales.map(([id, quantity]) => {
              const article = articles.get(id);
              return <li key={id}>
                {article?.image && <img src={article.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
                <div><span>{article?.name || id}</span><span className={styles.rankTrack} aria-hidden="true"><i style={{ width: `${100 * quantity / report.topSales[0][1]}%` }} /></span></div>
                <strong>{quantity} {t("st.")}</strong>
              </li>;
            })}</ol>}
            {report.rankedSales.length > report.topSales.length && <details className={styles.fullRanking} open={expanded === report.title} onToggle={(event) => {
              const open = event.currentTarget.open;
              setExpanded((current) => open ? report.title : current === report.title ? undefined : current);
            }}>
              <summary>{t('Alle verkochte artikelen')} ({report.rankedSales.length})</summary>
              {expanded === report.title && <ol>{report.rankedSales.map(([id, quantity]) => <li key={id}>
                <span>{articles.get(id)?.name || id} <small>{articles.get(id)?.sku || id}</small></span>
                <strong>{formatQuantity(quantity)}</strong>
              </li>)}</ol>}
            </details>}
            <dl>
              {Object.entries(STOCK_OPERATIONS).filter(([key]) => key !== 'sale').map(([key, title]) => (
                <div key={key}><dt>{t(title)}</dt><dd>{report[key as keyof typeof STOCK_OPERATIONS]}{key === 'count' ? '' : ` ${t('st.')}`}</dd></div>
              ))}
              {demo && <div><dt>{t("Externe gebeurtenissen")}</dt><dd>{report.bot}</dd></div>}
            </dl>
            <dl className={styles.reportMoney}>
              <div><dt>{t('Geboekte verkoopbedragen')}</dt><dd>{report.pricedSales ? money.format(report.revenueCents / 100) : '—'}</dd></div>
              <div><dt>{t('Geboekte inkoopbedragen')}</dt><dd>{report.pricedReceipts ? money.format(report.purchaseCents / 100) : '—'}</dd></div>
            </dl>
            <small className={styles.muted}>{t('Boekingen zonder bedrag')}: {t('Verkoop')} {report.sales - report.pricedSales} · {t('Ontvangst')} {report.receipts - report.pricedReceipts}</small>
          </section>
          );
        })}
      </div>
      <section className={`${styles.panel} ${styles.journal}`} id="boekingen">
        <div className={styles.sectionHeading}><History size={20} aria-hidden="true" /><h2>{t("Voorraadlogboek")}</h2>{demo && <small>{t("Voorbeeldgegevens")}</small>}</div>
        {journal.length ? <ul className={styles.journalList}>{journal.slice(0, visible).map(movementRow)}</ul> : <p className={styles.muted}>{t("Geen boekingen")}</p>}
        {visible < journal.length && <button className={styles.secondary} type="button" onClick={() => setVisible(visible + 20)}>{t("Meer boekingen")}</button>}
      </section>
      {demo && <section className={styles.panel}>
        <div className={styles.sectionHeading}><Radio size={19} aria-hidden="true" /><h2>{t('Externe voorraadberichten')}</h2></div>
        <p className={styles.muted}>{t("Voorbeeldgegevens · automatisch bijgewerkt zodra een gebeurtenis binnenkomt.")}</p>
        <ul className={styles.journalList}>{feed.map(movementRow)}</ul>
      </section>}
    </section>
  );
}
