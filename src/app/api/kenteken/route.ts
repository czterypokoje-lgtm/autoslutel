import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ success: false, error: 'Kenteken is verplicht' }, { status: 400 });
    }

    // Clean kenteken: remove dashes, spaces, make uppercase
    const kenteken = query.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (kenteken.length < 4 || kenteken.length > 8) {
      return NextResponse.json({ success: false, error: 'Ongeldig kenteken' }, { status: 400 });
    }

    // Fetch from RDW Open Data
    const rdwUrl = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${kenteken}`;
    const response = await fetch(rdwUrl);

    if (!response.ok) {
      throw new Error(`RDW API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'Geen voertuig gevonden voor dit kenteken' }, { status: 404 });
    }

    const vehicle = data[0];

    // Extract Year from YYYYMMDD string
    let bouwjaar = '';
    const datumToelating = vehicle.datum_eerste_toelating || vehicle.datum_eerste_afgifte_nederland;
    if (datumToelating && datumToelating.length >= 4) {
      bouwjaar = String(datumToelating).substring(0, 4);
    }

    // Clean up make/model strings (RDW often has extra spaces or weird capitalization)
    const merk = vehicle.merk ? vehicle.merk.trim() : '';
    const handelsbenaming = vehicle.handelsbenaming ? vehicle.handelsbenaming.trim() : '';

    return NextResponse.json({
      success: true,
      data: {
        kenteken,
        merk,
        model: handelsbenaming,
        bouwjaar,
        voertuigsoort: vehicle.voertuigsoort || '',
        inrichting: vehicle.inrichting || '',
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/kenteken:', error);
    return NextResponse.json({ success: false, error: 'Interne serverfout bij ophalen RDW data' }, { status: 500 });
  }
}
