/** The owner's margin on a technician's bid. */
export const MARGIN = 0.25;

/** Btw on top of the customer price. */
export const VAT_RATE = 0.21;

/** Excluding btw, in whole euros, rounded up so the margin is never below 25%. */
export const customerPrice = (bid: number) => Math.ceil(Math.round(bid * (1 + MARGIN) * 100) / 100);

/** What the customer pays. */
export const customerPriceInclVat = (bid: number) => Math.round(customerPrice(bid) * (1 + VAT_RATE) * 100) / 100;

export interface BidRow {
  id: string;
  job_id: string;
  bid_price: number | string;
  bid_date: string | null;
  bid_start: string | null;
  bid_end: string | null;
  technicians?: { name: string } | { name: string }[] | null;
}

export interface BidJob {
  id: string;
  status: string;
  city: string | null;
  car_make: string | null;
  car_model: string | null;
  car_year: number | string | null;
  service_type: string | null;
}

const firstName = (t: BidRow['technicians']) => (Array.isArray(t) ? t[0]?.name : t?.name) ?? null;

/** Open bids with the price to offer. No customer details: this goes to chat. */
export function summarizeBids(bids: BidRow[], jobs: BidJob[]) {
  const byId = new Map(jobs.map((j) => [j.id, j]));
  return bids.flatMap((bid) => {
    const job = byId.get(bid.job_id);
    if (!job || job.status === 'afgerond' || job.status === 'geannuleerd') return [];
    const amount = Number(bid.bid_price);
    return [
      {
        offerId: bid.id,
        jobId: job.id,
        car: [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ') || null,
        city: job.city,
        service: job.service_type,
        technician: firstName(bid.technicians),
        bid: amount,
        customerPrice: customerPrice(amount),
        customerPriceInclVat: customerPriceInclVat(amount),
        when: [bid.bid_date, bid.bid_start, bid.bid_end].filter(Boolean).join(' ') || null,
      },
    ];
  });
}
