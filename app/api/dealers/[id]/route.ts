import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: dealerData, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select(`
        *,
        profiles!dealers_user_id_fkey(display_name, role)
      `)
      .eq('id', params.id)
      .single();

    if (dealerError) throw dealerError;
    
    return NextResponse.json(dealerData);
  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, salesman_id, price_chart_code } = body;

    console.log("PUT /api/dealers/[id] - Request body:", body);
    console.log("PUT /api/dealers/[id] - Dealer ID:", params.id);

    // Validate inputs
    if (name && name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name) {
      updateData.name = name;
    }
    
    // Handle salesman assignment
    updateData.salesman_id = salesman_id || null;
    
    // Handle price chart assignment
    updateData.price_chart_code = price_chart_code || null;

    console.log("PUT /api/dealers/[id] - Update data:", updateData);

    // Update the dealer record
    const { data: dealerData, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (dealerError) {
      console.error('Dealer update error:', dealerError);
      throw dealerError;
    }

    console.log("PUT /api/dealers/[id] - Updated dealer:", dealerData);

    // If name was updated, also update the profile display_name
    if (name) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ display_name: name })
        .eq('user_id', dealerData.user_id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't throw here, as the dealer update was successful
      }
    }

    // Fetch profiles for the dealer
    const { data: profileData, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', dealerData.user_id)
      .single();

    if (profileFetchError) {
      console.error('Error fetching profile:', profileFetchError);
    }

    // Fetch price chart if assigned
    let priceChartData = null;
    if (dealerData.price_chart_code) {
      const { data: chartData, error: chartError } = await supabaseAdmin
        .from('price_charts')
        .select('*')
        .eq('id', dealerData.price_chart_code)
        .single();

      if (chartError) {
        console.error('Error fetching price chart:', chartError);
      } else {
        priceChartData = chartData;
      }
    }

    // Combine the data
    const responseData = {
      ...dealerData,
      profile_display_name: profileData?.display_name || null,
      profile_role: profileData?.role || null,
      price_chart_name: priceChartData?.name || null,
      price_chart_code_display: priceChartData?.price_chart_code || null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating dealer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update dealer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First get the user_id from the dealer record
    const { data: dealerData, error: fetchError } = await supabaseAdmin
      .from('dealers')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;

    // Delete the dealer record
    const { error: deleteError } = await supabaseAdmin
      .from('dealers')
      .delete()
      .eq('id', params.id);

    if (deleteError) throw deleteError;

    // Delete the user account
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      dealerData.user_id
    );

    if (userDeleteError) throw userDeleteError;

    return NextResponse.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Error deleting dealer:', error);
    return NextResponse.json(
      { error: 'Failed to delete dealer' },
      { status: 500 }
    );
  }
} 