const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env.local');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('jobs').select('status, leads(gclid, wbraid, gbraid)').eq('status', 'afgerond');
  let hasGclid = 0;
  let hasWbraid = 0;
  let hasGbraid = 0;
  let totalWithLeads = 0;
  
  if (data) {
    data.forEach(r => { 
      if (r.leads) {
        totalWithLeads++;
        if (r.leads.gclid) hasGclid++;
        if (r.leads.wbraid) hasWbraid++;
        if (r.leads.gbraid) hasGbraid++;
      }
    });
    console.log(`Total completed: ${data.length}, with lead: ${totalWithLeads}, gclid: ${hasGclid}, wbraid: ${hasWbraid}, gbraid: ${hasGbraid}`);
  }
}
run();
