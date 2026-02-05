import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/supabase';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
