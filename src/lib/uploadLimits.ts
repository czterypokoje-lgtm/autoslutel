/**
 * How large an uploaded photo may be, in one place for the browser and the
 * route that receives it.
 *
 * WHY IT IS FOUR AND NOT EIGHT
 *
 * A Vercel Serverless Function refuses a request body over 4.5 MB, and it
 * refuses it in the platform, before any of our code runs. There is no handler
 * to return a sentence a customer can read: what comes back is Vercel's own
 * error page, which is not JSON, so `response.json()` on the other end throws
 * and the form reports a network error for a photo that simply was not small
 * enough.
 *
 * /api/upload used to declare 8 MB, which is above that ceiling. Every file
 * between 4.5 and 8 MB — a normal photo from a phone whose browser could not
 * re-encode it — therefore died in the gap: the friendly "te groot" message
 * existed in the code and could never be reached by the files it was written
 * for.
 *
 * So our limit sits BELOW the platform's. Everything we reject, we reject
 * ourselves, with a sentence in Dutch and a status the form can read.
 *
 * KEEP THIS UNDER 4.5 MB. Raising it past that does not raise the limit; it
 * only moves the failure back out of reach of the error message.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** As it is written to a customer, so the two sides cannot drift apart. */
export const MAX_UPLOAD_LABEL = '4 MB';

/** The one sentence a customer sees when their photo is too large. */
export const TOO_LARGE_MESSAGE = `Foto is te groot. Maximaal ${MAX_UPLOAD_LABEL} — probeer een kleinere foto.`;
