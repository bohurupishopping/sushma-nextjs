import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, get the current profile to check its status
    const { data: currentProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('status')
      .eq('user_id', params.id)
      .single();

    if (fetchError) throw fetchError;
    
    // Toggle the status
    const newStatus = currentProfile.status === 'active' ? 'deactivated' : 'active';
    
    // Update the profile with the new status
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status: newStatus })
      .eq('user_id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle user status' },
      { status: 500 }
    );
  }
} 