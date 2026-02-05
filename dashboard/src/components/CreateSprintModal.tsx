'use client';

import { useState } from 'react';
import { createSprint, Sprint } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, Loader2, Rocket } from 'lucide-react';

interface CreateSprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  nextSprintNumber: number;
  onSprintCreated: (sprint: Sprint) => void;
}

export function CreateSprintModal({
  open,
  onOpenChange,
  projectId,
  nextSprintNumber,
  onSprintCreated,
}: CreateSprintModalProps) {
  const [name, setName] = useState(`Sprint ${nextSprintNumber}`);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Sprint name is required');
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    setIsSubmitting(true);

    try {
      const sprint = await createSprint({
        project_id: projectId,
        name: name.trim(),
        number: nextSprintNumber,
        status: 'planned',
        planned_start: startDate || null,
        planned_end: endDate || null,
      });

      onSprintCreated(sprint);
      onOpenChange(false);

      // Reset form
      setName(`Sprint ${nextSprintNumber + 1}`);
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error('Error creating sprint:', err);
      setError('Failed to create sprint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    }
    onOpenChange(open);
  };

  // Auto-calculate end date (2 weeks from start) if start date is set
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (date && !endDate) {
      const start = new Date(date);
      start.setDate(start.getDate() + 14);
      setEndDate(start.toISOString().split('T')[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Rocket className="w-5 h-5 text-blue-500" />
            Create New Sprint
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Plan your next sprint by setting a name and date range.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sprint Name */}
          <div>
            <label
              htmlFor="sprint-name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Sprint Name
            </label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sprint 1 - MVP Features"
              className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              autoFocus
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="start-date"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  Start Date
                </span>
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              />
            </div>
            <div>
              <label
                htmlFor="end-date"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  End Date
                </span>
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>

          {/* Duration hint */}
          {startDate && endDate && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {(() => {
                const days = Math.ceil(
                  (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const weeks = Math.floor(days / 7);
                const remainingDays = days % 7;
                if (weeks === 0) return `${days} day${days === 1 ? '' : 's'}`;
                if (remainingDays === 0) return `${weeks} week${weeks === 1 ? '' : 's'}`;
                return `${weeks} week${weeks === 1 ? '' : 's'}, ${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
              })()}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Create Sprint
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
