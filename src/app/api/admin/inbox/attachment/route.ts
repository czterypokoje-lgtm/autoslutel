import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';

export const dynamic = 'force-dynamic';

/**
 * One attachment out of a received e-mail, resolved when somebody clicks it.
 *
 * The inbound webhook stores only what the file is, not the file — Resend
 * gives out a short-lived signed URL per attachment, so this route trades the
 * ids for a fresh one and redirects. A photo nobody opens costs nothing, and
 * the link in the thread never goes stale.
 *
 * Office only. The ids in the query string are not a credential: anyone
 * holding them could otherwise read a customer's attachment, which is exactly
 * what the session check is for.
 */

/* Resend ids are uuids; anything else is not worth a round trip. */
const ID = /^[0-9a-f-]{10,40}$/i;

export async function GET(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const url = new URL(request.url);
  const emailId = url.searchParams.get('email') ?? '';
  const fileId = url.searchParams.get('file') ?? '';

  if (!ID.test(emailId) || !ID.test(fileId)) {
    return NextResponse.json({ error: 'Ongeldige bijlage' }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'RESEND_API_KEY ontbreekt' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}/attachments/${fileId}`,
      {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!res.ok) {
      console.error('[inbox/attachment] ophalen mislukt:', res.status, await res.text());
      /*
       * Most often this is retention: Resend has expired the received e-mail
       * and the file is genuinely gone. Say so, rather than showing a broken
       * download.
       */
      return NextResponse.json(
        { error: 'Deze bijlage is niet meer beschikbaar.' },
        { status: 404 },
      );
    }

    const { download_url: downloadUrl } = (await res.json()) as { download_url?: string };
    if (!downloadUrl) {
      return NextResponse.json({ error: 'Geen downloadlink ontvangen' }, { status: 502 });
    }

    /* 302, not 301: the signed URL expires, so nothing may cache this. */
    return NextResponse.redirect(downloadUrl, {
      status: 302,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[inbox/attachment] faalde:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Bijlage ophalen mislukt' }, { status: 502 });
  }
}
