'use client';

import { ChevronDown, AlertCircle, AlertTriangle, Zap, Circle } from 'lucide-react';
import { TaskComplexity } from '@/lib/supabase';
import { getComplexityLabel } from '@/lib/agents';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ComplexitySelectorProps {
  value: TaskComplexity;
  onChange: (value: TaskComplexity) => void;
  disabled?: boolean;
}

const COMPLEXITY_OPTIONS: TaskComplexity[] = ['simple', 'medium', 'complex', 'critical'];

const COMPLEXITY_STYLES: Record<TaskComplexity, { bg: string; text: string; border: string }> = {
  simple: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  complex: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
};

const COMPLEXITY_ICONS: Record<TaskComplexity, React.ReactNode> = {
  simple: <Circle className="h-3.5 w-3.5" />,
  medium: <Zap className="h-3.5 w-3.5" />,
  complex: <AlertTriangle className="h-3.5 w-3.5" />,
  critical: <AlertCircle className="h-3.5 w-3.5" />,
};

const COMPLEXITY_DESCRIPTIONS: Record<TaskComplexity, string> = {
  simple: 'Quick tasks, any skill level',
  medium: 'Standard tasks, mid-level+',
  complex: 'Challenging tasks, senior+',
  critical: 'High-stakes, lead only',
};

export function ComplexitySelector({ value, onChange, disabled }: ComplexitySelectorProps) {
  const styles = COMPLEXITY_STYLES[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          styles.bg,
          styles.text,
          styles.border
        )}
      >
        {COMPLEXITY_ICONS[value]}
        <span>{getComplexityLabel(value)}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as TaskComplexity)}>
          {COMPLEXITY_OPTIONS.map((complexity) => {
            const optStyles = COMPLEXITY_STYLES[complexity];
            return (
              <DropdownMenuRadioItem
                key={complexity}
                value={complexity}
                className="flex items-start gap-3 py-2"
              >
                <span className={cn('mt-0.5', optStyles.text)}>{COMPLEXITY_ICONS[complexity]}</span>
                <div className="flex-1">
                  <div className={cn('font-medium', optStyles.text)}>
                    {getComplexityLabel(complexity)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {COMPLEXITY_DESCRIPTIONS[complexity]}
                  </div>
                </div>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Badge-style variant for read-only display
export function ComplexityBadge({ complexity }: { complexity: TaskComplexity }) {
  const styles = COMPLEXITY_STYLES[complexity];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        styles.bg,
        styles.text
      )}
    >
      {COMPLEXITY_ICONS[complexity]}
      <span>{getComplexityLabel(complexity)}</span>
    </span>
  );
}
