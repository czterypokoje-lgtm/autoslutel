// Shared setup for the ERP scenario tests (docs/P0-kesif.md §4).
// They write real rows, so they refuse to run against anything but the local test project.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const TEST_PROJECT = 'ysrebelulbmnbzyvnsic'; // autosleutel-test
if (!url.includes(TEST_PROJECT) || !key) {
  throw new Error(`ERP tests only run against the test project ${TEST_PROJECT}; check .env.local.`);
}

export const db = createClient(url, key, { auth: { persistSession: false } });

/** A per-run marker so each test can find and delete exactly its own rows. */
export const uniq = (name) => `test-${name}-${Date.now().toString(36)}`;
