import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/supabase';
import { testNotification } from '@/lib/discord-notify';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const { webhook_url } = await request.json();

    if (!webhook_url || typeof webhook_url !== 'string') {
      return NextResponse.json(
        { error: 'webhook_url is required' },
        { status: 400 }
      );
    }

    const project = await getProject(projectId);
    const success = await testNotification(webhook_url, project.name);

    if (success) {
      return NextResponse.json({ success: true, message: 'Test message sent successfully' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send test message. Check the webhook URL.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing webhook:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
