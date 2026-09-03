'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import styles from './vandaag.module.css';
import { JOB_STATUS_LABELS, slotLabel, type JobStatus } from '@/lib/crmJobs';

export interface VanJob {
  id: string;
  status: string;
  scheduled_date: string;
  slot_start: string | null;
  slot_end: string | null;
  street: string | null;
  postcode: string | null;
  city: string | null;
  kenteken: string | null;
  service_type: string | null;
  quoted_price: number | string | null;
  final_price: number | string | null;
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  signature_url: string | null;
}

const STATUS_CLASS: Record<string, string> = {
  gepland: styles.stGepland,
  onderweg: styles.stOnderweg,
  bezig: styles.stBezig,
  afgerond: styles.stAfgerond,
  geannuleerd: styles.stGeannuleerd,
};

/** The one-tap step forward from each state. */
const NEXT_STATUS: Record<string, { to: JobStatus; label: string } | null> = {
  gepland: { to: 'onderweg', label: 'Vertrokken' },
  onderweg: { to: 'bezig', label: 'Aangekomen — begin klus' },
  bezig: null, // finishing needs the record below, so it is not one tap
  afgerond: null,
  geannuleerd: null,
};

const QUEUE_KEY = 'crm.van.queue.v1';

interface QueuedPatch {
  jobId: string;
  patch: Record<string, unknown>;
  at: number;
}

/*
 * The queue and the connection are both external systems, not React state, so
 * they are read through useSyncExternalStore. That is not linter appeasement:
 * localStorage can be changed by another tab, and `navigator.onLine` flips
 * without React ever rendering.
 */

let queueCount = 0;
const queueListeners = new Set<() => void>();

function readQueue(): QueuedPatch[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedPatch[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // A private-mode browser with no storage. The update is still sent live;
    // only the offline safety net is missing, and that is worth carrying on for.
  }
  queueCount = items.length;
  for (const listener of queueListeners) listener();
}

function subscribeQueue(callback: () => void): () => void {
  queueListeners.add(callback);
  return () => {
    queueListeners.delete(callback);
  };
}

