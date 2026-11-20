'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCalendarController } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import listPlugin from '@fullcalendar/react/list';
import multiMonthPlugin from '@fullcalendar/react/multimonth';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import nlLocale from '@fullcalendar/react/locales/nl';
import enGbLocale from '@fullcalendar/react/locales/en-gb';
import { differenceInCalendarDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Settings, XIcon } from 'lucide-react';
import { EventCalendarViews } from '@/components/calendar/event-calendar-views';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreviewLanguage } from '../PreviewLanguage';
import { amsterdamParts, amsterdamToday, minutesToTime, timeToMinutes, isoWeekday } from '@/lib/amsterdamTime';
import type { WorkshopAppointment, WorkshopSettings } from '@/lib/workshopAgenda';
import { apiError, calendarText } from './calendarText';
import { AppointmentDetailDialog, NewAppointmentDialog } from './AppointmentDialogs';
import { WorkshopSettingsSheet } from './WorkshopSettingsSheet';

/*
 * The Studio Admin Aria calendar (src/app/(main)/dashboard/calendar), ported
 * as-is: same header (range title, days and event count, calendar select,
 * prev/today/next, view select, add button) and the same FullCalendar views
 * component. The data and the calendar list come from the CRM instead of the
 * demo events. Monday-first, 24-hour, Europe/Amsterdam.
 */

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit', hour12: false } as const;

