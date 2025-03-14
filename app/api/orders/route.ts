import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface ProductData {
  price_per_unit: number;
  currency: string;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}

// GET all orders
export async function GET() {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        dealer:dealers(
          id,
          name,
          dealer_code
        ),
        salesman:profiles!orders_salesman_id_fkey(
          user_id,
          display_name
        ),
        product:products(
          id,
          name,
          category,
          unit
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealer_id, product_id, quantity, notes, price_chart_id, price_per_unit, product_name, unit } = body;

    console.log('Creating order with data:', body);

    // Validate required fields
    if (!dealer_id || !product_id || !quantity || !price_chart_id || !price_per_unit || !product_name || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields. Please ensure all required data is provided.' },
        { status: 400 }
      );
    }

    // Create the order with the provided data
    const orderData = {
      dealer_id,
      product_id,
      product_name,
      unit,
      quantity: Number(quantity),
      price_chart_id,
      price_per_unit: Number(price_per_unit),
      total_price: Number(quantity) * Number(price_per_unit),
      status: 'processing',
      notes: notes || null
    };

    console.log('Creating order with data:', orderData);

    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: `Failed to create order: ${orderError.message}` },
        { status: 500 }
      );
    }

    console.log('Order created successfully:', createdOrder);
    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 