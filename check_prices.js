const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env.local');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('jobs').select('id, final_price, quoted_price').eq('status', 'afgerond').limit(10);
  console.log(data);
}
run();
