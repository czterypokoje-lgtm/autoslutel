/**
 * Invites a CRM user and sets their role, or changes the role of an existing
 * one.
 *
 *   node scripts/crm-user.mjs <e-mail> <owner|kantoor|monteur>
 *   node scripts/crm-user.mjs <e-mail> <rol> --invite
 *   node scripts/crm-user.mjs --list
 *
 * By default a new account is created without sending any mail — the owner
 * sets the password in the Supabase dashboard (Authentication -> Users). Add
 * `--invite` to send an invitation mail instead, for someone who will sign in
 * with a magic link rather than a password.
 *
 * The role lives in `app_metadata.role`, which is only writable with the
 * service-role key — deliberately, because `user_metadata` is writable by the
 * user themselves and a role a user can edit is not a role. The RLS policies in
 * supabase/migrations/0003_crm_roles.sql read it straight off the JWT, so this
 * script is the only way in and out of the CRM's permission model.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment. Run it against production with care: it creates real accounts
 * and sends real invitation mail.
 */

import { createClient } from '@supabase/supabase-js';

const ROLES = ['owner', 'kantoor', 'monteur'];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Pull them from Vercel first:  vercel env pull .env.local'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const invite = args.includes('--invite');
const [arg1, arg2] = args.filter((a) => !a.startsWith('--'));
const listMode = args.includes('--list');

async function list() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) {
    console.error('Could not list users:', error.message);
    process.exit(1);
  }

  const users = data.users
    .map((u) => ({
      email: u.email ?? '(no email)',
      role: u.app_metadata?.role ?? '—',
      last: u.last_sign_in_at ? u.last_sign_in_at.slice(0, 10) : 'nooit',
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

  if (users.length === 0) {
    console.log('No users yet.');
    return;
  }

  const width = Math.max(...users.map((u) => u.email.length));
  console.log(`${'E-MAIL'.padEnd(width)}  ROL       LAATSTE LOGIN`);
  for (const u of users) {
    console.log(`${u.email.padEnd(width)}  ${u.role.padEnd(8)}  ${u.last}`);
  }
}

async function setRole(email, role, invite) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) {
    console.error('Could not list users:', error.message);
    process.exit(1);
  }

  const existing = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      { app_metadata: { role } }
    );
    if (updateError) {
      console.error('Could not set the role:', updateError.message);
      process.exit(1);
    }
    console.log(`${email} is now ${role}.`);
    console.log(
      'They must sign out and back in: the role travels in the JWT, and the ' +
        'one in their browser still carries the old value.'
    );
    return;
  }

  if (invite) {
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      { data: {}, redirectTo: 'https://www.autosleutel24.nl/admin/auth/callback' }
    );
    if (inviteError) {
      console.error('Could not invite:', inviteError.message);
      process.exit(1);
    }

    // The invite creates the user; fetch it again to attach the role.
    const { data: after } = await supabase.auth.admin.listUsers({ perPage: 200 });
    const created = after?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!created) {
      console.error(
        `Invited ${email}, but could not find the new user to set the role. ` +
          `Run this again once the invitation has been accepted.`
      );
      process.exit(1);
    }

    const { error: roleError } = await supabase.auth.admin.updateUserById(
      created.id,
      { app_metadata: { role } }
    );
    if (roleError) {
      console.error('Invited, but could not set the role:', roleError.message);
      process.exit(1);
    }

    console.log(`Invited ${email} as ${role}. The invitation mail is on its way.`);
    return;
  }

  /*
   * No mail. The account is created confirmed but without a password, so the
   * only way in is a password set from the Supabase dashboard, or a magic link
   * requested from the login form. Nothing lands in an inbox unasked.
   */
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role },
  });

  if (createError) {
    console.error('Could not create the account:', createError.message);
    process.exit(1);
  }

  console.log(`Created ${email} as ${role}. No mail was sent.`);
  console.log(
    'Set a password in the Supabase dashboard:\n' +
      '  Authentication -> Users -> ' + email + ' -> Reset password / Update user'
  );
}

if (listMode) {
  await list();
} else if (arg1 && ROLES.includes(arg2)) {
  await setRole(arg1, arg2, invite);
} else {
  console.error(
    'Usage:\n' +
      '  node scripts/crm-user.mjs <e-mail> <owner|kantoor|monteur> [--invite]\n' +
      '  node scripts/crm-user.mjs --list'
  );
  process.exit(1);
}
