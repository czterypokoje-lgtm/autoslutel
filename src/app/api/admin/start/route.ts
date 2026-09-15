import { NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseWerkgebied } from '@/lib/crmJobs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await requireCrmUser();
  if (user.role !== 'monteur') {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  
  // Verify this user has a technician record
  const { data: me, error: meError } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (meError || !me) {
    return NextResponse.json({ error: 'Monteur account niet gevonden' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  // 1. Update technician info (phone, werkgebied)
  const { error: techError } = await supabase
    .from('technicians')
    .update({
      phone: body.phone ?? null,
      werkgebied: parseWerkgebied(body.werkgebied),
    })
    .eq('id', me.id);

  if (techError) {
    console.error('Failed to update technician info:', techError.message);
    return NextResponse.json({ error: 'Opslaan contactgegevens mislukt' }, { status: 500 });
  }

  // 2. Insert tools
  if (Array.isArray(body.tools) && body.tools.length > 0) {
    const toolsData = body.tools.map((t: any) => ({
      technician_id: me.id,
      brand: t.brand,
      model: t.model || null,
    }));
    
    await supabase.from('technician_tools').insert(toolsData);
  }

  // 3. Insert coverage
  if (Array.isArray(body.coverage) && body.coverage.length > 0) {
    const coverageRows: any[] = [];
    for (const c of body.coverage) {
      if (Array.isArray(c.scenarios)) {
        for (const scenario of c.scenarios) {
          coverageRows.push({
            technician_id: me.id,
            make: c.make,
            scenario: scenario,
          });
        }
      }
    }
    
    if (coverageRows.length > 0) {
      await supabase.from('technician_coverage').insert(coverageRows);
    }
  }

  // 4. Update or insert subscription tier
  const tier = body.tier === 'premium' ? 'premium' : body.tier === 'pro' ? 'pro' : 'starter';
  const fee = tier === 'premium' ? 1200 : tier === 'pro' ? 399 : 0;
  const pct = tier === 'premium' ? 8 : tier === 'pro' ? 18 : 25;
  const priority = tier === 'premium' ? 180 : tier === 'pro' ? 90 : 0;

  const { error: subError } = await supabase
    .from('technician_subscription')
    .upsert({
      technician_id: me.id,
      tier,
      monthly_fee: fee,
      commission_pct: pct,
      priority_seconds: priority,
    }, { onConflict: 'technician_id' });

  if (subError) {
    console.error('Failed to upsert subscription:', subError.message);
    // Don't fail the whole request just for subscription, as coverage is the blocker
  }

  return NextResponse.json({ success: true });
}
