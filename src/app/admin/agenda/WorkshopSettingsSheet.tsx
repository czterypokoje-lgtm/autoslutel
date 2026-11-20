'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { amsterdamParts, amsterdamToday } from '@/lib/amsterdamTime';
import type { WorkshopHours, WorkshopSettings } from '@/lib/workshopAgenda';
import { apiError, locale, type CalendarText } from './calendarText';
import { selectClass } from './AppointmentDialogs';

/** Office-only: opening hours, service durations, calendar capacity, closures and blocks. */
export function WorkshopSettingsSheet({ open, onOpenChange, settings, text, english, onSaved }: {
  open: boolean; onOpenChange: (open: boolean) => void; settings: WorkshopSettings; text: CalendarText; english: boolean;
  onSaved: (settings: WorkshopSettings) => void;
}) {
  const [hours, setHours] = useState<WorkshopHours[]>(settings.hours);
  const [durations, setDurations] = useState<Record<string, string>>({});
  const [capacities, setCapacities] = useState<Record<string, string>>({});
  const [closure, setClosure] = useState({ calendar_id: '', start_date: amsterdamToday(), start_time: '', end_date: amsterdamToday(), end_time: '', reason: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const weekday = (n: number) => new Intl.DateTimeFormat(locale(english), { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, n, 12)));

  async function save(payload: Record<string, unknown>) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/workshop/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setMessage(apiError(text, body?.code === 'service_error' ? body : { code: 'invalid' }, response.status)); return false; }
      onSaved(body as WorkshopSettings);
      setDurations({}); setCapacities({});
      setMessage(text.save + ' ✓');
      return true;
    } catch {
      setMessage(text.errors.service_error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const fmt = (iso: string) => { const p = amsterdamParts(iso); return `${p.day} ${p.time}`; };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg" data-testid="workshop-settings">
        <SheetHeader>
          <SheetTitle>{text.settings}</SheetTitle>
          <SheetDescription>{text.settingsHint}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 px-4 pb-6">
          {message && <p role="status" className="text-sm">{message}</p>}

          <section className="grid gap-2">
            <h2 className="text-sm font-semibold">{text.hours}</h2>
            {hours.map((h, i) => (
              <div key={h.weekday} className="grid grid-cols-[6.5rem_auto_1fr_1fr] items-center gap-2 text-sm">
                <span className="capitalize">{weekday(h.weekday)}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={h.closed} onChange={(e) => setHours((all) => all.map((x, j) => j === i ? { ...x, closed: e.target.checked, open_time: x.open_time ?? '09:00', close_time: x.close_time ?? '18:00' } : x))} />
                  {text.closed}
                </label>
                <Input type="time" step={900} aria-label={`${weekday(h.weekday)} ${text.from}`} disabled={h.closed} value={h.open_time ?? ''}
                  onChange={(e) => setHours((all) => all.map((x, j) => j === i ? { ...x, open_time: e.target.value } : x))} />
                <Input type="time" step={900} aria-label={`${weekday(h.weekday)} ${text.until}`} disabled={h.closed} value={h.close_time ?? ''}
                  onChange={(e) => setHours((all) => all.map((x, j) => j === i ? { ...x, close_time: e.target.value } : x))} />
              </div>
            ))}
            <Button size="sm" className="justify-self-start" disabled={busy} onClick={() => void save({ kind: 'hours', hours })}>{text.save}</Button>
          </section>

          <section className="grid gap-2">
            <h2 className="text-sm font-semibold">{text.services}</h2>
            {settings.services.map((s) => (
              <div key={s.id} className="grid grid-cols-[1fr_5rem_auto] items-center gap-2 text-sm">
                <span className={s.active ? '' : 'text-muted-foreground line-through'}>{english ? s.name_en : s.name_nl}</span>
                <Input type="number" min={5} max={600} step={5} aria-label={`${english ? s.name_en : s.name_nl} ${text.duration}`}
                  value={durations[s.id] ?? String(s.duration_minutes)} onChange={(e) => setDurations((d) => ({ ...d, [s.id]: e.target.value }))} />
                <Button size="sm" variant="outline" disabled={busy || durations[s.id] === undefined}
                  onClick={() => void save({ kind: 'service', id: s.id, duration_minutes: Number(durations[s.id]) })}>{text.save}</Button>
              </div>
            ))}
            <p className="text-muted-foreground text-xs">{text.duration} ({text.minutes})</p>
          </section>

          <section className="grid gap-2">
            <h2 className="text-sm font-semibold">{text.calendars}</h2>
            {settings.calendars.map((c) => (
              <div key={c.id} className="grid grid-cols-[auto_1fr_4.5rem_auto] items-center gap-2 text-sm">
                <span className="size-3 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                <span className={c.active ? '' : 'text-muted-foreground line-through'}>{c.name}</span>
                <Input type="number" min={1} max={20} aria-label={`${c.name} ${text.capacity}`}
                  value={capacities[c.id] ?? String(c.capacity)} onChange={(e) => setCapacities((d) => ({ ...d, [c.id]: e.target.value }))} />
                <Button size="sm" variant="outline" disabled={busy || capacities[c.id] === undefined}
                  onClick={() => void save({ kind: 'calendar', id: c.id, capacity: Number(capacities[c.id]) })}>{text.save}</Button>
              </div>
            ))}
            <p className="text-muted-foreground text-xs">{text.capacity}: max. {english ? 'appointments at the same time' : 'afspraken tegelijk'}</p>
          </section>

          <section className="grid gap-2">
            <h2 className="text-sm font-semibold">{text.closures}</h2>
            {settings.closures.filter((c) => c.ends_at > new Date().toISOString()).length === 0 && <p className="text-muted-foreground text-xs">{text.noClosures}</p>}
            {settings.closures.filter((c) => c.ends_at > new Date().toISOString()).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs">
                <span>
                  <strong>{c.calendar_id ? settings.calendars.find((x) => x.id === c.calendar_id)?.name : text.wholeWorkshop}</strong>
                  {' · '}{fmt(c.starts_at)} → {fmt(c.ends_at)}{c.reason ? ` · ${c.reason}` : ''}
                </span>
                <Button size="icon-sm" variant="ghost" aria-label={text.remove} disabled={busy} onClick={() => void save({ kind: 'closure_delete', id: c.id })}><Trash2 /></Button>
              </div>
            ))}
            <form className="grid gap-2 rounded-md border p-2" onSubmit={async (e) => { e.preventDefault(); if (await save({ kind: 'closure_add', ...closure })) setClosure((c) => ({ ...c, reason: '' })); }}>
              <select className={selectClass} aria-label={text.calendar} value={closure.calendar_id} onChange={(e) => setClosure((c) => ({ ...c, calendar_id: e.target.value }))}>
                <option value="">{text.wholeWorkshop}</option>
                {settings.calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" aria-label={`${text.from} ${text.date}`} value={closure.start_date} onChange={(e) => setClosure((c) => ({ ...c, start_date: e.target.value }))} required />
                <Input type="time" step={900} aria-label={`${text.from} ${text.time}`} value={closure.start_time} onChange={(e) => setClosure((c) => ({ ...c, start_time: e.target.value }))} />
                <Input type="date" aria-label={`${text.until} ${text.date}`} value={closure.end_date} onChange={(e) => setClosure((c) => ({ ...c, end_date: e.target.value }))} required />
                <Input type="time" step={900} aria-label={`${text.until} ${text.time}`} value={closure.end_time} onChange={(e) => setClosure((c) => ({ ...c, end_time: e.target.value }))} />
              </div>
              <Input aria-label={text.reason} placeholder={text.reason} value={closure.reason} maxLength={200} onChange={(e) => setClosure((c) => ({ ...c, reason: e.target.value }))} />
              <Button type="submit" size="sm" className="justify-self-start" disabled={busy}>{text.add}</Button>
            </form>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
