import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET a specific price chart item
export async function GET(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('price_chart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('id', params.itemId)
      .eq('price_chart_id', params.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Price chart item not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching price chart item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT (update) a price chart item
export async function PUT(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.price_per_unit || !body.effective_date) {
      return NextResponse.json(
        { error: 'Price and effective date are required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('price_chart_items')
      .update({
        price_per_unit: body.price_per_unit,
        currency: body.currency || 'INR',
        effective_date: body.effective_date,
        expiry_date: body.expiry_date || null,
      })
      .eq('id', params.itemId)
      .eq('price_chart_id', params.id)
      .select(`
        *,
        product:products(*)
      `);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Price chart item not found' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error updating price chart item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a price chart item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('price_chart_items')
      .delete()
      .eq('id', params.itemId)
      .eq('price_chart_id', params.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price chart item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 