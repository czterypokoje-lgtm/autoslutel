const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
process.loadEnvFile('.env.local');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*, leads(gclid, email, phone, name)')
    .eq('status', 'afgerond');

  if (error) {
    console.error(error);
    return;
  }

  // Google Ads format + Extra helpful columns for the user
  let csv = 'Parameters:TimeZone=Europe/Amsterdam\n';
  csv += 'Google Click ID,Email,Phone Number,Conversion Name,Conversion Time,Conversion Value,Conversion Currency,City,Postcode,Kenteken,Car Make,Car Model\n';

  let exported = 0;

  for (const job of jobs) {
    const lead = job.leads || {};
    
    const clickId = lead.gclid || '';
    const email = (lead.email || '').trim();
    let phone = (lead.phone || job.customer_phone || '').trim();
    
    // Clean up phone number for Google Ads (they usually prefer E.164, e.g., +31...)
    if (phone.startsWith('0')) {
      phone = '+31' + phone.substring(1).replace(/\s/g, '');
    }
    
    const completed = new Date(job.completed_at || job.updated_at);
    const pad = (n) => n.toString().padStart(2, '0');
    // Format: MM/dd/yyyy HH:mm:ss
    const timeString = `${pad(completed.getMonth() + 1)}/${pad(completed.getDate())}/${completed.getFullYear()} ${pad(completed.getHours())}:${pad(completed.getMinutes())}:${pad(completed.getSeconds())}`;
    
    // Ensure price is a valid number. Fallback: final_price -> quoted_price -> 0
    let value = job.final_price;
    if (value === null || value === undefined) {
      value = job.quoted_price;
    }
    if (value === null || value === undefined) {
      value = 0;
    }
    
    // Extra columns for human readability
    const city = job.city || '';
    const postcode = job.postcode || '';
    const kenteken = job.kenteken || '';
    const carMake = job.car_make || '';
    const carModel = job.car_model || '';
    
    csv += `"${clickId}","${email}","${phone}","Offline Conversion","${timeString}","${value}","EUR","${city}","${postcode}","${kenteken}","${carMake}","${carModel}"\n`;
    exported++;
  }

  const outputPath = '/Users/ik/Desktop/Google_Ads_Completed_Jobs.csv';
  fs.writeFileSync(outputPath, csv);
  console.log(`Exported ${exported} jobs to ${outputPath}`);
}
run();
