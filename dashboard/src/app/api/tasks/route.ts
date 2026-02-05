import { NextRequest, NextResponse } from 'next/server';
import { createTask, Task, updateTaskStatus, getProjectSprints, supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const sprintId = searchParams.get('sprintId');

    if (!projectId && !sprintId) {
      return NextResponse.json(
        { error: 'Either projectId or sprintId query parameter is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (sprintId) {
      query = query.eq('sprint_id', sprintId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data as Task[], { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { project_id, title, task_type, priority, created_by, acceptance_criteria } = body;
    
    if (!project_id || !title || !task_type || !priority || !created_by) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['project_id', 'title', 'task_type', 'priority', 'created_by', 'acceptance_criteria']
        },
        { status: 400 }
      );
    }

    // Validate acceptance_criteria is present and non-empty
    if (!acceptance_criteria || (Array.isArray(acceptance_criteria) && acceptance_criteria.length === 0)) {
      return NextResponse.json(
        { 
          error: 'acceptance_criteria is required and must be a non-empty array'
        },
        { status: 400 }
      );
    }

    // Validate task_type
    const validTaskTypes: Task['task_type'][] = [
      'development', 'research', 'design', 'testing', 'bug', 'documentation', 'business', 'marketing', 'other'
    ];
    if (!validTaskTypes.includes(task_type)) {
      return NextResponse.json(
        { 
          error: 'Invalid task_type',
          valid_types: validTaskTypes
        },
        { status: 400 }
      );
    }

    // Validate priority
    if (typeof priority !== 'number' || priority < 1 || priority > 3) {
      return NextResponse.json(
        { 
          error: 'Priority must be a number between 1-3'
        },
        { status: 400 }
      );
    }

    // Auto-assign to active sprint if no sprint_id provided
    let sprintId = body.sprint_id || null;
    if (!sprintId) {
      try {
        const sprints = await getProjectSprints(project_id);
        const activeSprint = sprints.find(s => s.status === 'active');
        if (activeSprint) {
          sprintId = activeSprint.id;
        }
      } catch {
        // If sprint lookup fails, leave unassigned
      }
    }

    // Create the task
    const newTask = await createTask({
      project_id,
      title,
      description: body.description,
      task_type,
      priority,
      created_by,
      sprint_id: sprintId,
      acceptance_criteria,
    });

    return NextResponse.json(newTask, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['id', 'status']
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses: Task['status'][] = [
      'backlog', 'assigned', 'in_progress', 'blocked', 'waiting_human', 'review', 'done', 'cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status',
          valid_statuses: validStatuses
        },
        { status: 400 }
      );
    }

    // Update the task status
    const updatedTask = await updateTaskStatus(id, status);

    return NextResponse.json(updatedTask, { status: 200 });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}