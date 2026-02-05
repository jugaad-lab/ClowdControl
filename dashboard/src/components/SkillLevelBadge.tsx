'use client';

import { Star } from 'lucide-react';
import { SkillLevel } from '@/lib/supabase';
import { getSkillLevelLabel } from '@/lib/agents';
import { cn } from '@/lib/utils';

interface SkillLevelBadgeProps {
  level: SkillLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const LEVEL_STYLES: Record<SkillLevel, string> = {
  junior: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  mid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  senior: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  lead: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
};

const STAR_COLORS: Record<SkillLevel, string> = {
  junior: 'text-zinc-400 dark:text-zinc-500',
  mid: 'text-blue-500 dark:text-blue-400',
  senior: 'text-purple-500 dark:text-purple-400',
  lead: 'text-amber-500 dark:text-amber-400',
};

const STAR_COUNTS: Record<SkillLevel, number> = {
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
};

export function SkillLevelBadge({
  level,
  showIcon = true,
  size = 'md',
}: SkillLevelBadgeProps) {
  const starCount = STAR_COUNTS[level];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        LEVEL_STYLES[level],
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
      )}
    >
      {showIcon && (
        <span className="flex gap-0.5">
          {Array.from({ length: starCount }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'fill-current',
                STAR_COLORS[level],
                size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
              )}
            />
          ))}
        </span>
      )}
      <span>{getSkillLevelLabel(level)}</span>
    </span>
  );
}
