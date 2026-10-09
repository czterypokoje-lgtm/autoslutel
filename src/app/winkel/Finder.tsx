'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './winkel.module.css';

/**
 * "Welke auto heeft u?" — three dropdowns and a plate field.
 *
 * A real <form method="get" action="/winkel/zoeken">, so it submits and
 * returns results with JavaScript off or still loading. React only
 * progressively enhances it: narrowing the model list to the chosen make,
 * and the year list to the span the supplier actually states. Without
 * hydration you pick a make and press the button, which is the answer that
 * works for 60% of the catalogue anyway.
 *
 * The data for that narrowing is passed in whole (61 makes, 850 models) by
 * the server component. It is a few tens of kilobytes and it means changing
 * the make does not cost a round trip while someone is standing next to
 * their car.
 */

export interface FinderMake {
  make: string;
  count: number;
  sellable: number;
}

export interface FinderModel {
  model: string;
  fromYear: number | null;
  toYear: number | null;
}

interface Props {
  makes: FinderMake[];
  /** make (lowercased) → its models. */
  modelsByMake: Record<string, FinderModel[]>;
  initial?: { make?: string; model?: string; year?: number };
}

const THIS_YEAR = new Date().getFullYear();

export default function Finder({ makes, modelsByMake, initial }: Props) {
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [year, setYear] = useState(initial?.year ? String(initial.year) : '');

  const [plate, setPlate] = useState('');
  const [plateError, setPlateError] = useState<string | null>(null);
  const [plateBusy, setPlateBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const models = useMemo(
    () => modelsByMake[make.trim().toLowerCase()] ?? [],
    [modelsByMake, make]
  );

  /*
   * Years come from the chosen model when it states a span, otherwise from
   * the make as a whole. An empty list hides the year step: asking for a
   * year that nothing states would take the visitor's one chance to narrow
   * and spend it on a field the finder then ignores.
   */
  const years = useMemo(() => {
    const rows = model
      ? models.filter((m) => m.model.toLowerCase() === model.toLowerCase())
      : models;

    let from: number | null = null;
    let to: number | null = null;
    for (const r of rows) {
      if (r.fromYear) from = from == null ? r.fromYear : Math.min(from, r.fromYear);
      if (r.toYear) to = to == null ? r.toYear : Math.max(to, r.toYear);
    }
    if (from == null && to == null) return [];

    const start = from ?? 1990;
    const end = Math.min(to ?? THIS_YEAR, THIS_YEAR);
    if (end < start) return [];

    const out: number[] = [];
    for (let y = end; y >= start; y--) out.push(y);
    return out;
  }, [models, model]);

  /**
   * The plate shortcut: six characters instead of three dropdowns.
   *
   * RDW gives us make, model and year, and whatever it returns is only used
   * to pre-fill the three fields — never to search directly. The visitor sees
   * what we understood from their plate and can correct it, which matters
   * because RDW writes "GOLF VARIANT" where our supplier writes "Golf".
   */
  async function lookupPlate() {
    const cleaned = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length < 4) {
      setPlateError('Vul een volledig kenteken in.');
      return;
    }

    setPlateBusy(true);
    setPlateError(null);
    try {
      const res = await fetch(`/api/kenteken?q=${encodeURIComponent(cleaned)}`);
      const json = await res.json();

      if (!res.ok || !json?.success || !json?.data?.merk) {
        setPlateError(
          json?.error ?? 'Dit kenteken kennen we niet. Kies hieronder zelf uw auto.'
        );
        return;
      }

      // RDW shouts ("VOLKSWAGEN"); our catalogue does not. Match on lowercase
      // and keep OUR spelling, so the value matches a dropdown option.
      const rdwMake = String(json.data.merk).trim().toLowerCase();
      const known = makes.find((m) => m.make.toLowerCase() === rdwMake);
      if (!known) {
        setPlateError(
          `Voor ${json.data.merk} hebben we nog geen onderdelen in de winkel. Bel ons — we maken de sleutel op locatie.`
        );
        return;
      }
      setMake(known.make);

      /*
       * RDW's handelsbenaming is longer than our model names ("GOLF VARIANT"
       * against "Golf"), so take the longest of our models that appears
       * inside it. Longest wins so "Golf Plus" beats "Golf" when both match.
       */
      const rdwModel = String(json.data.model ?? '').trim().toLowerCase();
      const ourModels = modelsByMake[known.make.toLowerCase()] ?? [];
      const hit = ourModels
        .filter((m) => {
          const a = m.model.toLowerCase();
          return rdwModel.includes(a) || a.includes(rdwModel);
        })
        .sort((a, b) => b.model.length - a.model.length)[0];
      setModel(hit?.model ?? '');

      const bouwjaar = Number(json.data.bouwjaar);
      setYear(Number.isInteger(bouwjaar) && bouwjaar > 1950 ? String(bouwjaar) : '');

      // Straight to the results: the visitor gave us a plate to save time.
      const params = new URLSearchParams({ merk: known.make });
      if (hit?.model) params.set('model', hit.model);
      if (Number.isInteger(bouwjaar) && bouwjaar > 1950) params.set('jaar', String(bouwjaar));
      params.set('kenteken', cleaned);
      startTransition(() => router.push(`/winkel/zoeken?${params.toString()}`));
    } catch {
      setPlateError('Opzoeken lukte niet. Kies hieronder zelf uw auto.');
    } finally {
      setPlateBusy(false);
    }
  }

  return (
    <div className={styles.finderInner}>
      <p className={styles.finderKicker}>Onderdelen winkel</p>
      <h1 className={styles.finderTitle}>Welke auto heeft u?</h1>
      <p className={styles.finderLead}>
        Kies uw merk en we laten zien welke sleutelbehuizingen, baarden,
        batterijen en printplaten erop passen — en wat u zelf kunt monteren.
      </p>

      {/* Works as plain HTML: method=get, a real action, named fields. */}
      <form method="get" action="/winkel/zoeken" className={styles.steps}>
        <div className={styles.step}>
          <label className={styles.stepLabel} htmlFor="finder-merk">
            Merk
          </label>
          <select
            id="finder-merk"
            name="merk"
            className={styles.select}
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              // A model from the previous make is meaningless now.
              setModel('');
              setYear('');
            }}
            required
          >
            <option value="">Kies uw merk…</option>
            {makes.map((m) => (
              <option key={m.make} value={m.make}>
                {m.make} ({m.count})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.step}>
          <label className={styles.stepLabel} htmlFor="finder-model">
            Model <span style={{ opacity: 0.6 }}>(optioneel)</span>
          </label>
          <select
            id="finder-model"
            name="model"
            className={styles.select}
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setYear('');
            }}
            disabled={!make}
          >
            {/*
              Not "alle modellen" — that would suggest the list is complete.
              Only 20% of the catalogue names a model, so "staat er niet bij"
              is the normal case and has to read like a valid answer.
            */}
            <option value="">
              {make && models.length === 0
                ? 'Geen modellen bekend — kies alleen merk'
                : 'Alle / staat er niet bij'}
            </option>
            {models.map((m) => (
              <option key={m.model} value={m.model}>
                {m.model}
                {m.fromYear ? ` (${m.fromYear}${m.toYear ? `–${m.toYear}` : '–nu'})` : ''}
              </option>
            ))}
          </select>
        </div>

        {years.length > 0 ? (
          <div className={styles.step}>
            <label className={styles.stepLabel} htmlFor="finder-jaar">
              Bouwjaar <span style={{ opacity: 0.6 }}>(optioneel)</span>
            </label>
            <select
              id="finder-jaar"
              name="jaar"
              className={styles.select}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Weet ik niet</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button
          type="submit"
          className={`btn btn-primary ${styles.finderSubmit}`}
          disabled={!make}
        >
          Onderdelen zoeken
        </button>
      </form>

      <div className={styles.plateRow}>
        <div className={styles.plateField}>
          <span className={styles.plateCountry}>NL</span>
          <input
            className={styles.plateInput}
            value={plate}
            onChange={(e) => {
              setPlate(e.target.value);
              setPlateError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void lookupPlate();
              }
            }}
            placeholder="XX-123-X"
            aria-label="Kenteken"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={10}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline-white"
          onClick={() => void lookupPlate()}
          disabled={plateBusy}
        >
          {plateBusy ? 'Zoeken…' : 'Vul in met kenteken'}
        </button>
      </div>

      {plateError ? (
        <p className={styles.plateError} role="status">
          {plateError}
        </p>
      ) : (
        <p className={styles.plateHint}>
          Sneller: vul uw kenteken in en we vullen merk, model en bouwjaar zelf in.
        </p>
      )}
    </div>
  );
}
