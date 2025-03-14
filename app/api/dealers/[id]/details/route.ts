import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    console.log('Fetching dealer details for ID:', context.params.id);

    // First get the dealer data
    const { data: dealerData, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('*')
      .eq('id', context.params.id)
      .single();

    if (dealerError) {
      console.error('Supabase error fetching dealer:', dealerError);
      return NextResponse.json(
        { error: `Failed to fetch dealer: ${dealerError.message}` },
        { status: 500 }
      );
    }

    if (!dealerData) {
      console.error('No dealer found for ID:', context.params.id);
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    // Then get the profile data
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', dealerData.user_id)
      .single();

    if (profileError) {
      console.error('Supabase error fetching profile:', profileError);
      // Don't return error here, just log it
    }

    // If dealer has a price chart, get the price chart data
    let priceChartData = null;
    if (dealerData.price_chart_code) {
      const { data: chartData, error: chartError } = await supabaseAdmin
        .from('price_charts')
        .select('*')
        .eq('id', dealerData.price_chart_code)
        .single();

      if (chartError) {
        console.error('Supabase error fetching price chart:', chartError);
        // Don't return error here, just log it
      } else {
        priceChartData = chartData;
      }
    }

    // Combine all the data
    const responseData = {
      ...dealerData,
      profile: profileData || null,
      price_chart: priceChartData || null
    };

    console.log('Successfully fetched dealer data:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in GET /api/dealers/[id]/details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}