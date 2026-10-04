/**
 * Point the Telegram bot at one of this app's deployments.
 *
 *   node --env-file=.env.local scripts/set-telegram-webhook.mjs            # production
 *   node --env-file=.env.local scripts/set-telegram-webhook.mjs <url>      # anywhere else
 *   node --env-file=.env.local scripts/set-telegram-webhook.mjs --info     # just look
 *
 * A script rather than a one-line curl because the obvious curl keeps going
 * wrong in ways that cost an evening: zsh expands the `!` in a shell
 * condition as history, `read -p` is a bash-ism that silently yields an empty
 * token, and a token pasted into a command line ends up in shell history. The
 * two values live in .env.local, which is gitignored, and nothing here has to
 * be substituted by hand.
 *
 * Worth knowing: a preview deployment with NEXT_PUBLIC_CRM_READONLY=1 answers
 * 423 to every POST, Telegram's included — the bot will look dead while being
 * perfectly healthy. The default below is production for that reason.
 */

const PRODUCTION = 'https://www.autosleutel24.nl/api/telegram/webhook';

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !secret) {
  console.error(
    'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET.\n' +
      'Add both to .env.local (it is gitignored) and run again with --env-file=.env.local'
  );
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  }).then((response) => response.json());

const arg = process.argv[2];

if (arg === '--info') {
  const info = await api('getWebhookInfo');
  const r = info.result ?? {};
  console.log('url                  :', r.url || '(none set)');
  console.log('pending updates      :', r.pending_update_count ?? 0);
  console.log('allowed updates      :', r.allowed_updates ? r.allowed_updates.join(', ') : '(all)');
  if (r.last_error_message) {
    console.log('last error           :', r.last_error_message);
    console.log('  at                 :', new Date((r.last_error_date ?? 0) * 1000).toISOString());
  } else {
    console.log('last error           : none');
  }
  process.exit(0);
}

const url = arg && arg.startsWith('http') ? arg : PRODUCTION;

const result = await api('setWebhook', {
  url,
  secret_token: secret,
  /* Both, and only both: `message` carries photos, commands and the bare
     numbers that answer a question; `callback_query` carries every button. */
  allowed_updates: ['message', 'callback_query'],
});

if (!result.ok) {
  console.error('Failed:', result.description ?? JSON.stringify(result));
  process.exit(1);
}

console.log(`Webhook set to ${url}`);

/* Read it straight back: setWebhook returning ok only means Telegram accepted
   the address, not that anything answers there. */
const info = await api('getWebhookInfo');
const r = info.result ?? {};
console.log('confirmed            :', r.url);
console.log('pending updates      :', r.pending_update_count ?? 0);
if (r.last_error_message) console.log('last error           :', r.last_error_message);
