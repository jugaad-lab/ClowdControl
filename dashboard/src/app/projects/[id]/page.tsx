'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getProject,
  getProjectTasks,
  getProjectSprints,
  getAgents,
  updateTaskStatus,
  subscribeToTasks,
  getTaskDependencies,
  Project,
  Task,
  Sprint,
  Agent,
  TaskDependency,
} from '@/lib/supabase';
import { useTheme } from '@/lib/hooks';
import { TaskListView } from '@/components/TaskListView';
import { TaskFilters, useTaskFilters, filterTasks } from '@/components/TaskFilters';
import { TaskSidePanel } from '@/components/TaskSidePanel';
import { ProjectProgress } from '@/components/ProjectProgress';
import { BudgetProgressBar } from '@/components/BudgetProgressBar';
import { BudgetTracker } from '@/components/BudgetTracker';
import { DependencyGraph } from '@/components/DependencyGraph';
import { GanttChart } from '@/components/charts/GanttChart';
import { CriticalPath, getCriticalPathIds } from '@/components/CriticalPath';
import { ReviewQueue } from '@/components/ReviewQueue';
import { ProjectSettings } from '@/components/ProjectSettings';
import { NotificationSetupBanner } from '@/components/NotificationSetupBanner';
import { Rocket, LayoutGrid, List, GitBranch, BarChart3, ClipboardCheck, Play, SkipForward, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

type ViewMode = 'kanban' | 'list';
type TabMode = 'tasks' | 'gantt' | 'dependencies' | 'review';

const statusColumns = ['backlog', 'assigned', 'in_progress', 'review', 'done'] as const;

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
  backlog: 'bg-zinc-100 border-zinc-300 dark:bg-zinc-800/50 dark:border-zinc-700',
  assigned: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
  in_progress: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800',
  review: 'bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800',
  done: 'bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800',
  blocked: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
};

