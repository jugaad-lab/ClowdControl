'use client';

import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { ShadowingMode } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShadowingSelectorProps {
  value: ShadowingMode;
  onChange: (value: ShadowingMode) => void;
  disabled?: boolean;
}

const SHADOWING_OPTIONS: ShadowingMode[] = ['none', 'recommended', 'required'];

const SHADOWING_STYLES: Record<
  ShadowingMode,
  { bg: string; text: string; border: string }
> = {
  none: {
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
  recommended: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  required: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
};

const SHADOWING_ICONS: Record<ShadowingMode, React.ReactNode> = {
  none: <EyeOff className="h-3.5 w-3.5" />,
  recommended: <Eye className="h-3.5 w-3.5" />,
  required: <Eye className="h-3.5 w-3.5" />,
};

const SHADOWING_LABELS: Record<ShadowingMode, string> = {
  none: 'No Shadowing',
  recommended: 'Recommended',
  required: 'Required',
};

const SHADOWING_DESCRIPTIONS: Record<ShadowingMode, string> = {
  none: 'Agent works independently',
  recommended: 'Human observation suggested',
  required: 'Human must observe execution',
};

export function ShadowingSelector({
  value,
  onChange,
  disabled,
}: ShadowingSelectorProps) {
  const styles = SHADOWING_STYLES[value];

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
        {SHADOWING_ICONS[value]}
        <span>{SHADOWING_LABELS[value]}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as ShadowingMode)}
        >
          {SHADOWING_OPTIONS.map((mode) => {
            const optStyles = SHADOWING_STYLES[mode];
            return (
              <DropdownMenuRadioItem
                key={mode}
                value={mode}
                className="flex items-start gap-3 py-2"
              >
                <span className={cn('mt-0.5', optStyles.text)}>
                  {SHADOWING_ICONS[mode]}
                </span>
                <div className="flex-1">
                  <div className={cn('font-medium', optStyles.text)}>
                    {SHADOWING_LABELS[mode]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {SHADOWING_DESCRIPTIONS[mode]}
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
