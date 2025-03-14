import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET all items for a specific price chart
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('price_chart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('price_chart_id', params.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching price chart items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new price chart item
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.product_id || !body.price_per_unit || !body.effective_date) {
      return NextResponse.json(
        { error: 'Product, price, and effective date are required fields' },
        { status: 400 }
      );
    }

    // Check if product already exists in this price chart
    const { data: existingItems, error: checkError } = await supabaseAdmin
      .from('price_chart_items')
      .select('id')
      .eq('price_chart_id', params.id)
      .eq('product_id', body.product_id);
    
    if (checkError) {
      console.error('Supabase error:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (existingItems && existingItems.length > 0) {
      return NextResponse.json(
        { error: 'This product is already in the price chart' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('price_chart_items')
      .insert([{
        price_chart_id: params.id,
        product_id: body.product_id,
        price_per_unit: body.price_per_unit,
        currency: body.currency || 'INR',
        effective_date: body.effective_date,
        expiry_date: body.expiry_date || null,
      }])
      .select(`
        *,
        product:products(*)
      `);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error creating price chart item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 