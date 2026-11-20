'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TIME_SLOTS } from '@/lib/crmJobs';

import { OTHER, SERVICE_OPTIONS, clean, type PickerMake } from '../nieuw/CarPicker';
import type { PlanLead } from '../nieuw/PlanForm';

/**
 * "Klus inplannen", Studio look.
 *
 * A presentation twin of nieuw/PlanForm: every piece of state, every
 * validation, the debounced lead lookup and the POST body below are the same
 * code as the old form. Only the markup changed — shadcn Card/Input/Select/
 * Textarea/Button instead of jobs.module.css.
 */

interface SuggestionView {
  id: string;
  name: string;
  inRegion: boolean;
  reason: string;
  /** The rate this monteur agreed to, or null when they have no subscription row. */
  commissionPct: number | null;
}

/** Falls back to the same 25% the payout and balance screens assume. */
const DEFAULT_COMMISSION_PCT = 25;

/* Radix Select has no value for "nothing chosen" — an empty string is how it
   says "uncontrolled" — so the placeholder and the "Anders…" escape hatch
   travel as sentinels and are mapped back at the edge. */
const NONE = '__none__';

export default function StudioPlanForm({
  lead,
  order,
  date,
  suggestions,
  initialSlot,
  initialTechnicianId,
  cars,
}: {
  lead: PlanLead | null;
  order: { id: string; order_number: string; total_inc: number } | null;
  date: string;
  suggestions: SuggestionView[];
  /** Set when this form opened from a click on an empty hour in the calendar. */
  initialSlot?: string;
  initialTechnicianId?: string;
  /** Every make and model in the catalogue, for the pickers. */
  cars: PickerMake[];
}) {
  const router = useRouter();

  const [scheduledDate, setScheduledDate] = useState(date);
  // 10:00–12:00 is the first slot of a normal working day; night windows exist
  // but should never be the default. A click on the calendar overrides both.
  const [slot, setSlot] = useState(initialSlot ?? '10:00');
  const [technicianId, setTechnicianId] = useState<string>(initialTechnicianId ?? suggestions[0]?.id ?? '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(lead?.location ?? '');
  const [postcode, setPostcode] = useState(lead?.postcode ?? '');
  const [kenteken, setKenteken] = useState(lead?.kenteken ?? '');
  const [service, setService] = useState(lead?.service ?? '');
  // A lead that came through the site already says which car it is; a walk-in
  // planned by hand starts blank and the office types it in.
  const [carMake, setCarMake] = useState(lead?.brand ?? '');
  const [carModel, setCarModel] = useState(lead?.model ?? '');
  const [carYear, setCarYear] = useState(lead?.year ?? '');
  const [keylessChoice, setKeylessChoice] = useState<'' | 'true' | 'false'>('');
  const [customerName, setCustomerName] = useState(lead?.name ?? '');
  const [customerPhone, setCustomerPhone] = useState(lead?.phone_e164 ?? lead?.phone ?? '');

  /*
   * Linking a phone-in back to the lead it came from: only offered, never
   * applied on its own. Two people share a number more often than a CRM
   * expects, and a wrongly linked job would report someone else's ad click as
   * the cause of this sale.
   */
  const [linkedLeadId, setLinkedLeadId] = useState<string | null>(lead?.id ?? null);
  const [matches, setMatches] = useState<
    { id: string; name: string | null; service: string | null; created_at: string; hasClickId: boolean }[]
  >([]);
  const [dismissed, setDismissed] = useState(false);

  const phoneDigits = customerPhone.replace(/\D/g, '');
  const lookupWorthIt = !linkedLeadId && !order && !dismissed && phoneDigits.length >= 9;

  useEffect(() => {
    if (!lookupWorthIt) return;

    let cancelled = false;
    /* Debounced: this fires while somebody is still typing the number. */
    const timer = setTimeout(() => {
      fetch(`/api/admin/leads/by-phone?phone=${encodeURIComponent(customerPhone)}`)
        .then((r) => (r.ok ? r.json() : { leads: [] }))
        .then((json) => { if (!cancelled) setMatches(json.leads ?? []); })
        .catch(() => { if (!cancelled) setMatches([]); });
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [customerPhone, lookupWorthIt]);

  // A webshop order is already paid, so the agreed price is known exactly.
  const [quoted, setQuoted] = useState(order ? String(order.total_inc) : '');
  const [commissionPct, setCommissionPct] = useState('');
  const [commissionAmount, setCommissionAmount] = useState('');
  /* Whichever box the office typed in last is the truth; the other follows. */
  const [lastEdited, setLastEdited] = useState<'pct' | 'amount' | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const agreedPct = suggestions.find((s) => s.id === technicianId)?.commissionPct ?? null;

  const num = (s: string) => Number(s.replace(',', '.'));
  const quotedNumber = num(quoted);
  const haveQuote = Number.isFinite(quotedNumber) && quotedNumber > 0;

  let shownPct: string;
  let shownAmount: string;
  if (lastEdited === 'amount') {
    shownAmount = commissionAmount;
    const amt = num(commissionAmount);
    shownPct = haveQuote && Number.isFinite(amt) ? String(Math.round((amt / quotedNumber) * 1000) / 10) : '';
  } else {
    shownPct = lastEdited === 'pct' ? commissionPct : String(agreedPct ?? DEFAULT_COMMISSION_PCT);
    const pct = num(shownPct);
    shownAmount = haveQuote && Number.isFinite(pct) ? (Math.round(quotedNumber * pct) / 100).toFixed(2) : '';
  }

  const pctNumber = num(shownPct);
  const amountNumber = num(shownAmount);
  const splitIsReal =
    haveQuote &&
    Number.isFinite(amountNumber) &&
    amountNumber >= 0 &&
    amountNumber <= quotedNumber &&
    Number.isFinite(pctNumber) &&
    pctNumber >= 0 &&
    pctNumber <= 100;
  const ourCut = splitIsReal ? amountNumber : null;
  const technicianGets = splitIsReal ? quotedNumber - amountNumber : null;
  /* Catches "commissie hoger dan de prijs", which is always a typo. */
  const splitIsImpossible = haveQuote && Number.isFinite(amountNumber) && amountNumber > quotedNumber;
  const euro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (customerPhone.replace(/\D/g, '').length < 9) {
      setError('Vul het telefoonnummer van de klant in (minimaal 9 cijfers).');
      return;
    }
    setSaving(true);
    setError('');

    const window = TIME_SLOTS.find((s) => s.start === slot);

    const response = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // One or the other, never both: the id is the same value in the
        // order case and would otherwise be written into a lead column.
        lead_id: order ? null : linkedLeadId,
        order_id: order?.id ?? null,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        technician_id: technicianId || null,
        scheduled_date: scheduledDate,
        slot_start: window?.start ?? slot,
        slot_end: window?.end ?? '',
        street,
        postcode,
        city,
        kenteken,
        car_make: clean(carMake) || null,
        car_model: clean(carModel) || null,
        car_year: clean(carYear) || null,
        keyless: keylessChoice === '' ? null : keylessChoice === 'true',
        service_type: clean(service),
        quoted_price: quoted,
        // Both, because the office may have agreed a flat euro amount that is
        // not a round percentage of the price — sending only one would make
        // the server recompute it and lose the number actually agreed.
        commission_pct: shownPct,
        commission_amount: shownAmount,
        notes,
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Inplannen mislukt. Probeer opnieuw.');
      setSaving(false);
      return;
    }

    router.push(`/admin/jobs?datum=${scheduledDate}`);
    router.refresh();
  }

  return (
    <form className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] md:gap-6" onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardTitle>
            <PreviewText>{'Klus'}</PreviewText>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="datum" label={<PreviewText>{'Datum'}</PreviewText>}>
            <Input
              id="datum"
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </Field>

          <Field htmlFor="tijdvak" label="Tijdvak">
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger id="tijdvak" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((s) => (
                  <SelectItem key={s.start} value={s.start}>
                    {s.start}–{s.end}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field htmlFor="klantnaam" label="Naam klant">
            <Input
              id="klantnaam"
              autoComplete="off"
              placeholder="Naam van de klant"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Field>

          <Field
            htmlFor="klanttelefoon"
            label={
              <>
                Telefoon klant{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </>
            }
          >
            {/*
              Required, and the single highest-value field on this form: the
              number is what links a phone-in back to the ad click that paid
              for it. Without it the only alternative is pairing a click to a
              job by how close they are in time, and the median gap is 55.6
              hours — a coin toss with the ad budget riding on it.
            */}
            <Input
              id="klanttelefoon"
              type="tel"
              inputMode="tel"
              required
              autoComplete="off"
              placeholder="06 12 34 56 78"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            {linkedLeadId && !lead && (
              <p className="text-xs text-green-600">
                Gekoppeld aan een eerdere aanvraag — de klus telt mee in de advertentierapportage.{' '}
                <button type="button" onClick={() => setLinkedLeadId(null)} className="text-muted-foreground underline">
                  ontkoppelen
                </button>
              </p>
            )}
            {lookupWorthIt && matches.length > 0 && (
              <div className="bg-muted/50 flex flex-col gap-1.5 rounded-md border p-2.5">
                <div className="text-xs">
                  Dit nummer stond al bij{' '}
                  {matches.length === 1 ? 'een eerdere aanvraag' : `${matches.length} eerdere aanvragen`}:
                </div>
                {matches.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                      {m.created_at.slice(0, 10)}
                      {m.name ? ` · ${m.name}` : ''}
                      {m.service ? ` · ${m.service}` : ''}
                      {/* The only reason the office should care which one to pick. */}
                      {m.hasClickId ? ' · via advertentie' : ''}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => { setLinkedLeadId(m.id); setMatches([]); }}
                    >
                      Koppelen
                    </Button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="text-muted-foreground w-fit text-xs underline"
                >
                  Nieuwe klant, niet koppelen
                </button>
              </div>
            )}
          </Field>

          <PickOrType
            id="dienst"
            label="Dienst"
            value={service}
            onChange={setService}
            placeholder="Kies een dienst"
            options={SERVICE_OPTIONS.map((s) => ({ value: s, label: s }))}
            otherLabel="Andere dienst…"
          />

          <Field htmlFor="prijs" label="Afgesproken prijs (€)">
            <Input
              id="prijs"
              inputMode="decimal"
              placeholder="249.00"
              value={quoted}
              onChange={(e) => setQuoted(e.target.value)}
            />
          </Field>

          <Field htmlFor="commissiePct" label="Onze commissie (%)">
            <Input
              id="commissiePct"
              inputMode="decimal"
              placeholder="25"
              value={shownPct}
              onChange={(e) => {
                setLastEdited('pct');
                setCommissionPct(e.target.value);
              }}
            />
          </Field>

          <Field htmlFor="commissieBedrag" label="Onze commissie (€)">
            <Input
              id="commissieBedrag"
              inputMode="decimal"
              placeholder="62.25"
              value={shownAmount}
              onChange={(e) => {
                setLastEdited('amount');
                setCommissionAmount(e.target.value);
              }}
            />
          </Field>

          <p className={`text-sm sm:col-span-2 ${splitIsImpossible ? 'text-destructive' : 'text-muted-foreground'}`}>
            {splitIsImpossible ? (
              <>Commissie is hoger dan de afgesproken prijs — controleer het bedrag.</>
            ) : ourCut !== null && technicianGets !== null ? (
              <>
                Wij houden <strong>{euro(ourCut)}</strong> · monteur krijgt <strong>{euro(technicianGets)}</strong>
              </>
            ) : agreedPct !== null ? (
              `Afgesproken tarief van deze monteur: ${agreedPct}% — vul een prijs in voor de verdeling`
            ) : (
              `Geen afspraak vastgelegd — standaard ${DEFAULT_COMMISSION_PCT}%`
            )}
          </p>

          <Field htmlFor="straat" label="Straat en huisnummer">
            <Input id="straat" value={street} onChange={(e) => setStreet(e.target.value)} />
          </Field>

          <Field htmlFor="pc" label={<PreviewText>{'Postcode'}</PreviewText>}>
            <Input id="pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
          </Field>

          <Field htmlFor="plaats" label={<PreviewText>{'Plaats'}</PreviewText>}>
            <Input id="plaats" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>

          <Field htmlFor="kent" label="Kenteken">
            <Input id="kent" value={kenteken} onChange={(e) => setKenteken(e.target.value)} />
          </Field>

          <CarPicker
            cars={cars}
            make={carMake}
            model={carModel}
            year={carYear}
            onMake={setCarMake}
            onModel={setCarModel}
            onYear={setCarYear}
            onKeyType={setKeylessChoice}
          />

          <Field htmlFor="keyless" label="Sleuteltype">
            <Select
              value={keylessChoice === '' ? NONE : keylessChoice}
              onValueChange={(v) => setKeylessChoice(v === NONE ? '' : (v as 'true' | 'false'))}
            >
              <SelectTrigger id="keyless" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>
                  <PreviewText>{'Onbekend'}</PreviewText>
                </SelectItem>
                <SelectItem value="false">Sleutel (contactslot)</SelectItem>
                <SelectItem value="true">Keyless (start-knop)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="notitie">Notitie voor de monteur</Label>
            <Textarea id="notitie" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <p className="text-muted-foreground text-sm sm:col-span-2">
            Het tijdvak is wat de klant te horen krijgt. Een exacte tijd beloven werkt in spoedwerk niet: de klus
            ervoor loopt uit en de belofte is gebroken voordat iemand vertrokken is.
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Inplannen…' : 'Klus inplannen'}
            </Button>
            <Button variant="outline" asChild>
              <Link href={lead ? '/admin/leads' : '/admin/jobs'}>
                <PreviewText>{'Annuleren'}</PreviewText>
              </Link>
            </Button>
            {error && <span className="text-destructive text-sm">{error}</span>}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:gap-6">
        {order && (
          <Card>
            <CardHeader>
              <CardTitle>
                <PreviewText>{'Bestelling'}</PreviewText>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Summary
                rows={[
                  ['Ordernummer', order.order_number],
                  ['Al betaald', `€ ${order.total_inc.toFixed(2)}`],
                ]}
              />
            </CardContent>
          </Card>
        )}

        {lead && !order && (
          <Card>
            <CardHeader>
              <CardTitle>Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <Summary
                rows={[
                  [<PreviewText key="k">{'Klant'}</PreviewText>, lead.name ?? 'geen naam'],
                  [
                    <PreviewText key="t">{'Telefoon'}</PreviewText>,
                    lead.phone_e164 ? <a href={`tel:${lead.phone_e164}`}>{lead.phone_e164}</a> : '—',
                  ],
                  ['Voertuig', [lead.brand, lead.model, lead.year].filter(Boolean).join(' ') || '—'],
                  [<PreviewText key="b">{'Bron'}</PreviewText>, lead.source ?? 'unknown'],
                ]}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              <PreviewText>{'Monteur'}</PreviewText>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {suggestions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Geen beschikbare monteurs voor deze dag.</p>
            ) : (
              <>
                {suggestions.map((s) => (
                  <SuggestionButton
                    key={s.id}
                    active={technicianId === s.id}
                    name={s.name}
                    why={s.reason}
                    tag={s.inRegion ? 'regio' : null}
                    onClick={() => setTechnicianId(s.id)}
                  />
                ))}
                <SuggestionButton
                  active={technicianId === ''}
                  name="Nog niet toewijzen"
                  why="plan de klus vast in, kies later wie gaat"
                  tag={null}
                  onClick={() => setTechnicianId('')}
                />
              </>
            )}
            <p className="text-muted-foreground text-sm">
              De volgorde is een voorstel op basis van werkgebied en drukte, geen toewijzing. Verkeer, voorraad in de
              bus en een klant die om een bepaalde monteur vraagt weet dit scherm niet.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function Field({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Summary({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
      {rows.map((row, i) => (
        <div key={i} className="col-span-2 grid grid-cols-subgrid">
          <dt className="text-muted-foreground">{row[0]}</dt>
          <dd className="truncate">{row[1]}</dd>
        </div>
      ))}
    </dl>
  );
}

function SuggestionButton({
  active,
  name,
  why,
  tag,
  onClick,
}: {
  active: boolean;
  name: string;
  why: string;
  tag: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`hover:bg-muted/60 flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm ${
        active ? 'border-primary bg-muted' : ''
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        <span className="text-muted-foreground block truncate text-xs">{why}</span>
      </span>
      {tag && <span className="text-muted-foreground rounded-full border px-1.5 text-[11px]">{tag}</span>}
    </button>
  );
}

/**
 * A dropdown with an escape hatch — the shadcn twin of nieuw/CarPicker's
 * PickOrType. Choosing "Anders…" swaps the list for a text field, and a value
 * that is not in the list (from an old lead, say) opens straight in that text
 * field, so nothing typed earlier is lost.
 */
function PickOrType({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  otherLabel = 'Anders…',
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  otherLabel?: string;
  disabled?: boolean;
}) {
  const known = value === '' || options.some((o) => o.value.toLowerCase() === value.toLowerCase());
  const typing = !known || value === OTHER;
  const picked = options.find((o) => o.value.toLowerCase() === value.toLowerCase())?.value ?? NONE;

  return (
    <Field htmlFor={id} label={label}>
      {typing ? (
        <div className="flex gap-2">
          <Input
            id={id}
            autoFocus={value === OTHER}
            value={value === OTHER ? '' : value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value || OTHER)}
          />
          <Button type="button" variant="outline" onClick={() => onChange('')}>
            <PreviewText>{'Lijst'}</PreviewText>
          </Button>
        </div>
      ) : (
        <Select
          value={picked}
          disabled={disabled}
          onValueChange={(v) => onChange(v === NONE ? '' : v)}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{placeholder}</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
            <SelectItem value={OTHER}>{otherLabel}</SelectItem>
          </SelectContent>
        </Select>
      )}
    </Field>
  );
}

const THIS_YEAR = new Date().getFullYear();

/**
 * Merk → model → bouwjaar, each a list built from the catalogue. Same rules as
 * the old picker: the model list only shows the chosen make's models, the year
 * list only the years that model was built, and a model that exists with one
 * kind of key only sets the key type by itself.
 */
function CarPicker({
  cars,
  make,
  model,
  year,
  onMake,
  onModel,
  onYear,
  onKeyType,
}: {
  cars: PickerMake[];
  make: string;
  model: string;
  year: string;
  onMake: (v: string) => void;
  onModel: (v: string) => void;
  onYear: (v: string) => void;
  onKeyType: (v: '' | 'true' | 'false') => void;
}) {
  const current = useMemo(
    () => cars.find((c) => c.make.toLowerCase() === clean(make).toLowerCase()) ?? null,
    [cars, make]
  );
  const currentModel = current?.models.find((m) => m.model.toLowerCase() === clean(model).toLowerCase()) ?? null;

  const from = currentModel?.from ?? 1995;
  const to = Math.min(currentModel?.to ?? THIS_YEAR, THIS_YEAR);
  const years: string[] = [];
  for (let y = to; y >= Math.min(from, to); y--) years.push(String(y));

  return (
    <>
      <PickOrType
        id="merk"
        label="Automerk"
        value={make}
        onChange={(v) => {
          onMake(v);
          onModel('');
          onYear('');
        }}
        placeholder="Kies merk"
        options={cars.map((c) => ({ value: c.make, label: c.make }))}
        otherLabel="Ander merk…"
      />
      <PickOrType
        id="model"
        label="Model"
        value={model}
        disabled={!current}
        onChange={(v) => {
          onModel(v);
          onYear('');
          const m = current?.models.find((x) => x.model === v);
          if (m) onKeyType(m.keyless && !m.blade ? 'true' : m.blade && !m.keyless ? 'false' : '');
        }}
        placeholder={current ? 'Kies model' : 'Kies eerst een merk'}
        options={(current?.models ?? []).map((m) => ({
          value: m.model,
          label: m.from ? `${m.model} (${m.from}–${m.to ?? 'nu'})` : m.model,
        }))}
        otherLabel="Ander model…"
      />
      <PickOrType
        id="bouwjaar"
        label="Bouwjaar"
        value={year}
        onChange={onYear}
        placeholder="Kies bouwjaar"
        options={years.map((y) => ({ value: y, label: y }))}
        otherLabel="Ander jaar…"
      />
    </>
  );
}
