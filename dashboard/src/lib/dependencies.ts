import { Task, TaskDependency } from './supabase';

/**
 * Get all tasks that block a given task (tasks that must complete first)
 */
export function getBlockingTasks(
  taskId: string,
  dependencies: TaskDependency[],
  tasks: Task[]
): Task[] {
  const blockingIds = dependencies
    .filter((d) => d.task_id === taskId)
    .map((d) => d.depends_on_task_id);

  return tasks.filter((t) => blockingIds.includes(t.id));
}

/**
 * Get all tasks blocked by a given task (tasks waiting for this one)
 */
export function getBlockedTasks(
  taskId: string,
  dependencies: TaskDependency[],
  tasks: Task[]
): Task[] {
  const blockedIds = dependencies
    .filter((d) => d.depends_on_task_id === taskId)
    .map((d) => d.task_id);

  return tasks.filter((t) => blockedIds.includes(t.id));
}

/**
 * Check if a task can start (all dependencies are done)
 */
export function canTaskStart(
  task: Task,
  dependencies: TaskDependency[],
  tasks: Task[]
): boolean {
  const blockingTasks = getBlockingTasks(task.id, dependencies, tasks);
  return blockingTasks.every((t) => t.status === 'done');
}

/**
 * Get all tasks in a dependency chain (transitive dependencies)
 */
export function getTransitiveDependencies(
  taskId: string,
  dependencies: TaskDependency[],
  tasks: Task[],
  visited: Set<string> = new Set()
): Task[] {
  if (visited.has(taskId)) return [];
  visited.add(taskId);

  const directDeps = getBlockingTasks(taskId, dependencies, tasks);
  const allDeps: Task[] = [...directDeps];

  for (const dep of directDeps) {
    const transitive = getTransitiveDependencies(dep.id, dependencies, tasks, visited);
    allDeps.push(...transitive);
  }

  return allDeps;
}

/**
 * Calculate critical path (longest dependency chain)
 * Returns tasks in order from start to finish
 */
export function calculateCriticalPath(
  tasks: Task[],
  dependencies: TaskDependency[]
): Task[] {
  // Build adjacency list
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const task of tasks) {
    graph.set(task.id, []);
    inDegree.set(task.id, 0);
  }

  // Build graph
  for (const dep of dependencies) {
    const successors = graph.get(dep.depends_on_task_id);
    if (successors) {
      successors.push(dep.task_id);
    }
    inDegree.set(dep.task_id, (inDegree.get(dep.task_id) || 0) + 1);
  }

  // Find longest path using dynamic programming
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string | null>();

  // Initialize distances
  for (const task of tasks) {
    distances.set(task.id, 0);
    predecessors.set(task.id, null);
  }

  // Process in topological order
  const sorted = topologicalSort(tasks, dependencies);

  for (const task of sorted) {
    const currentDist = distances.get(task.id) || 0;
    const successors = graph.get(task.id) || [];

    for (const succId of successors) {
      const newDist = currentDist + 1;
      if (newDist > (distances.get(succId) || 0)) {
        distances.set(succId, newDist);
        predecessors.set(succId, task.id);
      }
    }
  }

  // Find task with maximum distance (end of critical path)
  let maxDist = 0;
  let endTaskId: string | null = null;

  for (const [taskId, dist] of distances) {
    if (dist >= maxDist) {
      maxDist = dist;
      endTaskId = taskId;
    }
  }

  if (!endTaskId) return [];

  // Reconstruct path
  const path: Task[] = [];
  let currentId: string | null = endTaskId;

  while (currentId) {
    const task = tasks.find((t) => t.id === currentId);
    if (task) path.unshift(task);
    currentId = predecessors.get(currentId) || null;
  }

  return path;
}

/**
 * Topological sort for Gantt ordering
 * Returns tasks sorted so that dependencies come before dependents
 */
export function topologicalSort(
  tasks: Task[],
  dependencies: TaskDependency[]
): Task[] {
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Initialize
  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adjacencyList.set(task.id, []);
  }

  // Build graph
  for (const dep of dependencies) {
    const successors = adjacencyList.get(dep.depends_on_task_id);
    if (successors) {
      successors.push(dep.task_id);
    }
    inDegree.set(dep.task_id, (inDegree.get(dep.task_id) || 0) + 1);
  }

  // Find all nodes with no incoming edges
  const queue: string[] = [];
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  const result: Task[] = [];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  while (queue.length > 0) {
    const taskId = queue.shift()!;
    const task = taskMap.get(taskId);
    if (task) result.push(task);

    const successors = adjacencyList.get(taskId) || [];
    for (const succId of successors) {
      const newDegree = (inDegree.get(succId) || 1) - 1;
      inDegree.set(succId, newDegree);
      if (newDegree === 0) {
        queue.push(succId);
      }
    }
  }

  // Add any remaining tasks (in case of cycles or disconnected nodes)
  for (const task of tasks) {
    if (!result.find((t) => t.id === task.id)) {
      result.push(task);
    }
  }

  return result;
}

/**
 * Build a dependency graph structure for visualization
 */
export interface DependencyNode {
  id: string;
  task: Task;
  dependencies: string[];
  dependents: string[];
  level: number;
}

export function buildDependencyGraph(
  tasks: Task[],
  dependencies: TaskDependency[]
): DependencyNode[] {
  const nodes: DependencyNode[] = [];
  const levelMap = new Map<string, number>();

  // Calculate levels (distance from root tasks)
  const calculateLevel = (taskId: string, visited: Set<string>): number => {
    if (visited.has(taskId)) return 0;
    visited.add(taskId);

    const deps = dependencies.filter((d) => d.task_id === taskId);
    if (deps.length === 0) return 0;

    const maxParentLevel = Math.max(
      ...deps.map((d) => calculateLevel(d.depends_on_task_id, visited))
    );

    return maxParentLevel + 1;
  };

  // Calculate level for each task
  for (const task of tasks) {
    const level = calculateLevel(task.id, new Set());
    levelMap.set(task.id, level);
  }

  // Build nodes
  for (const task of tasks) {
    const taskDependencies = dependencies
      .filter((d) => d.task_id === task.id)
      .map((d) => d.depends_on_task_id);

    const taskDependents = dependencies
      .filter((d) => d.depends_on_task_id === task.id)
      .map((d) => d.task_id);

    nodes.push({
      id: task.id,
      task,
      dependencies: taskDependencies,
      dependents: taskDependents,
      level: levelMap.get(task.id) || 0,
    });
  }

  return nodes;
}

/**
 * Detect if adding a dependency would create a cycle
 */
export function wouldCreateCycle(
  taskId: string,
  dependsOnTaskId: string,
  dependencies: TaskDependency[]
): boolean {
  // Check if dependsOnTaskId already depends on taskId (directly or transitively)
  const visited = new Set<string>();
  const stack = [dependsOnTaskId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = dependencies.filter((d) => d.task_id === current);
    for (const dep of deps) {
      stack.push(dep.depends_on_task_id);
    }
  }

  return false;
}
