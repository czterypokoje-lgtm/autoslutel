import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1];

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (err1) console.error("Users Error:", err1);
  
  const serkanUser = users?.users?.find(u => u.email === 'berkanacarll1@gmail.com');
  console.log("User:", serkanUser?.id);

  if (serkanUser) {
    const { data: tech } = await supabase.from('technicians').select('*').eq('user_id', serkanUser.id).single();
    console.log("Tech:", tech?.id, tech?.name);

    if (tech) {
      const { data: jobs } = await supabase.from('jobs').select('*').eq('technician_id', tech.id);
      console.log("Jobs assigned:", jobs?.length);
      if (jobs?.length) console.log(jobs[0]);
      
      const { data: offers } = await supabase.from('job_offers').select('*').eq('technician_id', tech.id);
      console.log("Offers:", offers?.length);
      if (offers?.length) console.log(offers[0]);
    }
  } else {
    // If not found by email, list all technicians
    const { data: allTechs } = await supabase.from('technicians').select('*');
    console.log("All techs:", allTechs);
  }
}
run();
