import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const project = await getProject(id);
    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error('Error fetching project:', error);

    // Supabase returns PGRST116 when .single() finds no rows
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
