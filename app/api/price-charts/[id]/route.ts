import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET a specific price chart by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the price chart
    const { data: priceChart, error: chartError } = await supabaseAdmin
      .from('price_charts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (chartError) {
      console.error('Supabase error:', chartError);
      return NextResponse.json({ error: chartError.message }, { status: 500 });
    }

    if (!priceChart) {
      return NextResponse.json({ error: 'Price chart not found' }, { status: 404 });
    }

    // Get the price chart items with product details
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('price_chart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('price_chart_id', params.id);

    if (itemsError) {
      console.error('Supabase error:', itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Return both the price chart and its items
    return NextResponse.json({
      ...priceChart,
      items: items || []
    });
  } catch (error) {
    console.error('Error fetching price chart:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT (update) a price chart
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is a required field' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('price_charts')
      .update({
        name: body.name,
        description: body.description || null,
      })
      .eq('id', params.id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Price chart not found' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error updating price chart:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a price chart
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if there are any price chart items
    const { data: items, error: checkItemsError } = await supabaseAdmin
      .from('price_chart_items')
      .select('id')
      .eq('price_chart_id', params.id);
    
    if (checkItemsError) {
      console.error('Supabase error:', checkItemsError);
      return NextResponse.json({ error: checkItemsError.message }, { status: 500 });
    }
    
    if (items && items.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete price chart as it has products associated with it' },
        { status: 400 }
      );
    }

    // Check if any dealers are using this price chart
    const { data: dealers, error: checkDealersError } = await supabaseAdmin
      .from('dealers')
      .select('id')
      .eq('price_chart_id', params.id);
    
    if (checkDealersError) {
      console.error('Supabase error:', checkDealersError);
      return NextResponse.json({ error: checkDealersError.message }, { status: 500 });
    }
    
    if (dealers && dealers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete price chart as it is assigned to one or more dealers' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('price_charts')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price chart:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 