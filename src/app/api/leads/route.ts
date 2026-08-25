import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // We use anon key for now, RLS is off
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
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
