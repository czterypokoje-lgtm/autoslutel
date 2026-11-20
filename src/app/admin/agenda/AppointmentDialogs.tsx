'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { amsterdamParts, amsterdamToday, minutesToTime, timeToMinutes } from '@/lib/amsterdamTime';
import type { WorkshopAppointment, WorkshopSettings } from '@/lib/workshopAgenda';
import { apiError, locale, type CalendarText } from './calendarText';

export const selectClass = 'border-input bg-background h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50';

function Field({ label, htmlFor, children, className = '' }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return <div className={`grid gap-1.5 ${className}`}><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

type FreeState = { status: 'idle' | 'loading' | 'open' | 'closed' | 'past' | 'error'; times: string[] };

/** Free start times from the same database function the Workshop Service agent uses. */
function useFreeTimes(serviceId: string, date: string, calendarId: string) {
  const valid = !!serviceId && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const key = valid ? `${serviceId}|${date}|${calendarId}` : '';
  const [result, setResult] = useState<FreeState & { key: string }>({ key: '', status: 'idle', times: [] });
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ service: serviceId, date, ...(calendarId ? { calendar: calendarId } : {}) });
    fetch(`/api/admin/workshop/availability?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((body: { status: string; slots: { starts_at: string }[] }) => {
        const times = [...new Set(body.slots.map((s) => amsterdamParts(s.starts_at).time))].sort();
        setResult({ key, status: body.status === 'open' ? 'open' : body.status === 'past' ? 'past' : 'closed', times });
      })
      .catch((error) => { if (error.name !== 'AbortError') setResult({ key, status: 'error', times: [] }); });
    return () => controller.abort();
  }, [key, serviceId, date, calendarId]);
  if (!key) return { status: 'idle', times: [] } as FreeState;
  return result.key === key ? result : ({ status: 'loading', times: [] } as FreeState);
}

function FreeTimes({ state, value, onPick, text }: { state: FreeState; value: string; onPick: (time: string) => void; text: CalendarText }) {
  const times = state.times;
  return (
    <div className="grid gap-1.5" data-testid="free-times">
      <span className="text-sm font-medium">{text.freeTimes}</span>
      {state.status === 'idle' && <p className="text-muted-foreground text-xs">{text.pickService}</p>}
      {state.status === 'loading' && <p className="text-muted-foreground text-xs">{text.loading}</p>}
      {state.status === 'error' && <p className="text-destructive text-xs">{text.errors.service_error}</p>}
      {state.status === 'closed' && <p className="text-muted-foreground text-xs">{text.dayClosed}</p>}
      {state.status === 'past' && <p className="text-muted-foreground text-xs">{text.dayPast}</p>}
      {state.status === 'open' && !times.length && <p className="text-muted-foreground text-xs">{text.noFreeTimes}</p>}
      {state.status === 'open' && times.length > 0 && (
        <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          {times.map((time) => (
            <button key={time} type="button" onClick={() => onPick(time)} aria-pressed={value === time}
              className={`rounded-md border px-2 py-0.5 text-xs tabular-nums ${value === time ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}>
              {time}
            </button>
          ))}
        </div>
      )}
      {state.status === 'open' && value && !times.includes(value) && <p className="text-xs text-amber-700 dark:text-amber-400">{text.notInList}</p>}
    </div>
  );
}

const newKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function NewAppointmentDialog({ initial, settings, defaultCalendar, text, english, onClose, onCreated }: {
  initial: { date: string; time: string }; settings: WorkshopSettings; defaultCalendar: string; text: CalendarText; english: boolean;
  onClose: () => void; onCreated: (day: string) => void;
}) {
  const services = settings.services.filter((s) => s.active);
  const calendars = settings.calendars.filter((c) => c.active);
  const [form, setForm] = useState({
    service_id: services[0]?.id ?? '', calendar_id: defaultCalendar, date: initial.date, time: initial.time,
    customer_name: '', customer_phone: '', customer_email: '', vehicle_make: '', vehicle_model: '', vehicle_year: '', source: 'crm', notes: '',
  });
  // One key per opened form: a double click or a retry never books twice.
  const [idempotencyKey] = useState(newKey);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const free = useFreeTimes(form.service_id, form.date, form.calendar_id);
  const service = services.find((s) => s.id === form.service_id);
  const end = service && /^\d\d:\d\d$/.test(form.time) ? minutesToTime(timeToMinutes(form.time) + service.duration_minutes) : '';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/workshop/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, calendar_id: form.calendar_id || null, idempotency_key: idempotencyKey }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setError(apiError(text, body, response.status)); return; }
      onCreated(form.date);
    } catch {
      setError(text.errors.service_error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{text.newAppointment}</DialogTitle>
          <DialogDescription>{new Intl.DateTimeFormat(locale(english), { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${form.date}T12:00:00Z`))}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" data-testid="new-appointment-form">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={text.service} htmlFor="ws-service">
              <select id="ws-service" className={selectClass} value={form.service_id} onChange={(e) => set('service_id')(e.target.value)} required>
                {services.map((s) => <option key={s.id} value={s.id}>{english ? s.name_en : s.name_nl} · {s.duration_minutes} {text.minutes}</option>)}
              </select>
            </Field>
            <Field label={text.calendar} htmlFor="ws-calendar">
              <select id="ws-calendar" className={selectClass} value={form.calendar_id} onChange={(e) => set('calendar_id')(e.target.value)}>
                <option value="">{text.anyCalendar}</option>
                {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label={text.date} htmlFor="ws-date">
              <Input id="ws-date" type="date" value={form.date} min={amsterdamToday()} onChange={(e) => set('date')(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={text.start} htmlFor="ws-time">
                <Input id="ws-time" type="time" step={900} value={form.time} onChange={(e) => set('time')(e.target.value)} required />
              </Field>
              <Field label={text.end} htmlFor="ws-end"><Input id="ws-end" value={end} readOnly tabIndex={-1} aria-readonly="true" /></Field>
            </div>
          </div>
          <FreeTimes state={free} value={form.time} onPick={set('time')} text={text} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={text.name} htmlFor="ws-name" className="sm:col-span-1">
              <Input id="ws-name" value={form.customer_name} onChange={(e) => set('customer_name')(e.target.value)} required maxLength={120} autoComplete="off" />
            </Field>
            <Field label={text.phone} htmlFor="ws-phone">
              <Input id="ws-phone" type="tel" value={form.customer_phone} onChange={(e) => set('customer_phone')(e.target.value)} autoComplete="off" />
            </Field>
            <Field label={text.email} htmlFor="ws-email">
              <Input id="ws-email" type="email" value={form.customer_email} onChange={(e) => set('customer_email')(e.target.value)} autoComplete="off" />
            </Field>
            <Field label={text.make} htmlFor="ws-make"><Input id="ws-make" value={form.vehicle_make} onChange={(e) => set('vehicle_make')(e.target.value)} maxLength={40} /></Field>
            <Field label={text.model} htmlFor="ws-model"><Input id="ws-model" value={form.vehicle_model} onChange={(e) => set('vehicle_model')(e.target.value)} maxLength={60} /></Field>
            <Field label={text.year} htmlFor="ws-year"><Input id="ws-year" inputMode="numeric" value={form.vehicle_year} onChange={(e) => set('vehicle_year')(e.target.value)} maxLength={4} /></Field>
            <Field label={text.source} htmlFor="ws-source">
              <select id="ws-source" className={selectClass} value={form.source} onChange={(e) => set('source')(e.target.value)}>
                {Object.entries(text.sources).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label={text.notes} htmlFor="ws-notes" className="sm:col-span-2">
              <Textarea id="ws-notes" rows={2} value={form.notes} onChange={(e) => set('notes')(e.target.value)} maxLength={500} />
            </Field>
          </div>
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{text.cancel}</Button>
            <Button type="submit" disabled={busy}>{busy ? text.saving : text.book}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid grid-cols-[7rem_1fr] gap-2 py-1 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words">{children}</dd></div>;
}

export function AppointmentDetailDialog({ appointment: a, settings, canEdit, text, english, onClose, onChanged }: {
  appointment: WorkshopAppointment; settings: WorkshopSettings; canEdit: boolean; text: CalendarText; english: boolean;
  onClose: () => void; onChanged: (message: string, day?: string) => void;
}) {
  const service = settings.services.find((s) => s.id === a.service_id);
  const calendar = settings.calendars.find((c) => c.id === a.calendar_id);
  const start = amsterdamParts(a.starts_at);
  const end = amsterdamParts(a.ends_at);
  const [mode, setMode] = useState<'view' | 'move' | 'cancel'>('view');
  const [target, setTarget] = useState({ date: start.day, time: start.time, calendar_id: a.calendar_id });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const free = useFreeTimes(mode === 'move' ? a.service_id : '', target.date, target.calendar_id);
  const editable = canEdit && !['geannuleerd', 'afgerond', 'no_show'].includes(a.status);
  const dateLabel = useMemo(() => new Intl.DateTimeFormat(locale(english), { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${start.day}T12:00:00Z`)), [english, start.day]);

  async function patch(payload: Record<string, unknown>, message: string, day?: string) {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/workshop/appointments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, ...payload }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setError(apiError(text, body, response.status)); return; }
      onChanged(message, day);
      if (payload.action !== 'status') onClose();
      else setMode('view');
    } catch {
      setError(text.errors.service_error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg" data-testid="appointment-detail">
        <DialogHeader>
          <DialogTitle>{english ? service?.name_en : service?.name_nl} · {a.customer_name}</DialogTitle>
          <DialogDescription>{dateLabel}, {start.time}–{end.time}</DialogDescription>
        </DialogHeader>

        {mode === 'view' && (
          <dl className="divide-y">
            <Row label={text.reference}><span className="font-mono">{a.reference}</span></Row>
            <Row label={text.status}>{text.statuses[a.status] ?? a.status}</Row>
            <Row label={text.customer}>{a.customer_name}</Row>
            {canEdit && <Row label={text.contact}>
              {a.customer_phone && <a className="underline" href={`tel:${a.customer_phone}`}>{a.customer_phone}</a>}
              {a.customer_phone && a.customer_email && <br />}
              {a.customer_email && <a className="underline" href={`mailto:${a.customer_email}`}>{a.customer_email}</a>}
            </Row>}
            <Row label={text.service}>{english ? service?.name_en : service?.name_nl} ({service?.duration_minutes} {text.minutes})</Row>
            <Row label={text.vehicle}>{[a.vehicle_make, a.vehicle_model, a.vehicle_year].filter(Boolean).join(' ') || '—'}</Row>
            <Row label={text.start}>{start.day} {start.time}</Row>
            <Row label={text.end}>{end.day} {end.time}</Row>
            <Row label={text.calendar}>{calendar?.name ?? '—'}</Row>
            <Row label={text.source}>{text.sources[a.source] ?? a.source}</Row>
            {canEdit && a.notes && <Row label={text.notes}>{a.notes}</Row>}
          </dl>
        )}

        {mode === 'move' && (
          <form className="grid gap-3" data-testid="move-form" onSubmit={(e) => { e.preventDefault(); void patch({ action: 'move', ...target }, text.moved, target.date); }}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={text.date} htmlFor="ws-move-date"><Input id="ws-move-date" type="date" min={amsterdamToday()} value={target.date} onChange={(e) => setTarget((t) => ({ ...t, date: e.target.value }))} required /></Field>
              <Field label={text.start} htmlFor="ws-move-time"><Input id="ws-move-time" type="time" step={900} value={target.time} onChange={(e) => setTarget((t) => ({ ...t, time: e.target.value }))} required /></Field>
              <Field label={text.calendar} htmlFor="ws-move-calendar">
                <select id="ws-move-calendar" className={selectClass} value={target.calendar_id} onChange={(e) => setTarget((t) => ({ ...t, calendar_id: e.target.value }))}>
                  {settings.calendars.filter((c) => c.active || c.id === a.calendar_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <FreeTimes state={free} value={target.time} onPick={(time) => setTarget((t) => ({ ...t, time }))} text={text} />
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setMode('view'); setError(''); }}>{text.cancel}</Button>
              <Button type="submit" disabled={busy}>{busy ? text.saving : text.move}</Button>
            </DialogFooter>
          </form>
        )}

        {mode === 'cancel' && (
          <div className="grid gap-3">
            <p className="text-sm">{text.confirmCancel}</p>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setMode('view'); setError(''); }}>{text.close}</Button>
              <Button type="button" variant="destructive" disabled={busy} onClick={() => void patch({ action: 'cancel' }, text.cancelled)}>{text.yesCancel}</Button>
            </DialogFooter>
          </div>
        )}

        {mode === 'view' && (
          <>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <DialogFooter className="flex-wrap gap-2 sm:justify-between">
              {editable ? (
                <div className="flex flex-wrap gap-1">
                  {a.status !== 'bevestigd' && <Button size="sm" variant="outline" disabled={busy} onClick={() => void patch({ action: 'status', status: 'bevestigd' }, text.updated)}>{text.markConfirmed}</Button>}
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void patch({ action: 'status', status: 'afgerond' }, text.updated)}>{text.markDone}</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void patch({ action: 'status', status: 'no_show' }, text.updated)}>{text.markNoShow}</Button>
                </div>
              ) : <span />}
              <div className="flex gap-2">
                {editable && <Button variant="outline" onClick={() => setMode('cancel')}>{text.cancelAppointment}</Button>}
                {editable && <Button onClick={() => setMode('move')}>{text.move}</Button>}
                {!editable && <Button variant="outline" onClick={onClose}>{text.close}</Button>}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