function subscribeOnline(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export default function VanScreen({
  jobs,
  technicianName,
  today,
}: {
  jobs: VanJob[];
  technicianName: string | null;
  today: string;
}) {
  const [rows, setRows] = useState(jobs);

  // Server render assumes online: a "no connection" banner flashing on every
  // page load would train people to ignore it.
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
  const queued = useSyncExternalStore(subscribeQueue, () => queueCount, () => 0);

  /*
   * Offline queue.
   *
   * There is no signal in a parking garage, and that is exactly where this work
   * happens. A status tap that fails is kept and replayed rather than lost —
   * otherwise the monteur taps "afgerond", sees nothing, and the office never
   * learns the job is done.
   */
  const flush = useCallback(async () => {
    const pending = readQueue();

    const left: QueuedPatch[] = [];
    for (const item of pending) {
      const ok = await fetch(`/api/admin/jobs/${item.jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.patch),
      })
        .then((r) => r.ok)
        .catch(() => false);
      if (!ok) left.push(item);
    }

    // Always written back, even when nothing was pending: this is also what
    // seeds the counter from storage on the first run after a page load.
    writeQueue(left);
  }, []);

  // Retry whenever the connection comes back, and once on load to clear
  // anything left over from a previous session in a dead spot.
  useEffect(() => {
    function retry() {
      void flush();
    }
    window.addEventListener('online', retry);
    void flush();
    return () => window.removeEventListener('online', retry);
  }, [flush]);

  const patchJob = useCallback(
    async (jobId: string, patch: Record<string, unknown>) => {
      // Optimistic: the screen moves immediately, because the monteur is
      // already walking away from the phone.
      setRows((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, ...(patch as Partial<VanJob>) } : j))
      );

      const ok = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
        .then((r) => r.ok)
        .catch(() => false);

      if (!ok) {
        writeQueue([...readQueue(), { jobId, patch, at: Date.now() }]);
        return false;
      }
      return true;
    },
    []
  );

  const dateLabel = new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Amsterdam',
  }).format(new Date(`${today}T12:00:00Z`));

  const open = rows.filter((j) => j.status !== 'afgerond' && j.status !== 'geannuleerd');

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h1 className={styles.title}>Vandaag</h1>
        <span className={styles.sub}>
          {technicianName ? `${technicianName} · ` : ''}
          {dateLabel} · {open.length} open
        </span>
      </div>

      {!online && (
        <div className={styles.offline}>
          Geen verbinding — wijzigingen worden bewaard en verstuurd zodra je weer
          bereik hebt.
        </div>
      )}

      {online && queued > 0 && (
        <div className={styles.offline}>
          {queued} wijziging{queued === 1 ? '' : 'en'} nog te versturen…
        </div>
      )}

      {rows.length === 0 ? (
        <p className={styles.empty}>Geen klussen vandaag.</p>
      ) : (
        rows.map((job) => (
          <JobCard key={job.id} job={job} onPatch={patchJob} />
        ))
      )}
    </div>
  );
}

function JobCard({
  job,
  onPatch,
}: {
  job: VanJob;
  onPatch: (id: string, patch: Record<string, unknown>) => Promise<boolean>;
}) {
  const [finishing, setFinishing] = useState(false);
  const next = NEXT_STATUS[job.status] ?? null;

  const address = [job.street, job.postcode, job.city].filter(Boolean).join(', ');
  const mapsUrl = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.slot}>
          {slotLabel(job.slot_start, job.slot_end)}
        </span>
        <span
          className={`${styles.badge} ${STATUS_CLASS[job.status] ?? styles.stGepland}`}
        >
          {JOB_STATUS_LABELS[job.status as JobStatus] ?? job.status}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.address}>{address || 'Geen adres'}</div>
        <div className={styles.meta}>
          {job.service_type ?? 'geen dienst'}
          {job.kenteken && (
            <>
              {' · '}
              <span className={styles.plate}>{job.kenteken}</span>
            </>
          )}
        </div>
        {job.customer_name && <div className={styles.meta}>{job.customer_name}</div>}

        {job.notes && <div className={styles.note}>{job.notes}</div>}

        <div className={styles.row}>
          {mapsUrl && (
            <a className={styles.tap} href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Navigeer
            </a>
          )}
          {job.customer_phone && (
            <a className={styles.tap} href={`tel:${job.customer_phone}`}>
              Bel klant
            </a>
          )}

          {next && (
            <button
              className={`${styles.tap} ${styles.tapPrimary}`}
              onClick={() => onPatch(job.id, { status: next.to })}
            >
              {next.label}
            </button>
          )}

          {/*
            * Telling the customer you are on your way, as a prefilled message
            * the monteur sends from their own WhatsApp.
            *
            * Not sent automatically: that needs a messaging provider
            * (Twilio, MessageBird) that this deployment does not have. A tap
            * that opens WhatsApp works today and needs no account — and the
            * customer gets a real number they can reply to.
            */}
          {job.status === 'onderweg' && job.customer_phone && (
            <a
              className={styles.tap}
              style={{ gridColumn: '1 / -1' }}
              href={`https://wa.me/${job.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Goedendag${job.customer_name ? ` ${job.customer_name}` : ''}, ik ben onderweg naar u voor ${
                  job.service_type ?? 'de afspraak'
                }. Tot zo — Autosleutel24.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Klant appen: ik ben onderweg
            </a>
          )}

          {job.status === 'bezig' && !finishing && (
            <button
              className={`${styles.tap} ${styles.tapDone}`}
              onClick={() => setFinishing(true)}
            >
              Klus afronden
            </button>
          )}
        </div>
      </div>

      {finishing && job.status === 'bezig' && (
        <FinishPanel
          job={job}
          onPatch={onPatch}
          onDone={() => setFinishing(false)}
        />
      )}
    </div>
  );
}

/**
 * What gets recorded at the end of a job.
 *
 * Photos and the signature go straight up and are not queued offline: a
 * multi-megabyte image does not belong in localStorage, and pretending it was
 * saved would be worse than saying it was not.
 */
function FinishPanel({
  job,
  onPatch,
  onDone,
}: {
  job: VanJob;
  onPatch: (id: string, patch: Record<string, unknown>) => Promise<boolean>;
  onDone: () => void;
}) {
  const [price, setPrice] = useState(
    job.final_price === null
      ? job.quoted_price === null
        ? ''
        : String(job.quoted_price)
      : String(job.final_price)
  );
  const [note, setNote] = useState('');
  const [material, setMaterial] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [signed, setSigned] = useState(Boolean(job.signature_url));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('contant');
  const [paymentDone, setPaymentDone] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const drew = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Match the backing store to the CSS size so the line is not blurry and
    // the exported PNG is the right resolution.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#111111';
  }, []);

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    drew.current = true;
    const { x, y } = pointerPosition(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  function moveDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const { x, y } = pointerPosition(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function endDraw() {
    drawing.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    drew.current = false;
    setSigned(false);
  }

  async function uploadSignature(): Promise<boolean> {
    const canvas = canvasRef.current;
    if (!canvas || !drew.current) return true; // nothing drawn, nothing to send

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!blob) return false;

    const ok = await fetch(`/api/admin/jobs/${job.id}/signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: blob,
    })
      .then((r) => r.ok)
      .catch(() => false);

    setSigned(ok);
    return ok;
  }

  async function addPhoto(event: React.ChangeEvent<HTMLInputElement>, kind: string) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setError('');

    const response = await fetch(`/api/admin/jobs/${job.id}/photos?kind=${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Foto uploaden mislukt — probeer het met bereik opnieuw.');
      setBusy(false);
      return;
    }

    const body = await response.json();
    setPhotos((prev) => [...prev, body.photo.url]);
    setBusy(false);
  }

  async function addMaterial() {
    const description = material.trim();
    if (!description) return;

    setBusy(true);
    const ok = await fetch(`/api/admin/jobs/${job.id}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, quantity: 1 }),
    })
      .then((r) => r.ok)
      .catch(() => false);

    if (ok) {
      setMaterials((prev) => [...prev, description]);
      setMaterial('');
    } else {
      setError('Materiaal opslaan mislukt.');
    }
    setBusy(false);
  }

  /*
   * Money taken at the door.
   *
   * Recorded as its own step, not derived from the price: what was agreed and
   * what was actually handed over are different numbers often enough that
   * guessing would put the wrong figure on someone's balance.
   */
  async function recordPayment(): Promise<boolean> {
    const value = paymentAmount.trim();
    if (!value) return true; // nothing collected here — invoiced or already paid

    const response = await fetch(`/api/admin/jobs/${job.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: value, method: paymentMethod }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(
        body?.error ??
          'Betaling kon niet worden vastgelegd. Dit gaat niet in de wachtrij — probeer het met bereik opnieuw.'
      );
      return false;
    }

    setPaymentDone(true);
    return true;
  }

  async function finish() {
    setBusy(true);
    setError('');
    setMessage('');

    // Before the status flips: a job marked afgerond with the payment missing
    // is a job nobody goes back to.
    if (!paymentDone && !(await recordPayment())) {
      setBusy(false);
      return;
    }

    await uploadSignature();

    const sent = await onPatch(job.id, {
      status: 'afgerond',
      final_price: price.trim() === '' ? null : price.trim(),
      notes: note.trim() ? note.trim() : job.notes,
    });

    setBusy(false);
    setMessage(
      sent
        ? 'Klus afgerond en verstuurd.'
        : 'Klus afgerond. Nog geen verbinding — wordt verstuurd zodra je bereik hebt.'
    );
    onDone();
  }

  return (
    <div className={styles.finish}>
      <p className={styles.finishTitle}>Klus afronden</p>

      <div className={styles.field}>
        <span className={styles.label}>Foto&apos;s</span>
        {photos.length > 0 && (
          <div className={styles.photos}>
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} className={styles.thumb} src={url} alt="" />
            ))}
          </div>
        )}
        <div className={styles.row}>
          <label className={styles.tap}>
            Foto vooraf
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => addPhoto(e, 'before')}
            />
          </label>
          <label className={styles.tap}>
            Foto achteraf
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => addPhoto(e, 'after')}
            />
          </label>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Materiaal</span>
        {materials.map((m, i) => (
          <div key={`${m}-${i}`} className={styles.materialRow}>
            <span>{m}</span>
            <span className={styles.materialQty}>1×</span>
          </div>
        ))}
        <div className={styles.row}>
          <input
            className={styles.input}
            placeholder="Bijv. smart key Mercedes"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
          <button className={styles.tap} onClick={addMaterial} disabled={busy}>
            Toevoegen
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>
          Betaling {paymentDone && '· vastgelegd'}
        </span>
        <select
          className={styles.input}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          disabled={paymentDone}
        >
          <option value="contant">Contant — ik heb het geld</option>
          <option value="pin">Pin — ik heb het geld</option>
          <option value="tikkie">Tikkie — naar het bedrijf</option>
          <option value="ideal">iDEAL — naar het bedrijf</option>
          <option value="factuur">Op factuur — later</option>
        </select>
        <input
          className={styles.input}
          inputMode="decimal"
          placeholder="Ontvangen bedrag, leeg = niets ontvangen"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          disabled={paymentDone}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`pr-${job.id}`}>
          Werkelijke prijs (€)
        </label>
        <input
          id={`pr-${job.id}`}
          className={styles.input}
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`nt-${job.id}`}>
          Notitie
        </label>
        <textarea
          id={`nt-${job.id}`}
          className={styles.input}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>
          Handtekening klant {signed && '· opgeslagen'}
        </span>
        <canvas
          ref={canvasRef}
          className={`${styles.sigPad} ${signed ? styles.sigDone : ''}`}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
        <button className={styles.tap} onClick={clearSignature} type="button">
          Wissen
        </button>
      </div>

      <button
        className={`${styles.tap} ${styles.tapDone}`}
        onClick={finish}
        disabled={busy}
      >
        {busy ? 'Bezig…' : 'Afronden'}
      </button>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.ok}>{message}</p>}
    </div>
  );
}