export default function WorkshopCalendar({ initialSettings, canEdit, today: serverToday }: {
  initialSettings: WorkshopSettings | null; canEdit: boolean; today: string;
}) {
  const controller = useCalendarController();
  const { english } = usePreviewLanguage();
  const text = calendarText(english);
  const views = [
    { value: 'dayGridMonth', label: text.month },
    { value: 'timeGridWeek', label: text.week },
    { value: 'timeGridDay', label: text.day },
  ];
  const [settings, setSettings] = useState(initialSettings);
  const [selectedCalendar, setSelectedCalendar] = useState('all');
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [dateInfo, setDateInfo] = useState({ title: '', days: 0, start: 0, end: 0 });
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; appointments: WorkshopAppointment[]; error: boolean }>({ key: '', appointments: [], error: false });
  const [draft, setDraft] = useState<{ date: string; time: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const loadKey = range ? `${range.start}|${range.end}|${reload}` : '';
  useEffect(() => {
    if (!range) return;
    const ctrl = new AbortController();
    fetch(`/api/admin/workshop/appointments?${new URLSearchParams({ from: range.start, to: range.end })}`, { signal: ctrl.signal, cache: 'no-store' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((body: { appointments: WorkshopAppointment[] }) => setLoaded({ key: loadKey, appointments: body.appointments, error: false }))
      .catch((error) => { if (error.name !== 'AbortError') setLoaded((prev) => ({ ...prev, key: loadKey, error: true })); });
    return () => ctrl.abort();
  }, [loadKey, range]);

  useEffect(() => {
    if (initialSettings) return;
    fetch('/api/admin/workshop/settings', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((next: WorkshopSettings | null) => { if (next) setSettings(next); })
      .catch(() => undefined);
  }, [initialSettings]);

  const calendars = useMemo(() => [
    { value: 'all', label: text.allCalendars },
    ...(settings?.calendars ?? []).filter((c) => c.active).map((c) => ({ value: c.id, label: c.name })),
  ], [settings, text.allCalendars]);
  const calendarById = useMemo(() => new Map((settings?.calendars ?? []).map((c) => [c.id, c])), [settings]);
  const serviceById = useMemo(() => new Map((settings?.services ?? []).map((s) => [s.id, s])), [settings]);

  const visible = useMemo(() => loaded.appointments.filter((a) => a.status !== 'geannuleerd'
    && (selectedCalendar === 'all' || a.calendar_id === selectedCalendar)), [loaded.appointments, selectedCalendar]);
  const eventCount = visible.filter((a) => {
    const start = Date.parse(a.starts_at);
    return start >= dateInfo.start && start < dateInfo.end;
  }).length;

  const events = useMemo(() => [
    ...visible.map((a) => {
      const service = serviceById.get(a.service_id);
      return {
        id: a.id,
        title: service ? (english ? service.name_en : service.name_nl) : a.customer_name,
        start: a.starts_at,
        end: a.ends_at,
        color: calendarById.get(a.calendar_id)?.color,
        editable: canEdit && ['gepland', 'bevestigd'].includes(a.status),
      };
    }),
    // Closures (whole workshop) and blocks (one calendar) as background events.
    ...(settings?.closures ?? []).filter((c) => selectedCalendar === 'all' || !c.calendar_id || c.calendar_id === selectedCalendar).map((c) => ({
      id: `closure-${c.id}`,
      title: c.reason ?? (c.calendar_id ? `${text.blocked} · ${calendarById.get(c.calendar_id)?.name ?? ''}` : text.closed),
      start: c.starts_at,
      end: c.ends_at,
      display: 'background',
    })),
  ], [visible, settings, selectedCalendar, serviceById, calendarById, english, canEdit, text.blocked, text.closed]);

  // Opening hours from the CRM; FullCalendar counts Sunday as 0.
  const businessHours = useMemo(() => (settings?.hours ?? []).filter((h) => !h.closed && h.open_time && h.close_time)
    .map((h) => ({ daysOfWeek: [h.weekday % 7], startTime: h.open_time!, endTime: h.close_time! })), [settings]);
  const slotBounds = useMemo(() => {
    const open = businessHours.map((h) => timeToMinutes(h.startTime));
    const close = businessHours.map((h) => timeToMinutes(h.endTime));
    if (!open.length) return { slotMinTime: '07:00:00', slotMaxTime: '20:00:00' };
    return {
      slotMinTime: `${minutesToTime(Math.max(0, Math.min(...open) - 60))}:00`,
      slotMaxTime: `${minutesToTime(Math.min(23 * 60 + 59, Math.max(...close) + 60))}:00`,
    };
  }, [businessHours]);

  const flash = (message: string) => { setNotice(message); setTimeout(() => setNotice(''), 4000); };
  const newAt = (date: string, time?: string) => {
    if (!canEdit) return;
    const today = amsterdamToday();
    if (date < today) return;
    const hours = settings?.hours.find((h) => h.weekday === isoWeekday(date));
    setDraft({ date, time: time ?? (hours?.open_time ?? '09:00') });
  };
  const selected = selectedId ? loaded.appointments.find((a) => a.id === selectedId) ?? null : null;
  const status = !range || loaded.key !== loadKey ? 'loading' : loaded.error ? 'error' : 'ready';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col overflow-hidden rounded-md border">
        <div className="bg-sidebar text-sidebar-foreground flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 shrink-0 flex-col gap-1">
            <div className="text-lg leading-none font-medium capitalize" data-testid="calendar-title">{dateInfo.title}</div>
            <p className="text-muted-foreground text-sm" data-testid="calendar-count">
              {text.days(dateInfo.days)} - {text.appointments(eventCount)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
              <SelectTrigger className="w-full sm:w-44" aria-label={text.calendar} data-testid="calendar-filter">
                <CalendarIcon />
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.value} value={calendar.value}>{calendar.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ButtonGroup>
              <Button size="icon" variant="outline" onClick={() => controller.prev()} aria-label={text.previous}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" onClick={() => controller.today()}>
                {text.today}
              </Button>
              <Button size="icon" variant="outline" onClick={() => controller.next()} aria-label={text.next}>
                <ChevronRight />
              </Button>
            </ButtonGroup>
            <Select value={controller.view?.type ?? views[0].value} onValueChange={(value) => controller.changeView(value)}>
              <SelectTrigger aria-label={`${text.month} / ${text.week} / ${text.day}`} data-testid="view-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {views.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {canEdit && (
              <>
                <Button onClick={() => newAt(amsterdamParts(controller.getDate?.() ?? Date.now()).day < amsterdamToday() ? amsterdamToday() : amsterdamParts(controller.getDate?.() ?? Date.now()).day)}>
                  <Plus data-icon="inline-start" />
                  {text.newAppointment}
                </Button>
                <Button size="icon" variant="outline" onClick={() => setSettingsOpen(true)} aria-label={text.settings}>
                  <Settings />
                </Button>
              </>
            )}
          </div>
        </div>

        {!canEdit && <p className="text-muted-foreground border-b px-4 py-2 text-xs">{text.readOnly}</p>}
        {notice && <p role="status" className="border-b px-4 py-2 text-sm">{notice}</p>}
        {status === 'error' && (
          <div role="alert" className="flex items-center gap-3 border-b px-4 py-3 text-sm">
            {text.loadError}<Button size="sm" variant="outline" onClick={() => setReload((n) => n + 1)}>{text.retry}</Button>
          </div>
        )}

        <div aria-busy={status === 'loading'} data-testid="calendar-body">
          <EventCalendarViews
            controller={controller}
            initialView={views[0].value}
            initialDate={serverToday}
            plugins={[...plugins]}
            popoverCloseContent={() => <XIcon className="text-muted-foreground group-hover:text-foreground size-5" />}
            events={events}
            nowIndicator
            timeZone="Europe/Amsterdam"
            locale={english ? enGbLocale : nlLocale}
            firstDay={1}
            eventTimeFormat={TIME_FORMAT}
            slotHeaderFormat={TIME_FORMAT}
            businessHours={businessHours}
            slotMinTime={slotBounds.slotMinTime}
            slotMaxTime={slotBounds.slotMaxTime}
            allDaySlot={false}
            navLinks
            dayMaxEvents
            editable={canEdit}
            eventDurationEditable={false}
            datesSet={(info) => {
              setDateInfo({
                title: info.view.title,
                days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
                start: info.view.currentStart.getTime(),
                end: info.view.currentEnd.getTime(),
              });
              setRange({ start: info.start.toISOString(), end: info.end.toISOString() });
            }}
            dateClick={(info) => {
              const at = amsterdamParts(info.date);
              newAt(at.day, info.allDay ? undefined : at.time);
            }}
            eventClick={(info) => {
              if (info.event.id.startsWith('closure-')) return;
              info.jsEvent.preventDefault();
              setSelectedId(info.event.id);
            }}
            eventDrop={async (info) => {
              const start = info.event.start;
              if (!start) { info.revert(); return; }
              const at = amsterdamParts(start);
              const appointment = loaded.appointments.find((a) => a.id === info.event.id);
              // A drop in month view keeps the original clock time.
              const time = info.view.type === 'dayGridMonth' && appointment ? amsterdamParts(appointment.starts_at).time : at.time;
              const response = await fetch('/api/admin/workshop/appointments', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: info.event.id, action: 'move', date: at.day, time }),
              });
              const body = await response.json().catch(() => null);
              if (!response.ok) { info.revert(); flash(apiError(text, body, response.status)); return; }
              flash(text.moved);
              setReload((n) => n + 1);
            }}
          />
        </div>
      </div>

      {settings && draft && (
        <NewAppointmentDialog key={`${draft.date}-${draft.time}`} initial={draft} settings={settings}
          defaultCalendar={selectedCalendar === 'all' ? '' : selectedCalendar} text={text} english={english}
          onClose={() => setDraft(null)}
          onCreated={(day) => { setDraft(null); flash(text.created); controller.gotoDate?.(day); setReload((n) => n + 1); }} />
      )}
      {settings && selected && (
        <AppointmentDetailDialog appointment={selected} settings={settings} canEdit={canEdit} text={text} english={english}
          onClose={() => setSelectedId(null)}
          onChanged={(message, day) => { flash(message); if (day) controller.gotoDate?.(day); setReload((n) => n + 1); }} />
      )}
      {canEdit && settings && (
        <WorkshopSettingsSheet key={settingsOpen ? 'open' : 'closed'} open={settingsOpen} onOpenChange={setSettingsOpen}
          settings={settings} text={text} english={english}
          onSaved={(next) => { setSettings(next); setReload((n) => n + 1); }} />
      )}
    </div>
  );
}
