const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env.local');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: jobInfo, error: err1 } = await supabase.from('jobs').select('*').limit(1);
  if (jobInfo && jobInfo.length > 0) console.log('Jobs columns:', Object.keys(jobInfo[0]));
  
  const { data: leadInfo, error: err2 } = await supabase.from('leads').select('*').limit(1);
  if (leadInfo && leadInfo.length > 0) console.log('Leads columns:', Object.keys(leadInfo[0]));
}
run();
