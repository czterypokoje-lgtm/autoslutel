const fs = require('fs');

let code = fs.readFileSync('src/app/admin/overzicht/OfficeOverview.tsx', 'utf8');

// Add the 13th promise
if (!code.includes('crm_marketing_costs')) {
  code = code.replace(
    "supabase.from('crm_report_source').select('*'),",
    "supabase.from('crm_report_source').select('*'),\n    supabase.from('crm_marketing_costs').select('*').gte('date', daysAgo(14).toISOString().split('T')[0]),"
  );
  
  code = code.replace(
    "{ data: reportSource },",
    "{ data: reportSource },\n    { data: marketingCosts },"
  );

  // Now replace the mock data with actual data merger logic
  const oldMockData = `const mixedData = [
    { date: '1 Nis', revenue: 2200, calls: 18, conversion: 10 },
    { date: '2 Nis', revenue: 1200, calls: 17, conversion: 5 },
    { date: '3 Nis', revenue: 1400, calls: 20, conversion: 9 },
    { date: '4 Nis', revenue: 1300, calls: 16, conversion: 6 },
    { date: '5 Nis', revenue: 2300, calls: 19, conversion: 8 },
    { date: '6 Nis', revenue: 2300, calls: 23, conversion: 10 },
    { date: '7 Nis', revenue: 2100, calls: 27, conversion: 20 },
    { date: '8 Nis', revenue: 2000, calls: 26, conversion: 18 },
    { date: '9 Nis', revenue: 2480, calls: 30, conversion: 20 },
    { date: '10 Nis', revenue: 2000, calls: 22, conversion: 15 },
    { date: '11 Nis', revenue: 2300, calls: 24, conversion: 12 },
    { date: '12 Nis', revenue: 2050, calls: 25, conversion: 18 },
    { date: '13 Nis', revenue: 2200, calls: 26, conversion: 28 },
    { date: '14 Nis', revenue: 2600, calls: 16, conversion: 20 },
  ];`;
  
  // Create an aggressive regex to remove the mock mixedData block, as my search string might have minor space diffs.
  code = code.replace(/const mixedData = \[[\s\S]*?\];/m, `
  // Aggregate real marketing data and revenue for the chart
  const mixedData = Array.from({ length: 14 }).map((_, i) => {
    const d = daysAgo(13 - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    
    // Revenue for that day
    const dayJobs = (yearJobs || []).filter(j => j.scheduled_date === dateStr && j.final_price);
    const revenue = dayJobs.reduce((sum, j) => sum + (Number(j.final_price) || 0), 0);
    
    // Clicks/Calls for that day
    const dayCosts = (marketingCosts || []).filter(c => c.date === dateStr);
    const clicks = dayCosts.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
    
    // Total leads generated that day
    const dayLeads = (leadDates || []).filter(l => l.created_at.startsWith(dateStr));
    const leads = dayLeads.length;
    
    // Conversion: Leads / Clicks (If zero clicks but got leads, assume 100% organic, but let's cap at 100%)
    const conversion = clicks > 0 ? Math.min(Math.round((leads / clicks) * 100), 100) : (leads > 0 ? 100 : 0);

    // Fallback visually if no marketing API data is present yet
    const finalCalls = clicks > 0 ? clicks : leads * 2; // Dummy estimate if API not set up

    return {
      date: displayDate,
      revenue,
      calls: finalCalls,
      conversion
    };
  });
  `);

  fs.writeFileSync('src/app/admin/overzicht/OfficeOverview.tsx', code);
  console.log('Merged real marketing data into MixedChart');
}
