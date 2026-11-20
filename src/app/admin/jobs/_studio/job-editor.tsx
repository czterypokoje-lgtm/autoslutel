'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { JOB_STATUSES, JOB_STATUS_LABELS, TIME_SLOTS, trimTime } from '@/lib/crmJobs';

import type { JobDetail } from '../[id]/JobEditor';

/**
 * The job editor, Studio look.
 *
 * A presentation twin of [id]/JobEditor: the same state, the same derived
 * commission split and the same PATCH to /api/admin/jobs/:id. The long form is
 * split over two tabs instead of one column, with the save button outside them
 * so a change made on either tab is one click from being saved.
 */

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/* Radix Select has no value for "nothing chosen", so "" travels as a sentinel. */
const NONE = '__none__';

export default function StudioJobEditor({
  job,
  technicians,
}: {
  job: JobDetail;
  technicians: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(job.status);
  const [technicianId, setTechnicianId] = useState(job.technician_id ?? '');
  const [date, setDate] = useState(job.scheduled_date);
  const [slot, setSlot] = useState(trimTime(job.slot_start));
  const [finalPrice, setFinalPrice] = useState(job.final_price === null ? '' : String(job.final_price));
  /*
   * Commission, correctable here after the fact — a price gets renegotiated at
   * the kerb often enough that the cut agreed when the job was planned is not
   * always the cut that ends up being right.
   */
  const [commissionPct, setCommissionPct] = useState(job.commission_pct === null ? '' : String(job.commission_pct));
  const [commissionAmount, setCommissionAmount] = useState(
    job.commission_amount === null ? '' : String(job.commission_amount)
  );
  const [notes, setNotes] = useState(job.notes ?? '');
  const [city, setCity] = useState(job.city ?? '');
  const [postcode, setPostcode] = useState(job.postcode ?? '');
  const [carMake, setCarMake] = useState(job.car_make ?? '');
  const [carModel, setCarModel] = useState(job.car_model ?? '');
  const [carYear, setCarYear] = useState(job.car_year === null ? '' : String(job.car_year));
  const [keylessChoice, setKeylessChoice] = useState<'' | 'true' | 'false'>(
    job.keyless === null ? '' : job.keyless ? 'true' : 'false'
  );
  const [scenarioChoice, setScenarioChoice] = useState(job.scenario ?? '');

  const [revCallout, setRevCallout] = useState(job.revenue_callout === null ? '' : String(job.revenue_callout));
  const [revMaterials, setRevMaterials] = useState(job.revenue_materials === null ? '' : String(job.revenue_materials));
  const [revLabor, setRevLabor] = useState(job.revenue_labor === null ? '' : String(job.revenue_labor));
  const [revDiscount, setRevDiscount] = useState(job.revenue_discount === null ? '' : String(job.revenue_discount));

  const [costMaterials, setCostMaterials] = useState(job.cost_materials === null ? '' : String(job.cost_materials));
  const [costTech, setCostTech] = useState(job.cost_technician === null ? '' : String(job.cost_technician));
  const [costTravel, setCostTravel] = useState(job.cost_travel === null ? '' : String(job.cost_travel));
  const [costFee, setCostFee] = useState(job.cost_payment_fee === null ? '' : String(job.cost_payment_fee));
  const [costOther, setCostOther] = useState(job.cost_other === null ? '' : String(job.cost_other));

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /*
   * The split reads off the werkelijke prijs once there is one, and the
   * afgesproken prijs until then — that is the number the commission is
   * actually taken from at each stage of the job.
   */
  const toNum = (v: string | number | null) => (v === null || v === '' ? NaN : Number(String(v).replace(',', '.')));
  const typedFinal = toNum(finalPrice);
  const basisPrice = Number.isFinite(typedFinal) ? typedFinal : toNum(job.quoted_price);
  const typedCommission = toNum(commissionAmount);
  const haveBoth = Number.isFinite(basisPrice) && basisPrice > 0 && Number.isFinite(typedCommission);
  const commissionTooHigh = haveBoth && typedCommission > basisPrice;
  const monteurGets = haveBoth && !commissionTooHigh ? basisPrice - typedCommission : null;

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);

    const window = TIME_SLOTS.find((s) => s.start === slot);

    const response = await fetch(`/api/admin/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        technician_id: technicianId || null,
        scheduled_date: date,
        slot_start: window?.start ?? slot,
        slot_end: window?.end ?? trimTime(job.slot_end),
        final_price: finalPrice.trim() === '' ? null : finalPrice.trim(),

        revenue_callout: revCallout.trim() === '' ? null : revCallout.trim(),
        revenue_materials: revMaterials.trim() === '' ? null : revMaterials.trim(),
        revenue_labor: revLabor.trim() === '' ? null : revLabor.trim(),
        revenue_discount: revDiscount.trim() === '' ? null : revDiscount.trim(),
        cost_materials: costMaterials.trim() === '' ? null : costMaterials.trim(),
        cost_technician: costTech.trim() === '' ? null : costTech.trim(),
        cost_travel: costTravel.trim() === '' ? null : costTravel.trim(),
        cost_payment_fee: costFee.trim() === '' ? null : costFee.trim(),
        cost_other: costOther.trim() === '' ? null : costOther.trim(),

        commission_pct: commissionPct.trim() === '' ? null : commissionPct.trim(),
        commission_amount: commissionAmount.trim() === '' ? null : commissionAmount.trim(),
        notes,
        city: city.trim() || null,
        postcode: postcode.trim() || null,
        car_make: carMake.trim() || null,
        car_model: carModel.trim() || null,
        car_year: carYear.trim() || null,
        keyless: keylessChoice === '' ? null : keylessChoice === 'true',
        scenario: scenarioChoice === '' ? null : scenarioChoice,
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] md:gap-6">
      <Card>
        <CardContent>
          <Tabs defaultValue="planning">
            <TabsList>
              <TabsTrigger value="planning">
                <PreviewText>{'Planning'}</PreviewText>
              </TabsTrigger>
              <TabsTrigger value="geld">Omzet en kosten</TabsTrigger>
            </TabsList>

            <TabsContent value="planning" className="grid gap-4 pt-4 sm:grid-cols-2">
              <Field htmlFor="st" label="Status">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="st" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {JOB_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field htmlFor="mt" label={<PreviewText>{'Monteur'}</PreviewText>}>
                <Select
                  value={technicianId === '' ? NONE : technicianId}
                  onValueChange={(v) => setTechnicianId(v === NONE ? '' : v)}
                >
                  <SelectTrigger id="mt" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Niet toegewezen</SelectItem>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field htmlFor="dt" label={<PreviewText>{'Datum'}</PreviewText>}>
                <Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>

              <Field htmlFor="sl" label="Tijdvak">
                <Select value={slot} onValueChange={setSlot}>
                  <SelectTrigger id="sl" className="w-full">
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

              <Field htmlFor="fp" label="Werkelijke prijs (€)">
                <Input id="fp" inputMode="decimal" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
              </Field>

              <Field htmlFor="cpct" label="Commissie (%)">
                <Input
                  id="cpct"
                  inputMode="decimal"
                  placeholder="25"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                />
              </Field>

              <Field htmlFor="camt" label="Commissie (€)">
                <Input
                  id="camt"
                  inputMode="decimal"
                  placeholder="62.25"
                  value={commissionAmount}
                  onChange={(e) => setCommissionAmount(e.target.value)}
                />
              </Field>

              <p className={`text-sm sm:col-span-2 ${commissionTooHigh ? 'text-destructive' : 'text-muted-foreground'}`}>
                {commissionTooHigh ? (
                  <>Commissie is hoger dan de prijs — controleer het bedrag.</>
                ) : monteurGets !== null ? (
                  <>
                    Monteur houdt <strong>{MONEY.format(monteurGets)}</strong> over van{' '}
                    {MONEY.format(basisPrice as number)}
                  </>
                ) : (
                  'Vul een prijs en commissie in om de verdeling te zien.'
                )}
              </p>

              <Field htmlFor="cm" label="Automerk">
                <Input id="cm" placeholder="bijv. Toyota" value={carMake} onChange={(e) => setCarMake(e.target.value)} />
              </Field>

              <Field htmlFor="cmo" label="Model">
                <Input id="cmo" placeholder="bijv. Aygo" value={carModel} onChange={(e) => setCarModel(e.target.value)} />
              </Field>

              <Field htmlFor="cy" label="Bouwjaar">
                <Input
                  id="cy"
                  inputMode="numeric"
                  placeholder="bijv. 2018"
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </Field>

              <Field htmlFor="ck" label="Sleuteltype">
                <Select
                  value={keylessChoice === '' ? NONE : keylessChoice}
                  onValueChange={(v) => setKeylessChoice(v === NONE ? '' : (v as 'true' | 'false'))}
                >
                  <SelectTrigger id="ck" className="w-full">
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

              <Field htmlFor="cscen" label="Service (Scenario)">
                <Select
                  value={scenarioChoice === '' ? NONE : scenarioChoice}
                  onValueChange={(v) => setScenarioChoice(v === NONE ? '' : v)}
                >
                  <SelectTrigger id="cscen" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Overig / Onbekend</SelectItem>
                    <SelectItem value="bijmaken">
                      <PreviewText>{'Sleutel bijmaken'}</PreviewText>
                    </SelectItem>
                    <SelectItem value="alle_sleutels_kwijt">
                      <PreviewText>{'Alle sleutels kwijt'}</PreviewText>
                    </SelectItem>
                    <SelectItem value="reparatie">
                      <PreviewText>{'Sleutel repareren'}</PreviewText>
                    </SelectItem>
                    <SelectItem value="slot">Slot of cilinder</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field htmlFor="city" label="Plaats (City)">
                <Input id="city" placeholder="bijv. Amsterdam" value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>

              <Field htmlFor="pc" label={<PreviewText>{'Postcode'}</PreviewText>}>
                <Input id="pc" placeholder="bijv. 1011 AB" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
              </Field>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="nt">
                  <PreviewText>{'Notitie'}</PreviewText>
                </Label>
                <Textarea id="nt" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="geld" className="flex flex-col gap-4 pt-4">
              <p className="text-muted-foreground text-sm">
                Let op: de velden onder &quot;Omzet&quot; worden nu alleen opgeslagen — ze tellen nog niet mee in de
                Brutowinst hieronder. Brutowinst gebruikt alleen de Definitieve Prijs.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <h3 className="text-sm font-medium">
                    <PreviewText>{'Omzet'}</PreviewText>
                  </h3>
                  <Money label="Oproep / Voorrijkosten (€)" value={revCallout} onChange={setRevCallout} />
                  <Money label="Materialen (€)" value={revMaterials} onChange={setRevMaterials} />
                  <Money label="Arbeid / Programmeren (€)" value={revLabor} onChange={setRevLabor} />
                  <Money label="Korting (€)" value={revDiscount} onChange={setRevDiscount} />
                </div>

                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <h3 className="text-sm font-medium">
                    <PreviewText>{'Kosten'}</PreviewText>
                  </h3>
                  <Money label="Inkoop materialen (€)" value={costMaterials} onChange={setCostMaterials} />
                  <Money label="Monteur (€)" value={costTech} onChange={setCostTech} />
                  <Money
                    label="Reis / Brandstof (€)"
                    value={costTravel}
                    onChange={setCostTravel}
                    /* Where the number came from, so it can be checked instead of believed. */
                    hint={
                      job.travel_km !== null
                        ? `${Number(job.travel_km).toFixed(1)} km heen en terug, automatisch berekend. Overschrijf gerust.`
                        : undefined
                    }
                  />
                  <Money label="Transactiekosten Mollie/pin (€)" value={costFee} onChange={setCostFee} />
                  <Money label="Overige kosten (€)" value={costOther} onChange={setCostOther} />
                </div>
              </div>

              {job.gross_margin !== null && (
                <div
                  className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                    job.gross_margin > 0 ? 'border-green-600/40 bg-green-600/10' : 'border-destructive/40 bg-destructive/10'
                  }`}
                >
                  <span>
                    <PreviewText>{'Brutowinst'}</PreviewText>
                  </span>
                  <b>
                    {job.gross_margin > 0 ? '+ ' : ''}€ {Number(job.gross_margin).toFixed(2).replace('.', ',')}
                  </b>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            <Button onClick={save} disabled={saving}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
            {saved && <span className="text-muted-foreground text-sm">Opgeslagen.</span>}
            {error && <span className="text-destructive text-sm">{error}</span>}
          </div>

          <p className="text-muted-foreground mt-3 text-sm">
            De werkelijke prijs is niet hetzelfde als de afspraak. In fase 4 schrijft die het factuurbedrag, en dat
            bedrag gaat als conversiewaarde terug naar de lead.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gegevens</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
            {(
              [
                [<PreviewText key="a">{'Adres'}</PreviewText>, [job.street, job.postcode, job.city].filter(Boolean).join(', ') || '—'],
                ['Kenteken', job.kenteken ?? '—'],
                ['Dienst', job.service_type ?? '—'],
                ['Afgesproken', job.quoted_price === null ? '—' : MONEY.format(Number(job.quoted_price))],
                ['Gestart', job.started_at ? job.started_at.slice(0, 16).replace('T', ' ') : '—'],
                [<PreviewText key="af">{'Afgerond'}</PreviewText>, job.completed_at ? job.completed_at.slice(0, 16).replace('T', ' ') : '—'],
              ] as [React.ReactNode, React.ReactNode][]
            ).map((row, i) => (
              <div key={i} className="col-span-2 grid grid-cols-subgrid">
                <dt className="text-muted-foreground">{row[0]}</dt>
                <dd className="truncate">{row[1]}</dd>
              </div>
            ))}
          </dl>

          {job.postcode && (
            <Button variant="outline" asChild className="w-fit">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  [job.street, job.postcode, job.city].filter(Boolean).join(' ')
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Navigeer
              </a>
            </Button>
          )}

          <p className="text-muted-foreground text-sm">
            Foto&apos;s, handtekening en materiaal komen in fase 3, op het monteurscherm — dat is waar ze ontstaan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ htmlFor, label, children }: { htmlFor: string; label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Money({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input type="number" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}
