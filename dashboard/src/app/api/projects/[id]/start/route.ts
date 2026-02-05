import { NextRequest, NextResponse } from 'next/server';
import { startNextTask, getProject, getAgentById } from '@/lib/supabase';
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

    const task = await startNextTask(projectId);

    if (!task) {
      return NextResponse.json(
        { 
          message: 'No backlog tasks available in active sprint',
          task: null 
        },
        { status: 200 }
      );
    }

    // Get project details for Discord notification
    const project = await getProject(projectId);

    // Get assigned agent's Discord ID for @mention
    let mention = '';
    if (task.assigned_to) {
      try {
        const agent = await getAgentById(task.assigned_to);
        if (agent?.discord_user_id) {
          mention = `<@${agent.discord_user_id}> `;
        }
      } catch {
        // Agent lookup failed, continue without mention
      }
    }

    // Send Discord notification with @mention if available
    const discordMessage = `${mention}🚀 **Task Assigned**
**Task:** ${task.title}
**Project:** ${project.name}
**Task ID:** \`${task.id}\`
**Assigned to:** ${task.assigned_to || 'Not assigned'}
**Priority:** P${task.priority}

PM: Please create task file and spawn the assigned agent.`;

    await notifyPM(discordMessage, projectId, 'task_started');

    return NextResponse.json({
      message: 'Task started successfully',
      task,
    });
  } catch (error) {
    console.error('Error starting next task:', error);
    
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