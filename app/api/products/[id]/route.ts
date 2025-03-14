import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET a specific product by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT (update) a product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.unit) {
      return NextResponse.json(
        { error: 'Name and unit are required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        name: body.name,
        category: body.category || null,
        description: body.description || null,
        unit: body.unit,
      })
      .eq('id', params.id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product is used in any price chart
    const { data: priceChartItems, error: checkError } = await supabaseAdmin
      .from('price_chart_items')
      .select('id')
      .eq('product_id', params.id);
    
    if (checkError) {
      console.error('Supabase error:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (priceChartItems && priceChartItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product as it is used in one or more price charts' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 