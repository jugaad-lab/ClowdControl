'use client';

import { useMemo, useState } from 'react';
import { Task, TaskDependency } from '@/lib/supabase';
import { topologicalSort } from '@/lib/dependencies';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: Task) => void;
  highlightCriticalPath?: string[];
}

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-zinc-300 dark:bg-zinc-600',
  assigned: 'bg-blue-400 dark:bg-blue-600',
  in_progress: 'bg-amber-400 dark:bg-amber-600',
  blocked: 'bg-red-400 dark:bg-red-600',
  review: 'bg-purple-400 dark:bg-purple-600',
  done: 'bg-green-400 dark:bg-green-600',
  cancelled: 'bg-zinc-400 dark:bg-zinc-500',
};

const TASK_HEIGHT = 32;
const ROW_GAP = 8;
const LABEL_WIDTH = 200;
const DAY_WIDTH = 40;
const HEADER_HEIGHT = 40;

export function GanttChart({
  tasks,
  dependencies,
  onTaskClick,
  highlightCriticalPath = [],
}: GanttChartProps) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const chartData = useMemo(() => {
    if (tasks.length === 0) return null;

    // Sort tasks topologically
    const sortedTasks = topologicalSort(tasks, dependencies);

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7); // Start 7 days ago
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30); // End 30 days from now

    // Adjust based on task deadlines
    for (const task of tasks) {
      if (task.deadline) {
        const deadline = new Date(task.deadline);
        if (deadline > endDate) {
          endDate.setTime(deadline.getTime());
          endDate.setDate(endDate.getDate() + 7);
        }
      }
      if (task.created_at) {
        const created = new Date(task.created_at);
        if (created < startDate) {
          startDate.setTime(created.getTime());
          startDate.setDate(startDate.getDate() - 7);
        }
      }
    }

    // Calculate day columns
    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Calculate task bars
    const taskBars = sortedTasks.map((task, index) => {
      const taskStart = task.created_at
        ? new Date(task.created_at)
        : new Date(startDate);
      const taskEnd = task.deadline
        ? new Date(task.deadline)
        : task.completed_at
        ? new Date(task.completed_at)
        : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

      const startOffset = Math.max(
        0,
        Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const duration = Math.max(
        1,
        Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        task,
        y: index * (TASK_HEIGHT + ROW_GAP),
        x: LABEL_WIDTH + startOffset * DAY_WIDTH,
        width: duration * DAY_WIDTH,
        startOffset,
        duration,
      };
    });

    // Calculate dependency arrows
    const arrows: {
      from: { x: number; y: number };
      to: { x: number; y: number };
      isCritical: boolean;
    }[] = [];

    for (const dep of dependencies) {
      const fromBar = taskBars.find((b) => b.task.id === dep.depends_on_task_id);
      const toBar = taskBars.find((b) => b.task.id === dep.task_id);

      if (fromBar && toBar) {
        const isCritical =
          highlightCriticalPath.includes(dep.depends_on_task_id) &&
          highlightCriticalPath.includes(dep.task_id);

        arrows.push({
          from: {
            x: fromBar.x + fromBar.width,
            y: fromBar.y + TASK_HEIGHT / 2 + HEADER_HEIGHT,
          },
          to: {
            x: toBar.x,
            y: toBar.y + TASK_HEIGHT / 2 + HEADER_HEIGHT,
          },
          isCritical,
        });
      }
    }

    const chartWidth = LABEL_WIDTH + days.length * DAY_WIDTH + 50;
    const chartHeight = HEADER_HEIGHT + sortedTasks.length * (TASK_HEIGHT + ROW_GAP) + 20;

    return {
      tasks: sortedTasks,
      taskBars,
      days,
      arrows,
      startDate,
      chartWidth,
      chartHeight,
    };
  }, [tasks, dependencies, highlightCriticalPath]);

  if (!chartData || tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
        No tasks to display
      </div>
    );
  }

  const todayOffset = Math.floor(
    (new Date().getTime() - chartData.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="w-full overflow-auto bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <svg
        width={chartData.chartWidth}
        height={chartData.chartHeight}
        className="min-w-full"
      >
        <defs>
          <marker
            id="gantt-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              className="fill-zinc-400 dark:fill-zinc-500"
            />
          </marker>
          <marker
            id="gantt-arrow-critical"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" className="fill-orange-500" />
          </marker>
        </defs>

        {/* Header with dates */}
        <g className="text-xs">
          {chartData.days.map((day, i) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isFirstOfMonth = day.getDate() === 1;
            const isToday = i === todayOffset;

            return (
              <g key={i} transform={`translate(${LABEL_WIDTH + i * DAY_WIDTH}, 0)`}>
                {/* Weekend background */}
                {isWeekend && (
                  <rect
                    y={0}
                    width={DAY_WIDTH}
                    height={chartData.chartHeight}
                    className="fill-zinc-100 dark:fill-zinc-800/50"
                  />
                )}
                {/* Today line */}
                {isToday && (
                  <line
                    x1={DAY_WIDTH / 2}
                    y1={0}
                    x2={DAY_WIDTH / 2}
                    y2={chartData.chartHeight}
                    className="stroke-blue-500"
                    strokeWidth={2}
                    strokeDasharray="4,4"
                  />
                )}
                {/* Month label */}
                {isFirstOfMonth && (
                  <text
                    x={DAY_WIDTH / 2}
                    y={15}
                    textAnchor="middle"
                    className="fill-zinc-600 dark:fill-zinc-400 font-medium"
                  >
                    {day.toLocaleDateString('en-US', { month: 'short' })}
                  </text>
                )}
                {/* Day number */}
                <text
                  x={DAY_WIDTH / 2}
                  y={30}
                  textAnchor="middle"
                  className={cn(
                    'text-[10px]',
                    isToday
                      ? 'fill-blue-600 dark:fill-blue-400 font-bold'
                      : 'fill-zinc-400 dark:fill-zinc-500'
                  )}
                >
                  {day.getDate()}
                </text>
              </g>
            );
          })}
        </g>

        {/* Grid lines */}
        <g>
          {chartData.taskBars.map((bar, i) => (
            <line
              key={i}
              x1={LABEL_WIDTH}
              y1={HEADER_HEIGHT + bar.y + TASK_HEIGHT + ROW_GAP / 2}
              x2={chartData.chartWidth}
              y2={HEADER_HEIGHT + bar.y + TASK_HEIGHT + ROW_GAP / 2}
              className="stroke-zinc-100 dark:stroke-zinc-800"
            />
          ))}
        </g>

        {/* Task labels */}
        <g className="text-xs">
          {chartData.taskBars.map((bar) => {
            const isCritical = highlightCriticalPath.includes(bar.task.id);
            return (
              <text
                key={bar.task.id}
                x={10}
                y={HEADER_HEIGHT + bar.y + TASK_HEIGHT / 2 + 4}
                className={cn(
                  'cursor-pointer',
                  isCritical
                    ? 'fill-orange-600 dark:fill-orange-400 font-medium'
                    : 'fill-zinc-700 dark:fill-zinc-300'
                )}
                onClick={() => onTaskClick?.(bar.task)}
                onMouseEnter={() => setHoveredTask(bar.task.id)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                {bar.task.title.length > 22
                  ? bar.task.title.slice(0, 20) + '...'
                  : bar.task.title}
              </text>
            );
          })}
        </g>

        {/* Dependency arrows */}
        {chartData.arrows.map((arrow, i) => {
          const path =
            arrow.from.x < arrow.to.x
              ? `M ${arrow.from.x} ${arrow.from.y} C ${arrow.from.x + 20} ${arrow.from.y}, ${arrow.to.x - 20} ${arrow.to.y}, ${arrow.to.x} ${arrow.to.y}`
              : `M ${arrow.from.x} ${arrow.from.y} L ${arrow.from.x + 10} ${arrow.from.y} L ${arrow.from.x + 10} ${arrow.from.y + 20} L ${arrow.to.x - 10} ${arrow.to.y + 20} L ${arrow.to.x - 10} ${arrow.to.y} L ${arrow.to.x} ${arrow.to.y}`;

          return (
            <path
              key={i}
              d={path}
              fill="none"
              className={cn(
                arrow.isCritical
                  ? 'stroke-orange-500'
                  : 'stroke-zinc-300 dark:stroke-zinc-600'
              )}
              strokeWidth={arrow.isCritical ? 2 : 1}
              markerEnd={arrow.isCritical ? 'url(#gantt-arrow-critical)' : 'url(#gantt-arrow)'}
            />
          );
        })}

        {/* Task bars */}
        {chartData.taskBars.map((bar) => {
          const isCritical = highlightCriticalPath.includes(bar.task.id);
          const isHovered = hoveredTask === bar.task.id;

          return (
            <g
              key={bar.task.id}
              onClick={() => onTaskClick?.(bar.task)}
              onMouseEnter={() => setHoveredTask(bar.task.id)}
              onMouseLeave={() => setHoveredTask(null)}
              className="cursor-pointer"
            >
              <rect
                x={bar.x}
                y={HEADER_HEIGHT + bar.y}
                width={bar.width}
                height={TASK_HEIGHT}
                rx={4}
                className={cn(
                  STATUS_COLORS[bar.task.status],
                  'transition-all duration-150',
                  isHovered && 'opacity-80'
                )}
              />
              {isCritical && (
                <rect
                  x={bar.x - 2}
                  y={HEADER_HEIGHT + bar.y - 2}
                  width={bar.width + 4}
                  height={TASK_HEIGHT + 4}
                  rx={6}
                  fill="none"
                  className="stroke-orange-500"
                  strokeWidth={2}
                />
              )}
              {bar.width > 50 && (
                <text
                  x={bar.x + 8}
                  y={HEADER_HEIGHT + bar.y + TASK_HEIGHT / 2 + 4}
                  className="fill-white text-xs font-medium pointer-events-none"
                >
                  {bar.task.title.slice(0, Math.floor(bar.width / 8))}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
