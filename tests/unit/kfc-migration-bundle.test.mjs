// The KeyForCars migration bundle builder (scripts/build-kfc-migration-bundle.mjs).
// Pure: builds in memory from fake file names and SQL.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBundle, selectMigrations, transactionProblem } from '../../scripts/build-kfc-migration-bundle.mjs';

test('0104z first, then 0106 onwards in order; 0105 and older left out', () => {
  const { files, missing, duplicates } = selectMigrations([
    '0107_b.sql', '0105_inbox.sql', '0104z_park_old_inbox.sql', '0104_x.sql', '0106_a.sql', '0133_install_marker.sql', 'README.md',
  ]);
  assert.deepEqual(files, ['0104z_park_old_inbox.sql', '0106_a.sql', '0107_b.sql', '0133_install_marker.sql']);
  assert.ok(missing.includes(129) && missing.includes(134) && !missing.includes(133));
  assert.deepEqual(duplicates, []);
});

test('two branches claiming one number stop the build', () => {
  const { duplicates } = selectMigrations(['0130_a.sql', '0130_b.sql']);
  assert.deepEqual(duplicates, [130]);
  assert.throws(() => buildBundle([], { duplicates }), /share a number: 0130/);
});

test('one transaction: begin first, commit last, statements that break it refused', () => {
  const sql = buildBundle([{ name: '0106_a.sql', sql: 'create table t (id int);\n' }], { missing: [129] });
  assert.match(sql, /^begin;$/m);
  assert.ok(sql.trimEnd().endsWith('commit;'));
  assert.match(sql, /0129 {2}kassa \/ POS {2}— NOT IN THIS BUNDLE/);
  assert.equal(transactionProblem('create function f() returns void language plpgsql as $$ begin null; end; $$;'), null);
  assert.equal(transactionProblem('-- commit; is only a comment\n/* begin; */ select 1;'), null);
  assert.ok(transactionProblem('commit;'));
  assert.ok(transactionProblem('create index concurrently i on t (id);'));
  assert.throws(() => buildBundle([{ name: '0140_x.sql', sql: 'begin;\nselect 1;\ncommit;' }]), /0140_x\.sql cannot run/);
});
