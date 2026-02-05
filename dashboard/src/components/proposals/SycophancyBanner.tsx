'use client';

import { SycophancyFlag, SycophancyIndicator } from '@/lib/supabase';
import { AlertTriangle, Shield, X, CheckCircle2 } from 'lucide-react';

interface SycophancyBannerProps {
  flags: SycophancyFlag[];
  onDismiss?: (flagId: string) => void;
  onMarkFalsePositive?: (flagId: string) => void;
}

const indicatorLabels: Record<SycophancyIndicator, { label: string; description: string }> = {
  instant_high_consensus: {
    label: 'Instant Consensus',
    description: 'All agents agreed immediately without meaningful debate',
  },
  echo_language: {
    label: 'Echo Language',
    description: 'Agents used suspiciously similar phrasing in their reasoning',
  },
  flip_without_reasoning: {
    label: 'Unexplained Position Change',
    description: 'An agent changed their vote without providing new reasoning',
  },
  no_substantive_concerns: {
    label: 'Shallow Concerns',
    description: 'Concerns raised were superficial or non-specific',
  },
  copied_conclusion: {
    label: 'Copied Conclusion',
    description: 'Multiple agents reached identical conclusions with identical reasoning',
  },
};

export function SycophancyBanner({
  flags,
  onDismiss,
  onMarkFalsePositive,
}: SycophancyBannerProps) {
  // Only show unreviewed flags
  const activeFlags = flags.filter((f) => f.reviewed_at === null);

  if (activeFlags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {activeFlags.map((flag) => {
        const indicator = indicatorLabels[flag.indicator_type];
        return (
          <div
            key={flag.id}
            className="bg-gradient-to-r from-amber-950/50 to-orange-950/30 border-2 border-amber-700/50 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-start gap-4">
              {/* Warning Icon */}
              <div className="w-10 h-10 rounded-lg bg-amber-900/50 border border-amber-700/50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-amber-300">
                    ⚠️ Potential Sycophancy Detected
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/50 border border-amber-700/50 text-amber-400">
                    Requires Review
                  </span>
                </div>
                <p className="text-sm text-amber-200/80 mb-2">
                  <span className="font-medium">{indicator?.label}:</span>{' '}
                  {indicator?.description}
                </p>

                {/* Details if present */}
                {flag.details && Object.keys(flag.details).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-amber-400/70 cursor-pointer hover:text-amber-400">
                      View detection details
                    </summary>
                    <pre className="mt-2 text-xs bg-black/20 rounded-lg p-3 overflow-x-auto text-amber-300/70">
                      {JSON.stringify(flag.details, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Timestamp */}
                <p className="text-xs text-amber-500/60 mt-2">
                  Detected {new Date(flag.detected_at).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {onMarkFalsePositive && (
                  <button
                    onClick={() => onMarkFalsePositive(flag.id)}
                    className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/50 transition-colors"
                    title="Mark as false positive"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(flag.id)}
                    className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Human Review CTA */}
            <div className="mt-4 pt-4 border-t border-amber-800/30 flex items-center gap-3">
              <Shield className="w-4 h-4 text-amber-500" />
              <p className="text-sm text-amber-300/80">
                A human should review this consensus before proceeding.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