function ProjectPageContent() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tabMode, setTabMode] = useState<TabMode>('tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [startingTask, setStartingTask] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const filters = useTaskFilters();
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'member';

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectData, tasksData, sprintsData, agentsData, depsData] = await Promise.all([
          getProject(projectId),
          getProjectTasks(projectId),
          getProjectSprints(projectId),
          getAgents(),
          getTaskDependencies(projectId).catch(() => [] as TaskDependency[]),
        ]);
        setProject(projectData);
        setTasks(tasksData);
        setSprints(sprintsData);
        setAgents(agentsData);
        setDependencies(depsData);

        // Set active sprint
        const activeSprint = sprintsData.find((s) => s.status === 'active');
        setActiveSprintId(activeSprint?.id || null);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Subscribe to real-time task updates
    const subscription = subscribeToTasks(projectId, (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const getAgentName = (id: string | null) => {
    if (!id) return 'Unassigned';
    const agent = agents.find((a) => a.id === id);
    return agent?.display_name || id;
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSidePanelOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
  };

  const handleStartNextTask = async () => {
    setStartingTask(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/start`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start task');
      }
      
      const result = await response.json();
      
      if (result.task) {
        // Update the task in our local state
        setTasks((prev) =>
          prev.map((t) => (t.id === result.task.id ? result.task : t))
        );
        // Show success notification or highlight the task
        console.log('Started task:', result.task.title);
      } else {
        console.log('No tasks available to start');
        // Could show a toast or notification here
      }
    } catch (error) {
      console.error('Error starting task:', error);
      // Could show error notification here
    } finally {
      setStartingTask(false);
    }
  };

  const handleSettingsUpdate = (newSettings: Project['settings']) => {
    setProject((prev) => prev ? { ...prev, settings: newSettings } : null);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Apply sprint filter first, then quick filters
  const sprintFilteredTasks = activeSprintId === 'unassigned'
    ? tasks.filter((t) => !t.sprint_id)
    : activeSprintId
      ? tasks.filter((t) => t.sprint_id === activeSprintId)
      : tasks;

  const filteredTasks = filterTasks(sprintFilteredTasks, filters);

  // Calculate critical path for highlighting
  const criticalPathIds = useMemo(
    () => getCriticalPathIds(tasks, dependencies),
    [tasks, dependencies]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xl text-zinc-600 dark:text-zinc-400">Loading project...</div>
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

  const activeSprint = sprints.find((s) => s.id === activeSprintId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    bubbles: true,
                  });
                  document.dispatchEvent(event);
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                <span>Search</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded font-mono">⌘K</kbd>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                📁 {project.name}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                PM: {getAgentName(project.current_pm_id)} • Status: {project.status}
                {project.settings?.execution_mode && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
                    {project.settings.execution_mode}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Start Button - only show in manual mode, hide for viewers */}
              {canEdit && project.settings?.execution_mode === 'manual' && (
                <button
                  onClick={handleStartNextTask}
                  disabled={startingTask}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  {startingTask ? 'Starting...' : '▶ Start'}
                </button>
              )}

              {/* Settings - hide for non-admins */}
              {role === 'admin' && (
                <ProjectSettings
                  projectId={projectId}
                  project={project}
                  settings={project.settings}
                  onSettingsUpdate={handleSettingsUpdate}
                />
              )}
              
              {/* Sprint Planning */}
              <Link
                href={`/projects/${projectId}/sprints`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Rocket className="w-4 h-4" />
                Sprint Planning
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Setup Banner */}
      {!project.settings?.notification_webhook_url && (
        <NotificationSetupBanner projectId={projectId} />
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Project Progress & Budget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ProjectProgress tasks={tasks} sprints={sprints} />
          <BudgetTracker
            project={project}
            tasks={tasks}
            sprints={sprints}
          />
        </div>

        {/* Sprint Selector */}
        {sprints.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sprint:
              </span>
              <select
                value={activeSprintId || ''}
                onChange={(e) => setActiveSprintId(e.target.value || null)}
                className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm"
              >
                <option value="">All Tasks ({tasks.length})</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.status}) — {tasks.filter(t => t.sprint_id === sprint.id).length} tasks
                  </option>
                ))}
                {tasks.filter(t => !t.sprint_id).length > 0 && (
                  <option value="unassigned">
                    ⚠️ Unassigned ({tasks.filter(t => !t.sprint_id).length} tasks)
                  </option>
                )}
              </select>
            </div>

            {/* Sprint Progress */}
            {activeSprint && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
                  {activeSprint.name} - Acceptance Criteria
                </h3>
                <div className="space-y-2">
                  {activeSprint.acceptance_criteria.map((criteria, index) => (
                    <div
                      key={criteria.id || `ac-${index}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          criteria.verified
                            ? 'bg-green-100 text-green-600'
                            : 'bg-zinc-100 text-zinc-400'
                        }`}
                      >
                        {criteria.verified ? '✓' : '○'}
                      </span>
                      <span
                        className={
                          criteria.verified
                            ? 'text-zinc-500 line-through'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }
                      >
                        {criteria.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
            <button
              onClick={() => setTabMode('tasks')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                tabMode === 'tasks'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Tasks
            </button>
            <button
              onClick={() => setTabMode('gantt')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                tabMode === 'gantt'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Gantt
            </button>
            <button
              onClick={() => setTabMode('dependencies')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                tabMode === 'dependencies'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              <GitBranch className="w-4 h-4" />
              Dependencies
            </button>
            <button
              onClick={() => setTabMode('review')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                tabMode === 'review'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              <ClipboardCheck className="w-4 h-4" />
              Review
            </button>
          </div>
        </div>

        {/* Tasks Tab */}
        {tabMode === 'tasks' && (
          <>
            {/* Quick Filters */}
            <div className="mb-4">
              <TaskFilters agents={agents} tasks={sprintFilteredTasks} />
            </div>

            {/* View Toggle & Task Board Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Task Board
                {filteredTasks.length !== sprintFilteredTasks.length && (
                  <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                    ({filteredTasks.length} of {sprintFilteredTasks.length})
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Board
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  )}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
              <TaskListView
                tasks={filteredTasks}
                agents={agents}
                onTaskClick={handleTaskClick}
                onTaskUpdate={handleTaskUpdate}
              />
            )}

            {/* Kanban Board */}
            {viewMode === 'kanban' && (
              <div className="grid grid-cols-5 gap-4">
                {statusColumns.map((status) => (
                  <div
                    key={status}
                    className={`rounded-lg border-2 ${statusColors[status]} p-3 min-h-[400px]`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                  >
                    <h3 className="font-medium text-zinc-700 dark:text-zinc-300 mb-3 text-sm uppercase tracking-wide">
                      {statusLabels[status]} ({filteredTasks.filter((t) => t.status === status).length})
                    </h3>
                    <div className="space-y-2">
                      {filteredTasks
                        .filter((task) => task.status === status)
                        .map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onClick={() => handleTaskClick(task)}
                            className="bg-white dark:bg-zinc-800 rounded-md p-3 shadow-sm border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="font-medium text-zinc-900 dark:text-white text-sm mb-1">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-xs text-zinc-500 mb-2 line-clamp-2">
                                {task.description}
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">
                                {task.assigned_to ? getAgentName(task.assigned_to) : 'Unassigned'}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded ${
                                  task.task_type === 'development'
                                    ? 'bg-blue-100 text-blue-700'
                                    : task.task_type === 'research'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {task.task_type}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Gantt Tab */}
        {tabMode === 'gantt' && (
          <div className="space-y-6">
            <CriticalPath
              tasks={tasks}
              dependencies={dependencies}
              onTaskClick={handleTaskClick}
            />
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                Timeline View
              </h3>
              <GanttChart
                tasks={tasks}
                dependencies={dependencies}
                onTaskClick={handleTaskClick}
                highlightCriticalPath={criticalPathIds}
              />
            </div>
          </div>
        )}

        {/* Dependencies Tab */}
        {tabMode === 'dependencies' && (
          <div className="space-y-6">
            <CriticalPath
              tasks={tasks}
              dependencies={dependencies}
              onTaskClick={handleTaskClick}
            />
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                Dependency Graph
              </h3>
              <DependencyGraph
                tasks={tasks}
                dependencies={dependencies}
                onTaskClick={handleTaskClick}
                highlightCriticalPath={criticalPathIds}
              />
            </div>
          </div>
        )}

        {/* Review Tab */}
        {tabMode === 'review' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <ReviewQueue
              tasks={tasks}
              agents={agents}
              onTaskClick={handleTaskClick}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
        )}
      </main>

      {/* Task Side Panel */}
      <TaskSidePanel
        task={selectedTask}
        agents={agents}
        open={sidePanelOpen}
        onOpenChange={setSidePanelOpen}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xl text-zinc-600 dark:text-zinc-400">Loading project...</div>
      </div>
    }>
      <ProjectPageContent />
    </Suspense>
  );
}
