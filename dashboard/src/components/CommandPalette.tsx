'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  Plus,
  FolderOpen,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { supabase, Task, Project } from '@/lib/supabase';

const statusIcons: Record<Task['status'], React.ReactNode> = {
  backlog: <Circle className="size-3 text-zinc-400" />,
  assigned: <Clock className="size-3 text-blue-500" />,
  in_progress: <Clock className="size-3 text-yellow-500" />,
  blocked: <AlertCircle className="size-3 text-red-500" />,
  waiting_human: <AlertCircle className="size-3 text-orange-500" />,
  review: <Clock className="size-3 text-purple-500" />,
  done: <CheckCircle2 className="size-3 text-green-500" />,
  cancelled: <Circle className="size-3 text-zinc-300" />,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch data when palette opens
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('updated_at', { ascending: false }).limit(50),
        supabase.from('projects').select('*').order('name'),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, []);

  // Filter tasks by search query
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
      <CommandInput
        placeholder="Search tasks, projects, or type a command..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? 'Loading...' : 'No results found.'}
        </CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => handleSelect(() => {
              // Navigate to first project to create task there
              if (projects.length > 0) {
                router.push(`/projects/${projects[0].id}`);
              }
            })}
          >
            <Plus className="mr-2 size-4" />
            Create New Task
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => {
              const path = window.location.pathname;
              if (path.includes('?view=')) {
                const newPath = path.includes('view=list')
                  ? path.replace('view=list', 'view=kanban')
                  : path.replace('view=kanban', 'view=list');
                router.push(newPath);
              } else if (path.includes('/projects/')) {
                router.push(`${path}?view=list`);
              }
            })}
          >
            <LayoutList className="mr-2 size-4" />
            Switch to List View
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => {
              const path = window.location.pathname;
              if (path.includes('?view=')) {
                const newPath = path.includes('view=kanban')
                  ? path.replace('view=kanban', 'view=list')
                  : path.replace('view=list', 'view=kanban');
                router.push(newPath);
              } else if (path.includes('/projects/')) {
                router.push(`${path}?view=kanban`);
              }
            })}
          >
            <LayoutGrid className="mr-2 size-4" />
            Switch to Kanban View
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Projects */}
        {projects.length > 0 && (
          <>
            <CommandGroup heading="Go to Project">
              {projects.slice(0, 5).map((project) => (
                <CommandItem
                  key={project.id}
                  value={`project-${project.name}`}
                  onSelect={() => handleSelect(() => router.push(`/projects/${project.id}`))}
                >
                  <FolderOpen className="mr-2 size-4" />
                  {project.name}
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {project.status}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Tasks */}
        {filteredTasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {filteredTasks.slice(0, 10).map((task) => (
              <CommandItem
                key={task.id}
                value={`task-${task.title}`}
                onSelect={() => handleSelect(() => {
                  // Navigate to project with task selected
                  router.push(`/projects/${task.project_id}?task=${task.id}`);
                })}
              >
                <div className="mr-2">{statusIcons[task.status]}</div>
                <span className="flex-1 truncate">{task.title}</span>
                <span className="ml-2 text-xs text-muted-foreground capitalize">
                  {task.status.replace('_', ' ')}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
            close
          </span>
        </div>
        <Search className="size-3 opacity-50" />
      </div>
    </CommandDialog>
  );
}
