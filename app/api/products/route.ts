import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET all products
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new product
export async function POST(request: Request) {
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
      .insert([{
        name: body.name,
        category: body.category || null,
        description: body.description || null,
        unit: body.unit,
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 