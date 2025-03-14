import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching dealer details for ID:', params.id);

    // Get complete dealer data
    const { data: dealerData, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select(`
        id,
        name,
        dealer_code,
        salesman_id,
        price_chart_code,
        created_at,
        updated_at,
        profiles!dealers_user_id_fkey (
          display_name,
          role
        )
      `)
      .eq('id', params.id)
      .single();

    if (dealerError) {
      console.error('Supabase error fetching dealer:', dealerError);
      return NextResponse.json(
        { error: `Failed to fetch dealer: ${dealerError.message}` },
        { status: 500 }
      );
    }

    if (!dealerData) {
      console.error('No dealer found for ID:', params.id);
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    console.log('Successfully fetched dealer data:', dealerData);
    return NextResponse.json(dealerData);
  } catch (error) {
    console.error('Error in GET /api/dealers/[id]/products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 