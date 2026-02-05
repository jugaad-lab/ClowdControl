'use client';

import { IndependentOpinion, SycophancyIndicator, supabase } from './supabase';

export interface SycophancyCheckResult {
  flagged: boolean;
  indicators: {
    type: SycophancyIndicator;
    details: Record<string, unknown>;
  }[];
}

// Time threshold for "instant consensus" in milliseconds (60 seconds)
const INSTANT_CONSENSUS_THRESHOLD_MS = 60 * 1000;

// Similarity threshold for text comparison (0-1)
const TEXT_SIMILARITY_THRESHOLD = 0.8;

/**
 * Calculate Jaccard similarity between two strings (word-based)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Check for instant high consensus (all approve within threshold)
 */
function checkInstantConsensus(
  opinions: IndependentOpinion[]
): { flagged: boolean; details: Record<string, unknown> } {
  if (opinions.length < 2) {
    return { flagged: false, details: {} };
  }

  const allApprove = opinions.every((o) => o.opinion.vote === 'approve');
  if (!allApprove) {
    return { flagged: false, details: {} };
  }

  const timestamps = opinions.map((o) => new Date(o.generated_at).getTime());
  const timeDiff = Math.max(...timestamps) - Math.min(...timestamps);

  if (timeDiff <= INSTANT_CONSENSUS_THRESHOLD_MS) {
    return {
      flagged: true,
      details: {
        time_diff_ms: timeDiff,
        threshold_ms: INSTANT_CONSENSUS_THRESHOLD_MS,
        vote_count: opinions.length,
      },
    };
  }

  return { flagged: false, details: {} };
}

/**
 * Check for no substantive concerns
 */
function checkNoSubstantiveConcerns(
  opinions: IndependentOpinion[]
): { flagged: boolean; details: Record<string, unknown> } {
  if (opinions.length < 2) {
    return { flagged: false, details: {} };
  }

  const totalConcerns = opinions.reduce(
    (sum, o) => sum + (o.opinion.concerns?.length || 0),
    0
  );

  if (totalConcerns === 0) {
    return {
      flagged: true,
      details: {
        opinion_count: opinions.length,
        total_concerns: 0,
      },
    };
  }

  return { flagged: false, details: {} };
}

/**
 * Check for echo language (similar reasoning text)
 */
function checkEchoLanguage(
  opinions: IndependentOpinion[]
): { flagged: boolean; details: Record<string, unknown> } {
  if (opinions.length < 2) {
    return { flagged: false, details: {} };
  }

  const similarities: { pair: [string, string]; similarity: number }[] = [];

  for (let i = 0; i < opinions.length; i++) {
    for (let j = i + 1; j < opinions.length; j++) {
      const similarity = calculateTextSimilarity(
        opinions[i].opinion.reasoning,
        opinions[j].opinion.reasoning
      );

      if (similarity >= TEXT_SIMILARITY_THRESHOLD) {
        similarities.push({
          pair: [opinions[i].agent_id, opinions[j].agent_id],
          similarity,
        });
      }
    }
  }

  if (similarities.length > 0) {
    return {
      flagged: true,
      details: {
        high_similarity_pairs: similarities,
        threshold: TEXT_SIMILARITY_THRESHOLD,
      },
    };
  }

  return { flagged: false, details: {} };
}

/**
 * Check for copied conclusions
 */
function checkCopiedConclusion(
  opinions: IndependentOpinion[]
): { flagged: boolean; details: Record<string, unknown> } {
  if (opinions.length < 2) {
    return { flagged: false, details: {} };
  }

  // Extract last sentences as "conclusions"
  const getConclusion = (text: string): string => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    return sentences[sentences.length - 1]?.trim().toLowerCase() || '';
  };

  const conclusions = opinions.map((o) => ({
    agent_id: o.agent_id,
    conclusion: getConclusion(o.opinion.reasoning),
  }));

  const duplicates: { pair: [string, string]; conclusion: string }[] = [];

  for (let i = 0; i < conclusions.length; i++) {
    for (let j = i + 1; j < conclusions.length; j++) {
      if (
        conclusions[i].conclusion.length > 20 &&
        calculateTextSimilarity(
          conclusions[i].conclusion,
          conclusions[j].conclusion
        ) > 0.9
      ) {
        duplicates.push({
          pair: [conclusions[i].agent_id, conclusions[j].agent_id],
          conclusion: conclusions[i].conclusion,
        });
      }
    }
  }

  if (duplicates.length > 0) {
    return {
      flagged: true,
      details: { duplicates },
    };
  }

  return { flagged: false, details: {} };
}

/**
 * Run all sycophancy checks on a set of opinions
 */
export function checkForSycophancy(
  opinions: IndependentOpinion[]
): SycophancyCheckResult {
  const indicators: SycophancyCheckResult['indicators'] = [];

  const instantConsensus = checkInstantConsensus(opinions);
  if (instantConsensus.flagged) {
    indicators.push({
      type: 'instant_high_consensus',
      details: instantConsensus.details,
    });
  }

  const noSubstantiveConcerns = checkNoSubstantiveConcerns(opinions);
  if (noSubstantiveConcerns.flagged) {
    indicators.push({
      type: 'no_substantive_concerns',
      details: noSubstantiveConcerns.details,
    });
  }

  const echoLanguage = checkEchoLanguage(opinions);
  if (echoLanguage.flagged) {
    indicators.push({
      type: 'echo_language',
      details: echoLanguage.details,
    });
  }

  const copiedConclusion = checkCopiedConclusion(opinions);
  if (copiedConclusion.flagged) {
    indicators.push({
      type: 'copied_conclusion',
      details: copiedConclusion.details,
    });
  }

  return {
    flagged: indicators.length > 0,
    indicators,
  };
}

/**
 * Flag sycophancy for a proposal
 */
export async function flagSycophancy(
  proposalId: string,
  indicatorType: SycophancyIndicator,
  details: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('sycophancy_flags')
    .insert({
      proposal_id: proposalId,
      indicator_type: indicatorType,
      details,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check and flag sycophancy for a proposal
 */
export async function checkAndFlagSycophancy(
  proposalId: string,
  opinions: IndependentOpinion[]
): Promise<SycophancyCheckResult> {
  const result = checkForSycophancy(opinions);

  if (result.flagged) {
    // Flag all detected indicators
    for (const indicator of result.indicators) {
      await flagSycophancy(proposalId, indicator.type, indicator.details);
    }
  }

  return result;
}

/**
 * Get unreviewed sycophancy flags count
 */
export async function getUnreviewedFlagsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('sycophancy_flags')
    .select('*', { count: 'exact', head: true })
    .is('reviewed_by', null);

  if (error) throw error;
  return count || 0;
}

/**
 * Review a sycophancy flag
 */
export async function reviewSycophancyFlag(
  flagId: string,
  reviewedBy: string,
  wasFalsePositive: boolean,
  resolutionNotes?: string
) {
  const { data, error } = await supabase
    .from('sycophancy_flags')
    .update({
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      was_false_positive: wasFalsePositive,
      resolution_notes: resolutionNotes || null,
    })
    .eq('id', flagId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
