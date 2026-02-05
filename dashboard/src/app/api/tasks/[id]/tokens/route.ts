import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { tokens_consumed } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    if (typeof tokens_consumed !== 'number' || tokens_consumed < 0) {
      return NextResponse.json(
        { error: 'tokens_consumed must be a non-negative number' },
        { status: 400 }
      );
    }

    if (tokens_consumed > 100_000_000) {
      return NextResponse.json(
        { error: 'tokens_consumed value exceeds reasonable limit (100M)' },
        { status: 400 }
      );
    }

    // Fetch the task to verify it exists and get project_id
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, project_id, tokens_consumed')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const previousTokens = task.tokens_consumed ?? 0;
    const tokenDelta = tokens_consumed - previousTokens;

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        tokens_consumed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update the project's aggregate tokens_used
    if (tokenDelta !== 0) {
      const { error: projectError } = await supabase.rpc('increment_tokens_used', {
        project_id_input: task.project_id,
        delta: tokenDelta,
      });

      // If the RPC doesn't exist, fall back to a manual update
      if (projectError) {
        const { data: project } = await supabase
          .from('projects')
          .select('tokens_used')
          .eq('id', task.project_id)
          .single();

        if (project) {
          await supabase
            .from('projects')
            .update({
              tokens_used: (project.tokens_used ?? 0) + tokenDelta,
              updated_at: new Date().toISOString(),
            })
            .eq('id', task.project_id);
        }
      }
    }

    return NextResponse.json({
      message: 'Token count updated',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Error updating task tokens:', error);

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
