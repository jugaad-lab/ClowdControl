import { NextRequest, NextResponse } from 'next/server';
import { updateProjectSettings, getProject, ProjectSettings, updateProjectVisibility } from '@/lib/supabase';
import { notifyPM } from '@/lib/discord-notify';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const requestBody = await request.json();
    const { visibility, ...settingsUpdate } = requestBody as Partial<ProjectSettings> & { visibility?: 'public' | 'private' };

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get current project to compare changes
    const project = await getProject(projectId);
    const currentMode = project.settings.execution_mode;
    const newMode = settingsUpdate.execution_mode;

    // Update visibility if provided
    if (visibility && visibility !== project.visibility) {
      await updateProjectVisibility(projectId, visibility);
    }

    // Update the settings
    await updateProjectSettings(projectId, settingsUpdate);

    // Send Discord notification if execution mode changed
    if (newMode && newMode !== currentMode) {
      let discordMessage = '';

      switch (newMode) {
        case 'full_speed':
          discordMessage = `🔥 **Execution Mode Changed: Full Speed**
**Project:** ${project.name}
**Project ID:** \`${project.id}\`
PM: Create a 5-min monitoring cron (sprint{N}-fullspeed-monitor). Chain through all backlog tasks automatically. Only stop on blockers or budget limits.`;
          break;
        case 'background':
          discordMessage = `⏰ **Execution Mode Changed: Background**
**Project:** ${project.name}
**Project ID:** \`${project.id}\`
PM: Create a 30-min processing cron (sprint{N}-background-processor). Process ONE backlog task per cycle. Monitor until done, then wait for next cycle.`;
          break;
        case 'manual':
          discordMessage = `🟢 **Execution Mode Changed: Manual**
**Project:** ${project.name}
**Project ID:** \`${project.id}\`
PM: Disable any active processing/monitoring crons for this project. Wait for user to click Start before processing tasks.`;
          break;
      }

      if (discordMessage) {
        await notifyPM(discordMessage, projectId, 'mode_changed');
      }
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating project settings:', error);
    
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