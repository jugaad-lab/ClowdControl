'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ArrowLeft } from 'lucide-react';
import { Task, Agent, getAgents, supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/hooks';
import { ReviewQueue } from '@/components/ReviewQueue';
import { ReviewPanel } from '@/components/ReviewPanel';

export default function ReviewPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsData, tasksData] = await Promise.all([
          getAgents(),
          supabase
            .from('tasks')
            .select('*')
            .eq('requires_review', true)
            .order('updated_at', { ascending: false }),
        ]);

        setAgents(agentsData);
        if (tasksData.data) {
          setTasks(tasksData.data as Task[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xl text-zinc-600 dark:text-zinc-400">Loading review queue...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clowd-Control
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Review Queue
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Review and approve agent work
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue */}
          <div className={selectedTask ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <ReviewQueue
              tasks={tasks}
              agents={agents}
              onTaskClick={handleTaskClick}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>

          {/* Review Panel */}
          {selectedTask && (
            <div className="lg:col-span-1">
              <ReviewPanel
                task={selectedTask}
                agents={agents}
                onTaskUpdate={handleTaskUpdate}
                onClose={() => setSelectedTask(null)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
