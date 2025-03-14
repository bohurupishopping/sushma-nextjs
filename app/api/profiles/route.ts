import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) throw profilesError;
    
    return NextResponse.json(profilesData || []);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
} 