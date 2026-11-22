/* NL/EN copy for the workshop calendar. Follows the panel's PreviewLanguage switch. */

const nl = {
  title: 'Werkplaatsagenda',
  month: 'Maand', week: 'Week', day: 'Dag',
  previous: 'Vorige', today: 'Vandaag', next: 'Volgende',
  allCalendars: 'Alle kalenders', calendar: 'Kalender', anyCalendar: 'Eerste vrije kalender',
  newAppointment: 'Nieuwe afspraak', settings: 'Instellingen',
  days: (n: number) => `${n} ${n === 1 ? 'dag' : 'dagen'}`,
  appointments: (n: number) => `${n} ${n === 1 ? 'afspraak' : 'afspraken'}`,
  more: (n: number) => `+${n} meer`,
  closed: 'Gesloten', blocked: 'Geblokkeerd', loading: 'Laden…',
  loadError: 'De agenda kan nu niet worden geladen.', retry: 'Opnieuw',
  readOnly: 'Alleen lezen: afspraken maken of wijzigen is voorbehouden aan kantoor.',
  customer: 'Klant', name: 'Naam', phone: 'Telefoon', email: 'E-mail', contact: 'Contact',
  service: 'Dienst', vehicle: 'Auto', make: 'Merk', model: 'Model', year: 'Bouwjaar',
  date: 'Datum', start: 'Begin', end: 'Einde', time: 'Tijd', duration: 'Duur', minutes: 'min',
  status: 'Status', source: 'Bron', notes: 'Notities', reference: 'Referentie',
  freeTimes: 'Vrije tijden', noFreeTimes: 'Geen vrije tijd op deze dag voor deze dienst.',
  dayClosed: 'De werkplaats is op deze dag gesloten.', dayPast: 'Deze dag is voorbij.',
  pickService: 'Kies eerst een dienst.', notInList: 'Dit tijdstip staat niet in de vrije tijden; de server controleert het opnieuw.',
  save: 'Opslaan', saving: 'Opslaan…', cancel: 'Annuleren', close: 'Sluiten',
  book: 'Afspraak maken', move: 'Verplaatsen', moveTitle: 'Afspraak verplaatsen', cancelAppointment: 'Afspraak annuleren',
  confirmCancel: 'Deze afspraak annuleren? Het tijdstip komt weer vrij.', yesCancel: 'Ja, annuleren',
  markConfirmed: 'Bevestigd', markDone: 'Afgerond', markNoShow: 'Niet verschenen',
  created: 'Afspraak gemaakt', moved: 'Afspraak verplaatst', cancelled: 'Afspraak geannuleerd', updated: 'Status bijgewerkt',
  hours: 'Openingstijden', services: 'Diensten en duur', calendars: 'Kalenders en capaciteit', closures: 'Sluitingen en blokkades',
  capacity: 'Capaciteit', active: 'Actief', wholeWorkshop: 'Hele werkplaats', reason: 'Reden', add: 'Toevoegen', remove: 'Verwijderen',
  from: 'Van', until: 'Tot', noClosures: 'Geen sluitingen of blokkades gepland.',
  settingsHint: 'Wijzigingen gelden direct voor de agenda én voor de Workshop Service-agent.',
  errors: {
    full: 'Dit tijdstip is al bezet.', past: 'Dit tijdstip ligt in het verleden.', closed: 'De werkplaats is dan gesloten.',
    outside_hours: 'Valt (deels) buiten de openingstijden.', blocked: 'Dit tijdstip is geblokkeerd of gesloten.',
    unknown_calendar: 'Onbekende of inactieve kalender.', unknown_service: 'Onbekende of inactieve dienst.', invalid_time: 'Ongeldige tijd.',
    not_movable: 'Deze afspraak kan niet meer worden verplaatst.', not_found: 'Afspraak niet gevonden.',
    idempotency_mismatch: 'Dubbele aanvraag; vernieuw het formulier.', invalid: 'Controleer de ingevulde velden.',
    service_error: 'De agenda is tijdelijk niet beschikbaar.', forbidden: 'Geen toegang.', generic: 'Er ging iets mis.',
  } as Record<string, string>,
  fields: {
    service_id: 'dienst', start: 'datum/tijd', calendar_id: 'kalender', customer_name: 'naam', customer_phone: 'telefoon',
    customer_email: 'e-mail', contact: 'telefoon of e-mail', vehicle_year: 'bouwjaar', source: 'bron',
  } as Record<string, string>,
  statuses: { gepland: 'Gepland', bevestigd: 'Bevestigd', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd', no_show: 'Niet verschenen' } as Record<string, string>,
  sources: { crm: 'CRM', telefoon: 'Telefoon', whatsapp: 'WhatsApp' } as Record<string, string>,
};

const en: typeof nl = {
  title: 'Workshop Calendar',
  month: 'Month', week: 'Week', day: 'Day',
  previous: 'Previous', today: 'Today', next: 'Next',
  allCalendars: 'All calendars', calendar: 'Calendar', anyCalendar: 'First free calendar',
  newAppointment: 'New Appointment', settings: 'Settings',
  days: (n) => `${n} ${n === 1 ? 'day' : 'days'}`,
  appointments: (n) => `${n} ${n === 1 ? 'appointment' : 'appointments'}`,
  more: (n) => `+${n} more`,
  closed: 'Closed', blocked: 'Blocked', loading: 'Loading…',
  loadError: 'The calendar cannot be loaded right now.', retry: 'Retry',
  readOnly: 'Read only: creating or changing appointments is limited to office staff.',
  customer: 'Customer', name: 'Name', phone: 'Phone', email: 'Email', contact: 'Contact',
  service: 'Service', vehicle: 'Vehicle', make: 'Make', model: 'Model', year: 'Year',
  date: 'Date', start: 'Start', end: 'End', time: 'Time', duration: 'Duration', minutes: 'min',
  status: 'Status', source: 'Source', notes: 'Notes', reference: 'Reference',
  freeTimes: 'Available times', noFreeTimes: 'No free time on this day for this service.',
  dayClosed: 'The workshop is closed on this day.', dayPast: 'This day has passed.',
  pickService: 'Choose a service first.', notInList: 'This time is not in the available list; the server checks it again.',
  save: 'Save', saving: 'Saving…', cancel: 'Cancel', close: 'Close',
  book: 'Book Appointment', move: 'Move', moveTitle: 'Move Appointment', cancelAppointment: 'Cancel Appointment',
  confirmCancel: 'Cancel this appointment? The time becomes available again.', yesCancel: 'Yes, cancel',
  markConfirmed: 'Confirmed', markDone: 'Completed', markNoShow: 'No-show',
  created: 'Appointment created', moved: 'Appointment moved', cancelled: 'Appointment cancelled', updated: 'Status updated',
  hours: 'Opening Hours', services: 'Services and Duration', calendars: 'Calendars and Capacity', closures: 'Closures and Blocks',
  capacity: 'Capacity', active: 'Active', wholeWorkshop: 'Whole workshop', reason: 'Reason', add: 'Add', remove: 'Remove',
  from: 'From', until: 'Until', noClosures: 'No closures or blocks scheduled.',
  settingsHint: 'Changes apply immediately to the calendar and to the Workshop Service agent.',
  errors: {
    full: 'This time is already taken.', past: 'This time is in the past.', closed: 'The workshop is closed then.',
    outside_hours: 'Falls (partly) outside opening hours.', blocked: 'This time is blocked or closed.',
    unknown_calendar: 'Unknown or inactive calendar.', unknown_service: 'Unknown or inactive service.', invalid_time: 'Invalid time.',
    not_movable: 'This appointment can no longer be moved.', not_found: 'Appointment not found.',
    idempotency_mismatch: 'Duplicate request; reopen the form.', invalid: 'Check the fields.',
    service_error: 'The calendar is temporarily unavailable.', forbidden: 'No access.', generic: 'Something went wrong.',
  },
  fields: {
    service_id: 'service', start: 'date/time', calendar_id: 'calendar', customer_name: 'name', customer_phone: 'phone',
    customer_email: 'email', contact: 'phone or email', vehicle_year: 'year', source: 'source',
  },
  statuses: { gepland: 'Scheduled', bevestigd: 'Confirmed', afgerond: 'Completed', geannuleerd: 'Cancelled', no_show: 'No-show' },
  sources: { crm: 'CRM', telefoon: 'Phone', whatsapp: 'WhatsApp' },
};

export type CalendarText = typeof nl;
export const calendarText = (english: boolean): CalendarText => (english ? en : nl);
export const locale = (english: boolean) => (english ? 'en-GB' : 'nl-NL');

/** Error message for an API response body. */
export function apiError(text: CalendarText, body: { code?: string; fields?: string[] } | null, status: number): string {
  if (status === 401 || status === 403) return text.errors.forbidden;
  const base = text.errors[body?.code ?? ''] ?? text.errors.generic;
  return body?.fields?.length ? `${base} (${body.fields.map((f) => text.fields[f] ?? f).join(', ')})` : base;
}
