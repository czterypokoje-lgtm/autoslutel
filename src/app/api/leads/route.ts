import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.storage_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    const { brand, model, year, service, location, photoUrl } = body;

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          brand,
          model,
          year,
          service,
          location,
          photo_url: photoUrl,
        },
      ]);

    if (error) {
      console.error('Error inserting lead into Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/leads route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
