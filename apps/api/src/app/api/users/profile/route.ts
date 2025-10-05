/**
 * User Profile API Endpoint
 * PUT /api/users/profile - Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { CustomUsersTableUser } from '@finmatter/types';

export async function PUT(req: NextRequest) {
  try {
    const { name, email, onboardingCompleted } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new FinMatterError('Unauthorized', 'AUTH_REQUIRED', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: userResponse, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userResponse?.user) {
      throw new FinMatterError('Unauthorized', 'INVALID_TOKEN', 401);
    }

    const userId = userResponse.user.id;
    const updateData: Partial<CustomUsersTableUser> = {};

    if (name !== undefined) {
      updateData.name = name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (onboardingCompleted !== undefined) {
      updateData.onboarding_completed = onboardingCompleted;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: true, message: 'No data to update' },
        { status: 200 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update user profile error:', error);
      throw new FinMatterError(
        'Failed to update user profile',
        'DB_UPDATE_FAILED',
        500,
        { error },
      );
    }

    return NextResponse.json({ success: true, user: data }, { status: 200 });
  } catch (error) {
    if (error instanceof FinMatterError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    console.error('Unexpected error in PUT /api/users/profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
