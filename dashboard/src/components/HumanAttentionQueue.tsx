'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHumanAttentionTasks, supabase, Task, updateTaskStatus } from '@/lib/supabase';

type HumanAttentionTask = Task & { project: { name: string; id: string } };

interface HumanAttentionQueueProps {
  onTaskUpdate?: () => void;
}

export function HumanAttentionQueue({ onTaskUpdate }: HumanAttentionQueueProps) {
  const [tasks, setTasks] = useState<HumanAttentionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchTasks();

    // Subscribe to real-time task changes
    const subscription = supabase
      .channel('human-attention-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          fetchTasks();
          onTaskUpdate?.();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [onTaskUpdate]);

  async function fetchTasks() {
    try {
      const data = await getHumanAttentionTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch human attention tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsInProgress(taskId: string) {
    try {
      await updateTaskStatus(taskId, 'in_progress');
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }

  async function handleMarkAsResolved(taskId: string) {
    try {
      await updateTaskStatus(taskId, 'done');
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/50 dark:to-yellow-950/50 rounded-lg border border-orange-200 dark:border-orange-800 p-4">
        <div className="flex items-center gap-2">
          <span className="text-orange-600 dark:text-orange-400 text-xl">⚠️</span>
          <span className="text-orange-800 dark:text-orange-200 font-medium">Loading attention queue...</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800 p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
          <span className="text-green-800 dark:text-green-200 font-medium">
            All clear! No tasks need your attention right now.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/50 dark:to-yellow-950/50 rounded-lg border border-orange-200 dark:border-orange-800">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-orange-600 dark:text-orange-400 text-xl">⚠️</span>
            <div>
              <h2 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                Needs Your Attention
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {tasks.length} task{tasks.length === 1 ? '' : 's'} blocked or awaiting human input
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-sm font-medium">
              {tasks.length}
            </span>
            <button className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors">
              {collapsed ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className="bg-white dark:bg-zinc-900 rounded-md border border-orange-200 dark:border-orange-800 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/projects/${task.project.id}`}
                      className="font-medium text-zinc-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {task.title}
                    </Link>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      task.status === 'waiting_human'
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                    }`}>
                      {task.status === 'waiting_human' ? 'Needs Human' : 'Blocked'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                      task.priority === 3 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' 
                        : task.priority === 2 
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                        : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    }`}>
                      P{task.priority}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">{task.project.name}</span>
                    {task.description && (
                      <span className="ml-2">• {task.description}</span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-zinc-500">
                    Created {new Date(task.created_at).toLocaleDateString()} by {task.created_by}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleMarkAsInProgress(task.id)}
                    className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                    title="Mark as in progress"
                  >
                    Start Work
                  </button>
                  <button
                    onClick={() => handleMarkAsResolved(task.id)}
                    className="px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 rounded hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                    title="Mark as resolved"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}