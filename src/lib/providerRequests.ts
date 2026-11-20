import 'server-only';

/** Demo execution cannot consume provider credits or send real messages. */
export function providerRequestsEnabled() {
  return process.env.KFC_DEMO_MODE !== '1';
}
