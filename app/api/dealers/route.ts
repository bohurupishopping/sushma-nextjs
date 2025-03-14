import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // First fetch all dealers
    const { data: dealersData, error: dealersError } = await supabaseAdmin
      .from('dealers')
      .select('*');

    if (dealersError) {
      console.error('Supabase error:', dealersError);
      throw dealersError;
    }
    
    if (!dealersData) {
      console.log('No dealers data returned');
      return NextResponse.json([]);
    }

    // Then fetch profiles for all dealers
    const userIds = dealersData.map(dealer => dealer.user_id);
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
      throw profilesError;
    }

    // Fetch price charts if needed
    const priceChartIds = dealersData
      .filter(dealer => dealer.price_chart_code)
      .map(dealer => dealer.price_chart_code);
    
    let priceChartsMap = new Map();
    
    if (priceChartIds.length > 0) {
      const { data: priceChartsData, error: priceChartsError } = await supabaseAdmin
        .from('price_charts')
        .select('*')
        .in('id', priceChartIds);
      
      if (priceChartsError) {
        console.error('Price charts fetch error:', priceChartsError);
        // Don't throw, just log the error
      } else if (priceChartsData) {
        priceChartsMap = new Map(
          priceChartsData.map(chart => [chart.id, chart])
        );
      }
    }

    // Create a map of user_id to profile data
    const profilesMap = new Map(
      profilesData?.map(profile => [profile.user_id, profile]) || []
    );

    // Combine the data
    const formattedDealers = dealersData.map(dealer => ({
      ...dealer,
      profile_display_name: profilesMap.get(dealer.user_id)?.display_name || null,
      profile_role: profilesMap.get(dealer.user_id)?.role || null,
      price_chart_name: dealer.price_chart_code ? priceChartsMap.get(dealer.price_chart_code)?.name || null : null,
      price_chart_code_display: dealer.price_chart_code ? priceChartsMap.get(dealer.price_chart_code)?.price_chart_code || null : null
    }));
    
    return NextResponse.json(formattedDealers);
  } catch (error) {
    console.error('Detailed error in GET /api/dealers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, salesman_id, price_chart_code } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // First create a new user with dealer role
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { 
        name,
        role: 'dealer' // Set role in metadata
      }
    });

    if (userError) {
      console.error('User creation error:', userError);
      throw userError;
    }

    // Update the profile with dealer role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'dealer' })
      .eq('user_id', userData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    // The dealer record should be created automatically via the trigger
    // But we can update it with additional info
    if (salesman_id || price_chart_code) {
      const { error: updateError } = await supabaseAdmin
        .from('dealers')
        .update({
          salesman_id: salesman_id || null,
          price_chart_code: price_chart_code || null,
        })
        .eq('user_id', userData.user.id);

      if (updateError) {
        console.error('Dealer update error:', updateError);
        throw updateError;
      }
    }

    return NextResponse.json({ 
      message: 'Dealer created successfully',
      dealer: userData.user 
    });
  } catch (error) {
    console.error('Detailed error in POST /api/dealers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create dealer' },
      { status: 500 }
    );
  }
} 