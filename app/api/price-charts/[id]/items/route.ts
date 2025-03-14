import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { NextRequest } from 'next/server';

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string;
}

interface PriceChartItem {
  id: string;
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
  product: Product;
}

interface TransformedItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
}

// GET all items for a specific price chart
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching price chart items for chart ID:', params.id);

    // Get price chart items with product details
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('price_chart_items')
      .select(`
        id,
        price_per_unit,
        currency,
        effective_date,
        expiry_date,
        product:products (
          id,
          name,
          category,
          unit,
          description
        )
      `)
      .eq('price_chart_id', params.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Supabase error fetching price chart items:', itemsError);
      return NextResponse.json(
        { error: `Failed to fetch price chart items: ${itemsError.message}` },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      console.log('No items found for price chart:', params.id);
      return NextResponse.json([]);
    }

    // Transform the data to match our Product interface
    const transformedItems = (items as unknown as PriceChartItem[]).map(item => ({
      id: item.product.id,
      name: item.product.name,
      category: item.product.category,
      unit: item.product.unit,
      price_per_unit: item.price_per_unit,
      currency: item.currency,
      effective_date: item.effective_date,
      expiry_date: item.expiry_date
    }));

    console.log('Successfully fetched price chart items:', transformedItems);
    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error in GET /api/price-charts/[id]/items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST a new price chart item
export async function POST(
  request: NextRequest,
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