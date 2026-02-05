import { NextRequest, NextResponse } from 'next/server';
import { createAgentSession, getAgentSessions } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { agent_id, session_key } = body;
    
    if (!agent_id || !session_key) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['agent_id', 'session_key']
        },
        { status: 400 }
      );
    }

    // Create the agent session
    const newSession = await createAgentSession({
      agent_id,
      session_key,
      task_id: body.task_id,
    });

    return NextResponse.json(newSession, { status: 201 });

  } catch (error) {
    console.error('Error creating agent session:', error);
    return NextResponse.json(
      { error: 'Failed to create agent session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');

    const sessions = await getAgentSessions(agentId || undefined);
    
    return NextResponse.json(sessions);

  } catch (error) {
    console.error('Error fetching agent sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent sessions' },
      { status: 500 }
    );
  }
}