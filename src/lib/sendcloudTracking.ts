import { Buffer } from 'node:buffer';

type CarrierEvent = { parent_status?: string; carrier_update_timestamp?: string };
type SendcloudTracking = {
  expected_delivery_date?: string;
  carrier_tracking_url?: string;
  sendcloud_tracking_url?: string;
  statuses?: CarrierEvent[];
};

export async function readSendcloudTracking(trackingCode: string, publicKey?: string, secretKey?: string) {
  if (!publicKey || !secretKey) return { state: 'unconfigured' } as const;

  try {
    const response = await fetch('https://panel.sendcloud.sc/api/v2/tracking/' + encodeURIComponent(trackingCode), {
      headers: { Authorization: 'Basic ' + Buffer.from(publicKey + ':' + secretKey).toString('base64') },
      redirect: 'error', signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (response.status === 404) return { state: 'missing' } as const;
    if (!response.ok) return { state: 'unavailable' } as const;

    const data: SendcloudTracking = await response.json();
    if (!Array.isArray(data?.statuses)) return { state: 'unavailable' } as const;
    const events = data.statuses.flatMap((event) => {
      const timestamp = event?.carrier_update_timestamp;
      const time = typeof timestamp === 'string' ? Date.parse(timestamp) : NaN;
      return event?.parent_status && Number.isFinite(time)
        ? [{ status: event.parent_status, timestamp: new Date(time).toISOString() }] : [];
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const candidateUrl = data.sendcloud_tracking_url || data.carrier_tracking_url;
    return {
      state: 'available',
      event: events[0] ?? null,
      expectedDate: /^\d{4}-\d{2}-\d{2}$/.test(data.expected_delivery_date ?? '') ? data.expected_delivery_date : null,
      link: typeof candidateUrl === 'string' && candidateUrl.startsWith('https://') ? candidateUrl : null,
    } as const;
  } catch {
    return { state: 'unavailable' } as const;
  }
}
