/**
 * Walks the agent's four endpoints, the way ElevenLabs will.
 *
 *   AGENT_API_TOKEN=… node scripts/test-agent.mjs https://your-preview.vercel.app
 *
 * Run this before configuring anything in the ElevenLabs console. Every failure
 * it can report is one you would otherwise meet for the first time in a live
 * call, where the only symptom is an agent going quiet.
 *
 * It books nothing by default — the last step is a dry run that stops short of
 * creating a job. Pass --book to go all the way through and leave a real job in
 * the agenda, which is worth doing once.
 */

const base = (process.argv[2] ?? process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const token = process.env.AGENT_API_TOKEN;
const reallyBook = process.argv.includes('--book');

if (!token) {
  console.error('Set AGENT_API_TOKEN first — the same value the deployment has.');
  process.exit(1);
}

const call = async (path, body) => {
  const started = Date.now();
  let response;
  try {
    response = await fetch(`${base}/api/agent/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    return { ms: Date.now() - started, status: 0, json: null, error: String(error) };
  }

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // An HTML body here is almost always Vercel's login page.
  }
  return { ms: Date.now() - started, status: response.status, json, raw: text.slice(0, 160) };
};

const ok = (label, pass, detail = '') =>
  console.log(`  ${pass ? '✓' : '✗'} ${label.padEnd(46)} ${detail}`);

console.log(`\nAgent-API op ${base}\n`);

/* ── 0. can we reach it at all ── */
const reachable = await call('car', { make: 'Toyota', model: 'Prius', year: 2010 });

if (reachable.status === 0) {
  console.log(`  ✗ Geen verbinding — ${reachable.error}`);
  process.exit(1);
}
if (!reachable.json) {
  console.log('  ✗ Geen JSON terug. Dit is bijna altijd Vercel Deployment Protection:');
  console.log('    de agent krijgt een inlogpagina in plaats van een antwoord.');
  console.log(`    Eerste 160 tekens: ${reachable.raw}`);
  process.exit(1);
}
if (reachable.status === 401) {
  console.log('  ✗ 401 — AGENT_API_TOKEN klopt niet met wat er op de deployment staat.');
  process.exit(1);
}
if (reachable.status === 503) {
  console.log('  ✗ 503 — AGENT_API_TOKEN staat niet op de deployment (of is korter dan 24 tekens).');
  process.exit(1);
}

/* ── 1. de auto ── */
console.log('1 · check_car');
ok('kent Toyota Prius 2010', reachable.json.known === true, `${reachable.ms}ms`);
ok('weet of hij keyless is', 'keyless' in reachable.json, `keyless: ${reachable.json.keyless}`);

const misheard = await call('car', { make: 'Pesjot', model: 'een Peugeot 208', year: 'twintig veertien' });
ok(
  'repareert "Pesjot" → Peugeot',
  misheard.json?.understood?.make === 'Peugeot',
  `${misheard.json?.understood?.make} ${misheard.json?.understood?.model} ${misheard.json?.understood?.year}`
);
ok(
  'bevestigt de correctie vóór hij iets weigert',
  /klopt dat\?$/.test(misheard.json?.say ?? ''),
  misheard.json?.say ?? ''
);

const unknown = await call('car', { make: 'Maserati', model: 'Ghibli', year: 2018 });
ok('weigert een auto die we niet kennen', unknown.json?.known === false, unknown.json?.say ?? '');

/* ── 2. de prijs ── */
console.log('\n2 · get_price');
const spare = await call('quote', { make: 'Toyota', model: 'Prius', year: 2010, working_key: true, postcode: '6511' });
ok('prijst bijmaken', spare.json?.quoted === true, spare.json?.say ?? spare.json?.reason ?? '');

const lost = await call('quote', { make: 'Toyota', model: 'Prius', year: 2010, working_key: false, postcode: '6511' });
ok('prijst alle sleutels kwijt', lost.json?.quoted === true, lost.json?.say ?? '');
ok(
  'kwijt is duurder dan bijmaken',
  Number(lost.json?.total) > Number(spare.json?.total),
  `€${spare.json?.total} → €${lost.json?.total}`
);

const wide = await call('quote', { make: 'Volkswagen', model: 'Golf', year: 2015, working_key: true, postcode: '6511' });
ok(
  'weigert waar de prijs te onzeker is',
  wide.json?.quoted === false,
  wide.json?.reason ?? 'gaf toch een bedrag — controleer MAX_SPREAD'
);

/* ── 3. de blokken ── */
console.log('\n3 · get_slots');
const slots = await call('slots', { make: 'Toyota', model: 'Prius', year: 2010, working_key: true, postcode: '6511' });
ok('antwoordt', Array.isArray(slots.json?.slots), `${slots.json?.slots?.length ?? 0} blok(ken)`);
if (!slots.json?.slots?.length) {
  console.log(`     → ${slots.json?.say ?? 'geen blokken'}`);
  console.log('       Dit is correct zolang er nog geen monteur dekking voor Toyota heeft opgegeven.');
}

const faraway = await call('slots', { make: 'Toyota', model: 'Prius', year: 2010, working_key: true, postcode: '9700' });
ok('geeft niets buiten het werkgebied', (faraway.json?.slots?.length ?? 0) === 0, faraway.json?.say ?? '');

/* ── 4. boeken ── */
console.log('\n4 · book_job');
const badPhone = await call('book', {
  make: 'Toyota', model: 'Prius', year: 2010, working_key: true,
  postcode: '6511', city: 'Nijmegen', customer_name: 'Test',
  customer_phone: '12345', date: '2026-12-01', slot_start: '10:00',
});
ok(
  'weigert een onleesbaar telefoonnummer',
  badPhone.json?.reason === 'telefoonnummer_onduidelijk',
  badPhone.json?.say ?? ''
);

if (reallyBook) {
  const slot = slots.json?.slots?.[0];
  if (!slot) {
    console.log('  – overgeslagen: er is geen blok om in te boeken');
  } else {
    const booked = await call('book', {
      make: 'Toyota', model: 'Prius', year: 2010, working_key: true,
      postcode: '6511', city: 'Nijmegen', street: 'Teststraat 1',
      customer_name: 'TEST — mag verwijderd worden', customer_phone: '0611751231',
      date: slot.date, slot_start: slot.start,
      notes: 'Aangemaakt door scripts/test-agent.mjs',
    });
    ok('boekt', booked.json?.booked === true, booked.json?.say ?? booked.json?.error ?? '');
    ok('biedt de klus aan monteurs aan', (booked.json?.offered ?? 0) > 0, `${booked.json?.offered} aanbod/aanbiedingen`);
    if (booked.json?.reference) console.log(`     klus: ${booked.json.reference} — verwijder deze uit de agenda`);
  }
} else {
  console.log('  – echt boeken overgeslagen. Draai met --book om een testklus aan te maken.');
}

console.log('\nKlaar. Alles met een ✓ doet ElevenLabs straks precies zo.\n');
