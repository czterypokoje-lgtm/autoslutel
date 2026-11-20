'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { slotLabel, type JobStatus } from '@/lib/crmJobs';
import { waLink, onTheWayMessage } from '@/lib/whatsapp';
import { toWebp } from '@/lib/toWebp';
import { Car, ChevronDown, ChevronRight, MapPin, Navigation, Phone, User, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from 'cn';
import type { VanJob } from './VanScreen';

export type { VanJob };

const STEPS: { key: string; label: string }[] = [
  { key: 'gepland', label: 'Gepland' },
  { key: 'onderweg', label: 'Onderweg' },
  { key: 'bezig', label: 'Bezig' },
  { key: 'afgerond', label: 'Klaar' },
];

const EURO = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** Same one-tap step forward as the classic screen. */
const NEXT_STATUS: Record<string, { to: JobStatus; label: string } | null> = {
  gepland: { to: 'onderweg', label: 'Vertrokken' },
  onderweg: { to: 'bezig', label: 'Aangekomen — begin klus' },
  bezig: null,
  afgerond: null,
  geannuleerd: null,
};

const STATUS_BADGE: Record<string, string> = {
  gepland: 'bg-muted text-muted-foreground',
  onderweg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  bezig: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  afgerond: 'bg-green-500/15 text-green-600 dark:text-green-400',
  geannuleerd: 'bg-muted text-muted-foreground',
};

const QUEUE_KEY = 'crm.van.queue.v1';

interface QueuedPatch {
  jobId: string;
  patch: Record<string, unknown>;
  at: number;
}

/*
 * Offline queue and connection state — identical to VanScreen.tsx, duplicated
 * rather than imported because that file's module-level `queueCount` /
 * `queueListeners` are process-wide singletons: having both screens import
 * the same instance is fine, having the Studio screen pull in VanScreen's
 * client component just for these two functions is not.
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
    // No storage (private mode) — the update still goes out live.
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

export default function StudioVanScreen({
  jobs,
  technicianName,
  today,
  vanStock,
}: {
  jobs: VanJob[];
  technicianName: string | null;
  today: string;
  vanStock: { id: string; description: string; quantity: number; unit_cost: number | null }[];
}) {
  const [rows, setRows] = useState(jobs);

  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
  const queued = useSyncExternalStore(subscribeQueue, () => queueCount, () => 0);

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
    writeQueue(left);
  }, []);

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
  const live = rows.filter((j) => j.status !== 'geannuleerd');
  const doneCount = live.filter((j) => j.status === 'afgerond').length;
  const pct = live.length ? Math.round((doneCount / live.length) * 100) : 0;

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight">Vandaag</h1>
        <p className="text-muted-foreground text-sm">
          {technicianName ? `${technicianName} · ` : ''}
          {dateLabel}
        </p>
      </div>

      {live.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <b className="text-base font-medium">
                {doneCount} van {live.length} klaar
              </b>
              <span className="text-muted-foreground">
                {open.length === 0 ? 'Alles gedaan vandaag' : `${open.length} nog te gaan`}
              </span>
            </div>
            <Progress value={pct} />
          </CardContent>
        </Card>
      )}

      {!online && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Geen verbinding — wijzigingen worden bewaard en verstuurd zodra je weer bereik hebt.
        </div>
      )}

      {online && queued > 0 && (
        <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {queued} wijziging{queued === 1 ? '' : 'en'} nog te versturen…
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Geen klussen vandaag.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((job) => (
            <JobCard key={job.id} job={job} onPatch={patchJob} vanStock={vanStock} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  onPatch,
  vanStock,
}: {
  job: VanJob;
  onPatch: (id: string, patch: Record<string, unknown>) => Promise<boolean>;
  vanStock: { id: string; description: string; quantity: number; unit_cost: number | null }[];
}) {
  const [finishing, setFinishing] = useState(false);
  const [expanded, setExpanded] = useState(job.status !== 'afgerond');
  const next = NEXT_STATUS[job.status] ?? null;
  const stepIndex = STEPS.findIndex((s) => s.key === job.status);
  const price = Number(job.final_price ?? job.quoted_price) || 0;

  const address = [job.street, job.postcode, job.city].filter(Boolean).join(', ');
  const mapsUrl = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : null;
  const car = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ');

  const logo = job.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={job.logo} alt="" className="size-5 shrink-0 object-contain" />
  ) : (
    <Car size={18} strokeWidth={2} className="shrink-0 text-muted-foreground" />
  );

  if (!expanded) {
    return (
      <button type="button" className="w-full text-left" onClick={() => setExpanded(true)}>
        <Card className="flex-row items-center gap-3 px-4 py-3">
          <span className="text-sm font-medium tabular-nums">{slotLabel(job.slot_start, job.slot_end)}</span>
          {logo}
          <span className="flex-1 truncate text-sm">{car || job.service_type || 'Klus'}</span>
          <Badge className="bg-green-500/15 text-green-600 dark:text-green-400">Klaar</Badge>
          <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
        </Card>
      </button>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium tabular-nums">{slotLabel(job.slot_start, job.slot_end)}</span>
          {price > 0 && <span className="text-muted-foreground text-sm tabular-nums">{EURO.format(price)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={STATUS_BADGE[job.status] ?? ''}>{STEPS.find((s) => s.key === job.status)?.label ?? job.status}</Badge>
          {job.status === 'afgerond' && (
            <Button variant="ghost" size="icon-sm" onClick={() => setExpanded(false)} aria-label="Inklappen">
              <ChevronDown size={18} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {job.status === 'geannuleerd' ? (
          <p className="text-sm text-muted-foreground">Geannuleerd</p>
        ) : (
          <ol className="flex items-center gap-1.5" aria-label="Status">
            {STEPS.map((step, i) => (
              <li
                key={step.key}
                aria-current={i === stepIndex ? 'step' : undefined}
                className={cn(
                  'flex-1 border-t-2 pt-1.5 text-center text-[11px] font-medium',
                  i < stepIndex ? 'border-primary text-foreground' : i === stepIndex ? 'border-primary text-primary' : 'border-muted text-muted-foreground'
                )}
              >
                {step.label}
              </li>
            ))}
          </ol>
        )}

        {car && (
          <div className="flex items-center gap-2 text-sm font-medium">
            {logo}
            {car}
            {job.keyless !== null && (
              <Badge variant="outline">{job.keyless ? 'Keyless' : 'Sleutel'}</Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <MapPin size={16} strokeWidth={2} className="shrink-0 text-muted-foreground" />
          {address || 'Geen adres'}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wrench size={14} strokeWidth={2} className="shrink-0" />
          {job.service_type ?? 'geen dienst'}
          {job.kenteken && (
            <>
              {' · '}
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">{job.kenteken}</span>
            </>
          )}
        </div>

        {job.customer_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User size={14} strokeWidth={2} className="shrink-0" />
            {job.customer_name}
          </div>
        )}

        {job.notes && <p className="rounded-lg bg-muted p-3 text-sm">{job.notes}</p>}

        <div className="grid grid-cols-2 gap-2">
          {mapsUrl && (
            <Button variant="outline" size="lg" className="h-11 text-base" asChild>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation data-icon="inline-start" />
                Navigeer
              </a>
            </Button>
          )}
          {job.customer_phone && (
            <Button variant="outline" size="lg" className="h-11 text-base" asChild>
              <a href={`tel:${job.customer_phone}`}>
                <Phone data-icon="inline-start" />
                Bel klant
              </a>
            </Button>
          )}

          {next && (
            <Button size="lg" className="h-11 col-span-2 text-base" onClick={() => onPatch(job.id, { status: next.to })}>
              {next.label}
            </Button>
          )}

          {job.status === 'onderweg' && job.customer_phone && (
            <Button variant="outline" size="lg" className="col-span-2 h-11 text-base" asChild>
              <a
                href={waLink(job.customer_phone, onTheWayMessage(job.customer_name, job.service_type)) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Klant appen: ik ben onderweg
              </a>
            </Button>
          )}

          {job.status === 'bezig' && !finishing && (
            <Button size="lg" className="col-span-2 h-11 bg-green-600 text-base text-white hover:bg-green-600/90" onClick={() => setFinishing(true)}>
              Klus afronden
            </Button>
          )}
        </div>
      </CardContent>

      {finishing && job.status === 'bezig' && (
        <FinishPanel job={job} onPatch={onPatch} onDone={() => setFinishing(false)} vanStock={vanStock} />
      )}
    </Card>
  );
}

function FinishPanel({
  job,
  onPatch,
  onDone,
  vanStock,
}: {
  job: VanJob;
  onPatch: (id: string, patch: Record<string, unknown>) => Promise<boolean>;
  onDone: () => void;
  vanStock: { id: string; description: string; quantity: number; unit_cost: number | null }[];
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
    if (!canvas || !drew.current) return true;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
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

    const upload = await toWebp(file).catch(() => file);

    const response = await fetch(`/api/admin/jobs/${job.id}/photos?kind=${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': upload.type || file.type },
      body: upload,
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

    const item = vanStock.find((s) => s.description === description);

    const ok = await fetch(`/api/admin/jobs/${job.id}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, quantity: 1, stock_item_id: item?.id }),
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

  async function recordPayment(): Promise<boolean> {
    const value = paymentAmount.trim();
    if (!value) return true;

    const response = await fetch(`/api/admin/jobs/${job.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: value, method: paymentMethod }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Betaling kon niet worden vastgelegd. Dit gaat niet in de wachtrij — probeer het met bereik opnieuw.');
      return false;
    }

    setPaymentDone(true);
    return true;
  }

  async function finish() {
    setBusy(true);
    setError('');
    setMessage('');

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
    setMessage(sent ? 'Klus afgerond en verstuurd.' : 'Klus afgerond. Nog geen verbinding — wordt verstuurd zodra je bereik hebt.');
    onDone();
  }

  return (
    <CardContent className="flex flex-col gap-4 border-t pt-4">
      <p className="text-sm font-medium">Klus afronden</p>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Foto&apos;s</span>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="size-16 rounded-lg object-cover ring-1 ring-foreground/10" />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" className="h-11 text-base" asChild>
            <label>
              Foto vooraf
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhoto(e, 'before')} />
            </label>
          </Button>
          <Button variant="outline" size="lg" className="h-11 text-base" asChild>
            <label>
              Foto achteraf
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhoto(e, 'after')} />
            </label>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Materiaal</span>
        {materials.map((m, i) => (
          <div key={`${m}-${i}`} className="flex items-center justify-between text-sm">
            <span>{m}</span>
            <span className="text-muted-foreground">1×</span>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            className="h-11 text-base"
            list="van-stock-list"
            placeholder="Bijv. smart key Mercedes"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
          <datalist id="van-stock-list">
            {vanStock.slice(0, 50).map((s) => (
              <option key={s.id} value={s.description} />
            ))}
          </datalist>
          <Button variant="outline" size="lg" className="h-11 shrink-0 text-base" onClick={addMaterial} disabled={busy}>
            Toevoegen
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Betaling {paymentDone && '· vastgelegd'}</span>
        <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paymentDone}>
          <SelectTrigger className="h-11 w-full text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contant">Contant — ik heb het geld</SelectItem>
            <SelectItem value="pin">Pin — ik heb het geld</SelectItem>
            <SelectItem value="tikkie">Tikkie — naar het bedrijf</SelectItem>
            <SelectItem value="ideal">iDEAL — naar het bedrijf</SelectItem>
            <SelectItem value="factuur">Op factuur — later</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="h-11 text-base"
          inputMode="decimal"
          placeholder="Ontvangen bedrag, leeg = niets ontvangen"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          disabled={paymentDone}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={`pr-${job.id}`}>
          Werkelijke prijs (€)
        </label>
        <Input id={`pr-${job.id}`} className="h-11 text-base" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={`nt-${job.id}`}>
          Notitie
        </label>
        <Textarea id={`nt-${job.id}`} className="text-base" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Handtekening klant {signed && '· opgeslagen'}</span>
        <canvas
          ref={canvasRef}
          className={cn('h-32 w-full touch-none rounded-lg border bg-white', signed && 'ring-2 ring-green-500')}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
        <Button variant="outline" size="sm" onClick={clearSignature} type="button" className="w-fit">
          Wissen
        </Button>
      </div>

      <Button size="lg" className="h-12 bg-green-600 text-base text-white hover:bg-green-600/90" onClick={finish} disabled={busy}>
        {busy ? 'Bezig…' : 'Afronden'}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
    </CardContent>
  );
}
