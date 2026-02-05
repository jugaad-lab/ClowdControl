'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getProject,
  getProjectTasks,
  getProjectSprints,
  updateTaskSprint,
  Project,
  Task,
  Sprint,
} from '@/lib/supabase';
import { useTheme } from '@/lib/hooks';
import { SprintCard } from '@/components/SprintCard';
import { CreateSprintModal } from '@/components/CreateSprintModal';
import { BacklogView } from '@/components/BacklogView';
import { VelocityChart } from '@/components/charts/VelocityChart';
import { TokenUsageChart } from '@/components/charts/TokenUsageChart';
import { ArrowLeft, Plus, Rocket, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

function SprintsPageContent() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'member';

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectData, tasksData, sprintsData] = await Promise.all([
          getProject(projectId),
          getProjectTasks(projectId),
          getProjectSprints(projectId),
        ]);
        setProject(projectData);
        setTasks(tasksData);
        setSprints(sprintsData);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, sprintId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(sprintId);
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = async (e: React.DragEvent, sprintId: string | null) => {
    e.preventDefault();
    setDropTargetId(null);

    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    try {
      await updateTaskSprint(taskId, sprintId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, sprint_id: sprintId } : t))
      );
    } catch (error) {
      console.error('Error updating task sprint:', error);
    }
  };

  const handleSprintCreated = (sprint: Sprint) => {
    setSprints((prev) => [...prev, sprint]);
  };

  const nextSprintNumber = sprints.length > 0 ? Math.max(...sprints.map((s) => s.number)) + 1 : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading sprints...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xl text-red-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Rocket className="w-6 h-6 text-blue-500" />
                Sprint Planning
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                {project.name} • {sprints.length} sprint{sprints.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCharts(!showCharts)}
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {showCharts ? 'Hide' : 'Show'} Charts
              </Button>
              {canEdit && (
                <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Sprint
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Charts Section */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <VelocityChart
              sprints={sprints
                .filter((s) => s.status === 'completed')
                .map((s) => ({
                  sprintName: s.name,
                  pointsCompleted: tasks.filter(
                    (t) => t.sprint_id === s.id && t.status === 'done'
                  ).length,
                  pointsCommitted: tasks.filter((t) => t.sprint_id === s.id).length,
                }))}
            />
            <TokenUsageChart
              data={sprints
                .filter((s) => s.status === 'completed')
                .map((s) => ({
                  date: s.name,
                  tokens: tasks
                    .filter((t) => t.sprint_id === s.id)
                    .reduce((sum, t) => sum + (t.tokens_consumed ?? 0), 0),
                  label: s.name,
                }))}
              budget={project?.token_budget ?? 1000000}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Backlog column */}
          <div className="lg:col-span-1">
            <BacklogView
              tasks={tasks}
              onDragStart={handleDragStart}
              onDragOver={(e) => handleDragOver(e, null)}
              onDrop={(e) => handleDrop(e, null)}
              isDropTarget={dropTargetId === null}
            />
          </div>

          {/* Sprints grid */}
          <div className="lg:col-span-3">
            {sprints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <Rocket className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  No sprints yet
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm">
                  Create your first sprint to start organizing tasks into time-boxed iterations.
                </p>
                {canEdit && (
                  <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Sprint
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    tasks={tasks}
                    onDragOver={(e) => handleDragOver(e, sprint.id)}
                    onDrop={(e) => handleDrop(e, sprint.id)}
                    isDropTarget={dropTargetId === sprint.id}
                  />
                ))}

                {/* Add sprint card */}
                {canEdit && (
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="min-h-[200px] rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <Plus className="w-8 h-8" />
                    <span className="font-medium">Add Sprint</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Sprint Modal */}
      <CreateSprintModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        projectId={projectId}
        nextSprintNumber={nextSprintNumber}
        onSprintCreated={handleSprintCreated}
      />
    </div>
  );
}

export default function SprintsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading sprints...
          </div>
        </div>
      }
    >
      <SprintsPageContent />
    </Suspense>
  );
}
