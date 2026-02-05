'use client';

import React, { useState, useCallback } from 'react';

export type GoalStatus = 'not-started' | 'in-progress' | 'completed';

export interface SprintGoal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
}

interface SprintGoalsProps {
  goals: SprintGoal[];
  onGoalAdd?: (goal: Omit<SprintGoal, 'id'>) => void;
  onGoalUpdate?: (goal: SprintGoal) => void;
  onGoalDelete?: (goalId: string) => void;
  className?: string;
  editable?: boolean;
}

const statusConfig: Record<GoalStatus, { label: string; bgColor: string; textColor: string; icon: string }> = {
  'not-started': {
    label: 'Not Started',
    bgColor: 'bg-gray-600',
    textColor: 'text-gray-300',
    icon: '○',
  },
  'in-progress': {
    label: 'In Progress',
    bgColor: 'bg-yellow-600/30',
    textColor: 'text-yellow-400',
    icon: '◐',
  },
  'completed': {
    label: 'Completed',
    bgColor: 'bg-green-600/30',
    textColor: 'text-green-400',
    icon: '●',
  },
};

const statusOrder: GoalStatus[] = ['not-started', 'in-progress', 'completed'];

export function SprintGoals({
  goals,
  onGoalAdd,
  onGoalUpdate,
  onGoalDelete,
  className = '',
  editable = true,
}: SprintGoalsProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Progress stats
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const inProgressCount = goals.filter(g => g.status === 'in-progress').length;
  const totalCount = goals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddGoal = useCallback(() => {
    if (newGoalTitle.trim() && onGoalAdd) {
      onGoalAdd({
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim() || undefined,
        status: 'not-started',
      });
      setNewGoalTitle('');
      setNewGoalDescription('');
      setIsAddingGoal(false);
    }
  }, [newGoalTitle, newGoalDescription, onGoalAdd]);

  const handleStartEdit = useCallback((goal: SprintGoal) => {
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditDescription(goal.description || '');
  }, []);

  const handleSaveEdit = useCallback((goal: SprintGoal) => {
    if (editTitle.trim() && onGoalUpdate) {
      onGoalUpdate({
        ...goal,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
    }
    setEditingGoalId(null);
  }, [editTitle, editDescription, onGoalUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditingGoalId(null);
  }, []);

  const cycleStatus = useCallback((goal: SprintGoal) => {
    if (!onGoalUpdate) return;
    const currentIndex = statusOrder.indexOf(goal.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    onGoalUpdate({ ...goal, status: statusOrder[nextIndex] });
  }, [onGoalUpdate]);

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Sprint Goals</h3>
        <span className="text-sm font-medium text-blue-400">
          {completedCount}/{totalCount} Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.length === 0 && !isAddingGoal && (
          <div className="text-center py-8 text-gray-500">
            <p>No sprint goals defined yet.</p>
            {editable && onGoalAdd && (
              <button
                onClick={() => setIsAddingGoal(true)}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                + Add your first goal
              </button>
            )}
          </div>
        )}

        {goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-gray-700/50 rounded-lg p-4 transition-all hover:bg-gray-700/70"
          >
            {editingGoalId === goal.id ? (
              /* Edit Mode */
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Goal title"
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Description (optional)"
                  rows={2}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(goal)}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="flex items-start gap-3">
                {/* Status Badge (clickable to cycle) */}
                <button
                  onClick={() => editable && cycleStatus(goal)}
                  disabled={!editable || !onGoalUpdate}
                  className={`flex-shrink-0 mt-0.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    statusConfig[goal.status].bgColor
                  } ${statusConfig[goal.status].textColor} ${
                    editable && onGoalUpdate ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                  }`}
                  title={editable && onGoalUpdate ? 'Click to change status' : undefined}
                >
                  <span className="mr-1">{statusConfig[goal.status].icon}</span>
                  {statusConfig[goal.status].label}
                </button>

                {/* Goal Content */}
                <div className="flex-grow min-w-0">
                  <p className={`text-sm font-medium ${
                    goal.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'
                  }`}>
                    {goal.title}
                  </p>
                  {goal.description && (
                    <p className="text-xs text-gray-400 mt-1">{goal.description}</p>
                  )}
                </div>

                {/* Actions */}
                {editable && (onGoalUpdate || onGoalDelete) && (
                  <div className="flex-shrink-0 flex gap-1">
                    {onGoalUpdate && (
                      <button
                        onClick={() => handleStartEdit(goal)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                        title="Edit goal"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    {onGoalDelete && (
                      <button
                        onClick={() => onGoalDelete(goal.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                        title="Delete goal"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Goal Form */}
        {isAddingGoal && (
          <div className="bg-gray-700/50 rounded-lg p-4 border border-blue-500/50">
            <div className="space-y-3">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Goal title"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              <textarea
                value={newGoalDescription}
                onChange={(e) => setNewGoalDescription(e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsAddingGoal(false);
                    setNewGoalTitle('');
                    setNewGoalDescription('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGoal}
                  disabled={!newGoalTitle.trim()}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded transition-colors"
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Goal Button */}
      {editable && onGoalAdd && goals.length > 0 && !isAddingGoal && (
        <button
          onClick={() => setIsAddingGoal(true)}
          className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg border border-dashed border-gray-600 hover:border-gray-500 transition-colors"
        >
          + Add Goal
        </button>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Not Started</p>
          <p className="text-gray-300 font-semibold">{totalCount - completedCount - inProgressCount}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs">In Progress</p>
          <p className="text-yellow-400 font-semibold">{inProgressCount}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Completed</p>
          <p className="text-green-400 font-semibold">{completedCount}</p>
        </div>
      </div>
    </div>
  );
}

export default SprintGoals;
