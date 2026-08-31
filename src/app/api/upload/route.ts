import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';

/**
 * Customer photo upload for the lead form.
 *
 * Uploaded blobs are public and are re-served from our own domain through the
 * /f/:filename* rewrite, so an unrestricted endpoint here would let anyone host
 * arbitrary content on autosleutel24.nl. Every upload is therefore constrained by:
 *   - an image-only content-type allowlist
 *   - a hard size cap enforced from Content-Length and while streaming
 *   - a server-generated filename (the client name is never trusted)
 *   - a per-IP rate limit
 */

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const RATE_LIMIT = 10; // uploads
const RATE_WINDOW = 3600; // per hour, per IP

export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request);
  const limit = await rateLimit(`upload:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!limit.ok) {
    return tooManyRequests(RATE_WINDOW) as NextResponse;
  }

  // Content type decides the extension. The client-supplied filename is only
  // used to detect an obviously wrong upload, never to name the stored blob.
  const contentType = (request.headers.get('content-type') || '')
    .split(';')[0]!
    .trim()
    .toLowerCase();

  const extension = ALLOWED[contentType];
  if (!extension) {
    return NextResponse.json(
      { error: 'Alleen afbeeldingen zijn toegestaan (JPG, PNG, WEBP, HEIC).' },
      { status: 415 }
    );
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Bestand is te groot. Maximaal 8 MB.' },
      { status: 413 }
    );
  }

  if (!request.body) {
    return NextResponse.json({ error: 'Geen bestand ontvangen.' }, { status: 400 });
  }

  try {
    // Content-Length can be absent or wrong, so also enforce the cap on the
    // stream itself. This aborts the upload rather than trusting the header.
    let seen = 0;
    const capped = request.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          seen += chunk.byteLength;
          if (seen > MAX_BYTES) {
            controller.error(new Error('FILE_TOO_LARGE'));
            return;
          }
          controller.enqueue(chunk);
        },
      })
    );

    const blob = await put(`leads/photo.${extension}`, capped, {
      access: 'public',
      contentType,
      addRandomSuffix: true, // unguessable path; no collisions on a fixed name
      token: process.env.bbauto_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob);
  } catch (error) {
    if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
      return NextResponse.json(
        { error: 'Bestand is te groot. Maximaal 8 MB.' },
        { status: 413 }
      );
    }
    console.error('Error uploading file to Vercel Blob:', error);
    return NextResponse.json({ error: 'Uploaden mislukt.' }, { status: 500 });
  }
}
