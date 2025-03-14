import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', params.id)
      .single();

    if (profileError) throw profileError;
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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
    const { display_name, role, status } = body;

    // Create an update object with only the fields that are provided
    const updateData: { 
      display_name?: string; 
      role?: string; 
      status?: string;
    } = {};
    
    if (display_name !== undefined) updateData.display_name = display_name;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', params.id)
      .select()
      .single();

    if (profileError) throw profileError;

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete the profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', params.id);

    if (profileDeleteError) throw profileDeleteError;

    // Delete the user account
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      params.id
    );

    if (userDeleteError) throw userDeleteError;

    return NextResponse.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
} 