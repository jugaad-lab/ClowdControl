import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SeedSummary {
  deleted: {
    tasks: number;
    projects: number;
  };
  created: {
    projects: number;
  };
  projects: Array<{
    name: string;
    id: string;
    status: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is an admin request (basic auth check)
    const authHeader = request.headers.get('authorization');
    const isAdmin = authHeader === 'Bearer admin-seed-token'; // Simple auth for now
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const summary: SeedSummary = {
      deleted: { tasks: 0, projects: 0 },
      created: { projects: 0 },
      projects: []
    };

    // Step 1: Clean up test data
    console.log('Cleaning up test data...');

    // First, get test projects to count them
    const { data: testProjects } = await supabase
      .from('projects')
      .select('id, name')
      .or('name.ilike.%test%,name.ilike.%demo%,name.ilike.%example%');

    if (testProjects && testProjects.length > 0) {
      const testProjectIds = testProjects.map(p => p.id);
      
      // Delete test tasks first (foreign key constraint)
      const { data: deletedTasks } = await supabase
        .from('tasks')
        .delete()
        .in('project_id', testProjectIds)
        .select('id');
      
      summary.deleted.tasks = deletedTasks?.length || 0;

      // Delete test projects
      const { data: deletedProjects } = await supabase
        .from('projects')
        .delete()
        .in('id', testProjectIds)
        .select('id');
      
      summary.deleted.projects = deletedProjects?.length || 0;
    }

    // Step 2: Create real projects
    console.log('Creating real projects...');

    const realProjects = [
      {
        name: 'Clowd-Control',
        description: 'Multi-agent project coordination system with anti-groupthink mechanisms',
        status: 'active',
        owner_type: 'human',
        owner_ids: ['yajat'],
        current_pm_id: 'chhotu',
        tags: ['infrastructure', 'ai', 'meta'],
        token_budget: 1000000,
        tokens_used: 0,
        settings: {
          require_dual_pm_consensus: false,
          max_debate_rounds: 3,
          auto_flag_instant_consensus: true,
          notify_channel: null
        }
      },
      {
        name: 'DpuDebugAgent',
        description: 'AI-powered DPU regression analysis and live debugging system',
        status: 'active',
        owner_type: 'human',
        owner_ids: ['yajat'],
        current_pm_id: 'chhotu',
        tags: ['microsoft', 'ai', 'debugging'],
        token_budget: 500000,
        tokens_used: 0,
        settings: {
          require_dual_pm_consensus: false,
          max_debate_rounds: 3,
          auto_flag_instant_consensus: true,
          notify_channel: null
        }
      },
      {
        name: 'FPL Analytics',
        description: 'Fantasy Premier League data analysis and optimization tools',
        status: 'planning',
        owner_type: 'human',
        owner_ids: ['yajat'],
        current_pm_id: 'chhotu',
        tags: ['fpl', 'analytics', 'sports'],
        token_budget: 250000,
        tokens_used: 0,
        settings: {
          require_dual_pm_consensus: false,
          max_debate_rounds: 3,
          auto_flag_instant_consensus: true,
          notify_channel: null
        }
      }
    ];

    for (const projectData of realProjects) {
      // Check if project already exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('name', projectData.name)
        .single();

      if (existingProject) {
        // Project already exists, just add to summary
        summary.projects.push({
          name: existingProject.name,
          id: existingProject.id,
          status: existingProject.status
        });
      } else {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select('id, name, status')
          .single();

        if (error) {
          console.error(`Failed to create project ${projectData.name}:`, error);
          continue;
        }

        if (newProject) {
          summary.created.projects++;
          summary.projects.push({
            name: newProject.name,
            id: newProject.id,
            status: newProject.status
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${summary.deleted.projects} test projects and ${summary.deleted.tasks} test tasks. Created ${summary.created.projects} new projects.`,
      summary
    }, { status: 200 });

  } catch (error) {
    console.error('Error in admin seed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to check what would be cleaned up (dry run)
export async function GET() {
  try {
    // Get test projects that would be deleted
    const { data: testProjects } = await supabase
      .from('projects')
      .select('id, name, created_at')
      .or('name.ilike.%test%,name.ilike.%demo%,name.ilike.%example%');

    // Count test tasks that would be deleted
    let testTaskCount = 0;
    if (testProjects && testProjects.length > 0) {
      const testProjectIds = testProjects.map(p => p.id);
      const { data: testTasks } = await supabase
        .from('tasks')
        .select('id')
        .in('project_id', testProjectIds);
      
      testTaskCount = testTasks?.length || 0;
    }

    // Check existing real projects
    const realProjectNames = ['Clowd-Control', 'DpuDebugAgent', 'FPL Analytics'];
    const { data: existingRealProjects } = await supabase
      .from('projects')
      .select('id, name, status')
      .in('name', realProjectNames);

    return NextResponse.json({
      preview: {
        test_projects_to_delete: testProjects || [],
        test_tasks_to_delete_count: testTaskCount,
        existing_real_projects: existingRealProjects || [],
        real_projects_to_create: realProjectNames.filter(name => 
          !existingRealProjects?.some(p => p.name === name)
        )
      }
    });

  } catch (error) {
    console.error('Error in admin seed preview:', error);
    return NextResponse.json(
      { error: 'Failed to preview seed operation' },
      { status: 500 }
    );
  }
}