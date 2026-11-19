import type { ScanRequest, ScanResponse } from './bulkScan.worker';

/**
 * A small pool of decoder workers. Photos are handed out one at a time per
 * worker, so memory stays at a few decoded images regardless of batch size,
 * and the pool is torn down when the batch is done or cancelled.
 *
 * Nothing here may hang the page: every photo has a time limit, a worker that
 * crashes or is killed by the phone (low memory) is replaced, and the photo
 * comes back as an error instead of the batch waiting forever. Stopping
 * resolves at once.
 */
export interface PoolResult extends ScanResponse { file: File }

const PHOTO_TIMEOUT_MS = 30_000;

export function poolSize() {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
  // Phones throttle hard and have little memory: two workers is the sweet spot there.
  const mobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
  return Math.max(1, Math.min(mobile ? 2 : 4, cores - 1));
}

export async function scanPhotos(files: File[], options: {
  maxSide?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
  onResult: (result: PoolResult) => void;
}) {
  const { maxSide = 4096, signal, timeoutMs = PHOTO_TIMEOUT_MS, onResult } = options;
  const lanes = Math.min(poolSize(), files.length);
  let next = 0;

  async function lane() {
    const spawn = () => new Worker(new URL('./bulkScan.worker.ts', import.meta.url), { type: 'module' });
    let worker = spawn();
    try {
      while (!signal?.aborted && next < files.length) {
        const id = next++;
        const started = performance.now();
        const result = await new Promise<ScanResponse>((resolve) => {
          let done = false;
          const finish = (response: ScanResponse) => {
            if (done) return;
            done = true;
            window.clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            worker.onmessage = null;
            worker.onerror = null;
            resolve(response);
          };
          // A stuck or crashed worker cannot be trusted with the next photo: replace it.
          const fail = (error: string) => {
            worker.terminate();
            if (!signal?.aborted) worker = spawn();
            finish({ id, hash: '', codes: [], ms: performance.now() - started, error });
          };
          const timer = window.setTimeout(() => fail('Foto kon niet op tijd worden gelezen. Maak een scherpere of kleinere foto.'), timeoutMs);
          const onAbort = () => fail('Gestopt.');
          signal?.addEventListener('abort', onAbort, { once: true });
          worker.onmessage = (event: MessageEvent<ScanResponse>) => finish(event.data);
          worker.onerror = (event) => { event.preventDefault(); fail('De fotolezer is gestopt bij deze foto.'); };
          const request: ScanRequest = { id, file: files[id], maxSide };
          worker.postMessage(request);
        });
        if (signal?.aborted) break;
        onResult({ ...result, file: files[id] });
      }
    } finally {
      worker.terminate();
    }
  }

  await Promise.all(Array.from({ length: lanes }, lane));
}
