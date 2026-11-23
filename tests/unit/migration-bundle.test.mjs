// The Autosleutel24 migration bundle builder (scripts/build-as24-migration-bundle.mjs).
// Pure: builds in memory from fake file names and SQL. The committed bundle
// itself is rehearsed on PGlite in tests/pglite/as24-bundle.test.mjs.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIRST, LAST, buildBundle, selectMigrations, transactionProblem } from '../../scripts/build-as24-migration-bundle.mjs';

const pad = (number) => String(number).padStart(4, '0');
const range = () => Array.from({ length: LAST - FIRST + 1 }, (_, i) => `${pad(FIRST + i)}_m.sql`);

test('exactly one file per number in the range, in order; others left out', () => {
  const names = [...range().reverse(), `${pad(FIRST - 1)}_old.sql`, `${pad(LAST + 1)}_new.sql`, 'README.md'];
  assert.deepEqual(selectMigrations(names), range());
});

test('a missing or doubled number stops the build', () => {
  assert.throws(() => selectMigrations(range().slice(1)), new RegExp(`Migration ${pad(FIRST)}: expected one file, found 0`));
  assert.throws(() => selectMigrations([...range(), `${pad(FIRST)}_twin.sql`]), /expected one file, found 2/);
});

test('one transaction: begin first, commit last, statements that break it refused', () => {
  const sql = buildBundle([{ name: `${pad(FIRST)}_a.sql`, sql: 'create table t (id int);\n' }]);
  assert.match(sql, /^begin;$/m);
  assert.ok(sql.trimEnd().endsWith('commit;'));
  assert.equal(transactionProblem('create function f() returns void language plpgsql as $$ begin null; end; $$;'), null);
  assert.equal(transactionProblem('-- commit; is only a comment\n/* begin; */ select 1;'), null);
  assert.ok(transactionProblem('commit;'));
  assert.ok(transactionProblem('create index concurrently i on t (id);'));
  assert.throws(() => buildBundle([{ name: '0140_x.sql', sql: 'begin;\nselect 1;\ncommit;' }]), /0140_x\.sql cannot run/);
});
