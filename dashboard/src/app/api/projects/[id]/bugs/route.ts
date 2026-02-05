import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyPM } from '@/lib/discord-notify';

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

    const body = await request.json();
    const { title, description, priority, steps_to_reproduce, sprint_id } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const fullDescription = steps_to_reproduce
      ? `${description}\n\n**Steps to Reproduce:**\n${steps_to_reproduce}`
      : description;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        title: title.trim(),
        description: fullDescription,
        task_type: 'bug',
        status: 'backlog',
        priority: priority ?? 2,
        sprint_id: sprint_id || null,
        created_by: 'human',
        tags: ['bug', 'user-reported'],
        complexity: 'medium',
        tokens_consumed: 0,
        shadowing: 'none',
        requires_review: false,
        review_status: 'not_required',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating bug task:', error);
      return NextResponse.json(
        { error: 'Failed to create bug report' },
        { status: 500 }
      );
    }

    // Send Discord notification to PM
    const discordMessage = `\u{1F41B} **Bug Reported**
**Title:** ${task.title}
**Priority:** P${task.priority}
**Description:** ${description}
**Task ID:** \`${task.id}\`

PM: Triage and assign to an agent.`;

    await notifyPM(discordMessage, projectId, 'bug_reported');

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error creating bug report:', error);

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
