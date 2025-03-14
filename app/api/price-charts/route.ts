import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET all price charts
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('price_charts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching price charts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new price chart
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is a required field' },
        { status: 400 }
      );
    }

    // Generate a price chart code
    const { data: codeData, error: codeError } = await supabaseAdmin
      .rpc('generate_price_chart_code');
    
    if (codeError) {
      console.error('Supabase error generating code:', codeError);
      return NextResponse.json({ error: codeError.message }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('price_charts')
      .insert([{
        name: body.name,
        description: body.description || null,
        price_chart_code: codeData,
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error creating price chart:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 